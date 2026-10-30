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

export async function runTier3(baseUrl: string): Promise<TierResult> {
  const startTime = Date.now();
  const cases: TestCaseResult[] = [];
  const testDate = getFutureDate(35);
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
        tier: 3,
        status: 'PASSED',
        durationMs: Date.now() - t0,
      });
    } catch (err: any) {
      cases.push({
        id,
        name,
        tier: 3,
        status: 'FAILED',
        durationMs: Date.now() - t0,
        error: err?.message || String(err),
      });
    }
  }

  // 3.1: Complete booking approval lifecycle and availability slot synchronization
  await test('T3-01', 'Complete booking approval lifecycle: PENDING -> CONFIRMED -> CANCELLED with real-time slot state sync and re-booking', async () => {
    const slotTime = '10:00';

    // Step 1: Slot starts AVAILABLE
    const avail1 = await fetchHttp(
      `${baseUrl}/api/availability?roomId=room-1&date=${testDate}&durationHours=2`
    );
    const initialSlot = avail1.data?.data?.slots?.find((s: any) => s.time === slotTime);
    assertEqual(initialSlot?.status, 'AVAILABLE', 'Initial slot status is AVAILABLE');

    // Step 2: Create booking -> PENDING
    const b1 = await createTestBooking(baseUrl, {
      roomId: 'room-1',
      date: testDate,
      startTime: slotTime,
      durationHours: 2,
    });
    assertEqual(b1.status, 201, 'Booking 1 created');

    // Step 3: Slot must reflect PENDING
    const avail2 = await fetchHttp(
      `${baseUrl}/api/availability?roomId=room-1&date=${testDate}&durationHours=2`
    );
    const pendingSlot = avail2.data?.data?.slots?.find((s: any) => s.time === slotTime);
    assertEqual(pendingSlot?.status, 'PENDING', 'Slot status updated to PENDING');

    // Step 4: Admin approves booking -> CONFIRMED
    const approveRes = await fetchHttp(`${baseUrl}/api/admin/bookings/${b1.id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ adminNotes: 'Duyệt lịch đón khách' }),
    });
    assertEqual(approveRes.status, 200, 'Admin approval status');

    // Step 5: Slot must reflect CONFIRMED
    const avail3 = await fetchHttp(
      `${baseUrl}/api/availability?roomId=room-1&date=${testDate}&durationHours=2`
    );
    const confirmedSlot = avail3.data?.data?.slots?.find((s: any) => s.time === slotTime);
    assertEqual(confirmedSlot?.status, 'CONFIRMED', 'Slot status updated to CONFIRMED');

    // Step 6: Overlapping booking attempt must be blocked
    const conflictRes = await fetchHttp(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: 'room-1',
        customerName: 'Khách Đặt Trùng',
        customerPhone: generateRandomPhone(),
        date: testDate,
        startTime: slotTime,
        durationHours: 2,
        guestCount: 2,
      }),
    });
    assertEqual(conflictRes.status, 409, 'Overlapping booking blocked');

    // Step 7: Admin cancels confirmed booking -> CANCELLED
    const cancelRes = await fetchHttp(`${baseUrl}/api/admin/bookings/${b1.id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ reason: 'Khách bận việc đột xuất' }),
    });
    assertEqual(cancelRes.status, 200, 'Admin cancellation status');

    // Step 8: Slot must return to AVAILABLE
    const avail4 = await fetchHttp(
      `${baseUrl}/api/availability?roomId=room-1&date=${testDate}&durationHours=2`
    );
    const releasedSlot = avail4.data?.data?.slots?.find((s: any) => s.time === slotTime);
    assertEqual(releasedSlot?.status, 'AVAILABLE', 'Slot status restored to AVAILABLE');

    // Step 9: Re-booking by another customer succeeds
    const b2 = await createTestBooking(baseUrl, {
      roomId: 'room-1',
      date: testDate,
      startTime: slotTime,
      durationHours: 2,
      customerName: 'Khách Đặt Lại Sau Hủy',
    });
    assertEqual(b2.status, 201, 'Re-booking on released slot succeeds');
  });

  // 3.2: Booking rejection lifecycle & instant slot release
  await test('T3-02', 'Booking rejection lifecycle: PENDING -> REJECTED instantly frees slot for new reservations', async () => {
    const slotTime = '14:00';

    // Create booking -> PENDING
    const b = await createTestBooking(baseUrl, {
      roomId: 'room-1',
      date: testDate,
      startTime: slotTime,
      durationHours: 2,
    });
    assertEqual(b.status, 201, 'Booking created');

    // Verify slot is PENDING
    const avail1 = await fetchHttp(
      `${baseUrl}/api/availability?roomId=room-1&date=${testDate}&durationHours=2`
    );
    const slot1 = avail1.data?.data?.slots?.find((s: any) => s.time === slotTime);
    assertEqual(slot1?.status, 'PENDING', 'Slot is PENDING');

    // Admin rejects booking
    const rejectRes = await fetchHttp(`${baseUrl}/api/admin/bookings/${b.id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ reason: 'Khung giờ cần bảo trì bàn trà' }),
    });
    assertEqual(rejectRes.status, 200, 'Rejection succeeds');

    // Verify slot immediately returns to AVAILABLE
    const avail2 = await fetchHttp(
      `${baseUrl}/api/availability?roomId=room-1&date=${testDate}&durationHours=2`
    );
    const slot2 = avail2.data?.data?.slots?.find((s: any) => s.time === slotTime);
    assertEqual(slot2?.status, 'AVAILABLE', 'Slot is immediately AVAILABLE');

    // New customer books same slot immediately
    const bNew = await createTestBooking(baseUrl, {
      roomId: 'room-1',
      date: testDate,
      startTime: slotTime,
      durationHours: 2,
      customerName: 'Khách Mới Đặt Lại',
    });
    assertEqual(bNew.status, 201, 'New reservation on freed slot succeeds');
  });

  // 3.3: Slot block and customer booking interaction
  await test('T3-03', 'Admin slot block prevents conflicting bookings, isolates unaffected rooms, and restores availability on deletion', async () => {
    const blockDate = testDate;
    const blockStart = '17:00';
    const blockEnd = '20:00';

    // Create slot block on room-2
    const blockRes = await fetchHttp(`${baseUrl}/api/admin/slot-blocks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({
        roomId: 'room-2',
        date: blockDate,
        startTime: blockStart,
        endTime: blockEnd,
        reason: 'Sự kiện riêng của nghệ nhân trà',
      }),
    });
    assertEqual(blockRes.status, 201, 'Slot block created');
    const blockId = blockRes.data?.data?.id;

    // Check availability on room-2: slots during block must be unavailable
    const availRoom2 = await fetchHttp(
      `${baseUrl}/api/availability?roomId=room-2&date=${blockDate}&durationHours=2`
    );
    const slot1700 = availRoom2.data?.data?.slots?.find((s: any) => s.time === '17:00');
    assert(
      slot1700?.status === 'BLOCKED' || slot1700?.status === 'UNAVAILABLE',
      `Room-2 slot 17:00 status is blocked (got ${slot1700?.status})`
    );

    // Attempting to book room-2 during block must be rejected
    const bookBlockedRes = await fetchHttp(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: 'room-2',
        customerName: 'Khách Thử Đặt Giờ Khóa',
        customerPhone: generateRandomPhone(),
        date: blockDate,
        startTime: '17:00',
        durationHours: 2,
        guestCount: 2,
      }),
    });
    assertEqual(bookBlockedRes.status, 409, 'Booking into blocked interval rejected');

    // Customer booking room-3 (unaffected room) at 17:00 must succeed
    const bookRoom3Res = await fetchHttp(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: 'room-3',
        customerName: 'Khách Đặt Phòng Khác',
        customerPhone: generateRandomPhone(),
        date: blockDate,
        startTime: '17:00',
        durationHours: 2,
        guestCount: 8,
      }),
    });
    assertEqual(bookRoom3Res.status, 201, 'Booking unaffected room succeeds');

    // Delete slot block
    const delRes = await fetchHttp(`${baseUrl}/api/admin/slot-blocks?id=${blockId}`, {
      method: 'DELETE',
      headers: { Cookie: sessionCookie },
    });
    assertEqual(delRes.status, 200, 'Slot block deleted');

    // Check availability on room-2: restored to AVAILABLE
    const availRoom2After = await fetchHttp(
      `${baseUrl}/api/availability?roomId=room-2&date=${blockDate}&durationHours=2`
    );
    const restoredSlot = availRoom2After.data?.data?.slots?.find((s: any) => s.time === '17:00');
    assertEqual(restoredSlot?.status, 'AVAILABLE', 'Slot restored to AVAILABLE');

    // Booking room-2 now succeeds
    const bookAfterUnblock = await fetchHttp(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: 'room-2',
        customerName: 'Khách Đặt Sau Khi Mở Khóa',
        customerPhone: generateRandomPhone(),
        date: blockDate,
        startTime: '17:00',
        durationHours: 2,
        guestCount: 2,
      }),
    });
    assertEqual(bookAfterUnblock.status, 201, 'Booking after unblock succeeds');
  });

  // 3.4: Dynamic configuration changes and system reflection
  await test('T3-04', 'System configuration update modifies operating parameters and persists across queries', async () => {
    const configRes = await fetchHttp(`${baseUrl}/api/admin/config`, {
      headers: { Cookie: sessionCookie },
    });
    assertEqual(configRes.status, 200, 'GET config status');
    const originalSettings = configRes.data?.data?.settings;

    // Modify defaultDurationHours
    const updatedRes = await fetchHttp(`${baseUrl}/api/admin/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({
        ...originalSettings,
        defaultDurationHours: 3,
      }),
    });
    assertEqual(updatedRes.status, 200, 'PUT config status');

    // Verify GET reflects the new value
    const checkRes = await fetchHttp(`${baseUrl}/api/admin/config`, {
      headers: { Cookie: sessionCookie },
    });
    assertEqual(
      checkRes.data?.data?.settings?.defaultDurationHours,
      3,
      'Settings defaultDurationHours updated'
    );

    // Restore original settings
    await fetchHttp(`${baseUrl}/api/admin/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify(originalSettings),
    });
  });

  // 3.5: Idempotency protection on booking creation
  await test('T3-05', 'Idempotency key prevents duplicate bookings on concurrent or retried requests', async () => {
    const idempotencyKey = `idem-t3-05-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const payload = {
      roomId: 'room-4',
      customerName: 'Khách Kiểm Thử Trùng Lặp',
      customerPhone: generateRandomPhone(),
      customerEmail: 'idem@lungvai.vn',
      date: testDate,
      startTime: '10:00',
      durationHours: 2,
      guestCount: 2,
      idempotencyKey,
    };

    // First request
    const res1 = await fetchHttp(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    assertEqual(res1.status, 201, 'First booking request status');
    const ref1 = res1.data?.data?.bookingReference;
    assert(!!ref1, 'Reference 1 generated');

    // Repeated request with same idempotency key
    const res2 = await fetchHttp(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    // Should return 200 or 201 with identical booking reference, NOT 409 conflict
    assert(
      res2.status === 200 || res2.status === 201,
      `Idempotent retry status is 200 or 201 (got ${res2.status})`
    );
    const ref2 = res2.data?.data?.bookingReference;
    assertEqual(ref2, ref1, 'Idempotent request returns identical bookingReference');
  });

  const passed = cases.filter((c) => c.status === 'PASSED').length;
  const failed = cases.filter((c) => c.status === 'FAILED').length;
  const escalated = cases.filter((c) => c.status === 'ESCALATED').length;

  return {
    tier: 3,
    name: 'Tier 3: Cross-Feature Combinations & State Lifecycle',
    total: cases.length,
    passed,
    failed,
    escalated,
    durationMs: Date.now() - startTime,
    cases,
  };
}
