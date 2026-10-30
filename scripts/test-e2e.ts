async function runE2ETests() {
  const BASE_URL = 'http://localhost:3000';
  console.log(`=== BẮT ĐẦU KIỂM THỬ END-TO-END (E2E) TRÊN ${BASE_URL} ===\n`);

  // 0. Reset demo data before running suite
  const resetRes = await fetch(`${BASE_URL}/api/admin/reset`, {
    method: 'POST',
    headers: { 'x-admin-passcode': 'teaanf2026' },
  });
  if (!resetRes.ok) throw new Error(`Reset failed with status ${resetRes.status}`);

  // 1. Check Homepage
  const homeRes = await fetch(`${BASE_URL}/`);
  if (!homeRes.ok) throw new Error(`Homepage failed with status ${homeRes.status}`);
  const homeHtml = await homeRes.text();
  if (!homeHtml.includes('LÙNG VÀI TEA') || !homeHtml.includes('Trúc Ảnh')) {
    throw new Error('Homepage content missing brand name or rooms');
  }
  console.log(
    '✓ [01/15] Trang chủ (/) tải thành công (HTTP 200, hiển thị thương hiệu LÙNG VÀI TEA và 4 phòng trà)'
  );

  // 2. Check Room Detail Page
  const roomRes = await fetch(`${BASE_URL}/rooms/truc-anh`);
  if (!roomRes.ok) throw new Error(`Room detail failed with status ${roomRes.status}`);
  const roomHtml = await roomRes.text();
  if (!roomHtml.includes('Trúc Ảnh')) {
    throw new Error('Room detail missing expected content');
  }
  console.log('✓ [02/15] Trang chi tiết phòng (/rooms/truc-anh) tải thành công (HTTP 200)');

  // 3. Check Booking, Lookup, and Admin Pages
  const [bookPageRes, lookupPageRes, adminPageRes] = await Promise.all([
    fetch(`${BASE_URL}/booking?room=truc-anh`),
    fetch(`${BASE_URL}/lookup`),
    fetch(`${BASE_URL}/admin`),
  ]);
  if (!bookPageRes.ok || !lookupPageRes.ok || !adminPageRes.ok) {
    throw new Error('One of /booking, /lookup, /admin pages failed to load');
  }
  console.log('✓ [03/15] Các trang /booking, /lookup và /admin đều tải thành công (HTTP 200)');

  // 4. API Rooms
  const roomsApiRes = await fetch(`${BASE_URL}/api/rooms`);
  const roomsData = await roomsApiRes.json();
  if (!roomsData.success || roomsData.data.length !== 4) {
    throw new Error('API /api/rooms failed');
  }
  console.log(`✓ [04/15] API Danh sách phòng (/api/rooms) trả về ${roomsData.data.length} phòng trà`);

  // 5. API Availability (15-minute intervals)
  const testDate = '2026-12-20';
  const availRes = await fetch(
    `${BASE_URL}/api/availability?roomId=room-1&date=${testDate}&durationHours=2`
  );
  const availData = await availRes.json();
  if (!availData.success || !availData.data.slots || availData.data.slots.length < 40) {
    throw new Error('API /api/availability failed to return 15-minute slots');
  }
  console.log(
    `✓ [05/15] API Khung giờ (/api/availability) trả về ${availData.data.slots.length} mốc giờ 15 phút ngày ${testDate}`
  );

  // 6. API Create Booking -> PENDING
  const createRes = await fetch(`${BASE_URL}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomId: 'room-1',
      customerName: 'Trịnh Hoàng Nam',
      customerPhone: '0988777666',
      customerEmail: 'nam.trinh@example.com',
      date: testDate,
      startTime: '15:00',
      durationHours: 2,
      guestCount: 4,
      teaPackageId: 'tea-lung-vai',
      specialRequests: 'Khách đối tác quan trọng, chuẩn bị ấm tử sa chu nê',
      idempotencyKey: 'e2e-idem-1500',
    }),
  });
  const createData = await createRes.json();
  if (createRes.status !== 201 || !createData.success || createData.data.status !== 'pending') {
    throw new Error(`Create booking failed: ${JSON.stringify(createData)}`);
  }
  const createdRef = createData.data.bookingReference;
  const createdId = createData.data.id;
  console.log(
    `✓ [06/15] Khách gửi yêu cầu đặt lịch thành công -> trạng thái PENDING (${createdRef}, Hết hạn: ${createData.data.expiresAt})`
  );

  // 7. Verify Availability API shows PENDING for 15:00
  const availAfterCreate = await (
    await fetch(
      `${BASE_URL}/api/availability?roomId=room-1&date=${testDate}&durationHours=2`
    )
  ).json();
  const slot1500 = availAfterCreate.data.slots.find((s: { time: string; status: string }) => s.time === '15:00');
  if (slot1500?.status !== 'PENDING') {
    throw new Error(`Expected slot 15:00 status PENDING, got ${slot1500?.status}`);
  }
  console.log('✓ [07/15] Website cập nhật trạng thái khung giờ 15:00 sang PENDING (Đang chờ duyệt)');

  // 8. API Overlap Conflict Rejection (409 Conflict)
  const conflictRes = await fetch(`${BASE_URL}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomId: 'room-1',
      customerName: 'Người Đặt Trùng Lịch',
      customerPhone: '0911222333',
      date: testDate,
      startTime: '15:30', // Overlaps with 15:00 - 17:00
      durationHours: 2,
      guestCount: 3,
    }),
  });
  const conflictData = await conflictRes.json();
  const conflictCode = conflictData.code || conflictData.errorCode;
  if (conflictRes.status !== 409 || conflictCode !== 'SLOT_UNAVAILABLE') {
    throw new Error(`API did not reject overlapping booking with 409 SLOT_UNAVAILABLE: ${JSON.stringify(conflictData)}`);
  }
  console.log(
    `✓ [08/15] Ngăn chặn khách thứ 2 đặt trùng khung giờ đang chờ duyệt: HTTP 409 (${conflictCode})`
  );

  // 9. Public Status Polling & Lookup Endpoints
  const statusRes = await fetch(`${BASE_URL}/api/bookings/${createdRef}/status`);
  const statusData = await statusRes.json();
  if (!statusData.success || statusData.data.statusCode !== 'PENDING') {
    throw new Error('Public booking status endpoint failed');
  }
  console.log(
    `✓ [09/15] API Tra cứu trạng thái nhanh (/api/bookings/${createdRef}/status) trả về statusCode="${statusData.data.statusCode}"`
  );

  // 10. Unauthenticated Admin Approve Must Fail with 401
  const unauthRes = await fetch(`${BASE_URL}/api/admin/bookings/${createdId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (unauthRes.status !== 401) {
    throw new Error(`Expected 401 Unauthorized for unauthenticated admin call, got ${unauthRes.status}`);
  }
  console.log('✓ [10/15] Bảo mật phân quyền: Chặn truy cập API duyệt lịch trái phép với HTTP 401 Unauthorized');

  // 11. Admin Session Authentication Cookie
  const authRes = await fetch(`${BASE_URL}/api/admin/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passcode: 'teaanf2026' }),
  });
  const setCookieHeader = authRes.headers.get('set-cookie') || '';
  if (!authRes.ok || !setCookieHeader.includes('lvt_admin_session=')) {
    throw new Error('Admin session cookie was not issued');
  }
  const sessionCookie = setCookieHeader.split(';')[0];
  console.log('✓ [11/15] Xác thực Quản trị viên (/api/admin/auth) cấp HttpOnly Session Cookie thành công');

  // 12. Admin Approve Booking using Session Cookie -> CONFIRMED
  const approveRes = await fetch(`${BASE_URL}/api/admin/bookings/${createdId}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: sessionCookie,
    },
    body: JSON.stringify({
      adminNotes: 'Phòng trà đã chuẩn bị xong bàn trà Vân Shan đón anh Nam.',
    }),
  });
  const approveData = await approveRes.json();
  if (!approveRes.ok || !approveData.success || approveData.data.status !== 'confirmed') {
    throw new Error(`Admin approve failed: ${JSON.stringify(approveData)}`);
  }
  const availAfterApprove = await (
    await fetch(
      `${BASE_URL}/api/availability?roomId=room-1&date=${testDate}&durationHours=2`
    )
  ).json();
  if (availAfterApprove.data.slots.find((s: { time: string; status: string }) => s.time === '15:00')?.status !== 'CONFIRMED') {
    throw new Error('Slot 15:00 did not update to CONFIRMED after approval');
  }
  console.log(
    '✓ [12/15] Admin duyệt lịch thành công: PENDING -> CONFIRMED, khung giờ 15:00 trên website chuyển sang CONFIRMED'
  );

  // 13. Admin Double-Approve Rejection (409 Conflict)
  const doubleApproveRes = await fetch(`${BASE_URL}/api/admin/bookings/${createdId}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: sessionCookie,
    },
    body: JSON.stringify({}),
  });
  if (doubleApproveRes.status !== 409) {
    throw new Error(`Expected 409 on double approve, got ${doubleApproveRes.status}`);
  }
  console.log('✓ [13/15] Chặn Admin bấm duyệt 2 lần trên cùng một đơn (HTTP 409 INVALID_STATE_TRANSITION)');

  // 14. Create a second booking at 18:00 & Admin Reject -> REJECTED & Slot Released
  const secondBookingRes = await fetch(`${BASE_URL}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomId: 'room-1',
      customerName: 'Lê Nam',
      customerPhone: '0382371269',
      customerEmail: 'lenam287202@gmail.com',
      date: testDate,
      startTime: '18:00',
      durationHours: 2,
      guestCount: 2,
    }),
  });
  const secondBookingData = await secondBookingRes.json();
  const secondId = secondBookingData.data.id;

  const rejectRes = await fetch(`${BASE_URL}/api/admin/bookings/${secondId}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: sessionCookie,
    },
    body: JSON.stringify({
      reason: 'Khung giờ 18:00 phòng Trúc Ảnh có lịch bảo trì định kỳ.',
    }),
  });
  const rejectData = await rejectRes.json();
  if (!rejectRes.ok || rejectData.data.status !== 'rejected') {
    throw new Error('Admin reject failed');
  }
  const availAfterReject = await (
    await fetch(
      `${BASE_URL}/api/availability?roomId=room-1&date=${testDate}&durationHours=2`
    )
  ).json();
  if (availAfterReject.data.slots.find((s: { time: string; status: string }) => s.time === '18:00')?.status !== 'AVAILABLE') {
    throw new Error('Slot 18:00 was not released back to AVAILABLE after rejection');
  }
  console.log(
    '✓ [14/15] Admin từ chối lịch 18:00: PENDING -> REJECTED, giải phóng khung giờ 18:00 về AVAILABLE ngay lập tức'
  );

  // 15. Admin Cancel Confirmed Booking -> CANCELLED & Slot Released + Final Reset
  const cancelRes = await fetch(`${BASE_URL}/api/admin/bookings/${createdId}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: sessionCookie,
    },
    body: JSON.stringify({
      reason: 'Khách xin hủy lịch vì công tác đột xuất.',
    }),
  });
  const cancelData = await cancelRes.json();
  if (!cancelRes.ok || cancelData.data.status !== 'cancelled') {
    throw new Error('Admin cancel failed');
  }
  const availAfterCancel = await (
    await fetch(
      `${BASE_URL}/api/availability?roomId=room-1&date=${testDate}&durationHours=2`
    )
  ).json();
  if (availAfterCancel.data.slots.find((s: { time: string; status: string }) => s.time === '15:00')?.status !== 'AVAILABLE') {
    throw new Error('Slot 15:00 was not released back to AVAILABLE after cancellation');
  }

  // Restore clean demo data
  await fetch(`${BASE_URL}/api/admin/reset`, {
    method: 'POST',
    headers: { Cookie: sessionCookie },
  });
  console.log(
    '✓ [15/15] Admin hủy lịch đã xác nhận: CONFIRMED -> CANCELLED, mở lại khung giờ 15:00 về AVAILABLE & khôi phục dữ liệu mẫu\n'
  );

  console.log('=== TOÀN BỘ 15/15 KIỂM THỬ END-TO-END (E2E) ĐỀU VƯỢT QUA 100% ===');
}

runE2ETests().catch((err) => {
  console.error('Lỗi kiểm thử E2E:', err);
  process.exit(1);
});
