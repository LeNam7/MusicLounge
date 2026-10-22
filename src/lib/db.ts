import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { Booking, BookingStatus, Room, TeaPackage } from './types';
import { BRAND_CONFIG, INITIAL_ROOMS, INITIAL_TEA_PACKAGES } from './config';

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'oriental_serenity.db');

// Singleton database instance
let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(DB_PATH);
    dbInstance.exec('PRAGMA journal_mode = WAL;');
    dbInstance.exec('PRAGMA foreign_keys = ON;');
    initSchema(dbInstance);
  }
  return dbInstance;
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      chinese_name TEXT NOT NULL,
      tagline TEXT NOT NULL,
      description TEXT NOT NULL,
      full_description TEXT NOT NULL,
      capacity_min INTEGER NOT NULL,
      capacity_max INTEGER NOT NULL,
      price_per_hour INTEGER NOT NULL,
      price_package_2h INTEGER NOT NULL,
      area_sqm INTEGER NOT NULL,
      floor TEXT NOT NULL,
      amenities TEXT NOT NULL, -- JSON array
      images TEXT NOT NULL, -- JSON array
      tea_master_included INTEGER NOT NULL DEFAULT 1,
      is_active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tea_packages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      vietnamese_name TEXT NOT NULL,
      description TEXT NOT NULL,
      price INTEGER NOT NULL,
      servings TEXT NOT NULL,
      origin TEXT NOT NULL,
      image_url TEXT NOT NULL,
      tags TEXT NOT NULL, -- JSON array
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      booking_reference TEXT UNIQUE NOT NULL,
      room_id TEXT NOT NULL,
      room_name TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_email TEXT,
      date TEXT NOT NULL, -- YYYY-MM-DD
      start_time TEXT NOT NULL, -- HH:mm
      end_time TEXT NOT NULL, -- HH:mm
      duration_hours REAL NOT NULL,
      guest_count INTEGER NOT NULL,
      room_price INTEGER NOT NULL,
      tea_package_id TEXT,
      tea_package_name TEXT,
      tea_package_price INTEGER DEFAULT 0,
      total_price INTEGER NOT NULL,
      deposit_amount INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending', 'confirmed', 'rejected', 'cancelled', 'completed')),
      special_requests TEXT,
      admin_notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (room_id) REFERENCES rooms(id)
    );

    CREATE INDEX IF NOT EXISTS idx_bookings_room_date ON bookings(room_id, date);
    CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(booking_reference);
    CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
  `);

  // Seed default rooms if empty
  const roomCountStmt = db.prepare('SELECT COUNT(*) as count FROM rooms');
  const roomCount = (roomCountStmt.get() as { count: number }).count;
  if (roomCount === 0) {
    const insertRoom = db.prepare(`
      INSERT INTO rooms (
        id, slug, name, chinese_name, tagline, description, full_description,
        capacity_min, capacity_max, price_per_hour, price_package_2h, area_sqm,
        floor, amenities, images, tea_master_included, is_active, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const r of INITIAL_ROOMS) {
      insertRoom.run(
        r.id,
        r.slug,
        r.name,
        r.chineseName || '',
        r.tagline,
        r.description,
        r.fullDescription,
        r.capacityMin,
        r.capacityMax,
        r.pricePerHour,
        r.pricePackage2h,
        r.areaSqm,
        r.floor,
        JSON.stringify(r.amenities),
        JSON.stringify(r.images),
        r.teaMasterIncluded ? 1 : 0,
        r.isActive ? 1 : 0,
        r.sortOrder
      );
    }
  }

  // Seed tea packages if empty
  const teaCountStmt = db.prepare('SELECT COUNT(*) as count FROM tea_packages');
  const teaCount = (teaCountStmt.get() as { count: number }).count;
  if (teaCount === 0) {
    const insertTea = db.prepare(`
      INSERT INTO tea_packages (
        id, name, vietnamese_name, description, price, servings, origin, image_url, tags
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const t of INITIAL_TEA_PACKAGES) {
      insertTea.run(
        t.id,
        t.name,
        t.vietnameseName,
        t.description,
        t.price,
        t.servings,
        t.origin,
        t.imageUrl,
        JSON.stringify(t.tags)
      );
    }
  }

  // Seed sample initial booking for realistic demo if empty
  const bookingCountStmt = db.prepare('SELECT COUNT(*) as count FROM bookings');
  const bookingCount = (bookingCountStmt.get() as { count: number }).count;
  if (bookingCount === 0) {
    // Generate dates for today and tomorrow
    const today = new Date().toISOString().split('T')[0];
    const insertSampleBooking = db.prepare(`
      INSERT INTO bookings (
        id, booking_reference, room_id, room_name, customer_name, customer_phone, customer_email,
        date, start_time, end_time, duration_hours, guest_count, room_price,
        tea_package_id, tea_package_name, tea_package_price, total_price, deposit_amount,
        status, special_requests, admin_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertSampleBooking.run(
      'seed-booking-1',
      'OS-20261022-7F9A',
      'room-1',
      'Trúc Ảnh',
      'Đỗ Thành Long',
      '0912345678',
      'thanhlong.do@gmail.com',
      today,
      '14:00',
      '16:00',
      2,
      4,
      800000,
      'tea-lung-vai',
      'Thanh Sơn Trà - Lùng Vài',
      280000,
      1080000,
      324000,
      'confirmed',
      'Chuẩn bị bộ ấm tử sa đất chu nê, khách dùng đàm đạo kinh doanh.',
      'Đã liên hệ xác nhận cọc qua Chuyển khoản VietQR.'
    );

    insertSampleBooking.run(
      'seed-booking-2',
      'OS-20261022-4B2E',
      'room-2',
      'Nguyệt Các',
      'Hoàng Minh Châu',
      '0987654321',
      'chau.hoang@vietart.vn',
      today,
      '19:00',
      '21:00',
      2,
      2,
      750000,
      'tea-bach-mau-don',
      'Bạch Mẫu Đơn Cổ Thụ',
      260000,
      1010000,
      303000,
      'pending',
      'Kỷ niệm ngày quen nhau, mong chuẩn bị bàn trà có hoa tươi nhã nhặn.',
      'Khách vừa đặt online, cần gọi điện xác nhận trong 15 phút.'
    );
  }
}

// Map SQLite row to Room model
function mapRoomRow(row: Record<string, unknown>): Room {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    chineseName: row.chinese_name as string,
    tagline: row.tagline as string,
    description: row.description as string,
    fullDescription: row.full_description as string,
    capacityMin: Number(row.capacity_min),
    capacityMax: Number(row.capacity_max),
    pricePerHour: Number(row.price_per_hour),
    pricePackage2h: Number(row.price_package_2h),
    areaSqm: Number(row.area_sqm),
    floor: row.floor as string,
    amenities: JSON.parse(row.amenities as string || '[]'),
    images: JSON.parse(row.images as string || '[]'),
    teaMasterIncluded: Boolean(row.tea_master_included),
    isActive: Boolean(row.is_active),
    sortOrder: Number(row.sort_order),
  };
}

