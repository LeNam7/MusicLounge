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

export async function runTier4(baseUrl: string): Promise<TierResult> {
  const startTime = Date.now();
  const cases: TestCaseResult[] = [];
  const testDate = getFutureDate(40);
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
        tier: 4,
        status: 'PASSED',
        durationMs: Date.now() - t0,
      });
    } catch (err: any) {
      cases.push({
        id,
        name,
        tier: 4,
        status: 'FAILED',
        durationMs: Date.now() - t0,
        error: err?.message || String(err),
      });
    }
  }

  // 4.1: Complete customer journey: Discovery -> Inspection -> Booking -> Approval -> Voucher
  await test('T4-01', 'Complete Customer Journey: Landing page discovery -> Room inspection -> Booking wizard submission -> PENDING status -> Admin quick approval -> CONFIRMED voucher status', async () => {
    // Step 1: Customer lands on homepage
    const homeRes = await fetchHttp(`${baseUrl}/`);
    assertEqual(homeRes.status, 200, 'Landing page loads');
    assertIncludes(homeRes.rawText, 'LÙNG VÀI TEA', 'Brand title displayed');

    // Step 2: Customer inspects room details
    const roomRes = await fetchHttp(`${baseUrl}/rooms/truc-anh`);
    assertEqual(roomRes.status, 200, 'Room detail loads');
    assertIncludes(roomRes.rawText, 'Trúc Ảnh', 'Room title displayed');

    // Step 3: Customer opens booking wizard
    const wizardRes = await fetchHttp(`${baseUrl}/booking?room=truc-anh`);
    assertEqual(wizardRes.status, 200, 'Booking wizard page loads');

    // Step 4: System queries availability
    const availRes = await fetchHttp(
      `${baseUrl}/api/availability?roomId=room-1&date=${testDate}&durationHours=2`
    );
    assertEqual(availRes.status, 200, 'Availability query succeeds');

    // Step 5: Customer fills out booking form
    const customerPhone = generateRandomPhone();
    const customerName = 'Trịnh Gia Bảo';
    const bookingPayload = {
      roomId: 'room-1',
      customerName,
      customerPhone,
      customerEmail: 'giabao.trinh@example.com',
      date: testDate,
      startTime: '15:00',
      durationHours: 2,
      guestCount: 4,
      teaPackageId: 'tea-lung-vai',
      specialRequests: 'Chuẩn bị phòng trà đón tiếp đối tác trang trọng',
      idempotencyKey: `idem-t4-01-${Date.now()}`,
    };

    const bookRes = await fetchHttp(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingPayload),
    });
    assertEqual(bookRes.status, 201, 'Booking submitted successfully');
    const bookingCode = bookRes.data?.data?.bookingReference;
    const bookingId = bookRes.data?.data?.id;
    assert(!!bookingCode, 'Booking code generated');

    // Step 6: Customer checks status on /lookup or status API
    const status1Res = await fetchHttp(`${baseUrl}/api/bookings/${bookingCode}/status`);
    assertEqual(status1Res.status, 200, 'Customer status check');
    assertEqual(status1Res.data?.data?.statusCode, 'PENDING', 'Customer sees PENDING status');

    // Step 7: Admin reviews pending bookings
    const adminListRes = await fetchHttp(`${baseUrl}/api/admin/bookings?status=pending`, {
      headers: { Cookie: sessionCookie },
    });
    assertEqual(adminListRes.status, 200, 'Admin pending list loaded');
    const orderInList = adminListRes.data?.data?.find((b: any) => b.id === bookingId);
    assert(!!orderInList, 'Order found in admin pending list');

    // Step 8: Admin approves booking
    const approveRes = await fetchHttp(`${baseUrl}/api/admin/bookings/${bookingId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({
        adminNotes: 'Đã chuẩn bị bàn trà hướng tre xanh đón anh Bảo',
      }),
    });
    assertEqual(approveRes.status, 200, 'Admin approve successful');

    // Step 9: Customer refreshes status and views confirmation
    const verifiedLookupRes = await fetchHttp(
      `${baseUrl}/api/bookings/lookup?reference=${bookingCode}&phone=${customerPhone}`
    );
    assertEqual(verifiedLookupRes.status, 200, 'Customer verified lookup succeeds');
    assertEqual(verifiedLookupRes.data?.data?.statusCode, 'CONFIRMED', 'Customer sees CONFIRMED voucher status');
    assertEqual(verifiedLookupRes.data?.data?.customerName, customerName, 'Customer sees verified name');
  });

  // 4.2: Multi-room concurrent operation
  await test('T4-02', 'Multi-Room Concurrency: Simultaneous reservations on distinct rooms at identical time slots process and confirm independently', async () => {
    const dateT402 = getFutureDate(42);
    const slotTime = '16:00';

    // Customer A books Room 1 (Trúc Ảnh)
    const bookA = await fetchHttp(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: 'room-1',
        customerName: 'Khách Đoàn A',
        customerPhone: generateRandomPhone(),
        date: dateT402,
        startTime: slotTime,
        durationHours: 2,
        guestCount: 4,
      }),
    });
    assertEqual(bookA.status, 201, 'Booking A created');
    const idA = bookA.data?.data?.id;

    // Customer B books Room 2 (Nguyệt Các) at exact same time slot
    const bookB = await fetchHttp(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: 'room-2',
        customerName: 'Khách Đoàn B',
        customerPhone: generateRandomPhone(),
        date: dateT402,
        startTime: slotTime,
        durationHours: 2,
        guestCount: 4,
      }),
    });
    assertEqual(bookB.status, 201, 'Booking B created');
    const idB = bookB.data?.data?.id;

    // Admin approves both bookings
    const [approveA, approveB] = await Promise.all([
      fetchHttp(`${baseUrl}/api/admin/bookings/${idA}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
        body: JSON.stringify({ adminNotes: 'Duyệt Đoàn A' }),
      }),
      fetchHttp(`${baseUrl}/api/admin/bookings/${idB}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
        body: JSON.stringify({ adminNotes: 'Duyệt Đoàn B' }),
      }),
    ]);
    assertEqual(approveA.status, 200, 'Approve A succeeds');
    assertEqual(approveB.status, 200, 'Approve B succeeds');

    // Both rooms reflect CONFIRMED for 16:00
    const [availRoom1, availRoom2] = await Promise.all([
      fetchHttp(`${baseUrl}/api/availability?roomId=room-1&date=${dateT402}&durationHours=2`),
      fetchHttp(`${baseUrl}/api/availability?roomId=room-2&date=${dateT402}&durationHours=2`),
    ]);
    const slotA = availRoom1.data?.data?.slots?.find((s: any) => s.time === slotTime);
    const slotB = availRoom2.data?.data?.slots?.find((s: any) => s.time === slotTime);
    assertEqual(slotA?.status, 'CONFIRMED', 'Room 1 slot 16:00 is CONFIRMED');
    assertEqual(slotB?.status, 'CONFIRMED', 'Room 2 slot 16:00 is CONFIRMED');
  });

  // 4.3: VIP Private Event Lockdown across all rooms
  await test('T4-03', 'VIP Event Lockdown: Global operational block locks all rooms and restores availability upon release', async () => {
    const lockDate = getFutureDate(44);
    const lockStart = '19:00';
    const lockEnd = '22:00';

    // Admin locks ALL rooms
    const lockRes = await fetchHttp(`${baseUrl}/api/admin/slot-blocks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({
        roomId: 'ALL',
        date: lockDate,
        startTime: lockStart,
        endTime: lockEnd,
        reason: 'Đại tiệc trà riêng tư của đối tác danh dự',
      }),
    });
    assertEqual(lockRes.status, 201, 'Global lock created');
    const lockId = lockRes.data?.data?.id;

    // Booking Room 3 at 19:00 must be rejected (with valid capacity guestCount: 8)
    const tryRoom3 = await fetchHttp(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: 'room-3',
        customerName: 'Khách Đặt Giờ Đại Tiệc',
        customerPhone: generateRandomPhone(),
        date: lockDate,
        startTime: '19:00',
        durationHours: 2,
        guestCount: 8,
      }),
    });
    assertEqual(tryRoom3.status, 409, 'Booking Room 3 during global lock rejected');

    // Booking Room 4 at 19:00 must be rejected
    const tryRoom4 = await fetchHttp(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: 'room-4',
        customerName: 'Khách Đặt Giờ Đại Tiệc',
        customerPhone: generateRandomPhone(),
        date: lockDate,
        startTime: '19:00',
        durationHours: 2,
        guestCount: 2,
      }),
    });
    assertEqual(tryRoom4.status, 409, 'Booking Room 4 during global lock rejected');

    // Release global lock
    const releaseRes = await fetchHttp(`${baseUrl}/api/admin/slot-blocks?id=${lockId}`, {
      method: 'DELETE',
      headers: { Cookie: sessionCookie },
    });
    assertEqual(releaseRes.status, 200, 'Global lock released');

    // Booking Room 3 now succeeds
    const bookAfterRelease = await fetchHttp(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: 'room-3',
        customerName: 'Khách Đặt Sau Khi Mở Khóa Đại Tiệc',
        customerPhone: generateRandomPhone(),
        date: lockDate,
        startTime: '19:00',
        durationHours: 2,
        guestCount: 8,
      }),
    });
    assertEqual(bookAfterRelease.status, 201, 'Booking after global lock release succeeds');
  });

  // 4.4: PII Data Privacy & Exact Phone Verification Traversal
  await test('T4-04', 'PII Data Privacy Traversal: Public access strictly masks sensitive data, invalid phone is blocked (403), verified phone reveals full booking record', async () => {
    const dateT404 = getFutureDate(46);
    const sensitiveName = 'Phạm Quỳnh Anh';
    const sensitivePhone = '0933445566';
    const sensitiveEmail = 'quynhanh.pham@secretcorp.com';
    const sensitiveRequests = 'Không gian họp kín cấp chủ tịch HĐQT, bảo mật 100%';

    const bookingRes = await fetchHttp(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: 'room-2',
        customerName: sensitiveName,
        customerPhone: sensitivePhone,
        customerEmail: sensitiveEmail,
        date: dateT404,
        startTime: '10:00',
        durationHours: 2,
        guestCount: 4,
        specialRequests: sensitiveRequests,
      }),
    });
    assertEqual(bookingRes.status, 201, 'Sensitive booking created');
    const refCode = bookingRes.data?.data?.bookingReference;

    // 1. Unauthenticated public query to status endpoint
    const publicStatusRes = await fetchHttp(`${baseUrl}/api/bookings/${refCode}/status`);
    assertEqual(publicStatusRes.status, 200, 'Public status query');
    const publicData = publicStatusRes.data?.data;
    assert(publicData.customerName.includes('*'), 'Public customer name is masked');
    assert(publicData.customerPhone.includes('*'), 'Public customer phone is masked');

    // 2. Query with wrong phone
    const wrongPhoneRes = await fetchHttp(
      `${baseUrl}/api/bookings/lookup?reference=${refCode}&phone=0900000000`
    );
    assertEqual(wrongPhoneRes.status, 403, 'Lookup with wrong phone returns HTTP 403');

    // 3. Query with correct verified phone
    const verifiedRes = await fetchHttp(
      `${baseUrl}/api/bookings/lookup?reference=${refCode}&phone=${sensitivePhone}`
    );
    assertEqual(verifiedRes.status, 200, 'Verified lookup succeeds');
    assertEqual(verifiedRes.data?.verified, true, 'Lookup marked as verified');
    assertEqual(verifiedRes.data?.data?.customerName, sensitiveName, 'Full customer name exposed');
    assertEqual(verifiedRes.data?.data?.customerPhone, sensitivePhone, 'Full customer phone exposed');
    assertEqual(verifiedRes.data?.data?.customerEmail, sensitiveEmail, 'Customer email exposed');
    assertEqual(verifiedRes.data?.data?.specialRequests, sensitiveRequests, 'Special requests exposed');
  });

  const passed = cases.filter((c) => c.status === 'PASSED').length;
  const failed = cases.filter((c) => c.status === 'FAILED').length;
  const escalated = cases.filter((c) => c.status === 'ESCALATED').length;

  return {
    tier: 4,
    name: 'Tier 4: Real-World Scenarios (End-to-End User Journeys)',
    total: cases.length,
    passed,
    failed,
    escalated,
    durationMs: Date.now() - startTime,
    cases,
  };
}
