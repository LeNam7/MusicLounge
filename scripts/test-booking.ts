import {
  getAllRooms,
  getRoomBySlug,
  getAvailableSlots,
  createBooking,
  approveBooking,
  rejectBooking,
  cancelBooking,
  expireOverdueBookings,
  getBookingById,
  getBookingByReference,
  getBookingAuditLogs,
  getNotificationsForBooking,
  updateSystemSettings,
  createSlotBlock,
  deleteSlotBlock,
  resetDemoData,
  getDb,
} from '../src/lib/db';
import {
  setNotificationTransportForTesting,
  processNotificationsForBooking,
  deliverNotificationById,
} from '../src/lib/notifications';

async function runUnitAndIntegrationTests() {
  console.log('=== BẮT ĐẦU KIỂM THỬ UNIT & INTEGRATION HỆ THỐNG ĐẶT LỊCH LÙNG VÀI TEA ===\n');

  // 1. Reset demo data
  resetDemoData();
  console.log('✓ [01/21] Khởi tạo database và nạp dữ liệu mẫu thành công');

  // 2. Verify rooms
  const rooms = getAllRooms();
  if (rooms.length !== 4) throw new Error(`Expected 4 rooms, got ${rooms.length}`);
  const trucAnh = getRoomBySlug('truc-anh');
  if (!trucAnh || trucAnh.id !== 'room-1') {
    throw new Error('Không tìm thấy phòng Trúc Ảnh (room-1)');
  }
  console.log(
    `✓ [02/21] Kiểm tra danh sách phòng thành công: ${rooms.map((r) => r.name).join(', ')}`
  );

  // 3. Verify 15-minute slot intervals and 4 states
  const testDate = '2026-12-10';
  const slots = getAvailableSlots(trucAnh.id, testDate, 2);
  if (slots.length < 40) {
    throw new Error(`Expected 15-minute slots (>=40 slots), got ${slots.length}`);
  }
  if (slots[0].time !== '08:30' || slots[1].time !== '08:45' || slots[2].time !== '09:00') {
    throw new Error(`Các mốc giờ không cách nhau 15 phút: ${slots[0].time}, ${slots[1].time}`);
  }
  console.log(
    `✓ [03/21] Lưới khung giờ 15 phút hoạt động chuẩn xác (${slots.length} mốc từ ${slots[0].time} đến ${slots[slots.length - 1].time})`
  );

  // 4. Valid booking creation -> PENDING + expiresAt + Audit Log + Notification Log
  const b1 = createBooking({
    roomId: trucAnh.id,
    customerName: 'Nguyễn Văn An',
    customerPhone: '0901234567',
    customerEmail: 'an.nguyen@example.com',
    date: testDate,
    startTime: '10:00',
    durationHours: 2,
    guestCount: 4,
    teaPackageId: 'tea-lung-vai',
    specialRequests: 'Bàn gần cửa sổ nhìn ra vườn trúc',
    idempotencyKey: 'idem-key-001',
  });
  if (b1.status !== 'pending' || !b1.expiresAt) {
    throw new Error('Booking mới tạo phải có trạng thái pending và expiresAt');
  }
  const b1Audits = getBookingAuditLogs(b1.id);
  const b1Notifs = getNotificationsForBooking(b1.id);
  if (b1Audits.length !== 1 || b1Audits[0].toStatus !== 'pending') {
    throw new Error('Thiếu audit log CREATED -> pending');
  }
  if (b1Notifs.length !== 1 || b1Notifs[0].notificationType !== 'BOOKING_REQUESTED') {
    throw new Error('Thiếu bản ghi thông báo BOOKING_REQUESTED cho quản trị viên');
  }
  console.log(
    `✓ [04/21] Tạo yêu cầu đặt lịch hợp lệ -> PENDING (${b1.bookingReference}), có expiresAt, Audit Log và Outbox BOOKING_REQUESTED`
  );

  // 5. Verify slot state becomes PENDING across overlapping 15m slots
  const slotsAfterPending = getAvailableSlots(trucAnh.id, testDate, 2);
  const slot1000 = slotsAfterPending.find((s) => s.time === '10:00');
  const slot1115 = slotsAfterPending.find((s) => s.time === '11:15');
  if (slot1000?.status !== 'PENDING' || slot1115?.status !== 'PENDING') {
    throw new Error(`Expected slot 10:00 and 11:15 to be PENDING, got ${slot1000?.status}`);
  }
  console.log(
    '✓ [05/21] Trạng thái khung giờ trên website chuyển sang PENDING (Đang chờ duyệt) chính xác'
  );

  // 6. Idempotent retry with same idempotencyKey returns existing booking
  const b1Retry = createBooking({
    roomId: trucAnh.id,
    customerName: 'Nguyễn Văn An',
    customerPhone: '0901234567',
    date: testDate,
    startTime: '10:00',
    durationHours: 2,
    guestCount: 4,
    idempotencyKey: 'idem-key-001',
  });
  if (b1Retry.id !== b1.id) {
    throw new Error('Idempotency key không trả về cùng một booking khi retry');
  }
  console.log(
    '✓ [06/21] Idempotency Key chống tạo trùng đơn khi khách bấm gửi lại hoặc rớt mạng'
  );

  // 7. Overlapping booking on PENDING slot must be rejected with SLOT_UNAVAILABLE
  let pendingOverlapCaught = false;
  try {
    createBooking({
      roomId: trucAnh.id,
      customerName: 'Trần Thị Bích',
      customerPhone: '0912345678',
      date: testDate,
      startTime: '10:45',
      durationHours: 2,
      guestCount: 2,
    });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'SLOT_UNAVAILABLE') pendingOverlapCaught = true;
  }
  if (!pendingOverlapCaught) {
    throw new Error('Không chặn được khách thứ 2 đặt đè vào khung giờ đang PENDING');
  }
  console.log(
    '✓ [07/21] Ngăn chặn khách thứ 2 đặt trùng vào khung giờ đang PENDING (SLOT_UNAVAILABLE)'
  );

  // 8. Simulate 5 concurrent booking requests for the same slot (14:00)
  const concurrentResults = await Promise.allSettled(
    Array.from({ length: 5 }, (_, idx) =>
      Promise.resolve().then(() =>
        createBooking({
          roomId: trucAnh.id,
          customerName: `Khách Đồng Thời ${idx + 1}`,
          customerPhone: `098800011${idx}`,
          date: testDate,
          startTime: '14:00',
          durationHours: 2,
          guestCount: 2,
        })
      )
    )
  );
  const fulfilled = concurrentResults.filter((r) => r.status === 'fulfilled');
  const rejected = concurrentResults.filter((r) => r.status === 'rejected');
  if (fulfilled.length !== 1 || rejected.length !== 4) {
    throw new Error(
      `Concurrency check failed: fulfilled=${fulfilled.length}, rejected=${rejected.length}`
    );
  }
  console.log(
    '✓ [08/21] Kiểm thử đồng thời (5 requests cùng lúc vào 14:00): Chỉ 1 thành công, 4 bị từ chối an toàn'
  );

  // 9. Validation errors: past date, outside operating hours, capacity exceeded
  let pastDateCaught = false;
  try {
    createBooking({
      roomId: trucAnh.id,
      customerName: 'Khách Quá Khứ',
      customerPhone: '0911222333',
      date: '2020-01-01',
      startTime: '10:00',
      durationHours: 2,
      guestCount: 2,
    });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'VALIDATION_ERROR') pastDateCaught = true;
  }
  if (!pastDateCaught) throw new Error('Không chặn được ngày trong quá khứ');

  let outsideHoursCaught = false;
  try {
    createBooking({
      roomId: trucAnh.id,
      customerName: 'Khách Đêm Khuya',
      customerPhone: '0911222333',
      date: testDate,
      startTime: '21:30', // 21:30 + 2h = 23:30 > 22:30 closeTime
      durationHours: 2,
      guestCount: 2,
    });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'SLOT_UNAVAILABLE') outsideHoursCaught = true;
  }
  if (!outsideHoursCaught) throw new Error('Không chặn được khung giờ vượt quá giờ đóng cửa');

  let capacityCaught = false;
  try {
    createBooking({
      roomId: trucAnh.id,
      customerName: 'Khách Đông Người',
      customerPhone: '0911222333',
      date: testDate,
      startTime: '16:30',
      durationHours: 2,
      guestCount: 50,
    });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'VALIDATION_ERROR') capacityCaught = true;
  }
  if (!capacityCaught) throw new Error('Không chặn được số khách vượt quá sức chứa phòng');
  console.log(
    '✓ [09/21] Kiểm tra điều kiện biên (Ngày quá khứ, Ngoài giờ mở cửa, Vượt sức chứa) đạt 100%'
  );

  // 10. Holiday closedDates & Manual Slot Block (UNAVAILABLE)
  const holidayDate = '2026-12-25';
  updateSystemSettings({ closedDates: [holidayDate] });
  const holidaySlots = getAvailableSlots(trucAnh.id, holidayDate, 2);
  if (!holidaySlots.every((s) => s.status === 'UNAVAILABLE')) {
    throw new Error('Ngày nghỉ lễ phải có toàn bộ slot ở trạng thái UNAVAILABLE');
  }
  updateSystemSettings({ closedDates: [] });

  const block = createSlotBlock({
    roomId: trucAnh.id,
    date: testDate,
    startTime: '17:00',
    endTime: '19:00',
    reason: 'Bảo trì hệ thống âm thanh',
  });
  const slotsWithBlock = getAvailableSlots(trucAnh.id, testDate, 2);
  const slot1700 = slotsWithBlock.find((s) => s.time === '17:00');
  if (slot1700?.status !== 'UNAVAILABLE') {
    throw new Error('Slot bị khóa thủ công phải có trạng thái UNAVAILABLE');
  }
  deleteSlotBlock(block.id);
  console.log(
    '✓ [10/21] Quản lý ngày nghỉ lễ và Khóa khung giờ thủ công (UNAVAILABLE) hoạt động chính xác'
  );

  // 11. Admin Approve (PENDING -> CONFIRMED)
  const approvedB1 = approveBooking(b1.id, {
    adminNotes: 'Đã duyệt lịch cho anh An',
    reviewedBy: 'Admin Trà Sư',
  });
  if (approvedB1.status !== 'confirmed' || !approvedB1.reviewedAt) {
    throw new Error('Duyệt booking không chuyển sang confirmed');
  }
  const slotsAfterApprove = getAvailableSlots(trucAnh.id, testDate, 2);
  if (slotsAfterApprove.find((s) => s.time === '10:00')?.status !== 'CONFIRMED') {
    throw new Error('Slot sau khi duyệt phải chuyển sang CONFIRMED');
  }
  console.log(
    '✓ [11/21] Admin duyệt yêu cầu: PENDING -> CONFIRMED, khung giờ chuyển sang Đã đặt (CONFIRMED)'
  );

  // 12. Admin Double-Approve on already CONFIRMED booking must fail
  let doubleApproveCaught = false;
  try {
    approveBooking(b1.id, { adminNotes: 'Duyệt lần 2' });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'INVALID_BOOKING_STATE') doubleApproveCaught = true;
  }
  if (!doubleApproveCaught) throw new Error('Không chặn được duyệt lại đơn đã CONFIRMED');
  console.log(
    '✓ [12/21] Ngăn chặn Admin duyệt lại đơn đã ở trạng thái CONFIRMED (INVALID_BOOKING_STATE)'
  );

  // 13. Admin Reject (PENDING -> REJECTED) & Slot Release
  const pending1400 = (fulfilled[0] as PromiseFulfilledResult<{ id: string }>).value;
  const rejected1400 = rejectBooking(pending1400.id, {
    rejectionReason: 'Phòng có khách VIP đặt trọn gói chiều',
    adminNotes: 'Ghi chú nội bộ',
    reviewedBy: 'Admin Trà Sư',
  });
  if (rejected1400.status !== 'rejected' || !rejected1400.rejectionReason) {
    throw new Error('Từ chối booking không chuyển sang rejected');
  }
  const slotsAfterReject = getAvailableSlots(trucAnh.id, testDate, 2);
  if (slotsAfterReject.find((s) => s.time === '14:00')?.status !== 'AVAILABLE') {
    throw new Error('Khung giờ 14:00 phải được giải phóng về AVAILABLE sau khi từ chối');
  }
  console.log(
    '✓ [13/21] Admin từ chối yêu cầu: PENDING -> REJECTED và giải phóng khung giờ về AVAILABLE'
  );

  // 14. Admin Approve on REJECTED booking must fail
  let approveRejectedCaught = false;
  try {
    approveBooking(rejected1400.id);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'INVALID_BOOKING_STATE') approveRejectedCaught = true;
  }
  if (!approveRejectedCaught) throw new Error('Không chặn được duyệt đơn đã bị REJECTED');
  console.log('✓ [14/21] Ngăn chặn Admin duyệt đơn đã bị REJECTED');

  // 15. Booking Expiry (PENDING -> EXPIRED) and Race Condition between Expiry & Admin Approval
  const bExpiring = createBooking({
    roomId: trucAnh.id,
    customerName: 'Khách Quá Hạn Duyệt',
    customerPhone: '0933444555',
    date: testDate,
    startTime: '14:00',
    durationHours: 2,
    guestCount: 3,
  });
  // Force expires_at into the past
  getDb()
    .prepare(`UPDATE bookings SET expires_at = ? WHERE id = ?`)
    .run('2020-01-01T00:00:00.000Z', bExpiring.id);

  // If admin tries to approve right when it has expired, approveBooking must detect expiry, mark EXPIRED, and throw BOOKING_EXPIRED
  let approveExpiredCaught = false;
  try {
    approveBooking(bExpiring.id);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'BOOKING_EXPIRED') approveExpiredCaught = true;
  }
  if (!approveExpiredCaught) {
    throw new Error('Không phát hiện xung đột khi Admin bấm duyệt đúng lúc đơn vừa hết hạn');
  }
  const expiredRecord = getBookingById(bExpiring.id);
  if (expiredRecord?.status !== 'expired') {
    throw new Error(`Expected status expired, got ${expiredRecord?.status}`);
  }
  const slotsAfterExpire = getAvailableSlots(trucAnh.id, testDate, 2);
  if (slotsAfterExpire.find((s) => s.time === '14:00')?.status !== 'AVAILABLE') {
    throw new Error('Slot của đơn EXPIRED phải tự động mở lại thành AVAILABLE');
  }
  console.log(
    '✓ [15/21] Tự động hết hạn (PENDING -> EXPIRED), mở lại slot AVAILABLE và chặn Admin duyệt đơn quá hạn'
  );

  // 16. Scheduled Worker expireOverdueBookings() batch test
  const bBatchExpire = createBooking({
    roomId: trucAnh.id,
    customerName: 'Khách Quá Hạn Batch',
    customerPhone: '0944555666',
    date: testDate,
    startTime: '16:30',
    durationHours: 2,
    guestCount: 2,
  });
  getDb()
    .prepare(`UPDATE bookings SET expires_at = ? WHERE id = ?`)
    .run('2020-01-01T00:00:00.000Z', bBatchExpire.id);
  const expiredList = expireOverdueBookings();
  if (expiredList.length !== 1 || getBookingById(bBatchExpire.id)?.status !== 'expired') {
    throw new Error('expireOverdueBookings() batch worker failed');
  }
  console.log(
    '✓ [16/21] Tiến trình quét đơn quá hạn tự động (expireOverdueBookings) giải phóng slot chính xác'
  );

  // 17. Admin Cancel on CONFIRMED booking -> CANCELLED & Slot Release
  const cancelledB1 = cancelBooking(b1.id, {
    cancellationReason: 'Khách gọi điện báo bận đột xuất xin dời sang tuần sau',
    adminNotes: 'Đã hỗ trợ khách',
    cancelledBy: 'Admin Trà Sư',
  });
  if (cancelledB1.status !== 'cancelled' || !cancelledB1.cancellationReason) {
    throw new Error('Hủy lịch đã xác nhận thất bại');
  }
  const slotsAfterCancel = getAvailableSlots(trucAnh.id, testDate, 2);
  if (slotsAfterCancel.find((s) => s.time === '10:00')?.status !== 'AVAILABLE') {
    throw new Error('Khung giờ 10:00 phải được mở lại thành AVAILABLE sau khi hủy lịch CONFIRMED');
  }
  console.log(
    '✓ [17/21] Hủy lịch đã xác nhận (CONFIRMED -> CANCELLED) giải phóng khung giờ về AVAILABLE'
  );

  // 18. Notification Service: Successful Email Admin & Customer Delivery via Mock Transport
  setNotificationTransportForTesting(async (log) => ({
    success: true,
    providerResponse: `{"error":0,"message":"Success","msg_id":"mock-email-msg-${log.id.slice(0, 8)}"}`,
  }));

  const bNotifSuccess = createBooking({
    roomId: trucAnh.id,
    customerName: 'Khách Test Email Thành Công',
    customerPhone: '0977888999',
    customerEmail: 'khach.test@example.com',
    date: testDate,
    startTime: '10:00',
    durationHours: 2,
    guestCount: 4,
  });
  const sentAdminLogs = await processNotificationsForBooking(bNotifSuccess.id);
  if (sentAdminLogs.length !== 1 || sentAdminLogs[0].status !== 'SENT') {
    throw new Error('Gửi thông báo Email cho Admin qua transport thất bại');
  }
  console.log(
    `✓ [18/21] Gửi thông báo Email cho Admin (BOOKING_REQUESTED) thành công -> trạng thái SENT`
  );

  // 19. Notification Service: SMTP Error / Timeout does NOT rollback Booking
  setNotificationTransportForTesting(async () => ({
    success: false,
    error: 'SMTP Connection Timeout',
    providerResponse: '{"error":-500,"message":"SMTP Connection Timeout"}',
  }));

  const confirmedNotifBooking = approveBooking(bNotifSuccess.id, {
    adminNotes: 'Duyệt khi SMTP lỗi tạm thời',
  });
  const failedCustLogs = await processNotificationsForBooking(bNotifSuccess.id);
  const custConfirmedLog = failedCustLogs.find((l) => l.notificationType === 'BOOKING_CONFIRMED');
  if (
    confirmedNotifBooking.status !== 'confirmed' ||
    !custConfirmedLog ||
    custConfirmedLog.status !== 'FAILED'
  ) {
    throw new Error('Khi Email lỗi, booking vẫn phải giữ nguyên CONFIRMED và log phải ghi FAILED');
  }
  console.log(
    '✓ [19/21] Khi gửi Email gặp sự cố (Timeout/Mất mạng), trạng thái CONFIRMED vẫn toàn vẹn và Outbox ghi nhận FAILED'
  );

  // 20. Notification Service: Retry Mechanism recovers FAILED -> SENT without duplicate
  setNotificationTransportForTesting(async (log) => ({
    success: true,
    providerResponse: `{"error":0,"message":"Recovered","msg_id":"retry-email-msg-${log.id.slice(0, 8)}"}`,
  }));

  const retriedLog = await deliverNotificationById(custConfirmedLog.id);
  if (retriedLog?.status !== 'SENT' || retriedLog.attemptCount !== 2) {
    throw new Error('Retry thông báo thất bại');
  }
  // Retrying an already SENT notification is idempotent (no re-send)
  const secondRetry = await deliverNotificationById(custConfirmedLog.id);
  if (secondRetry?.attemptCount !== 2) {
    throw new Error('Thông báo đã SENT không được phép gửi trùng khi bấm retry lần nữa');
  }
  setNotificationTransportForTesting(null);
  console.log(
    '✓ [20/21] Cơ chế Retry thông báo Email khôi phục FAILED -> SENT và chống gửi trùng (Idempotent)'
  );

  // 21. Lookup by Reference & Reset Demo Data
  const lookedUp = getBookingByReference(bNotifSuccess.bookingReference);
  if (!lookedUp || lookedUp.status !== 'confirmed') {
    throw new Error('Tra cứu booking theo mã tham chiếu thất bại');
  }
  resetDemoData();
  console.log('✓ [21/21] Tra cứu mã booking & khôi phục dữ liệu mẫu hoàn tất\n');

  console.log('=== TẤT CẢ 21/21 BÀI KIỂM THỬ UNIT & INTEGRATION ĐỀU VƯỢT QUA 100% ===');
}

runUnitAndIntegrationTests().catch((err) => {
  console.error('Lỗi kiểm thử Unit/Integration:', err);
  process.exit(1);
});