// Map SQLite row to Booking model
function mapBookingRow(row: Record<string, unknown>): Booking {
  return {
    id: row.id as string,
    bookingReference: row.booking_reference as string,
    roomId: row.room_id as string,
    roomName: row.room_name as string,
    customerName: row.customer_name as string,
    customerPhone: row.customer_phone as string,
    customerEmail: (row.customer_email as string) || undefined,
    date: row.date as string,
    startTime: row.start_time as string,
    endTime: row.end_time as string,
    durationHours: Number(row.duration_hours),
    guestCount: Number(row.guest_count),
    roomPrice: Number(row.room_price),
    teaPackageId: (row.tea_package_id as string) || undefined,
    teaPackageName: (row.tea_package_name as string) || undefined,
    teaPackagePrice: Number(row.tea_package_price || 0),
    totalPrice: Number(row.total_price),
    depositAmount: Number(row.deposit_amount),
    status: row.status as BookingStatus,
    specialRequests: (row.special_requests as string) || undefined,
    adminNotes: (row.admin_notes as string) || undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// Time calculation helpers
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
}

export function calculateEndTime(startTime: string, durationHours: number): string {
  const startMins = timeToMinutes(startTime);
  const endMins = startMins + Math.round(durationHours * 60);
  return minutesToTime(endMins);
}

// Check time overlap taking buffer into consideration
export function isOverlapping(
  start1: string,
  end1: string,
  start2: string,
  end2: string,
  bufferMinutes: number = BRAND_CONFIG.bufferMinutes
): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);

  // Interval [s1, e1 + buffer] overlaps [s2, e2 + buffer]
  return s1 < e2 + bufferMinutes && e1 + bufferMinutes > s2;
}

