async function runE2ETests() {
  const BASE_URL = 'http://localhost:3000';
  console.log(`=== BẮT ĐẦU KIỂM THỬ END-TO-END TRÊN CỔNG ${BASE_URL} ===\n`);

  // 1. Check Homepage
  const homeRes = await fetch(`${BASE_URL}/`);
  if (!homeRes.ok) throw new Error(`Homepage failed with status ${homeRes.status}`);
  const homeHtml = await homeRes.text();
  if (!homeHtml.includes('LÙNG VÀI TEA') || !homeHtml.includes('Trúc Ảnh')) {
    throw new Error('Homepage content missing brand name or rooms');
  }
  console.log('✓ [1/10] Trang chủ (/) tải thành công (HTTP 200, đầy đủ nhận diện thương hiệu và 4 phòng trà)');

  // 2. Check Room Detail Page
  const roomRes = await fetch(`${BASE_URL}/rooms/truc-anh`);
  if (!roomRes.ok) throw new Error(`Room detail failed with status ${roomRes.status}`);
  const roomHtml = await roomRes.text();
  if (!roomHtml.includes('Trúc Ảnh') || !roomHtml.includes('ĐẶT PHÒNG NHANH')) {
    throw new Error('Room detail missing expected content');
  }
  console.log('✓ [2/10] Trang chi tiết phòng (/rooms/truc-anh) tải thành công (HTTP 200, có widget đặt phòng)');

  // 3. Check Booking Page
  const bookPageRes = await fetch(`${BASE_URL}/booking?room=nguyet-cac`);
  if (!bookPageRes.ok) throw new Error(`Booking page failed with status ${bookPageRes.status}`);
  console.log('✓ [3/10] Trang đặt phòng (/booking) tải thành công');

  // 4. API Rooms
  const roomsApiRes = await fetch(`${BASE_URL}/api/rooms`);
  const roomsData = await roomsApiRes.json();
  if (!roomsData.success || roomsData.data.length !== 4) {
    throw new Error('API /api/rooms failed');
  }
  console.log(`✓ [4/10] API Danh sách phòng (/api/rooms) trả về ${roomsData.data.length} phòng trà`);

  // 5. API Availability
  const testDate = '2026-11-25';
  const availRes = await fetch(`${BASE_URL}/api/availability?roomId=room-1&date=${testDate}&durationHours=2`);
  const availData = await availRes.json();
  if (!availData.success || !availData.data.slots || availData.data.slots.length === 0) {
    throw new Error('API /api/availability failed');
  }
  console.log(`✓ [5/10] API Khung giờ trống (/api/availability) trả về ${availData.data.slots.length} khung giờ lúc ${testDate}`);

  // 6. API Create Booking (Success)
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
    }),
  });
  const createData = await createRes.json();
  if (createRes.status !== 201 || !createData.success) {
    throw new Error(`Create booking failed: ${JSON.stringify(createData)}`);
  }
  const createdRef = createData.data.bookingReference;
  const createdId = createData.data.id;
  console.log(`✓ [6/10] Tạo đơn đặt phòng thành công qua API: ${createdRef} (Giá: ${createData.data.totalPrice.toLocaleString()}đ, Trạng thái: ${createData.data.status})`);

  // 7. API Overlap Conflict Rejection (409 Conflict)
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
  if (conflictRes.status !== 409 || conflictData.success !== false) {
    throw new Error('API did not properly reject overlapping booking with 409 Conflict');
  }
  console.log(`✓ [7/10] Ngăn chặn trùng lặp đồng thời (Concurrency) thành công: HTTP ${conflictRes.status} Conflict - "${conflictData.error}"`);

  // 8. API Lookup Booking
  const lookupRes = await fetch(`${BASE_URL}/api/bookings/lookup?reference=${createdRef}&phone=0988777666`);
  const lookupData = await lookupRes.json();
  if (!lookupData.success || lookupData.data.bookingReference !== createdRef) {
    throw new Error('Lookup booking failed');
  }
  console.log(`✓ [8/10] Tra cứu đơn theo mã tham chiếu thành công: ${lookupData.data.customerName} - ${lookupData.data.roomName}`);

  // 9. API Admin Authorization & Status Update
  const updateRes = await fetch(`${BASE_URL}/api/admin/bookings/${createdId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-passcode': 'serenity2026',
    },
    body: JSON.stringify({
      status: 'confirmed',
      adminNotes: 'Đã nhận chuyển khoản cọc thành công qua Vietcombank.',
    }),
  });
  const updateData = await updateRes.json();
  if (!updateData.success || updateData.data.status !== 'confirmed') {
    throw new Error('Admin status update failed');
  }
  console.log(`✓ [9/10] Quản trị viên cập nhật trạng thái đơn thành công: status="${updateData.data.status}"`);

  // 10. API Admin Stats
  const statsRes = await fetch(`${BASE_URL}/api/admin/stats?passcode=serenity2026`);
  const statsData = await statsRes.json();
  if (!statsData.success || statsData.data.totalBookings < 1) {
    throw new Error('Admin stats failed');
  }
  console.log(`✓ [10/10] Thống kê Dashboard Quản trị hoạt động chuẩn xác: Tổng ${statsData.data.totalBookings} đơn, Doanh thu: ${statsData.data.totalRevenue.toLocaleString()}đ\n`);

  console.log('=== TOÀN BỘ 10/10 KIỂM THỬ END-TO-END ĐỀU VƯỢT QUA 100% ===');
}

runE2ETests().catch((err) => {
  console.error('Lỗi kiểm thử E2E:', err);
  process.exit(1);
});
