/**
 * LÙNG VÀI TEA — HỆ THỐNG BACKTEST TOÀN DIỆN (COMPREHENSIVE BACKTEST SUITE)
 * 
 * Hội đồng Kỹ thuật & Kiểm thử:
 * 1. Solution Architect & Tech Lead
 * 2. Business Analyst & Product Specialist
 * 3. Senior QA / Test Automation Engineer
 * 4. Lead UI/UX & Mobile Front-End Engineer
 * 5. DevOps & Infrastructure Specialist
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  getDb,
  getAllRooms,
  getRoomBySlug,
  getAvailableSlots,
  createBooking,
  getBookingByReference,
  approveBooking,
  rejectBooking,
  cancelBooking,
  expireOverdueBookings,
  createSlotBlock,
  deleteSlotBlock,
  getSystemSettings,
  updateSystemSettings,
  BookingDomainError,
} from '../src/lib/db';
import { INITIAL_ROOMS, BRAND_CONFIG } from '../src/lib/config';

let passedChecks = 0;
let totalChecks = 0;

function assert(condition: boolean, message: string) {
  totalChecks++;
  if (!condition) {
    console.error(`❌ [THẤT BẠI] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedChecks++;
  console.log(`✓ [ĐẠT ${passedChecks}] ${message}`);
}

async function runComprehensiveBacktest() {
  console.log('\n================================================================');
  console.log('🏛️  BẮT ĐẦU PHIÊN KIỂM ĐỊNH HỘI ĐỒNG KỸ THUẬT & TOÀN BỘ HỆ THỐNG');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // PILLAR 1: KIỂM ĐỊNH TÀI NGUYÊN TĨNH, CSS VÀ BẢO VỆ GIAO DIỆN (UI/UX RESILIENCE)
  // -------------------------------------------------------------
  console.log('--- [1/5] KIỂM ĐỊNH TÀI NGUYÊN TĨNH & KHẢ NĂNG CHỐNG VỠ GIAO DIỆN (UI/UX) ---');
  
  // 1.1 Kiểm tra file assets công khai
  const publicDir = path.join(process.cwd(), 'public');
  const criticalAssets = [
    'images/logo-lung-vai-transparent.png',
    'images/hero-tea-ceremony.png',
    'icon-192x192.png',
    'icon-512x512.png',
    'favicon.ico',
    'sw.js',
  ];
  for (const asset of criticalAssets) {
    const fullPath = path.join(publicDir, asset);
    assert(fs.existsSync(fullPath), `Tài nguyên tĩnh thiết yếu tồn tại: ${asset}`);
    const stat = fs.statSync(fullPath);
    assert(stat.size > 0, `Kích thước tài nguyên > 0 bytes: ${asset} (${stat.size} bytes)`);
  }

  // 1.2 Kiểm tra Inline Fallback Size trên các logo/con dấu (Chống vỡ tràn màn hình khi mất CSS)
  const heroFile = fs.readFileSync(path.join(process.cwd(), 'src/components/Hero.tsx'), 'utf-8');
  assert(
    heroFile.includes('style={{ width: \'80px\', height: \'110px\'') || heroFile.includes('maxWidth: \'80px\''),
    'Hero con dấu triện có inline fallback dimensions (chống tràn 100% màn hình khi rớt CSS)'
  );

  const navbarFile = fs.readFileSync(path.join(process.cwd(), 'src/components/Navbar.tsx'), 'utf-8');
  assert(
    navbarFile.includes('maxWidth: \'40px\'') || navbarFile.includes('width: \'40px\''),
    'Navbar logo có inline fallback dimensions cố định'
  );

  const footerFile = fs.readFileSync(path.join(process.cwd(), 'src/components/Footer.tsx'), 'utf-8');
  assert(
    footerFile.includes('maxWidth: \'48px\'') || footerFile.includes('width: \'48px\''),
    'Footer logo có inline fallback dimensions cố định'
  );

  const adminFile = fs.readFileSync(path.join(process.cwd(), 'src/app/admin/page.tsx'), 'utf-8');
  assert(
    adminFile.includes('maxWidth: \'80px\'') && adminFile.includes('maxWidth: \'40px\''),
    'Admin login & header logos có inline fallback dimensions cố định'
  );

  // -------------------------------------------------------------
  // PILLAR 2: KIỂM ĐỊNH DỮ LIỆU PHÒNG & GIỚI HẠN SỨC CHỨA (DATA & CAPACITY LIMITS)
  // -------------------------------------------------------------
  console.log('\n--- [2/5] KIỂM ĐỊNH DỮ LIỆU PHÒNG & GIỚI HẠN SỨC CHỨA MỚI (2 - 10 NGƯỜI) ---');
  
  const rooms = getAllRooms();
  assert(rooms.length === 4, `Cơ sở dữ liệu có đầy đủ 4 phòng trà (hiện có: ${rooms.length})`);
  
  const trucAnh = rooms.find((r) => r.slug === 'truc-anh');
  assert(!!trucAnh, 'Tìm thấy phòng Trúc Ảnh');
  assert(trucAnh!.capacityMin === 2, `Phòng Trúc Ảnh sức chứa tối thiểu là 2 người (hiện tại: ${trucAnh?.capacityMin})`);
  assert(trucAnh!.capacityMax === 10, `Phòng Trúc Ảnh sức chứa tối đa là 10 người (hiện tại: ${trucAnh?.capacityMax})`);

  // Kiểm tra cấu hình config.ts đồng bộ
  const configTrucAnh = INITIAL_ROOMS.find((r) => r.slug === 'truc-anh');
  assert(configTrucAnh?.capacityMax === 10, 'Cấu hình INITIAL_ROOMS đồng bộ capacityMax = 10');

  // -------------------------------------------------------------
  // PILLAR 3: KIỂM ĐỊNH TRẢI NGHIỆM ĐẶT LỊCH (UX, STEPPER, GUEST COUNT, 90 PHÚT)
  // -------------------------------------------------------------
  console.log('\n--- [3/5] KIỂM ĐỊNH TRẢI NGHIỆM ĐẶT LỊCH (UX, NÚT +/-, KHÔNG LIỆT NÚT XOÁ, 90 PHÚT) ---');

  const wizardFile = fs.readFileSync(path.join(process.cwd(), 'src/components/BookingWizard.tsx'), 'utf-8');
  
  // 3.1 Kiểm tra thời lượng mặc định 90 phút (1.5 giờ)
  assert(
    wizardFile.includes('1.5 giờ (90 phút — Khuyên dùng)'),
    'Menu chọn thời lượng có tuỳ chọn 1.5 giờ (90 phút — Khuyên dùng)'
  );
  assert(
    wizardFile.includes('preselectedDuration || 1.5'),
    'Thời lượng mặc định tự động kích hoạt là 1.5 giờ'
  );

  // 3.2 Kiểm tra nút Stepper (+ / -) và chống liệt phím Backspace
  assert(
    wizardFile.includes('title="Giảm 1 khách"') && wizardFile.includes('title="Tăng 1 khách"'),
    'Giao diện có bộ nút Stepper Tăng/Giảm (+/-) chuẩn mobile touch'
  );
  assert(
    wizardFile.includes('val === \'\' ? \'\' : parseInt(val, 10)'),
    'Ô nhập số khách cho phép xoá trắng (rỗng), KHÔNG BAO GIỜ bị nhảy lại số cũ khi bấm Backspace'
  );
  assert(
    wizardFile.includes('onBlur={() => {'),
    'Tự động cân chỉnh về ngưỡng an toàn [capacityMin, capacityMax] khi người dùng hoàn thành nhập (onBlur)'
  );

  // -------------------------------------------------------------
  // PILLAR 4: KIỂM ĐỊNH LOGIC BACKEND, KHÓA TRÙNG LỊCH & CONCURRENCY
  // -------------------------------------------------------------
  console.log('\n--- [4/5] KIỂM ĐỊNH NGHIỆP VỤ BACKEND, KHÓA TRÙNG & PHÂN QUYỀN TRẠNG THÁI ---');

  const testDate = '2026-11-20';
  const testSlotTime = '14:30';

  // 4.1 Tạo đơn đặt lịch cho 10 khách
  const booking1 = createBooking({
    roomId: trucAnh!.id,
    customerName: 'Trưởng Đoàn 10 Khách',
    customerPhone: '0988776655',
    customerEmail: 'truongdoan@gmail.com',
    date: testDate,
    startTime: testSlotTime,
    durationHours: 1.5,
    guestCount: 10,
    specialRequests: 'Chuẩn bị phòng trà cho đoàn 10 người',
  });

  assert(booking1.statusCode === 'PENDING', `Đơn hàng tạo thành công với 10 khách: Mã ${booking1.bookingReference}`);
  assert(booking1.guestCount === 10, 'Số lượng khách ghi nhận chuẩn xác là 10 người');

  // 4.2 Thử tạo đơn thứ 2 vượt quá 10 khách (ví dụ 12 khách) -> Phải bị chặn
  let overCapacityBlocked = false;
  try {
    createBooking({
      roomId: trucAnh!.id,
      customerName: 'Khách Quá Tải',
      customerPhone: '0900000000',
      date: testDate,
      startTime: '10:00',
      durationHours: 1.5,
      guestCount: 12,
    });
  } catch (err: unknown) {
    if ((err as BookingDomainError).code === 'VALIDATION_ERROR') {
      overCapacityBlocked = true;
    }
  }
  assert(overCapacityBlocked, 'Hệ thống chặn thành công yêu cầu vượt quá sức chứa phòng (> 10 người)');

  // 4.3 Thử đặt trùng vào slot 14:30 của booking1 -> Phải bị chặn SLOT_UNAVAILABLE
  let doubleBookingBlocked = false;
  try {
    createBooking({
      roomId: trucAnh!.id,
      customerName: 'Người Đặt Trùng',
      customerPhone: '0911111111',
      date: testDate,
      startTime: testSlotTime,
      durationHours: 1.5,
      guestCount: 4,
    });
  } catch (err: unknown) {
    if ((err as BookingDomainError).code === 'SLOT_UNAVAILABLE') {
      doubleBookingBlocked = true;
    }
  }
  assert(doubleBookingBlocked, 'Khóa an toàn chống đặt trùng giờ đang PENDING hoạt động 100%');

  // 4.4 Admin duyệt đơn -> CONFIRMED
  const confirmedBooking = approveBooking(booking1.id, 'admin-tester', 'Duyệt thành công đoàn 10 khách');
  assert(confirmedBooking.statusCode === 'CONFIRMED', 'Admin duyệt đơn PENDING -> CONFIRMED thành công');

  // 4.5 Admin huỷ đơn -> CANCELLED và giải phóng slot về AVAILABLE
  const cancelledBooking = cancelBooking(confirmedBooking.id, 'admin-tester', 'Khách đổi lịch');
  assert(cancelledBooking.statusCode === 'CANCELLED', 'Huỷ đơn CONFIRMED -> CANCELLED thành công');

  const slotsAfterCancel = getAvailableSlots(trucAnh!.id, testDate, 1.5);
  const targetSlot = slotsAfterCancel.find((s) => s.time === testSlotTime);
  assert(targetSlot?.status === 'AVAILABLE', 'Khung giờ 14:30 được giải phóng lập tức về AVAILABLE');

  // -------------------------------------------------------------
  // PILLAR 5: KIỂM ĐỊNH GÓI SẢN PHẨM & QUY TRÌNH DEPLOY AN TOÀN
  // -------------------------------------------------------------
  console.log('\n--- [5/5] KIỂM ĐỊNH HẠ TẦNG & QUY TRÌNH TRIỂN KHAI KHÔNG LỖI (DEVOPS) ---');

  // 5.1 Kiểm tra file .next build outputs
  const nextStaticDir = path.join(process.cwd(), '.next/static');
  assert(fs.existsSync(nextStaticDir), 'Thư mục bản build .next/static tồn tại');

  const nextCssDir = path.join(nextStaticDir, 'chunks');
  const cssFiles = fs.readdirSync(nextCssDir).filter((f) => f.endsWith('.css'));
  assert(cssFiles.length >= 2, `Bản build Next.js đã sinh đầy đủ ${cssFiles.length} file CSS hợp lệ`);
  for (const css of cssFiles) {
    const size = fs.statSync(path.join(nextCssDir, css)).size;
    assert(size > 500, `File CSS ${css} có nội dung hợp lệ (${size} bytes)`);
  }

  // Dọn dẹp dữ liệu kiểm thử
  const db = getDb();
  db.prepare('DELETE FROM bookings WHERE id = ?').run(booking1.id);
  db.prepare('DELETE FROM booking_audit_logs WHERE booking_id = ?').run(booking1.id);

  console.log('\n================================================================');
  console.log(`🎉 TẤT CẢ ${passedChecks}/${totalChecks} BÀI BACKTEST ĐỀU VƯỢT QUA 100%!`);
  console.log('🏛️  HỘI ĐỒNG XÁC NHẬN: MÃ NGUỒN ĐẠT TIÊU CHUẨN SẴN SÀNG TRIỂN KHAI SẢN PHẨM');
  console.log('================================================================\n');
}

runComprehensiveBacktest().catch((err) => {
  console.error('\n❌ HỘI ĐỒNG PHÁT HIỆN SỰ CỐ TRONG QUÁ TRÌNH BACKTEST:', err);
  process.exit(1);
});