// ROOM API METHODS
export function getAllRooms(): Room[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM rooms WHERE is_active = 1 ORDER BY sort_order ASC').all();
  return (rows as unknown as Record<string, unknown>[]).map(mapRoomRow);
}

export function getAllRoomsAdmin(): Room[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM rooms ORDER BY sort_order ASC').all();
  return (rows as unknown as Record<string, unknown>[]).map(mapRoomRow);
}

export function getRoomBySlug(slug: string): Room | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM rooms WHERE slug = ?').get(slug);
  return row ? mapRoomRow(row as unknown as Record<string, unknown>) : null;
}

export function getRoomById(id: string): Room | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM rooms WHERE id = ?').get(id);
  return row ? mapRoomRow(row as unknown as Record<string, unknown>) : null;
}

export function updateRoom(id: string, updates: Partial<Room>): Room {
  const db = getDb();
  const current = getRoomById(id);
  if (!current) throw new Error('Không tìm thấy phòng trà');

  const updated: Room = { ...current, ...updates };
  db.prepare(`
    UPDATE rooms SET
      name = ?, chinese_name = ?, tagline = ?, description = ?, full_description = ?,
      capacity_min = ?, capacity_max = ?, price_per_hour = ?, price_package_2h = ?,
      area_sqm = ?, floor = ?, amenities = ?, images = ?, tea_master_included = ?,
      is_active = ?, sort_order = ?
    WHERE id = ?
  `).run(
    updated.name,
    updated.chineseName || '',
    updated.tagline,
    updated.description,
    updated.fullDescription,
    updated.capacityMin,
    updated.capacityMax,
    updated.pricePerHour,
    updated.pricePackage2h,
    updated.areaSqm,
    updated.floor,
    JSON.stringify(updated.amenities),
    JSON.stringify(updated.images),
    updated.teaMasterIncluded ? 1 : 0,
    updated.isActive ? 1 : 0,
    updated.sortOrder,
    id
  );

  return updated;
}

// TEA PACKAGES
export function getAllTeaPackages(): TeaPackage[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM tea_packages ORDER BY price DESC').all();
  return (rows as unknown as Record<string, unknown>[]).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    vietnameseName: r.vietnamese_name as string,
    description: r.description as string,
    price: Number(r.price),
    servings: r.servings as string,
    origin: r.origin as string,
    imageUrl: r.image_url as string,
    tags: JSON.parse(r.tags as string || '[]'),
  }));
}

