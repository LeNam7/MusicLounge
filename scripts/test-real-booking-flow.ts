import { createBooking, approveBooking, getBookingById } from '../src/lib/db';
import { processNotificationsForBooking } from '../src/lib/notifications';

async function main() {
  console.log('1. Khách hàng Lê Nam gửi yêu cầu đặt lịch...');
  const booking = createBooking({
    roomId: 'room-2', // Nguyệt Các
    customerName: 'Lê Nam',
    customerPhone: '0382371269',
    customerEmail: 'lenam287202@gmail.com',
    date: '2026-11-05',
    startTime: '15:00',
    durationHours: 2,
    guestCount: 4,
    teaPackageId: 'tea-o-long',
    specialRequests: 'Thử nghiệm nhận thông báo Gmail thực tế cho Admin & Khách hàng',
  });

  console.log(`Đã tạo đơn thành công: Mã ${booking.bookingReference} (ID: ${booking.id})`);

  // Xử lý gửi email cho Admin
  console.log('2. Đang gửi email thông báo ĐƠN MỚI cho Quản trị viên (lenam287202@gmail.com)...');
  const adminLogs = await processNotificationsForBooking(booking.id);
  console.log('Kết quả gửi email Admin:', adminLogs.map(l => ({ type: l.notificationType, status: l.status, resp: l.providerResponse })));

  // Admin bấm duyệt đơn
  console.log('3. Quản trị viên duyệt đơn...');
  approveBooking(booking.id, {
    adminNotes: 'Lùng Vài Tea đã chuẩn bị sẵn bàn trà ấm nồng và ấm tử sa Nghi Hưng cho Quý khách!',
    reviewedBy: 'Admin Lùng Vài Tea',
  });

  // Xử lý gửi email xác nhận cho Khách
  console.log('4. Đang gửi email XÁC NHẬN ĐẶT PHÒNG THÀNH CÔNG cho Khách hàng (lenam287202@gmail.com)...');
  const custLogs = await processNotificationsForBooking(booking.id);
  console.log('Kết quả gửi email Khách hàng:', custLogs.map(l => ({ type: l.notificationType, status: l.status, resp: l.providerResponse })));

  console.log('\n✅ HOÀN TẤT TOÀN BỘ QUY TRÌNH GỬI EMAIL THỰC TẾ QUA GMAIL SMTP!');
}

main().catch(console.error);
