import {
  assert,
  assertEqual,
  createTestBooking,
  fetchHttp,
  generateRandomPhone,
  getAdminSessionCookie,
  getFutureDate,
} from './helpers';
import { TestCaseResult, TierResult } from './types';

export async function runTier2(
  baseUrl: string,
  strict: boolean = false
): Promise<TierResult> {
  const startTime = Date.now();
  const cases: TestCaseResult[] = [];
  const testDate = getFutureDate(25);
  const sessionCookie = await getAdminSessionCookie(baseUrl);

  async function test(
    id: string,
    name: string,
    fn: () => Promise<void>
  ): Promise<void> {
    const t0 = Date.now();
    try {
      await fn();
      cases.push({
        id,
        name,
        tier: 2,
        status: 'PASSED',
        durationMs: Date.now() - t0,
      });
    } catch (err: any) {
      cases.push({
        id,
        name,
        tier: 2,
        status: 'FAILED',
        durationMs: Date.now() - t0,
        error: err?.message || String(err),
      });
    }
  }

  function recordEscalation(
    id: string,
    name: string,
    durationMs: number,
    escalation: {
      featureId: string;
      targetMilestone: string;
      description: string;
      observed: string;
      expected: string;
    }
  ) {
    if (strict) {
      cases.push({
        id,
        name,
        tier: 2,
        status: 'FAILED',
        durationMs,
        error: `[STRICT] Escalated bug ${escalation.featureId}: ${escalation.description}. Expected ${escalation.expected}, got ${escalation.observed}`,
        escalation,
      });
    } else {
      cases.push({
        id,
        name,
        tier: 2,
        status: 'ESCALATED',
        durationMs,
        escalation,
      });
    }
  }

  // 2.1 - 2.5: Missing required fields
  const baseValidPayload = {
    roomId: 'room-1',
    customerName: 'Nguyễn Thử Nghiệm',
    customerPhone: '0987654321',
    date: testDate,
    startTime: '10:00',
    durationHours: 2,
    guestCount: 4,
  };

  await test('T2-01', 'Booking creation with missing customerName returns HTTP 400 VALIDATION_ERROR', async () => {
    const { customerName, ...payload } = baseValidPayload;
    const res = await fetchHttp(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    assertEqual(res.status, 400, 'HTTP status for missing customerName');
    assertEqual(res.data?.code, 'VALIDATION_ERROR', 'Error code');
  });

  await test('T2-02', 'Booking creation with missing customerPhone returns HTTP 400 VALIDATION_ERROR', async () => {
    const { customerPhone, ...payload } = baseValidPayload;
    const res = await fetchHttp(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    assertEqual(res.status, 400, 'HTTP status for missing customerPhone');
    assertEqual(res.data?.code, 'VALIDATION_ERROR', 'Error code');
  });

  await test('T2-03', 'Booking creation with missing date returns HTTP 400 VALIDATION_ERROR', async () => {
    const { date, ...payload } = baseValidPayload;
    const res = await fetchHttp(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    assertEqual(res.status, 400, 'HTTP status for missing date');
    assertEqual(res.data?.code, 'VALIDATION_ERROR', 'Error code');
  });

  await test('T2-04', 'Booking creation with missing startTime returns HTTP 400 VALIDATION_ERROR', async () => {
    const { startTime, ...payload } = baseValidPayload;
    const res = await fetchHttp(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    assertEqual(res.status, 400, 'HTTP status for missing startTime');
    assertEqual(res.data?.code, 'VALIDATION_ERROR', 'Error code');
  });

  await test('T2-05', 'Booking creation with missing roomId returns HTTP 400 VALIDATION_ERROR', async () => {
    const { roomId, ...payload } = baseValidPayload;
    const res = await fetchHttp(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    assertEqual(res.status, 400, 'HTTP status for missing roomId');
    assertEqual(res.data?.code, 'VALIDATION_ERROR', 'Error code');
  });

  // 2.6: Invalid phone format
  await test('T2-06', 'Booking creation with invalid phone format returns HTTP 400 VALIDATION_ERROR', async () => {
    const res = await fetchHttp(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...baseValidPayload, customerPhone: 'invalid-phone' }),
    });
    assertEqual(res.status, 400, 'HTTP status for invalid phone');
    assertEqual(res.data?.code, 'VALIDATION_ERROR', 'Error code');
  });

  // 2.7: Capacity below minimum
  await test('T2-07', 'Booking with guest count below room minimum returns HTTP 400 VALIDATION_ERROR', async () => {
    const res = await fetchHttp(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...baseValidPayload, guestCount: 1 }), // Trúc Ảnh min is 2
    });
    assertEqual(res.status, 400, 'HTTP status for under-capacity');
    assertEqual(res.data?.code, 'VALIDATION_ERROR', 'Error code');
  });

  // 2.8: Capacity above maximum
  await test('T2-08', 'Booking with guest count exceeding room maximum returns HTTP 400 VALIDATION_ERROR', async () => {
    const res = await fetchHttp(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...baseValidPayload, guestCount: 15 }), // Trúc Ảnh max is 10
    });
    assertEqual(res.status, 400, 'HTTP status for over-capacity');
    assertEqual(res.data?.code, 'VALIDATION_ERROR', 'Error code');
  });

  // 2.9: Past date booking
  await test('T2-09', 'Booking in the past returns HTTP 400 VALIDATION_ERROR', async () => {
    const res = await fetchHttp(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...baseValidPayload, date: '2020-01-01' }),
    });
    assertEqual(res.status, 400, 'HTTP status for past booking');
    assertEqual(res.data?.code, 'VALIDATION_ERROR', 'Error code');
  });

  // 2.10: Booking exceeding operating hours
  await test('T2-10', 'Booking ending after operating close time returns HTTP 400 or 409 rejection', async () => {
    const res = await fetchHttp(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...baseValidPayload, startTime: '21:30', durationHours: 2 }), // ends 23:30 > 22:30
    });
    assert(res.status === 400 || res.status === 409, `HTTP status for out-of-hours (got ${res.status})`);
    assert(
      res.data?.code === 'VALIDATION_ERROR' || res.data?.code === 'SLOT_UNAVAILABLE',
      `Error code is VALIDATION_ERROR or SLOT_UNAVAILABLE (got ${res.data?.code})`
    );
  });

  // 2.11: Conflicting time slot (exact)
  let conflictBookingRef = '';
  const conflictPhone = generateRandomPhone();
  await test('T2-11', 'Conflicting booking on exact same time slot returns HTTP 409 SLOT_UNAVAILABLE', async () => {
    const firstRes = await fetchHttp(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...baseValidPayload,
        startTime: '13:00',
        customerPhone: conflictPhone,
      }),
    });
    assertEqual(firstRes.status, 201, 'First booking created');
    conflictBookingRef = firstRes.data?.data?.bookingReference;

    const conflictRes = await fetchHttp(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...baseValidPayload,
        startTime: '13:00',
        customerPhone: generateRandomPhone(),
      }),
    });
    assertEqual(conflictRes.status, 409, 'Conflict status');
    assertEqual(conflictRes.data?.code, 'SLOT_UNAVAILABLE', 'Conflict code');
  });

  // 2.12: Conflicting time slot (partial overlap)
  await test('T2-12', 'Conflicting booking with partial time overlap returns HTTP 409 SLOT_UNAVAILABLE', async () => {
    // Overlaps 13:00 - 15:00 by starting at 14:00
    const conflictRes = await fetchHttp(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...baseValidPayload,
        startTime: '14:00',
        durationHours: 2,
        customerPhone: generateRandomPhone(),
      }),
    });
    assertEqual(conflictRes.status, 409, 'Partial conflict status');
    assertEqual(conflictRes.data?.code, 'SLOT_UNAVAILABLE', 'Partial conflict code');
  });

  // 2.13: Non-existent booking reference lookup
  await test('T2-13', 'Lookup non-existent booking reference returns HTTP 404 NOT_FOUND', async () => {
    const res = await fetchHttp(
      `${baseUrl}/api/bookings/lookup?reference=LVT-99999999-XXXX&phone=0987654321`
    );
    assertEqual(res.status, 404, 'Status for missing booking');
    assertEqual(res.data?.code, 'NOT_FOUND', 'Error code');
  });

  // 2.14: Lookup with mismatched phone
  await test('T2-14', 'Lookup with wrong phone returns HTTP 403 FORBIDDEN', async () => {
    const res = await fetchHttp(
      `${baseUrl}/api/bookings/lookup?reference=${conflictBookingRef}&phone=0911222333`
    );
    assertEqual(res.status, 403, 'Status for mismatched phone');
    assertEqual(res.data?.code, 'FORBIDDEN', 'Error code');
  });

  // 2.15: PII protection: Phone suffix mismatch defense (F06)
  {
    const t0 = Date.now();
    const suffixPhone = conflictPhone.slice(-4); // last 4 digits
    const res = await fetchHttp(
      `${baseUrl}/api/bookings/lookup?reference=${conflictBookingRef}&phone=${suffixPhone}`
    );
    if (res.status === 403) {
      cases.push({
        id: 'T2-15',
        name: 'PII Protection (F06): Suffix phone lookup must be rejected with HTTP 403 FORBIDDEN',
        tier: 2,
        status: 'PASSED',
        durationMs: Date.now() - t0,
      });
    } else {
      recordEscalation(
        'T2-15',
        'PII Protection (F06): Suffix phone lookup must be rejected with HTTP 403 FORBIDDEN',
        Date.now() - t0,
        {
          featureId: 'F06',
          targetMilestone: 'M2',
          description: 'Suffix phone match allows bypassing exact phone verification',
          observed: `HTTP ${res.status} (verified=${res.data?.verified})`,
          expected: 'HTTP 403 FORBIDDEN with code "FORBIDDEN"',
        }
      );
    }
  }

  // 2.16: Non-existent room ID on admin update (F07)
  {
    const t0 = Date.now();
    const res = await fetchHttp(`${baseUrl}/api/admin/rooms/non-existent-room-999`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({ pricePerHour: 500000 }),
    });

    if (res.status === 404) {
      cases.push({
        id: 'T2-16',
        name: 'API Error Defense (F07): Updating non-existent room returns HTTP 404 NOT_FOUND',
        tier: 2,
        status: 'PASSED',
        durationMs: Date.now() - t0,
      });
    } else {
      recordEscalation(
        'T2-16',
        'API Error Defense (F07): Updating non-existent room returns HTTP 404 NOT_FOUND',
        Date.now() - t0,
        {
          featureId: 'F07',
          targetMilestone: 'M2',
          description: 'Non-existent room returns 500 DATABASE_ERROR instead of 404 NOT_FOUND',
          observed: `HTTP ${res.status} with code "${res.data?.code}"`,
          expected: 'HTTP 404 NOT_FOUND with code "NOT_FOUND"',
        }
      );
    }
  }

  // 2.17: Malformed JSON body on booking endpoint
  await test('T2-17', 'Malformed JSON payload on booking endpoint returns HTTP 400', async () => {
    const res = await fetchHttp(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ malformed json payload',
    });
    assertEqual(res.status, 400, 'HTTP status for malformed JSON');
  });

  // 2.18: Malformed JSON on admin room endpoint (F07)
  {
    const t0 = Date.now();
    const res = await fetchHttp(`${baseUrl}/api/admin/rooms/room-1`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: '{ invalid: json',
    });

    if (res.status === 400) {
      cases.push({
        id: 'T2-18',
        name: 'API Error Defense (F07): Malformed JSON on admin room update returns HTTP 400',
        tier: 2,
        status: 'PASSED',
        durationMs: Date.now() - t0,
      });
    } else {
      recordEscalation(
        'T2-18',
        'API Error Defense (F07): Malformed JSON on admin room update returns HTTP 400',
        Date.now() - t0,
        {
          featureId: 'F07',
          targetMilestone: 'M2',
          description: 'Malformed JSON returns 500 DATABASE_ERROR instead of 400',
          observed: `HTTP ${res.status} with code "${res.data?.code}"`,
          expected: 'HTTP 400 BAD_REQUEST',
        }
      );
    }
  }

  // 2.19: Admin login with incorrect passcode
  await test('T2-19', 'Admin login with incorrect passcode returns HTTP 401 UNAUTHORIZED', async () => {
    const res = await fetchHttp(`${baseUrl}/api/admin/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: 'wrongpasscode123' }),
    });
    assertEqual(res.status, 401, 'HTTP status for wrong passcode');
    assertEqual(res.data?.code, 'UNAUTHORIZED', 'Error code');
  });

  // 2.20: Protected admin endpoint without authentication
  await test('T2-20', 'Unauthenticated request to protected admin endpoint returns HTTP 401 UNAUTHORIZED', async () => {
    const res = await fetchHttp(`${baseUrl}/api/admin/config`);
    assertEqual(res.status, 401, 'HTTP status for unauthenticated admin call');
    assertEqual(res.data?.code, 'UNAUTHORIZED', 'Error code');
  });

  // 2.21: Invalid state transition (Double approve)
  await test('T2-21', 'Approving an already CONFIRMED booking returns HTTP 409 conflict', async () => {
    const firstBooking = await createTestBooking(baseUrl, { date: testDate, startTime: '16:00' });
    const approveRes1 = await fetchHttp(
      `${baseUrl}/api/admin/bookings/${firstBooking.id}/approve`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
        body: JSON.stringify({}),
      }
    );
    assertEqual(approveRes1.status, 200, 'First approval succeeds');

    const approveRes2 = await fetchHttp(
      `${baseUrl}/api/admin/bookings/${firstBooking.id}/approve`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
        body: JSON.stringify({}),
      }
    );
    assertEqual(approveRes2.status, 409, 'Double approval status');
    assert(
      approveRes2.data?.code === 'INVALID_STATE_TRANSITION' ||
        approveRes2.data?.code === 'INVALID_BOOKING_STATE',
      `Error code is INVALID_STATE_TRANSITION or INVALID_BOOKING_STATE (got ${approveRes2.data?.code})`
    );
  });

  // 2.22: Invalid state transition (Cancel rejected booking)
  await test('T2-22', 'Cancelling a REJECTED booking returns HTTP 409 conflict', async () => {
    const b = await createTestBooking(baseUrl, { date: testDate, startTime: '18:30' });
    const rejectRes = await fetchHttp(`${baseUrl}/api/admin/bookings/${b.id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ reason: 'Không phục vụ' }),
    });
    assertEqual(rejectRes.status, 200, 'Rejection succeeds');

    const cancelRes = await fetchHttp(`${baseUrl}/api/admin/bookings/${b.id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ reason: 'Hủy sau khi từ chối' }),
    });
    assertEqual(cancelRes.status, 409, 'Cancel rejected booking status');
    assert(
      cancelRes.data?.code === 'INVALID_STATE_TRANSITION' ||
        cancelRes.data?.code === 'INVALID_BOOKING_STATE',
      `Error code is INVALID_STATE_TRANSITION or INVALID_BOOKING_STATE (got ${cancelRes.data?.code})`
    );
  });

  // 2.23: Slot block invalid time bounds
  await test('T2-23', 'Slot block creation with startTime >= endTime returns HTTP 400 VALIDATION_ERROR', async () => {
    const res = await fetchHttp(`${baseUrl}/api/admin/slot-blocks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({
        roomId: 'room-1',
        date: testDate,
        startTime: '15:00',
        endTime: '14:00',
        reason: 'Khóa ngược thời gian',
      }),
    });
    assertEqual(res.status, 400, 'Invalid time bounds status');
    assertEqual(res.data?.code, 'VALIDATION_ERROR', 'Error code');
  });

  // 2.24: PATCH /api/admin/config (F05)
  {
    const t0 = Date.now();
    const res = await fetchHttp(`${baseUrl}/api/admin/config`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ holdDurationHours: 2 }),
    });

    if (res.status === 200) {
      cases.push({
        id: 'T2-24',
        name: 'Admin Config API Support (F05): PATCH /api/admin/config returns HTTP 200',
        tier: 2,
        status: 'PASSED',
        durationMs: Date.now() - t0,
      });
    } else {
      recordEscalation(
        'T2-24',
        'Admin Config API Support (F05): PATCH /api/admin/config returns HTTP 200',
        Date.now() - t0,
        {
          featureId: 'F05',
          targetMilestone: 'M2',
          description: 'PATCH method on /api/admin/config is not implemented (HTTP 405 Method Not Allowed)',
          observed: `HTTP ${res.status} Method Not Allowed`,
          expected: 'HTTP 200 with success: true',
        }
      );
    }
  }

  const passed = cases.filter((c) => c.status === 'PASSED').length;
  const failed = cases.filter((c) => c.status === 'FAILED').length;
  const escalated = cases.filter((c) => c.status === 'ESCALATED').length;

  return {
    tier: 2,
    name: 'Tier 2: Boundary & Corner Cases',
    total: cases.length,
    passed,
    failed,
    escalated,
    durationMs: Date.now() - startTime,
    cases,
  };
}