// AVAILABILITY METHODS
export function getBookingsForRoomAndDate(roomId: string, date: string): Booking[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT * FROM bookings 
    WHERE room_id = ? AND date = ? AND status IN ('pending', 'confirmed')
    ORDER BY start_time ASC
  `).all(roomId, date);

  return (rows as unknown as Record<string, unknown>[]).map(mapBookingRow);
}

export function checkAvailability(
  roomId: string,
  date: string,
  startTime: string,
  durationHours: number
): { available: boolean; reason?: string } {
  const startMins = timeToMinutes(startTime);
  const endMins = startMins + Math.round(durationHours * 60);
  const openMins = timeToMinutes(BRAND_CONFIG.openTime);
  const closeMins = timeToMinutes(BRAND_CONFIG.closeTime);

  // Validate operating hours
  if (startMins < openMins) {
    return { available: false, reason: `Phòng trà mở cửa từ ${BRAND_CONFIG.openTime}` };
  }
  if (endMins > closeMins) {
    return { available: false, reason: `Phòng trà đóng cửa lúc ${BRAND_CONFIG.closeTime}` };
  }

  const endTime = minutesToTime(endMins);
  const existingBookings = getBookingsForRoomAndDate(roomId, date);

  for (const b of existingBookings) {
    if (isOverlapping(startTime, endTime, b.startTime, b.endTime, BRAND_CONFIG.bufferMinutes)) {
      return {
        available: false,
        reason: `Khung giờ đã có khách đặt (${b.startTime} - ${b.endTime}) kèm thời gian chuẩn bị phòng.`
      };
    }
  }

  return { available: true };
}

export function getAvailableSlots(roomId: string, date: string, durationHours: number = 2): {
  time: string;
  available: boolean;
  reason?: string;
}[] {
  const slots: { time: string; available: boolean; reason?: string }[] = [];
  const openMins = timeToMinutes(BRAND_CONFIG.openTime);
  const closeMins = timeToMinutes(BRAND_CONFIG.closeTime);
  const interval = BRAND_CONFIG.slotIntervalMinutes;

  for (let m = openMins; m + Math.round(durationHours * 60) <= closeMins; m += interval) {
    const timeStr = minutesToTime(m);
    const result = checkAvailability(roomId, date, timeStr, durationHours);
    slots.push({
      time: timeStr,
      available: result.available,
      reason: result.reason,
    });
  }

  return slots;
}

// CONCURRENCY-SAFE TRANSACTIONAL BOOKING CREATION
export function createBooking(data: {
  roomId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  date: string;
  startTime: string;
  durationHours: number;
  guestCount: number;
  teaPackageId?: string;
  specialRequests?: string;
}): Booking {
  const db = getDb();

  // Validate room
  const room = getRoomById(data.roomId);
  if (!room) {
    throw new Error('Phòng trà được chọn không tồn tại.');
  }

  if (data.guestCount < room.capacityMin || data.guestCount > room.capacityMax) {
    throw new Error(`Số lượng khách (${data.guestCount} người) không phù hợp với sức chứa phòng ${room.name} (${room.capacityMin} - ${room.capacityMax} người).`);
  }

  // Validate duration
  if (data.durationHours < 1 || data.durationHours > 8) {
    throw new Error('Thời lượng đặt phòng từ 1 giờ đến 8 giờ.');
  }

  const endTime = calculateEndTime(data.startTime, data.durationHours);

  // Validate price calculation on server side
  let roomPrice = 0;
  if (data.durationHours === 2) {
    roomPrice = room.pricePackage2h;
  } else {
    roomPrice = Math.round(room.pricePerHour * data.durationHours);
  }

  let teaPackagePrice = 0;
  let teaPackageName = '';
  if (data.teaPackageId) {
    const tea = getAllTeaPackages().find(t => t.id === data.teaPackageId);
    if (tea) {
      teaPackagePrice = tea.price;
      teaPackageName = tea.name;
    }
  }

  const totalPrice = roomPrice + teaPackagePrice;
  const depositAmount = Math.round(totalPrice * (BRAND_CONFIG.depositPercentage / 100));

  // Generate unique booking reference: OS-YYYYMMDD-XXXX
  const dateStr = data.date.replace(/-/g, '');
  const randomHex = Math.random().toString(16).substring(2, 6).toUpperCase();
  const bookingReference = `OS-${dateStr}-${randomHex}`;
  const id = `bk-${Date.now()}-${randomHex}`;

  // Execute in SQLite TRANSACTION with BEGIN IMMEDIATE to guarantee mutual exclusion
  db.exec('BEGIN IMMEDIATE');
  try {
    // 1. Re-check availability inside transaction to prevent race conditions
    const existingRows = db.prepare(`
      SELECT * FROM bookings 
      WHERE room_id = ? AND date = ? AND status IN ('pending', 'confirmed')
    `).all(data.roomId, data.date) as unknown as Record<string, unknown>[];

    for (const row of existingRows) {
      const b = mapBookingRow(row);
      if (isOverlapping(data.startTime, endTime, b.startTime, b.endTime, BRAND_CONFIG.bufferMinutes)) {
        throw new Error(`Rất tiếc, khung giờ ${data.startTime} - ${endTime} vừa được khách khác giữ chỗ trước. Vui lòng chọn khung giờ khác.`);
      }
    }

    // 2. Insert booking
    const stmt = db.prepare(`
      INSERT INTO bookings (
        id, booking_reference, room_id, room_name, customer_name, customer_phone, customer_email,
        date, start_time, end_time, duration_hours, guest_count, room_price,
        tea_package_id, tea_package_name, tea_package_price, total_price, deposit_amount,
        status, special_requests
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      bookingReference,
      room.id,
      room.name,
      data.customerName.trim(),
      data.customerPhone.trim(),
      data.customerEmail ? data.customerEmail.trim() : null,
      data.date,
      data.startTime,
      endTime,
      data.durationHours,
      data.guestCount,
      roomPrice,
      data.teaPackageId || null,
      teaPackageName || null,
      teaPackagePrice,
      totalPrice,
      depositAmount,
      'pending', // Initial status is pending per business policy
      data.specialRequests ? data.specialRequests.trim() : null
    );

    db.exec('COMMIT');

    const created = getBookingById(id);
    if (!created) throw new Error('Không thể tạo đơn đặt phòng.');
    return created;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

// BOOKINGS ADMIN & LOOKUP
export function getBookingById(id: string): Booking | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
  return row ? mapBookingRow(row as unknown as Record<string, unknown>) : null;
}

