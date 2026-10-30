import { NextRequest } from 'next/server';
import { PATCH as configPatch, PUT as configPut } from '../src/app/api/admin/config/route';
import { GET as bookingStatusGet } from '../src/app/api/bookings/[code]/status/route';
import { GET as bookingLookupGet } from '../src/app/api/bookings/lookup/route';
import { PATCH as roomPatch } from '../src/app/api/admin/rooms/[id]/route';
import { PATCH as bookingPatch } from '../src/app/api/admin/bookings/[id]/route';
import { POST as slotBlockPost } from '../src/app/api/admin/slot-blocks/route';
import { POST as notificationPost } from '../src/app/api/admin/notifications/route';
import { POST as adminAuthPost, GET as adminAuthGet } from '../src/app/api/admin/auth/route';
import { resetDemoData } from '../src/lib/db';
import { ADMIN_COOKIE_NAME, getAdminPasscode } from '../src/lib/auth';

async function runAdversarialTests() {
  console.log('=== BẮT ĐẦU ADVERSARIAL STRESS TESTING (REVIEWER & CRITIC) ===\n');

  resetDemoData();
  const passcode = getAdminPasscode();
  let passCount = 0;
  let totalCount = 0;

  function record(desc: string, passed: boolean, details?: string) {
    totalCount++;
    if (passed) {
      passCount++;
      console.log(`✓ [ADV-${String(totalCount).padStart(2, '0')}] ${desc}`);
    } else {
      console.error(`❌ [ADV-${String(totalCount).padStart(2, '0')}] FAILED: ${desc} | ${details}`);
    }
  }

  // ADV 1: Phone attack with empty/special characters
  {
    const req = new NextRequest('http://localhost:3000/api/bookings/LVT-20261028-7F9A/status?phone=---');
    const res = await bookingStatusGet(req, { params: Promise.resolve({ code: 'LVT-20261028-7F9A' }) });
    const json = await res.json();
    record('Phone "---" does not match and keeps PII masked', json.success && json.data.customerPhone.includes('***'));
  }

  // ADV 2: Phone prefix attack (0912 vs full 0912345678)
  {
    const req = new NextRequest('http://localhost:3000/api/bookings/LVT-20261028-7F9A/status?phone=0912');
    const res = await bookingStatusGet(req, { params: Promise.resolve({ code: 'LVT-20261028-7F9A' }) });
    const json = await res.json();
    record('Phone prefix "0912" does not match and keeps PII masked', json.success && json.data.customerPhone.includes('***'));
  }

  // ADV 3: Phone middle attack (3456 vs full 0912345678)
  {
    const req = new NextRequest('http://localhost:3000/api/bookings/LVT-20261028-7F9A/status?phone=3456');
    const res = await bookingStatusGet(req, { params: Promise.resolve({ code: 'LVT-20261028-7F9A' }) });
    const json = await res.json();
    record('Phone substring "3456" does not match and keeps PII masked', json.success && json.data.customerPhone.includes('***'));
  }

  // ADV 4: Phone international format +84912345678 matching 0912345678
  {
    const req = new NextRequest('http://localhost:3000/api/bookings/LVT-20261028-7F9A/status?phone=%2B84912345678');
    const res = await bookingStatusGet(req, { params: Promise.resolve({ code: 'LVT-20261028-7F9A' }) });
    const json = await res.json();
    record('Phone "+84912345678" normalized matches "0912345678"', json.success && json.data.customerPhone === '0912345678');
  }

  // ADV 5: Phone formatted with dashes/spaces "091 234-5678"
  {
    const req = new NextRequest('http://localhost:3000/api/bookings/lookup?reference=LVT-20261028-7F9A&phone=091%20234-5678');
    const res = await bookingLookupGet(req);
    const json = await res.json();
    record('Phone "091 234-5678" with spaces/dashes matches lookup', res.status === 200 && json.verified === true);
  }

  // ADV 6: Phone single digit "0" in lookup returns 403
  {
    const req = new NextRequest('http://localhost:3000/api/bookings/lookup?reference=LVT-20261028-7F9A&phone=0');
    const res = await bookingLookupGet(req);
    record('Phone "0" returns 403 FORBIDDEN', res.status === 403);
  }

  // ADV 7: Phone "84" in lookup returns 403
  {
    const req = new NextRequest('http://localhost:3000/api/bookings/lookup?reference=LVT-20261028-7F9A&phone=84');
    const res = await bookingLookupGet(req);
    record('Phone "84" returns 403 FORBIDDEN', res.status === 403);
  }

  // ADV 8: SQL Injection in room ID
  {
    const req = new NextRequest('http://localhost:3000/api/admin/rooms/\' OR 1=1 --', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', 'x-admin-passcode': passcode },
      body: JSON.stringify({ pricePerHour: 100000 }),
    });
    const res = await roomPatch(req, { params: Promise.resolve({ id: '\' OR 1=1 --' }) });
    const json = await res.json();
    record('SQL Injection in Room ID safely handled as 404 NOT_FOUND', res.status === 404 && json.code === 'NOT_FOUND');
  }

  // ADV 9: Path Traversal in room ID
  {
    const req = new NextRequest('http://localhost:3000/api/admin/rooms/../../etc/passwd', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', 'x-admin-passcode': passcode },
      body: JSON.stringify({ pricePerHour: 100000 }),
    });
    const res = await roomPatch(req, { params: Promise.resolve({ id: '../../etc/passwd' }) });
    const json = await res.json();
    record('Path Traversal in Room ID safely handled as 404 NOT_FOUND', res.status === 404 && json.code === 'NOT_FOUND');
  }

  // ADV 10: Empty string body in config PATCH
  {
    const req = new NextRequest('http://localhost:3000/api/admin/config', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', 'x-admin-passcode': passcode },
      body: '',
    });
    const res = await configPatch(req);
    const json = await res.json();
    record('Empty string body in Config PATCH returns 400 VALIDATION_ERROR', res.status === 400 && json.code === 'VALIDATION_ERROR');
  }

  // ADV 11: Broken JSON syntax in bookings PATCH
  {
    const req = new NextRequest('http://localhost:3000/api/admin/bookings/seed-booking-1', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', 'x-admin-passcode': passcode },
      body: '{"status": "confirmed", broken',
    });
    const res = await bookingPatch(req, { params: Promise.resolve({ id: 'seed-booking-1' }) });
    const json = await res.json();
    record('Broken JSON syntax in Bookings PATCH returns 400 VALIDATION_ERROR', res.status === 400 && json.code === 'VALIDATION_ERROR');
  }

  // ADV 12: Broken JSON syntax in slot-blocks POST
  {
    const req = new NextRequest('http://localhost:3000/api/admin/slot-blocks', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-admin-passcode': passcode },
      body: '{roomId: "room-1"}', // unquoted key is invalid JSON
    });
    const res = await slotBlockPost(req);
    const json = await res.json();
    record('Unquoted key JSON in Slot-Blocks POST returns 400 VALIDATION_ERROR', res.status === 400 && json.code === 'VALIDATION_ERROR');
  }

  // ADV 13: Broken JSON syntax in notifications POST
  {
    const req = new NextRequest('http://localhost:3000/api/admin/notifications', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-admin-passcode': passcode },
      body: '<<<not a json>>>',
    });
    const res = await notificationPost(req);
    const json = await res.json();
    record('Invalid XML-like string in Notifications POST returns 400 VALIDATION_ERROR', res.status === 400 && json.code === 'VALIDATION_ERROR');
  }

  // ADV 14: Tampered JWT/Session Token
  {
    const req = new NextRequest('http://localhost:3000/api/admin/auth', {
      headers: { cookie: `${ADMIN_COOKIE_NAME}=eyJhY3RvciI6ImFkbWluIiwiZXhwIjoxNzkzNDQyMTM1MTU5fQ.fake_signature` },
    });
    const res = await adminAuthGet(req);
    record('Tampered session token fails verification with 401', res.status === 401);
  }

  // ADV 15: Forged Passcode Attempt
  {
    const req = new NextRequest('http://localhost:3000/api/admin/auth', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ passcode: 'wrong-passcode-attempt' }),
    });
    const res = await adminAuthPost(req);
    const json = await res.json();
    record('Wrong passcode rejected with 401 UNAUTHORIZED', res.status === 401 && json.code === 'UNAUTHORIZED');
  }

  console.log(`\n=== ADVERSARIAL TEST RESULTS: ${passCount}/${totalCount} PASSED ===`);
  if (passCount !== totalCount) {
    process.exit(1);
  }
}

runAdversarialTests().catch((err) => {
  console.error('Lỗi kiểm thử adversarial:', err);
  process.exit(1);
});
