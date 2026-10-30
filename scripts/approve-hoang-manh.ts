async function approveHoangManh() {
  const bookingId = 'bk-1793185813641-31B3';
  console.log(`Đang duyệt đơn cho Hoàng Mạnh (${bookingId})...`);

  const res = await fetch(`http://localhost:3000/api/admin/bookings/${bookingId}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-passcode': 'teaanf2026',
    },
    body: JSON.stringify({
      adminNotes: 'Trân trọng kính mời Quý khách Hoàng Mạnh ghé thưởng trà Lùng Vài đúng giờ.',
      reviewedBy: 'Quản trị viên Lùng Vài Tea',
    }),
  });

  const data = await res.json();
  console.log('Kết quả duyệt đơn:', JSON.stringify(data, null, 2));
}

approveHoangManh().catch(console.error);
