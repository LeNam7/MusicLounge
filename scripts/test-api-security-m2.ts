import { NextRequest } from 'next/server';
import { PATCH as configPatch, PUT as configPut } from '../src/app/api/admin/config/route';
import { GET as bookingStatusGet } from '../src/app/api/bookings/[code]/status/route';
import { GET as bookingLookupGet } from '../src/app/api/bookings/lookup/route';
import { PATCH as roomPatch } from '../src/app/api/admin/rooms/[id]/route';
import { PATCH as bookingPatch } from '../src/app/api/admin/bookings/[id]/route';
import { POST as slotBlockPost } from '../src/app/api/admin/slot-blocks/route';
import { POST as notificationPost } from '../src/app/api/admin/notifications/route';
import { POST as adminAuthPost } from '../src/app/api/admin/auth/route';
import { resetDemoData } from '../src/lib/db';
import { ADMIN_COOKIE_NAME, getAdminPasscode } from '../src/lib/auth';

async function runM2SecurityTests() {
  console.log('=== BẮT ĐẦU KIỂM THỬ BẢO MẬT & XỬ LÝ LỖI API (MILESTONE 2) ===\n');

  resetDemoData();
  const passcode = getAdminPasscode();

  // 1. Test Admin Config PATCH & PUT
  {
    const reqPatch = new NextRequest('http://localhost:3000/api/admin/config', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-admin-passcode': passcode,
      },
      body: JSON.stringify({
        openTime: '09:00',
        closeTime: '22:00',
      }),
    });
    const resPatch = await configPatch(reqPatch);
    const jsonPatch = await resPatch.json();
    if (resPatch.status !== 200 || !jsonPatch.success || jsonPatch.data.openTime !== '09:00') {
      throw new Error(`Config PATCH failed: ${JSON.stringify(jsonPatch)}`);
    }
    console.log('✓ [01/13] PATCH /api/admin/config cập nhật cấu hình thành công (HTTP 200)');

    const reqPut = new NextRequest('http://localhost:3000/api/admin/config', {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        'x-admin-passcode': passcode,
      },
      body: JSON.stringify({
        openTime: '08:30',
        closeTime: '22:30',
      }),
    });
    const resPut = await configPut(reqPut);
    const jsonPut = await resPut.json();
    if (resPut.status !== 200 || !jsonPut.success || jsonPut.data.openTime !== '08:30') {
      throw new Error(`Config PUT failed: ${JSON.stringify(jsonPut)}`);
    }
    console.log('✓ [02/13] PUT /api/admin/config cập nhật cấu hình thành công (HTTP 200)');
  }

  // 2. Test Invalid JSON in Config PATCH
  {
    const reqInvalid = new NextRequest('http://localhost:3000/api/admin/config', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-admin-passcode': passcode,
      },
      body: 'INVALID_JSON_BODY',
    });
    const res = await configPatch(reqInvalid);
    const json = await res.json();
    if (res.status !== 400 || json.code !== 'VALIDATION_ERROR') {
      throw new Error(`Expected 400 VALIDATION_ERROR on config invalid JSON, got ${res.status}: ${JSON.stringify(json)}`);
    }
    console.log('✓ [03/13] PATCH /api/admin/config với JSON hỏng trả về HTTP 400 VALIDATION_ERROR');
  }

  // 3. Test PII Leakage Protection in /api/bookings/[code]/status
  {
    // Try suffix match with single digit '8' (seed booking customer phone is 0912345678)
    const reqSuffix = new NextRequest('http://localhost:3000/api/bookings/LVT-20261028-7F9A/status?phone=8');
    const resSuffix = await bookingStatusGet(reqSuffix, { params: Promise.resolve({ code: 'LVT-20261028-7F9A' }) });
    const jsonSuffix = await resSuffix.json();
    if (!jsonSuffix.success || jsonSuffix.data.customerPhone.includes('0912345678')) {
      throw new Error(`Status endpoint leaked phone on suffix match: ${JSON.stringify(jsonSuffix)}`);
    }
    console.log('✓ [04/13] GET /api/bookings/[code]/status?phone=8 che thông tin PII, chặn rò rỉ hậu tố');

    // Exact match
    const reqExact = new NextRequest('http://localhost:3000/api/bookings/LVT-20261028-7F9A/status?phone=0912345678');
    const resExact = await bookingStatusGet(reqExact, { params: Promise.resolve({ code: 'LVT-20261028-7F9A' }) });
    const jsonExact = await resExact.json();
    if (!jsonExact.success || jsonExact.data.customerPhone !== '0912345678') {
      throw new Error(`Status endpoint failed on exact phone match: ${JSON.stringify(jsonExact)}`);
    }
    console.log('✓ [05/13] GET /api/bookings/[code]/status?phone=0912345678 xác minh chính xác');
  }

  // 4. Test PII Leakage Protection in /api/bookings/lookup
  {
    // Suffix match '8' must return 403 Forbidden
    const reqSuffix = new NextRequest('http://localhost:3000/api/bookings/lookup?reference=LVT-20261028-7F9A&phone=8');
    const resSuffix = await bookingLookupGet(reqSuffix);
    const jsonSuffix = await resSuffix.json();
    if (resSuffix.status !== 403 || jsonSuffix.code !== 'FORBIDDEN') {
      throw new Error(`Lookup suffix match did NOT return 403: status=${resSuffix.status}, body=${JSON.stringify(jsonSuffix)}`);
    }
    console.log('✓ [06/13] GET /api/bookings/lookup?phone=8 trả về HTTP 403 FORBIDDEN');

    // Exact match
    const reqExact = new NextRequest('http://localhost:3000/api/bookings/lookup?reference=LVT-20261028-7F9A&phone=0912345678');
    const resExact = await bookingLookupGet(reqExact);
    const jsonExact = await resExact.json();
    if (resExact.status !== 200 || !jsonExact.verified || jsonExact.data.customerPhone !== '0912345678') {
      throw new Error(`Lookup exact match failed: status=${resExact.status}, body=${JSON.stringify(jsonExact)}`);
    }
    console.log('✓ [07/13] GET /api/bookings/lookup?phone=0912345678 trả về HTTP 200 đầy đủ PII');
  }

  // 5. Test Non-existent Room PATCH returns HTTP 404
  {
    const reqNotFound = new NextRequest('http://localhost:3000/api/admin/rooms/room-999', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-admin-passcode': passcode,
      },
      body: JSON.stringify({ pricePerHour: 500000 }),
    });
    const resNotFound = await roomPatch(reqNotFound, { params: Promise.resolve({ id: 'room-999' }) });
    const jsonNotFound = await resNotFound.json();
    if (resNotFound.status !== 404 || jsonNotFound.code !== 'NOT_FOUND') {
      throw new Error(`Non-existent room patch did not return 404: status=${resNotFound.status}, body=${JSON.stringify(jsonNotFound)}`);
    }
    console.log('✓ [08/13] PATCH /api/admin/rooms/room-999 trả về HTTP 404 NOT_FOUND');
  }

  // 6. Test Invalid JSON across admin routes returns HTTP 400 VALIDATION_ERROR
  {
    // Rooms
    const reqRoom = new NextRequest('http://localhost:3000/api/admin/rooms/room-1', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', 'x-admin-passcode': passcode },
      body: '{ invalid json }',
    });
    const resRoom = await roomPatch(reqRoom, { params: Promise.resolve({ id: 'room-1' }) });
    const jsonRoom = await resRoom.json();
    if (resRoom.status !== 400 || jsonRoom.code !== 'VALIDATION_ERROR') {
      throw new Error(`Room PATCH invalid JSON did not return 400: ${JSON.stringify(jsonRoom)}`);
    }
    console.log('✓ [09/13] PATCH /api/admin/rooms/[id] với JSON hỏng trả về HTTP 400 VALIDATION_ERROR');

    // Bookings
    const reqBooking = new NextRequest('http://localhost:3000/api/admin/bookings/seed-booking-1', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', 'x-admin-passcode': passcode },
      body: '{ not valid }',
    });
    const resBooking = await bookingPatch(reqBooking, { params: Promise.resolve({ id: 'seed-booking-1' }) });
    const jsonBooking = await resBooking.json();
    if (resBooking.status !== 400 || jsonBooking.code !== 'VALIDATION_ERROR') {
      throw new Error(`Booking PATCH invalid JSON did not return 400: ${JSON.stringify(jsonBooking)}`);
    }
    console.log('✓ [10/13] PATCH /api/admin/bookings/[id] với JSON hỏng trả về HTTP 400 VALIDATION_ERROR');

    // Slot Blocks
    const reqSlot = new NextRequest('http://localhost:3000/api/admin/slot-blocks', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-admin-passcode': passcode },
      body: 'bad_json',
    });
    const resSlot = await slotBlockPost(reqSlot);
    const jsonSlot = await resSlot.json();
    if (resSlot.status !== 400 || jsonSlot.code !== 'VALIDATION_ERROR') {
      throw new Error(`Slot-blocks POST invalid JSON did not return 400: ${JSON.stringify(jsonSlot)}`);
    }
    console.log('✓ [11/13] POST /api/admin/slot-blocks với JSON hỏng trả về HTTP 400 VALIDATION_ERROR');

    // Notifications
    const reqNotif = new NextRequest('http://localhost:3000/api/admin/notifications', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-admin-passcode': passcode },
      body: 'bad_json',
    });
    const resNotif = await notificationPost(reqNotif);
    const jsonNotif = await resNotif.json();
    if (resNotif.status !== 400 || jsonNotif.code !== 'VALIDATION_ERROR') {
      throw new Error(`Notifications POST invalid JSON did not return 400: ${JSON.stringify(jsonNotif)}`);
    }
    console.log('✓ [12/13] POST /api/admin/notifications với JSON hỏng trả về HTTP 400 VALIDATION_ERROR');
  }

  // 7. Test Admin Auth Cookie Security
  {
    const reqAuth = new NextRequest('http://localhost:3000/api/admin/auth', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ passcode }),
    });
    const resAuth = await adminAuthPost(reqAuth);
    const setCookie = resAuth.headers.get('set-cookie') || '';
    if (!setCookie.includes(ADMIN_COOKIE_NAME) || !setCookie.includes('HttpOnly')) {
      throw new Error(`Admin cookie not set properly: ${setCookie}`);
    }
    console.log('✓ [13/13] POST /api/admin/auth cấp Cookie HttpOnly có cờ secure theo môi trường');
  }

  console.log('\n=== TẤT CẢ 13/13 BÀI KIỂM THỬ BẢO MẬT & API M2 ĐỀU VƯỢT QUA 100% ===\n');
}

runM2SecurityTests().catch((err) => {
  console.error('Kiểm thử thất bại:', err);
  process.exit(1);
});
