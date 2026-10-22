import { 
  getAllRooms, 
  getRoomBySlug, 
  getAvailableSlots, 
  createBooking, 
  searchBookings, 
  updateBookingStatus,
  getBookingByReference,
  resetDemoData
} from '../src/lib/db';

console.log('--- BẮT ĐẦU KIỂM THỬ HỆ THỐNG ĐẶT PHÒNG LÙNG VÀI TEA ---');

// 1. Reset demo data
resetDemoData();
console.log('✓ Khởi tạo và nạp dữ liệu ban đầu thành công');

// 2. Test Get Rooms
const rooms = getAllRooms();
console.log(`✓ Lấy danh sách phòng thành công: ${rooms.length} phòng`);
if (rooms.length !== 4) throw new Error('Số lượng phòng không khớp');

// 3. Test Room By Slug
const trucAnh = getRoomBySlug('truc-anh');
if (!trucAnh || trucAnh.name !== 'Trúc Ảnh') throw new Error('Không tìm thấy phòng Trúc Ảnh theo slug');
console.log(`✓ Tìm phòng theo slug thành công: ${trucAnh.name} (${trucAnh.chineseName})`);

// 4. Test Available Slots
const testDate = '2026-11-15';
const slots = getAvailableSlots(trucAnh.id, testDate, 2);
console.log(`✓ Tạo khung giờ thành công: ${slots.length} khung giờ lúc ${testDate}`);
if (slots.length === 0) throw new Error('Không có khung giờ nào được tạo');

// 5. Test Successful Booking Creation
const newBooking = createBooking({
  roomId: trucAnh.id,
  customerName: 'Nguyễn Văn An',
  customerPhone: '0901234567',
  customerEmail: 'an.nguyen@example.com',
  date: testDate,
  startTime: '10:00',
  durationHours: 2,
  guestCount: 4,
  teaPackageId: 'tea-lung-vai',
  specialRequests: 'Yêu cầu phòng yên tĩnh và chuẩn bị trà Shan Tuyết'
});

console.log(`✓ Tạo đơn đặt phòng thành công: ${newBooking.bookingReference} (Tổng tiền: ${newBooking.totalPrice.toLocaleString()}đ)`);
if (!newBooking.bookingReference.startsWith('LVT-20261115-')) {
  throw new Error('Định dạng mã booking không chính xác');
}

// 6. Test Slot Availability After Booking
const slotsAfter = getAvailableSlots(trucAnh.id, testDate, 2);
const bookedSlot10 = slotsAfter.find(s => s.time === '10:00');
if (bookedSlot10?.available) {
  throw new Error('Khung giờ 10:00 phải bị khoá sau khi đã được đặt!');
}
console.log(`✓ Khung giờ 10:00 đã bị khoá chính xác: "${bookedSlot10?.reason}"`);

// 7. Test Concurrency & Overlap Prevention (Must Fail)
let overlapPrevented = false;
try {
  createBooking({
    roomId: trucAnh.id,
    customerName: 'Trần Thị Bích',
    customerPhone: '0912999888',
    date: testDate,
    startTime: '10:30', // Overlaps with 10:00 - 12:00
    durationHours: 2,
    guestCount: 3,
  });
} catch (e: any) {
  overlapPrevented = true;
  console.log(`✓ Ngăn chặn thành công xung đột trùng lịch: "${e.message}"`);
}
if (!overlapPrevented) {
  throw new Error('Lỗi: Hệ thống không ngăn chặn được booking trùng lặp!');
}

// 8. Test Capacity Validation (Must Fail if guestCount > capacityMax)
let capacityPrevented = false;
try {
  createBooking({
    roomId: trucAnh.id,
    customerName: 'Lê Văn Cường',
    customerPhone: '0933444555',
    date: testDate,
    startTime: '14:00',
    durationHours: 2,
    guestCount: 20, // Max is 8
  });
} catch (e: any) {
  capacityPrevented = true;
  console.log(`✓ Kiểm tra giới hạn sức chứa thành công: "${e.message}"`);
}
if (!capacityPrevented) {
  throw new Error('Lỗi: Hệ thống không kiểm tra sức chứa tối đa của phòng!');
}

// 9. Test Booking Lookup by Reference
const lookedUp = getBookingByReference(newBooking.bookingReference);
if (!lookedUp || lookedUp.id !== newBooking.id) {
  throw new Error('Không thể tra cứu đơn đặt phòng theo mã!');
}
console.log(`✓ Tra cứu đơn theo mã tham chiếu thành công: ${lookedUp.customerName} - ${lookedUp.status}`);

// 10. Test Admin Status Transition
const confirmedBooking = updateBookingStatus(newBooking.id, 'confirmed', 'Đã nhận đủ tiền cọc qua ngân hàng.');
if (confirmedBooking.status !== 'confirmed') {
  throw new Error('Chuyển trạng thái đơn sang confirmed thất bại');
}
console.log(`✓ Cập nhật trạng thái quản trị viên thành công: ${confirmedBooking.status}`);

console.log('--- TẤT CẢ CÁC BÀI KIỂM THỬ BACKEND VÀ ĐẶT PHÒNG ĐỀU ĐẠT 100% ---');