export function getBookingByReference(reference: string): Booking | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM bookings WHERE booking_reference = ?').get(reference.toUpperCase().trim());
  return row ? mapBookingRow(row as unknown as Record<string, unknown>) : null;
}

export function searchBookings(options: {
  date?: string;
  status?: string;
  search?: string;
}): Booking[] {
  const db = getDb();
  let query = 'SELECT * FROM bookings WHERE 1=1';
  const params: (string | number)[] = [];

  if (options.date) {
    query += ' AND date = ?';
    params.push(options.date);
  }

  if (options.status && options.status !== 'all') {
    query += ' AND status = ?';
    params.push(options.status);
  }

  if (options.search) {
    query += ' AND (booking_reference LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)';
    const searchWild = `%${options.search}%`;
    params.push(searchWild, searchWild, searchWild);
  }

  query += ' ORDER BY created_at DESC';

  const rows = db.prepare(query).all(...params) as unknown as Record<string, unknown>[];
  return rows.map(mapBookingRow);
}

export function updateBookingStatus(
  id: string,
  status: BookingStatus,
  adminNotes?: string
): Booking {
  const db = getDb();
  const current = getBookingById(id);
  if (!current) throw new Error('Không tìm thấy thông tin đặt phòng');

  db.prepare(`
    UPDATE bookings 
    SET status = ?, admin_notes = COALESCE(?, admin_notes), updated_at = datetime('now')
    WHERE id = ?
  `).run(status, adminNotes || null, id);

  const updated = getBookingById(id);
  return updated!;
}

export function getDashboardStats() {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];

  const todayBookingsStmt = db.prepare(`SELECT COUNT(*) as count FROM bookings WHERE date = ? AND status IN ('pending', 'confirmed')`);
  const todayBookings = (todayBookingsStmt.get() as { count: number }).count;

  const pendingBookingsStmt = db.prepare(`SELECT COUNT(*) as count FROM bookings WHERE status = 'pending'`);
  const pendingBookings = (pendingBookingsStmt.get() as { count: number }).count;

  const totalRevenueStmt = db.prepare(`SELECT SUM(total_price) as sum FROM bookings WHERE status IN ('confirmed', 'completed')`);
  const totalRevenue = (totalRevenueStmt.get() as { sum: number | null }).sum || 0;

  const totalBookingsStmt = db.prepare(`SELECT COUNT(*) as count FROM bookings`);
  const totalBookings = (totalBookingsStmt.get() as { count: number }).count;

  return {
    todayBookings,
    pendingBookings,
    totalRevenue,
    totalBookings,
  };
}

export function resetDemoData() {
  const db = getDb();
  db.exec(`
    DELETE FROM bookings;
    DELETE FROM rooms;
    DELETE FROM tea_packages;
  `);
  initSchema(db);
  return { success: true, message: 'Đã khôi phục dữ liệu mẫu thành công.' };
}
