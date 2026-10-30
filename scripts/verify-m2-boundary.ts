import { getAdminPasscode } from '../src/lib/auth';
import { resetDemoData } from '../src/lib/db';

async function verifyM2() {
  console.log('=== VERIFYING M2 BOUNDARY & HTTP ENDPOINTS OVER REAL NETWORK ===');
  resetDemoData();
  const passcode = getAdminPasscode();
  const baseUrl = 'http://localhost:3000';

  const results: { test: string; status: number; body: any; passed: boolean; error?: string }[] = [];

  // 1. Attempt PATCH /api/admin/rooms/non_existent_id with valid passcode
  {
    console.log('\n[1] Testing PATCH /api/admin/rooms/non_existent_id:');
    const res1 = await fetch(`${baseUrl}/api/admin/rooms/non_existent_id`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-passcode': passcode,
      },
      body: JSON.stringify({ pricePerHour: 250000 }),
    });
    const data1 = await res1.json();
    console.log('HTTP Status:', res1.status);
    console.log('Response Body:', JSON.stringify(data1));
    const passed = res1.status === 404 && data1.code === 'NOT_FOUND';
    results.push({ test: 'PATCH non_existent_id returns 404 NOT_FOUND', status: res1.status, body: data1, passed });
  }

  // 2a. Attempt PATCH /api/admin/rooms/room-1 with partial payload { pricePerHour: 250000 }
  {
    console.log('\n[2a] Testing PATCH /api/admin/rooms/room-1 with partial payload { pricePerHour: 250000 }:');
    const res2a = await fetch(`${baseUrl}/api/admin/rooms/room-1`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-passcode': passcode,
      },
      body: JSON.stringify({ pricePerHour: 250000 }),
    });
    const data2a = await res2a.json();
    console.log('HTTP Status:', res2a.status);
    console.log('Response Body:', JSON.stringify(data2a));
    const passed = res2a.status === 200 && data2a.success && data2a.data?.pricePerHour === 250000;
    results.push({ test: 'PATCH room-1 partial payload { pricePerHour: 250000 } returns 200 OK', status: res2a.status, body: data2a, passed });
  }

  // 2b. Attempt PATCH /api/admin/rooms/room-1 with full payload { pricePerHour: 250000, pricePackage2h: 800000, capacityMax: 10, isActive: true }
  {
    console.log('\n[2b] Testing PATCH /api/admin/rooms/room-1 with full payload:');
    const res2b = await fetch(`${baseUrl}/api/admin/rooms/room-1`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-passcode': passcode,
      },
      body: JSON.stringify({ pricePerHour: 250000, pricePackage2h: 800000, capacityMax: 10, isActive: true }),
    });
    const data2b = await res2b.json();
    console.log('HTTP Status:', res2b.status);
    console.log('Response Body:', JSON.stringify(data2b));
    const passed = res2b.status === 200 && data2b.success && data2b.data?.pricePerHour === 250000;
    results.push({ test: 'PATCH room-1 full payload returns 200 OK', status: res2b.status, body: data2b, passed });
  }

  // 3. Test Malformed JSON on /api/admin/rooms/room-1
  {
    console.log('\n[3] Testing Malformed JSON on /api/admin/rooms/room-1:');
    const res3 = await fetch(`${baseUrl}/api/admin/rooms/room-1`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-passcode': passcode,
      },
      body: '{ invalid: json',
    });
    const data3 = await res3.json();
    console.log('HTTP Status:', res3.status);
    console.log('Response Body:', JSON.stringify(data3));
    const passed = res3.status === 400 && data3.code === 'VALIDATION_ERROR';
    results.push({ test: 'Malformed JSON on room PATCH returns 400 VALIDATION_ERROR', status: res3.status, body: data3, passed });
  }

  // 4. Test Admin Config PATCH
  {
    console.log('\n[4] Testing PATCH /api/admin/config:');
    const res4 = await fetch(`${baseUrl}/api/admin/config`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-passcode': passcode,
      },
      body: JSON.stringify({ holdDurationHours: 2 }),
    });
    const data4 = await res4.json();
    console.log('HTTP Status:', res4.status);
    console.log('Response Body:', JSON.stringify(data4));
    const passed = res4.status === 200 && data4.success;
    results.push({ test: 'PATCH /api/admin/config returns 200 OK', status: res4.status, body: data4, passed });
  }

  // 5. Test PII Suffix Leakage on /api/bookings/lookup
  {
    console.log('\n[5] Testing PII Suffix Leakage on /api/bookings/lookup:');
    const res5 = await fetch(`${baseUrl}/api/bookings/lookup?reference=LVT-20261028-7F9A&phone=8`);
    const data5 = await res5.json();
    console.log('HTTP Status:', res5.status);
    console.log('Response Body:', JSON.stringify(data5));
    const passed = res5.status === 403 && data5.code === 'FORBIDDEN';
    results.push({ test: 'PII Suffix match on lookup returns 403 FORBIDDEN', status: res5.status, body: data5, passed });
  }

  console.log('\n=== SUMMARY OF EMPIRICAL TESTS ===');
  for (const r of results) {
    console.log(`${r.passed ? '✓ PASS' : '❌ FAIL'}: ${r.test} [Status: ${r.status}]`);
  }
}

verifyM2().catch((err) => {
  console.error('Script error:', err);
  process.exit(1);
});
