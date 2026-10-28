async function main() {
  const payload = {
    roomId: 'room-2', // Phòng Nguyệt Các
    customerName: 'Hoàng Mạnh',
    customerPhone: '0912345678',
    customerEmail: 'manhnhon2002@gmail.com',
    date: '2026-11-06',
    startTime: '15:00',
    durationHours: 2,
    guestCount: 4,
    teaPackageId: 'tea-o-long',
    specialRequests: 'Thưởng trà đàm đạo cùng bạn hữu tại Lùng Vài Tea',
  };

  const res = await fetch('http://localhost:3000/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    console.error('Tạo đơn lỗi:', data);
    process.exit(1);
  }

  const booking = data.data;
  console.log('=== ĐÃ TẠO ĐƠN ĐẶT PHÒNG THÀNH CÔNG ===');
  console.log('Mã đặt phòng (Code):', booking.bookingReference);
  console.log('ID đơn:', booking.id);
  console.log('Khách hàng:', booking.customerName);
  console.log('Số điện thoại:', booking.customerPhone);
  console.log('Email khách nhận thông báo:', booking.customerEmail);
  console.log('Không gian:', booking.roomName || 'Phòng Nguyệt Các');
  console.log('Thời gian:', `${booking.date} lúc ${booking.startTime} - ${booking.endTime}`);
  console.log('Trạng thái hiện tại:', booking.status, '(Chờ duyệt - PENDING)');
}

main().catch(console.error);
