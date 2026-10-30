import { getAdminPasscode } from '../src/lib/auth';
import { getSystemSettings, resetDemoData } from '../src/lib/db';

const BASE_URL = 'http://localhost:3000';

async function fetchHttp(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: res.status, headers: res.headers, text, json };
}

async function runEmpiricalChallenge() {
  console.log('========================================================================');
  console.log('   CHALLENGER M2: EMPIRICAL SECURITY & STRESS-TESTING HARNESS');
  console.log('========================================================================\n');

  resetDemoData();
  const passcode = getAdminPasscode();
  const authHeaders = {
    'content-type': 'application/json',
    'x-admin-passcode': passcode,
  };

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition: boolean, msg: string) {
    totalTests++;
    if (!condition) {
      console.error(`❌ [FAIL] ${msg}`);
      throw new Error(msg);
    }
    passedTests++;
    console.log(`✓ [PASS] ${msg}`);
  }

  // =========================================================================
  // MISSION 1: PII EXTRACTION ATTACKS
  // =========================================================================
  console.log('--- MISSION 1: PII EXTRACTION ATTACKS (/api/bookings/lookup & status) ---');

  // Step 1: Create a test booking with a known, distinct phone number
  const testPhone = '0981999888';
  const testName = 'Nguyễn Bảo Mật Thử Nghiệm';
  const testEmail = 'secret.challenger@lungvai.vn';
  const bookingDate = '2026-11-20';

  const createRes = await fetchHttp(`${BASE_URL}/api/bookings`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      roomId: 'room-1',
      customerName: testName,
      customerPhone: testPhone,
      customerEmail: testEmail,
      date: bookingDate,
      startTime: '10:00',
      durationHours: 2,
      guestCount: 4,
    }),
  });

  assert(createRes.status === 201, `Created test booking with status 201 (got ${createRes.status})`);
  const bookingRef = createRes.json?.data?.bookingReference;
  assert(Boolean(bookingRef), `Acquired booking reference: ${bookingRef}`);

  // Test matrix for /api/bookings/lookup
  const piiAttackVectors = [
    // Attacks that MUST return HTTP 403 FORBIDDEN and disclose ZERO customer PII:
    { input: '8', desc: '1-digit suffix attack ("8")', shouldPass: false },
    { input: '88', desc: '2-digit suffix attack ("88")', shouldPass: false },
    { input: '888', desc: '3-digit suffix attack ("888")', shouldPass: false },
    { input: '9888', desc: '4-digit suffix attack ("9888")', shouldPass: false },
    { input: '99888', desc: '5-digit suffix attack ("99888")', shouldPass: false },
    { input: '1999888', desc: '7-digit suffix attack ("1999888")', shouldPass: false },
    { input: '0', desc: '1-digit prefix attack ("0")', shouldPass: false },
    { input: '098', desc: '3-digit prefix attack ("098")', shouldPass: false },
    { input: '098199', desc: '6-digit prefix attack ("098199")', shouldPass: false },
    { input: '8199988', desc: 'Middle substring attack ("8199988")', shouldPass: false },
    { input: '0981999887', desc: 'Off-by-one last digit attack ("0981999887")', shouldPass: false },
    { input: '1981999888', desc: 'Off-by-one first digit attack ("1981999888")', shouldPass: false },
    { input: '09819998889', desc: 'Extra appended digit attack ("09819998889")', shouldPass: false },
    { input: '098199988', desc: 'Truncated 9 digits attack ("098199988")', shouldPass: false },
    { input: "0981999888' OR '1'='1", desc: 'SQL injection string attack', shouldPass: false },
    { input: '<script>alert(1)</script>', desc: 'XSS string attack', shouldPass: false },
    { input: 'not_a_phone_number', desc: 'Non-numeric string attack', shouldPass: false },

    // Legitimate formats that MUST return HTTP 200 with full verified customer PII:
    { input: '0981999888', desc: 'Exact match (standard 0-leading)', shouldPass: true },
    { input: '+84981999888', desc: 'Exact match (E.164 +84)', shouldPass: true },
    { input: '84981999888', desc: 'Exact match (84 prefix)', shouldPass: true },
    { input: '098 199 9888', desc: 'Exact match (spaced format)', shouldPass: true },
    { input: '098-199-9888', desc: 'Exact match (hyphenated format)', shouldPass: true },
  ];

  for (const vector of piiAttackVectors) {
    const lookupUrl = `${BASE_URL}/api/bookings/lookup?reference=${encodeURIComponent(bookingRef)}&phone=${encodeURIComponent(vector.input)}`;
    const res = await fetchHttp(lookupUrl);

    if (vector.shouldPass) {
      assert(res.status === 200, `Lookup [${vector.desc}] returns HTTP 200`);
      assert(res.json?.verified === true, `Lookup [${vector.desc}] verified === true`);
      assert(res.json?.data?.customerPhone === testPhone, `Lookup [${vector.desc}] returns full phone`);
      assert(res.json?.data?.customerName === testName, `Lookup [${vector.desc}] returns full name`);
      assert(res.json?.data?.customerEmail === testEmail, `Lookup [${vector.desc}] returns customerEmail`);
    } else {
      assert(res.status === 403, `Attack [${vector.desc}] rejected with HTTP 403 FORBIDDEN (got ${res.status})`);
      assert(res.json?.code === 'FORBIDDEN', `Attack [${vector.desc}] error code is FORBIDDEN`);
      // Assert zero PII disclosure:
      const bodyText = res.text;
      assert(!bodyText.includes(testName), `Attack [${vector.desc}] NEVER discloses customer name`);
      assert(!bodyText.includes(testEmail), `Attack [${vector.desc}] NEVER discloses customer email`);
      assert(!bodyText.includes(testPhone), `Attack [${vector.desc}] NEVER discloses customer full phone`);
    }
  }

  // Also verify /api/bookings/[code]/status behavior with suffix attack
  {
    const statusUrlSuffix = `${BASE_URL}/api/bookings/${bookingRef}/status?phone=8`;
    const res = await fetchHttp(statusUrlSuffix);
    assert(res.status === 200, 'Status with suffix returns HTTP 200');
    assert(res.json?.data?.customerPhone !== testPhone, 'Status with suffix masks phone');
    assert(res.json?.data?.customerPhone.includes('*'), 'Status with suffix has asterisks in phone');
    assert(res.json?.data?.customerName !== testName, 'Status with suffix masks name');
    assert(res.json?.data?.customerEmail === undefined, 'Status with suffix does not contain email');

    const statusUrlExact = `${BASE_URL}/api/bookings/${bookingRef}/status?phone=${testPhone}`;
    const resExact = await fetchHttp(statusUrlExact);
    assert(resExact.status === 200, 'Status with exact phone returns HTTP 200');
    assert(resExact.json?.data?.customerPhone === testPhone, 'Status with exact phone returns full phone');
    assert(resExact.json?.data?.customerName === testName, 'Status with exact phone returns full name');
  }

  // =========================================================================
  // MISSION 2: HTTP 405 ELIMINATION & SQLITE PERSISTENCE
  // =========================================================================
  console.log('\n--- MISSION 2: HTTP 405 ELIMINATION & SQLITE PERSISTENCE (/api/admin/config) ---');

  // 1. Send PATCH request with valid passcode
  const patchPayload = {
    openTime: '07:30',
    closeTime: '23:00',
    holdDurationHours: 3,
    slotIntervalMinutes: 30,
  };

  const patchRes = await fetchHttp(`${BASE_URL}/api/admin/config`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify(patchPayload),
  });

  assert(patchRes.status === 200, `PATCH /api/admin/config returned HTTP 200 OK (got ${patchRes.status})`);
  assert(patchRes.json?.success === true, 'PATCH /api/admin/config success is true');
  assert(patchRes.json?.data?.openTime === '07:30', 'PATCH response data contains updated openTime');

  // 2. Confirm persistence in SQLite directly
  const dbSettings = getSystemSettings();
  assert(dbSettings.openTime === '07:30', `SQLite persisted openTime: expected "07:30", got "${dbSettings.openTime}"`);
  assert(dbSettings.closeTime === '23:00', `SQLite persisted closeTime: expected "23:00", got "${dbSettings.closeTime}"`);
  assert(dbSettings.holdDurationHours === 3, `SQLite persisted holdDurationHours: expected 3, got ${dbSettings.holdDurationHours}`);

  // 3. Confirm GET /api/admin/config returns the persisted changes
  const getRes = await fetchHttp(`${BASE_URL}/api/admin/config`, {
    headers: authHeaders,
  });
  assert(getRes.status === 200, 'GET /api/admin/config returned HTTP 200');
  assert(getRes.json?.data?.settings?.openTime === '07:30', 'GET config confirms persisted openTime in settings');

  // 4. Test PUT /api/admin/config also works and persists
  const putPayload = {
    openTime: '08:00',
    closeTime: '22:30',
    holdDurationHours: 2,
  };
  const putRes = await fetchHttp(`${BASE_URL}/api/admin/config`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify(putPayload),
  });
  assert(putRes.status === 200, `PUT /api/admin/config returned HTTP 200 OK (got ${putRes.status})`);
  const putDbSettings = getSystemSettings();
  assert(putDbSettings.openTime === '08:00', 'PUT persisted in SQLite');

  // =========================================================================
  // MISSION 3: PAYLOAD FUZZING ACROSS ALL MODIFIED ADMIN ROUTES
  // =========================================================================
  console.log('\n--- MISSION 3: PAYLOAD FUZZING ACROSS MODIFIED ADMIN ROUTES ---');

  const adminTargetRoutes = [
    { method: 'PATCH', path: '/api/admin/config', label: 'Admin Config PATCH' },
    { method: 'PUT', path: '/api/admin/config', label: 'Admin Config PUT' },
    { method: 'PATCH', path: '/api/admin/rooms/room-1', label: 'Admin Room PATCH' },
    { method: 'PATCH', path: '/api/admin/bookings/seed-booking-1', label: 'Admin Booking PATCH' },
    { method: 'POST', path: '/api/admin/slot-blocks', label: 'Admin SlotBlock POST' },
    { method: 'POST', path: '/api/admin/notifications', label: 'Admin Notifications POST' },
  ];

  const malformedPayloads = [
    { body: '{"openTime": "08:00", ', desc: 'Truncated JSON object' },
    { body: '[{"id": 1}, {"name": ', desc: 'Truncated JSON array' },
    { body: '{"isActive": tr', desc: 'Truncated boolean literal' },
    { body: '', desc: 'Completely empty string body' },
    { body: '   \n\t   ', desc: 'Whitespace-only body' },
    { body: '<?xml version="1.0"?><data><test>hello</test></data>', desc: 'XML formatted payload' },
    { body: 'undefined', desc: 'Raw JS undefined string' },
    { body: 'NaN', desc: 'Raw JS NaN string' },
    { body: 'plain text string without json syntax', desc: 'Unquoted plain text string' },
    { body: '\x00\x01\x02\xfe\xff', desc: 'Binary garbage bytes' },
    { body: '{ "a": 1, }', desc: 'Trailing comma JSON syntax error' },
    { body: "{ 'singleQuote': true }", desc: 'Single quotes JSON syntax error' },
  ];

  for (const target of adminTargetRoutes) {
    for (const payload of malformedPayloads) {
      const res = await fetchHttp(`${BASE_URL}${target.path}`, {
        method: target.method,
        headers: {
          'content-type': 'application/json',
          'x-admin-passcode': passcode,
        },
        body: payload.body,
      });

      // Strict assertions:
      // 1. NEVER return HTTP 500
      assert(res.status !== 500, `${target.label} with [${payload.desc}] NEVER returns HTTP 500 (got ${res.status})`);
      // 2. Returns HTTP 400
      assert(res.status === 400, `${target.label} with [${payload.desc}] returns HTTP 400 (got ${res.status})`);
      // 3. Contains VALIDATION_ERROR code
      assert(res.json?.code === 'VALIDATION_ERROR', `${target.label} with [${payload.desc}] returns VALIDATION_ERROR`);
    }
  }

  // Also fuzz POST /api/admin/auth
  for (const payload of malformedPayloads) {
    const res = await fetchHttp(`${BASE_URL}/api/admin/auth`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: payload.body,
    });
    assert(res.status !== 500, `POST /api/admin/auth with [${payload.desc}] NEVER returns HTTP 500 (got ${res.status})`);
    assert(res.status === 400, `POST /api/admin/auth with [${payload.desc}] returns HTTP 400 VALIDATION_ERROR`);
  }

  console.log('\n========================================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} EMPIRICAL CHALLENGER TESTS PASSED (100%)!`);
  console.log('========================================================================\n');
}

runEmpiricalChallenge().catch((err) => {
  console.error('Empirical Challenger Suite Failed:', err);
  process.exit(1);
});
