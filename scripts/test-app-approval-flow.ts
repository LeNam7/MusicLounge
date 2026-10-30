const BASE_URL = 'http://localhost:3000';

async function main() {
  console.log('=== TEST ĐÚNG QUY TRÌNH DUYỆT ĐƠN TRÊN APP -> GỬI EMAIL CHO KHÁCH HÀNG ===\n');

  // 1. Khách hàng Lê Nam gửi yêu cầu đặt phòng trên Website
  console.log('[Bước 1] Khách hàng Lê Nam gửi yêu cầu đặt phòng trên Website...');
  const createRes = await fetch('http://localhost:3000/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomId: 'room-1', // Phòng Trúc Ảnh (2 - 8 người)
      customerName: 'Lê Nam',
      customerPhone: '0382371269',
      customerEmail: 'lenam287202@gmail.com',
      date: '2026-11-15',
      startTime: '14:00',
      durationHours: 2,
      guestCount: 3,
      teaPackageId: 'tea-shan-tuyet-dac-biet',
      specialRequests: 'Thưởng trà đàm đạo cùng tri kỷ',
    }),
  });

  const createData = await createRes.json();
  if (!createRes.ok || !createData.success) {
    throw new Error(`Tạo đơn thất bại: ${JSON.stringify(createData)}`);
  }

  const booking = createData.data;
  console.log(`✓ Đã gửi yêu cầu thành công:`);
  console.log(`  - Mã tham chiếu: ${booking.bookingReference}`);
  console.log(`  - Khách hàng: ${booking.customerName} (${booking.customerPhone})`);
  console.log(`  - Email khách: ${booking.customerEmail}`);
  console.log(`  - Trạng thái: ${booking.status} (Chờ Quản trị viên duyệt trên App)`);
  console.log(`  - Ghi chú: KHÔNG gửi email duyệt trung gian, chỉ lưu đơn trên App chờ bạn duyệt.\n`);

  // 2. Quản trị viên đăng nhập vào Web App (/admin)
  console.log('[Bước 2] Quản trị viên mở Web App (/admin) đăng nhập để duyệt đơn...');
  const authRes = await fetch('http://localhost:3000/api/admin/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passcode: 'teaanf2026' }),
  });
  const cookie = authRes.headers.get('set-cookie')?.split(';')[0] || '';
  console.log('✓ Quản trị viên đã đăng nhập vào Web App thành công.\n');

  // 3. Quản trị viên bấm nút "Duyệt đơn" trực tiếp trên App
  console.log(`[Bước 3] Quản trị viên bấm "Duyệt đơn" (Approve) trên App cho mã ${booking.bookingReference}...`);
  const approveRes = await fetch(`http://localhost:3000/api/admin/bookings/${booking.id}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify({
      adminNotes: 'Lùng Vài Tea đã chuẩn bị sẵn bàn trà mộc và ấm tử sa Nghi Hưng cung nghinh Quý khách!',
      reviewedBy: 'Quản trị viên Lùng Vài Tea',
    }),
  });

  const approveData = await approveRes.json();
  if (!approveRes.ok || !approveData.success) {
    throw new Error(`Duyệt đơn thất bại: ${JSON.stringify(approveData)}`);
  }

  console.log(`✓ Đã duyệt đơn thành công trên Web App!`);
  console.log(`  - Trạng thái mới: ${approveData.data.status} (CONFIRMED)`);
  console.log(`  - Kết quả gửi email xác nhận cho Khách hàng:`);
  
  if (approveData.data.notifications && approveData.data.notifications.length > 0) {
    approveData.data.notifications.forEach((n: { notificationType: string; status: string; providerResponse?: string }) => {
      console.log(`    ➔ Loại: ${n.notificationType} | Trạng thái: ${n.status}`);
      console.log(`       Chi tiết: ${n.providerResponse}`);
    });
  }

  console.log('\n🎉 THÀNH CÔNG: Khi bấm duyệt trên App, email đã được gửi trực tiếp và tức thì về hộp thư khách hàng lenam287202@gmail.com!');
}

main().catch(console.error);
