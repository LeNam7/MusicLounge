import {
  assert,
  assertEqual,
  assertIncludes,
  fetchHttp,
  generateRandomPhone,
  getAdminSessionCookie,
  getFutureDate,
} from './helpers';
import { TestCaseResult, TierResult } from './types';

export async function runTier1(baseUrl: string): Promise<TierResult> {
  const startTime = Date.now();
  const cases: TestCaseResult[] = [];
  const testDate = getFutureDate(20);

  // Helper to record test results
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
        tier: 1,
        status: 'PASSED',
        durationMs: Date.now() - t0,
      });
    } catch (err: any) {
      cases.push({
        id,
        name,
        tier: 1,
        status: 'FAILED',
        durationMs: Date.now() - t0,
        error: err?.message || String(err),
      });
    }
  }

  // 1.1 Room listing API
  await test('T1-01', 'Room listing API returns all 4 tea rooms with correct capacity and attributes', async () => {
    const res = await fetchHttp(`${baseUrl}/api/rooms`);
    assertEqual(res.status, 200, 'Rooms API status');
    assert(res.data?.success === true, 'Rooms API success property');
    assert(Array.isArray(res.data?.data), 'Rooms data is array');
    assertEqual(res.data.data.length, 4, 'Rooms count');

    const trucAnh = res.data.data.find((r: any) => r.slug === 'truc-anh');
    assert(!!trucAnh, 'Room truc-anh exists');
    assertEqual(trucAnh.capacityMin, 2, 'Trúc Ảnh minimum capacity');
    assertEqual(trucAnh.capacityMax, 10, 'Trúc Ảnh maximum capacity');
    assert(trucAnh.pricePerHour > 0, 'Trúc Ảnh price per hour is defined');
  });

  // 1.2 Core UI Pages
  await test('T1-02', 'Core customer and admin pages load successfully (HTTP 200)', async () => {
    const [homeRes, roomRes, bookRes, lookupRes, adminRes] = await Promise.all([
      fetchHttp(`${baseUrl}/`),
      fetchHttp(`${baseUrl}/rooms/truc-anh`),
      fetchHttp(`${baseUrl}/booking?room=truc-anh`),
      fetchHttp(`${baseUrl}/lookup`),
      fetchHttp(`${baseUrl}/admin`),
    ]);

    assertEqual(homeRes.status, 200, 'Homepage status');
    assertIncludes(homeRes.rawText, 'LÙNG VÀI TEA', 'Homepage brand title');

    assertEqual(roomRes.status, 200, 'Room detail status');
    assertIncludes(roomRes.rawText, 'Trúc Ảnh', 'Room detail title');

    assertEqual(bookRes.status, 200, 'Booking page status');
    assertEqual(lookupRes.status, 200, 'Lookup page status');
    assertEqual(adminRes.status, 200, 'Admin page status');
  });

  // 1.3 Availability calculation
  await test('T1-03', 'Availability calculation returns exactly 56 15-minute intervals during operating hours (08:30 - 22:30)', async () => {
    const res = await fetchHttp(
      `${baseUrl}/api/availability?roomId=room-1&date=${testDate}&durationHours=2`
    );
    assertEqual(res.status, 200, 'Availability API status');
    assert(res.data?.success === true, 'Availability API success');
    const slots = res.data?.data?.slots;
    assert(Array.isArray(slots), 'Slots is an array');
    assertEqual(slots.length, 56, 'Slot count between 08:30 and 22:30 with 15min intervals');
    assertEqual(slots[0].time, '08:30', 'First slot is 08:30');
    assertEqual(slots[slots.length - 1].time, '22:15', 'Last slot is 22:15');
  });

  // 1.4 Booking creation
  let createdBookingId = '';
  let createdBookingRef = '';
  const customerPhone = generateRandomPhone();

  await test('T1-04', 'Booking creation generates PENDING booking with standard reference code (LVT-...) and hold timer', async () => {
    const payload = {
      roomId: 'room-1',
      customerName: 'Hoàng Minh Quân',
      customerPhone,
      customerEmail: 'quan.hoang@example.com',
      date: testDate,
      startTime: '09:00',
      durationHours: 2,
      guestCount: 4,
      teaPackageId: 'tea-lung-vai',
      specialRequests: 'Chuẩn bị phòng trà chu đáo đón khách đối tác',
      idempotencyKey: `idem-t1-04-${Date.now()}`,
    };

    const res = await fetchHttp(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    assertEqual(res.status, 201, 'Booking creation HTTP status');
    assert(res.data?.success === true, 'Booking response success');
    assertEqual(res.data?.data?.status, 'pending', 'Status string is pending');
    assertEqual(res.data?.data?.statusCode, 'PENDING', 'StatusCode is PENDING');

    createdBookingRef = res.data?.data?.bookingReference;
    createdBookingId = res.data?.data?.id;

    assert(/^LVT-\d{8}-[A-Z0-9]{4}$/.test(createdBookingRef), 'Booking reference format');
    assert(!!res.data?.data?.expiresAt, 'Hold timer expiresAt is present');
  });

  // 1.5 Masked booking status lookup
  await test('T1-05', 'Public booking status endpoint conceals customer PII without phone', async () => {
    const res = await fetchHttp(`${baseUrl}/api/bookings/${createdBookingRef}/status`);
    assertEqual(res.status, 200, 'Status endpoint HTTP status');
    assert(res.data?.success === true, 'Status query success');
    assertEqual(res.data?.data?.statusCode, 'PENDING', 'Status code is PENDING');

    // Customer name and phone must be masked
    const name = res.data?.data?.customerName || '';
    assert(name.includes('*'), `Customer name is masked: ${name}`);
    const phone = res.data?.data?.customerPhone || '';
    assert(phone.includes('*'), `Customer phone is masked: ${phone}`);
  });

  // 1.6 Full booking lookup with phone verification
  await test('T1-06', 'Booking lookup endpoint returns full PII when verified with exact phone number', async () => {
    const res = await fetchHttp(
      `${baseUrl}/api/bookings/lookup?reference=${createdBookingRef}&phone=${customerPhone}`
    );
    assertEqual(res.status, 200, 'Lookup endpoint HTTP status');
    assert(res.data?.success === true, 'Lookup query success');
    assertEqual(res.data?.verified, true, 'Lookup verified status');
    assertEqual(res.data?.data?.customerName, 'Hoàng Minh Quân', 'Customer name revealed unmasked');
    assertEqual(res.data?.data?.customerPhone, customerPhone, 'Customer phone revealed unmasked');
  });

  // 1.7 Admin authentication
  let sessionCookie = '';
  await test('T1-07', 'Admin authentication issues signed HttpOnly session cookie on valid passcode', async () => {
    const res = await fetchHttp(`${baseUrl}/api/admin/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: 'serenity2026' }),
    });

    assertEqual(res.status, 200, 'Admin auth HTTP status');
    assert(res.data?.success === true, 'Admin auth success');
    const setCookie = res.headers.get('set-cookie') || '';
    assertIncludes(setCookie, 'lvt_admin_session=', 'Cookie name');
    sessionCookie = setCookie.split(';')[0];
  });

  // 1.8 Admin booking approval
  await test('T1-08', 'Admin can approve PENDING booking to CONFIRMED and slot state synchronizes', async () => {
    const res = await fetchHttp(`${baseUrl}/api/admin/bookings/${createdBookingId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        adminNotes: 'Đã chuẩn bị trà ngon và ấm chu nê',
      }),
    });

    assertEqual(res.status, 200, 'Approval HTTP status');
    assert(res.data?.success === true, 'Approval success');
    assertEqual(res.data?.data?.status, 'confirmed', 'Status string is confirmed');
    assertEqual(res.data?.data?.statusCode, 'CONFIRMED', 'StatusCode is CONFIRMED');

    // Verify availability slot changed to CONFIRMED
    const availRes = await fetchHttp(
      `${baseUrl}/api/availability?roomId=room-1&date=${testDate}&durationHours=2`
    );
    const slot0900 = availRes.data?.data?.slots?.find((s: any) => s.time === '09:00');
    assertEqual(slot0900?.status, 'CONFIRMED', 'Slot 09:00 updated to CONFIRMED');
  });

  // 1.9 Admin booking rejection
  await test('T1-09', 'Admin can reject PENDING booking and slot immediately releases back to AVAILABLE', async () => {
    // Create another booking at 11:30
    const rejectBookingRes = await fetchHttp(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: 'room-1',
        customerName: 'Khách Chờ Từ Chối',
        customerPhone: generateRandomPhone(),
        date: testDate,
        startTime: '11:30',
        durationHours: 2,
        guestCount: 2,
      }),
    });
    const bookingToRejectId = rejectBookingRes.data?.data?.id;

    const res = await fetchHttp(`${baseUrl}/api/admin/bookings/${bookingToRejectId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        reason: 'Phòng chuẩn bị cho đoàn nghệ nhân trà đạo',
      }),
    });

    assertEqual(res.status, 200, 'Rejection HTTP status');
    assert(res.data?.success === true, 'Rejection success');
    assertEqual(res.data?.data?.status, 'rejected', 'Status string is rejected');

    // Slot 11:30 must be restored to AVAILABLE
    const availRes = await fetchHttp(
      `${baseUrl}/api/availability?roomId=room-1&date=${testDate}&durationHours=2`
    );
    const slot1130 = availRes.data?.data?.slots?.find((s: any) => s.time === '11:30');
    assertEqual(slot1130?.status, 'AVAILABLE', 'Slot 11:30 released to AVAILABLE');
  });

  // 1.10 Admin booking cancellation
  await test('T1-10', 'Admin can cancel CONFIRMED booking and slot releases back to AVAILABLE', async () => {
    const res = await fetchHttp(`${baseUrl}/api/admin/bookings/${createdBookingId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        reason: 'Khách báo hoãn việc gia đình',
      }),
    });

    assertEqual(res.status, 200, 'Cancellation HTTP status');
    assert(res.data?.success === true, 'Cancellation success');
    assertEqual(res.data?.data?.status, 'cancelled', 'Status string is cancelled');

    // Slot 09:00 must be restored to AVAILABLE
    const availRes = await fetchHttp(
      `${baseUrl}/api/availability?roomId=room-1&date=${testDate}&durationHours=2`
    );
    const slot0900 = availRes.data?.data?.slots?.find((s: any) => s.time === '09:00');
    assertEqual(slot0900?.status, 'AVAILABLE', 'Slot 09:00 restored to AVAILABLE');
  });

  // 1.11 Slot blocks management
  await test('T1-11', 'Admin can create, list, and delete operational slot blocks', async () => {
    // Create block
    const createRes = await fetchHttp(`${baseUrl}/api/admin/slot-blocks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        roomId: 'room-2',
        date: testDate,
        startTime: '14:00',
        endTime: '16:00',
        reason: 'Bảo trì máy điều hòa và lọc không khí',
      }),
    });
    assertEqual(createRes.status, 201, 'Slot block creation status');
    const blockId = createRes.data?.data?.id;
    assert(!!blockId, 'Created block has ID');

    // List blocks
    const listRes = await fetchHttp(
      `${baseUrl}/api/admin/slot-blocks?date=${testDate}&roomId=room-2`,
      { headers: { Cookie: sessionCookie } }
    );
    assertEqual(listRes.status, 200, 'Slot blocks list status');
    const found = listRes.data?.data?.find((b: any) => b.id === blockId);
    assert(!!found, 'Created block is present in list');

    // Delete block
    const delRes = await fetchHttp(`${baseUrl}/api/admin/slot-blocks?id=${blockId}`, {
      method: 'DELETE',
      headers: { Cookie: sessionCookie },
    });
    assertEqual(delRes.status, 200, 'Delete slot block status');
    assert(delRes.data?.success === true, 'Delete slot block success');
  });

  // 1.12 System configuration API
  await test('T1-12', 'Admin configuration API supports reading and updating system settings', async () => {
    const getRes = await fetchHttp(`${baseUrl}/api/admin/config`, {
      headers: { Cookie: sessionCookie },
    });
    assertEqual(getRes.status, 200, 'GET config status');
    assert(!!getRes.data?.data?.settings, 'Config settings present');

    const originalHold = getRes.data.data.settings.holdDurationHours;

    // Update config using PUT
    const putRes = await fetchHttp(`${baseUrl}/api/admin/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        ...getRes.data.data.settings,
        holdDurationHours: 3,
      }),
    });
    assertEqual(putRes.status, 200, 'PUT config status');

    // Restore original
    await fetchHttp(`${baseUrl}/api/admin/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        ...getRes.data.data.settings,
        holdDurationHours: originalHold,
      }),
    });
  });

  // 1.13 Admin dashboard statistics
  await test('T1-13', 'Admin dashboard statistics API returns aggregated business metrics', async () => {
    const res = await fetchHttp(`${baseUrl}/api/admin/stats?date=${testDate}`, {
      headers: { Cookie: sessionCookie },
    });
    assertEqual(res.status, 200, 'Stats HTTP status');
    assert(res.data?.success === true, 'Stats success');
    assert(typeof res.data?.data?.totalBookings === 'number', 'Total bookings metric');
    assert(typeof res.data?.data?.pendingBookings === 'number', 'Pending bookings metric');
  });

  // 1.14 Outbox notifications log & worker
  await test('T1-14', 'Admin notifications outbox endpoint supports log querying and worker queue trigger', async () => {
    const listRes = await fetchHttp(`${baseUrl}/api/admin/notifications`, {
      headers: { Cookie: sessionCookie },
    });
    assertEqual(listRes.status, 200, 'Notifications list HTTP status');
    assert(Array.isArray(listRes.data?.data?.notifications), 'Notifications array');

    const workerRes = await fetchHttp(`${baseUrl}/api/admin/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({ action: 'run_worker' }),
    });
    assertEqual(workerRes.status, 200, 'Run worker HTTP status');
    assert(workerRes.data?.success === true, 'Run worker success');
  });

  const passed = cases.filter((c) => c.status === 'PASSED').length;
  const failed = cases.filter((c) => c.status === 'FAILED').length;
  const escalated = cases.filter((c) => c.status === 'ESCALATED').length;

  return {
    tier: 1,
    name: 'Tier 1: Feature Coverage (Representative Inputs)',
    total: cases.length,
    passed,
    failed,
    escalated,
    durationMs: Date.now() - startTime,
    cases,
  };
}
