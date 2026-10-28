import { createBooking, approveBooking } from '../src/lib/db';
import { processNotificationsForBooking } from '../src/lib/notifications';

async function main() {
  console.log('=== GỬI EMAIL THỰC TẾ CHO LÊ NAM VỚI GIAO DIỆN XANH TRÀ DỊU SANG ===');
  
  // 1. Tạo đơn đặt phòng chính xác tên Lê Nam
  const booking = createBooking({
    roomId: 'room-2', // Phòng Nguyệt Các
    customerName: 'Lê Nam',
    customerPhone: '0382371269',
    customerEmail: 'lenam287202@gmail.com',
    date: '2026-11-08',
    startTime: '14:00',
    durationHours: 2,
    guestCount: 4,
    teaPackageId: 'tea-o-long',
    specialRequests: 'Không gian tĩnh lặng thưởng trà cùng tri kỷ',
  });

  console.log(`[1] Đã tạo đơn thành công:`);
  console.log(`    - Mã đặt phòng: ${booking.bookingReference}`);
  console.log(`    - Khách hàng: ${booking.customerName}`);
  console.log(`    - Số điện thoại: ${booking.customerPhone}`);
  console.log(`    - Email nhận thư: ${booking.customerEmail}`);

  // 2. Gửi email Quản trị viên (Tone xanh dịu sang)
  console.log('\n[2] Đang gửi Email Quản Trị Viên (Tone xanh ngọc trà dịu sang)...');
  const adminLogs = await processNotificationsForBooking(booking.id);
  adminLogs.forEach(l => {
    console.log(`    ✓ Loại: ${l.notificationType} | Trạng thái: ${l.status} | Chi tiết: ${l.providerResponse}`);
  });

  // 3. Admin duyệt đơn
  console.log('\n[3] Quản trị viên duyệt đơn...');
  approveBooking(booking.id, {
    adminNotes: 'Lùng Vài Tea đã chuẩn bị sẵn bàn trà ấm nồng và ấm tử sa Nghi Hưng cung nghinh Quý khách!',
    reviewedBy: 'Admin Lùng Vài Tea',
  });

  // 4. Gửi email Xác nhận thành công cho Khách hàng Lê Nam (Tone xanh dịu sang)
  console.log('\n[4] Đang gửi Email Xác Nhận Cho Khách Hàng Lê Nam (Tone xanh ngọc trà dịu sang)...');
  const custLogs = await processNotificationsForBooking(booking.id);
  custLogs.forEach(l => {
    console.log(`    ✓ Loại: ${l.notificationType} | Trạng thái: ${l.status} | Chi tiết: ${l.providerResponse}`);
  });

  console.log('\n✅ HOÀN TẤT GỬI EMAIL THỰC TẾ CHO LÊ NAM!');
}

main().catch(console.error);
