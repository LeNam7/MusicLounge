import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {
  Booking,
  BookingAuditLog,
  BookingStatus,
  BookingStatusCode,
  NotificationChannel,
  NotificationLog,
  NotificationRecipientType,
  NotificationStatus,
  NotificationType,
  Room,
  SlotBlock,
  SlotStatus,
  SystemSettings,
  TeaPackage,
  TimeSlot,
} from './types';
import { BRAND_CONFIG, INITIAL_ROOMS, INITIAL_TEA_PACKAGES } from './config';

// Custom structured domain error
export class BookingDomainError extends Error {
  public code: string;
  public httpStatus: number;

  constructor(message: string, code: string = 'VALIDATION_ERROR', httpStatus: number = 400) {
    super(message);
    this.name = 'BookingDomainError';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function resolveDbPath(): string {
  if (process.env.DATABASE_PATH) {
    return path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.DATABASE_PATH);
  }
  return path.join(process.cwd(), 'data', process.env.DATABASE_NAME || 'oriental_serenity.db');
}

const globalForDb = globalThis as unknown as {
  __sqliteDb?: DatabaseSync;
  __sqliteDbPath?: string;
};

export function getDb(): DatabaseSync {
  const targetPath = resolveDbPath();

  if (!globalForDb.__sqliteDb || globalForDb.__sqliteDbPath !== targetPath) {
    if (globalForDb.__sqliteDb) {
      try {
        globalForDb.__sqliteDb.close();
      } catch {
        // Ignore
      }
    }
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    globalForDb.__sqliteDbPath = targetPath;
    const db = new DatabaseSync(targetPath);
    db.exec('PRAGMA journal_mode = WAL;');
    db.exec('PRAGMA busy_timeout = 5000;');
    db.exec('PRAGMA foreign_keys = ON;');
    initSchema(db);
    globalForDb.__sqliteDb = db;
  }
  return globalForDb.__sqliteDb;
}

export function DEFAULT_SYSTEM_SETTINGS(): SystemSettings {
  return {
    openTime: BRAND_CONFIG.openTime || '08:30',
    closeTime: BRAND_CONFIG.closeTime || '22:30',
    slotIntervalMinutes: BRAND_CONFIG.slotIntervalMinutes || 15,
    defaultDurationHours: BRAND_CONFIG.defaultDurationHours || 2,
    bufferMinutes: BRAND_CONFIG.bufferMinutes ?? 15,
    holdDurationHours: Number(process.env.BOOKING_HOLD_HOURS) || BRAND_CONFIG.holdDurationHours || 24,
    depositPercentage: BRAND_CONFIG.depositPercentage || 30,
    closedDates: [],
    notifyCustomerOnExpiry: true,
  };
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
      amenities TEXT NOT NULL,
      images TEXT NOT NULL,
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
      tags TEXT NOT NULL,
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
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      duration_hours REAL NOT NULL,
      guest_count INTEGER NOT NULL,
      room_price INTEGER NOT NULL,
      tea_package_id TEXT,
      tea_package_name TEXT,
      tea_package_price INTEGER DEFAULT 0,
      total_price INTEGER NOT NULL,
      deposit_amount INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending', 'confirmed', 'rejected', 'expired', 'cancelled', 'completed')),
      special_requests TEXT,
      admin_notes TEXT,
      reviewed_by TEXT,
      reviewed_at TEXT,
      rejection_reason TEXT,
      cancellation_reason TEXT,
      expires_at TEXT,
      expired_at TEXT,
      cancelled_at TEXT,
      idempotency_key TEXT UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (room_id) REFERENCES rooms(id)
    );
  `);

  // Safe migration for pre-existing bookings table that lacked 'expired' status or new audit columns
  const masterRow = db
    .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='bookings'")
    .get() as { sql?: string } | undefined;

  if (masterRow?.sql && (!masterRow.sql.includes("'expired'") || !masterRow.sql.includes('reviewed_by'))) {
    db.exec('PRAGMA foreign_keys = OFF;');
    db.exec('BEGIN IMMEDIATE;');
    try {
      const existingCols = (db.prepare('PRAGMA table_info(bookings)').all() as Array<{ name: string }>).map(
        (c) => c.name
      );
      const hasCol = (c: string) => existingCols.includes(c);

      db.exec(`
        CREATE TABLE bookings_v2 (
          id TEXT PRIMARY KEY,
          booking_reference TEXT UNIQUE NOT NULL,
          room_id TEXT NOT NULL,
          room_name TEXT NOT NULL,
          customer_name TEXT NOT NULL,
          customer_phone TEXT NOT NULL,
          customer_email TEXT,
          date TEXT NOT NULL,
          start_time TEXT NOT NULL,
          end_time TEXT NOT NULL,
          duration_hours REAL NOT NULL,
          guest_count INTEGER NOT NULL,
          room_price INTEGER NOT NULL,
          tea_package_id TEXT,
          tea_package_name TEXT,
          tea_package_price INTEGER DEFAULT 0,
          total_price INTEGER NOT NULL,
          deposit_amount INTEGER NOT NULL,
          status TEXT NOT NULL CHECK(status IN ('pending', 'confirmed', 'rejected', 'expired', 'cancelled', 'completed')),
          special_requests TEXT,
          admin_notes TEXT,
          reviewed_by TEXT,
          reviewed_at TEXT,
          rejection_reason TEXT,
          cancellation_reason TEXT,
          expires_at TEXT,
          expired_at TEXT,
          cancelled_at TEXT,
          idempotency_key TEXT UNIQUE,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (room_id) REFERENCES rooms(id)
        );
      `);

      db.exec(`
        INSERT INTO bookings_v2 (
          id, booking_reference, room_id, room_name, customer_name, customer_phone, customer_email,
          date, start_time, end_time, duration_hours, guest_count, room_price,
          tea_package_id, tea_package_name, tea_package_price, total_price, deposit_amount,
          status, special_requests, admin_notes,
          reviewed_by, reviewed_at, rejection_reason, cancellation_reason,
          expires_at, expired_at, cancelled_at, idempotency_key,
          created_at, updated_at
        )
        SELECT
          id, booking_reference, room_id, room_name, customer_name, customer_phone, customer_email,
          date, start_time, end_time, duration_hours, guest_count, room_price,
          tea_package_id, tea_package_name, tea_package_price, total_price, deposit_amount,
          status, special_requests, admin_notes,
          ${hasCol('reviewed_by') ? 'reviewed_by' : 'NULL'},
          ${hasCol('reviewed_at') ? 'reviewed_at' : 'NULL'},
          ${hasCol('rejection_reason') ? 'rejection_reason' : 'NULL'},
          ${hasCol('cancellation_reason') ? 'cancellation_reason' : 'NULL'},
          ${hasCol('expires_at') ? 'expires_at' : "datetime(created_at, '+24 hours')"},
          ${hasCol('expired_at') ? 'expired_at' : 'NULL'},
          ${hasCol('cancelled_at') ? 'cancelled_at' : 'NULL'},
          ${hasCol('idempotency_key') ? 'idempotency_key' : 'NULL'},
          created_at, updated_at
        FROM bookings;
      `);

      db.exec('DROP TABLE bookings;');
      db.exec('ALTER TABLE bookings_v2 RENAME TO bookings;');
      db.exec('COMMIT;');
    } catch (e) {
      db.exec('ROLLBACK;');
      throw e;
    } finally {
      db.exec('PRAGMA foreign_keys = ON;');
    }
  }

  // Create supporting tables for settings, slot blocks, audit logs, and notification outbox
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_bookings_room_date ON bookings(room_id, date);
    CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(booking_reference);
    CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
    CREATE INDEX IF NOT EXISTS idx_bookings_expires_at ON bookings(status, expires_at);

    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value_json TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS slot_blocks (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      reason TEXT NOT NULL,
      created_by TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_slot_blocks_date ON slot_blocks(date, room_id);

    CREATE TABLE IF NOT EXISTS booking_audit_logs (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL,
      booking_reference TEXT NOT NULL,
      action TEXT NOT NULL,
      from_status TEXT,
      to_status TEXT NOT NULL,
      actor TEXT NOT NULL,
      reason TEXT,
      metadata_json TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_audit_booking_id ON booking_audit_logs(booking_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS notification_logs (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL,
      booking_reference TEXT NOT NULL,
      recipient_type TEXT NOT NULL CHECK(recipient_type IN ('ADMIN', 'CUSTOMER')),
      recipient_address TEXT NOT NULL,
      channel TEXT NOT NULL,
      notification_type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      payload_json TEXT,
      status TEXT NOT NULL CHECK(status IN ('PENDING', 'SENT', 'FAILED')),
      attempt_count INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 3,
      next_retry_at TEXT,
      last_error TEXT,
      provider_response TEXT,
      sent_at TEXT,
      idempotency_key TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_notifications_booking ON notification_logs(booking_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_notifications_status ON notification_logs(status, next_retry_at);
  `);

  // Initialize default system settings if missing
  const settingsRow = db.prepare("SELECT value_json FROM system_settings WHERE key = 'booking_config'").get() as
    | { value_json: string }
    | undefined;
  if (!settingsRow) {
    db.prepare("INSERT INTO system_settings (key, value_json) VALUES ('booking_config', ?)").run(
      JSON.stringify(DEFAULT_SYSTEM_SETTINGS())
    );
  }

  // Seed default rooms if empty or sync capacities
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
  } else {
    // Sync capacity bounds from config for existing rooms
    const updateCapacityStmt = db.prepare(
      'UPDATE rooms SET capacity_min = ?, capacity_max = ? WHERE id = ?'
    );
    for (const r of INITIAL_ROOMS) {
      updateCapacityStmt.run(r.capacityMin, r.capacityMax, r.id);
    }
  }

  // Seed or sync tea packages
  const insertTea = db.prepare(`
    INSERT INTO tea_packages (
      id, name, vietnamese_name, description, price, servings, origin, image_url, tags
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      vietnamese_name = excluded.vietnamese_name,
      description = excluded.description,
      price = excluded.price,
      servings = excluded.servings,
      origin = excluded.origin,
      image_url = excluded.image_url,
      tags = excluded.tags
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

  const validIds = INITIAL_TEA_PACKAGES.map((t) => `'${t.id}'`).join(',');
  db.prepare(`DELETE FROM tea_packages WHERE id NOT IN (${validIds})`).run();

  // Seed sample initial bookings for realistic demo if empty
  const bookingCountStmt = db.prepare('SELECT COUNT(*) as count FROM bookings');
  const bookingCount = (bookingCountStmt.get() as { count: number }).count;
  if (bookingCount === 0) {
    const today = getLocalTodayStr();
    const expiresIso = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    const nowIso = new Date().toISOString();

    const insertSampleBooking = db.prepare(`
      INSERT INTO bookings (
        id, booking_reference, room_id, room_name, customer_name, customer_phone, customer_email,
        date, start_time, end_time, duration_hours, guest_count, room_price,
        tea_package_id, tea_package_name, tea_package_price, total_price, deposit_amount,
        status, special_requests, admin_notes, reviewed_by, reviewed_at, expires_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertSampleBooking.run(
      'seed-booking-1',
      'LVT-20261028-7F9A',
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
      'Lục Trà Shan Tuyết 1 Tôm 2 Lá',
      280000,
      1080000,
      324000,
      'confirmed',
      'Chuẩn bị bộ ấm tử sa đất chu nê, khách dùng đàm đạo kinh doanh.',
      'Đã duyệt lịch và liên hệ xác nhận cọc.',
      'admin',
      nowIso,
      null,
      nowIso,
      nowIso
    );

    insertSampleBooking.run(
      'seed-booking-2',
      'LVT-20261028-4B2E',
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
      'tea-bach-tra-shan-tuyet',
      'Bạch Trà Shan Tuyết Cổ Thụ',
      350000,
      1100000,
      330000,
      'pending',
      'Kỷ niệm ngày quen nhau, mong chuẩn bị bàn trà có hoa tươi nhã nhặn.',
      'Khách vừa gửi yêu cầu đặt lịch, đang chờ chủ phòng trà duyệt.',
      null,
      null,
      expiresIso,
      nowIso,
      nowIso
    );
  }
}

export function getLocalTodayStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function toStatusCode(status: BookingStatus): BookingStatusCode {
  return status.toUpperCase() as BookingStatusCode;
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
    amenities: JSON.parse((row.amenities as string) || '[]'),
    images: JSON.parse((row.images as string) || '[]'),
    teaMasterIncluded: Boolean(row.tea_master_included),
    isActive: Boolean(row.is_active),
    sortOrder: Number(row.sort_order),
  };
}

// Map SQLite row to Booking model
function mapBookingRow(row: Record<string, unknown>): Booking {
  const status = (row.status as BookingStatus) || 'pending';
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
    status,
    statusCode: toStatusCode(status),
    specialRequests: (row.special_requests as string) || undefined,
    adminNotes: (row.admin_notes as string) || undefined,
    reviewedBy: (row.reviewed_by as string) || undefined,
    reviewedAt: (row.reviewed_at as string) || undefined,
    rejectionReason: (row.rejection_reason as string) || undefined,
    cancellationReason: (row.cancellation_reason as string) || undefined,
    expiresAt: (row.expires_at as string) || undefined,
    expiredAt: (row.expired_at as string) || undefined,
    cancelledAt: (row.cancelled_at as string) || undefined,
    idempotencyKey: (row.idempotency_key as string) || undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapAuditRow(row: Record<string, unknown>): BookingAuditLog {
  return {
    id: row.id as string,
    bookingId: row.booking_id as string,
    bookingReference: row.booking_reference as string,
    action: row.action as BookingAuditLog['action'],
    fromStatus: (row.from_status as BookingStatus) || null,
    toStatus: row.to_status as BookingStatus,
    actor: row.actor as string,
    reason: (row.reason as string) || undefined,
    metadataJson: (row.metadata_json as string) || undefined,
    createdAt: row.created_at as string,
  };
}

export function mapNotificationRow(row: Record<string, unknown>): NotificationLog {
  return {
    id: row.id as string,
    bookingId: row.booking_id as string,
    bookingReference: row.booking_reference as string,
    recipientType: row.recipient_type as NotificationRecipientType,
    recipientAddress: row.recipient_address as string,
    channel: row.channel as NotificationChannel,
    notificationType: row.notification_type as NotificationType,
    title: row.title as string,
    content: row.content as string,
    payloadJson: (row.payload_json as string) || undefined,
    status: row.status as NotificationStatus,
    attemptCount: Number(row.attempt_count || 0),
    maxAttempts: Number(row.max_attempts || 3),
    nextRetryAt: (row.next_retry_at as string) || undefined,
    lastError: (row.last_error as string) || undefined,
    providerResponse: (row.provider_response as string) || undefined,
    sentAt: (row.sent_at as string) || undefined,
    idempotencyKey: row.idempotency_key as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ============================================================================
// SYSTEM SETTINGS & SLOT BLOCKS
// ============================================================================

export function getSystemSettings(): SystemSettings {
  const db = getDb();
  const row = db.prepare("SELECT value_json FROM system_settings WHERE key = 'booking_config'").get() as
    | { value_json: string }
    | undefined;
  if (!row) return DEFAULT_SYSTEM_SETTINGS();
  try {
    return { ...DEFAULT_SYSTEM_SETTINGS(), ...JSON.parse(row.value_json) };
  } catch {
    return DEFAULT_SYSTEM_SETTINGS();
  }
}

export function updateSystemSettings(updates: Partial<SystemSettings>): SystemSettings {
  const db = getDb();
  const current = getSystemSettings();
  const next: SystemSettings = {
    ...current,
    ...updates,
    slotIntervalMinutes: Math.max(5, Math.min(120, Number(updates.slotIntervalMinutes ?? current.slotIntervalMinutes))),
    defaultDurationHours: Math.max(0.5, Math.min(8, Number(updates.defaultDurationHours ?? current.defaultDurationHours))),
    bufferMinutes: Math.max(0, Math.min(60, Number(updates.bufferMinutes ?? current.bufferMinutes))),
    holdDurationHours: Math.max(0.05, Math.min(168, Number(updates.holdDurationHours ?? current.holdDurationHours))),
    closedDates: Array.isArray(updates.closedDates) ? updates.closedDates : current.closedDates,
  };

  db.prepare(`
    INSERT INTO system_settings (key, value_json, updated_at)
    VALUES ('booking_config', ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = datetime('now')
  `).run(JSON.stringify(next));

  return next;
}

export function getSlotBlocks(date?: string, roomId?: string): SlotBlock[] {
  const db = getDb();
  let query = 'SELECT * FROM slot_blocks WHERE 1=1';
  const params: string[] = [];

  if (date) {
    query += ' AND date = ?';
    params.push(date);
  }
  if (roomId && roomId !== 'ALL') {
    query += " AND (room_id = ? OR room_id = 'ALL')";
    params.push(roomId);
  }
  query += ' ORDER BY date DESC, start_time ASC';

  const rows = db.prepare(query).all(...params) as unknown as Record<string, unknown>[];
  const rooms = getAllRoomsAdmin();
  return rows.map((r) => {
    const rm = rooms.find((room) => room.id === r.room_id);
    return {
      id: r.id as string,
      roomId: r.room_id as string,
      roomName: r.room_id === 'ALL' ? 'Tất cả các phòng' : rm?.name || (r.room_id as string),
      date: r.date as string,
      startTime: r.start_time as string,
      endTime: r.end_time as string,
      reason: r.reason as string,
      createdBy: r.created_by as string,
      createdAt: r.created_at as string,
    };
  });
}

export function createSlotBlock(data: {
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  createdBy?: string;
}): SlotBlock {
  const db = getDb();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    throw new BookingDomainError('Định dạng ngày không hợp lệ (YYYY-MM-DD).', 'VALIDATION_ERROR', 400);
  }
  if (timeToMinutes(data.endTime) <= timeToMinutes(data.startTime)) {
    throw new BookingDomainError('Giờ kết thúc khóa phải sau giờ bắt đầu.', 'VALIDATION_ERROR', 400);
  }

  const id = `blk-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
  db.prepare(`
    INSERT INTO slot_blocks (id, room_id, date, start_time, end_time, reason, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.roomId || 'ALL',
    data.date,
    data.startTime,
    data.endTime,
    data.reason.trim() || 'Tạm ngưng phục vụ khung giờ này',
    data.createdBy || 'admin'
  );

  const created = getSlotBlocks(data.date).find((b) => b.id === id);
  return created!;
}

export function deleteSlotBlock(id: string): boolean {
  const db = getDb();
  const res = db.prepare('DELETE FROM slot_blocks WHERE id = ?').run(id);
  return res.changes > 0;
}

// ============================================================================
// TIME HELPERS
// ============================================================================

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

// ============================================================================
// NOTIFICATION MESSAGE BUILDERS & OUTBOX ENQUEUE (TRANSACTIONAL)
// ============================================================================

export function buildNotificationMessage(
  booking: {
    id: string;
    bookingReference: string;
    roomName: string;
    customerName: string;
    customerPhone: string;
    date: string;
    startTime: string;
    endTime: string;
    guestCount: number;
    specialRequests?: string | null;
    rejectionReason?: string | null;
    cancellationReason?: string | null;
  },
  type: NotificationType
): { title: string; content: string } {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 3000}`;
  const adminUrl = `${baseUrl}/admin?bookingId=${encodeURIComponent(booking.id)}`;
  const lookupUrl = `${baseUrl}/lookup?ref=${encodeURIComponent(booking.bookingReference)}`;
  const notes = booking.specialRequests && booking.specialRequests.trim() ? booking.specialRequests.trim() : 'Không có';
  const rejectionReason =
    booking.rejectionReason && booking.rejectionReason.trim()
      ? booking.rejectionReason.trim()
      : 'Khung giờ quý khách chọn hiện đã kín lịch phục vụ hoặc đang bảo trì không gian.';
  const cancellationReason =
    booking.cancellationReason && booking.cancellationReason.trim()
      ? booking.cancellationReason.trim()
      : 'Thay đổi lịch vận hành đột xuất từ phòng trà.';

  switch (type) {
    case 'BOOKING_REQUESTED':
      return {
        title: 'Có yêu cầu đặt lịch phòng trà mới',
        content: [
          '[YÊU CẦU ĐẶT LỊCH MỚI]',
          '',
          `Mã yêu cầu: ${booking.bookingReference}`,
          `Phòng trà: ${booking.roomName}`,
          `Khách hàng: ${booking.customerName}`,
          `Số điện thoại: ${booking.customerPhone}`,
          `Ngày đặt: ${booking.date}`,
          `Khung giờ: ${booking.startTime} – ${booking.endTime}`,
          `Số lượng khách: ${booking.guestCount}`,
          `Ghi chú: ${notes}`,
          'Trạng thái: CHỜ DUYỆT',
          '',
          'Mở trang quản trị để xem chi tiết và xử lý yêu cầu:',
          adminUrl,
        ].join('\n'),
      };

    case 'BOOKING_CONFIRMED':
      return {
        title: 'Xác nhận đặt lịch phòng trà thành công',
        content: [
          '[XÁC NHẬN ĐẶT LỊCH PHÒNG TRÀ THÀNH CÔNG]',
          '',
          `Xin chào ${booking.customerName}!`,
          '',
          'Phòng trà xác nhận yêu cầu đặt lịch của bạn đã được chấp thuận.',
          '',
          `Mã đặt lịch: ${booking.bookingReference}`,
          `Phòng trà: ${booking.roomName}`,
          `Ngày đặt: ${booking.date}`,
          `Khung giờ: ${booking.startTime} – ${booking.endTime}`,
          `Số lượng khách: ${booking.guestCount}`,
          '',
          'Cảm ơn bạn đã lựa chọn phòng trà. Chúng tôi rất mong được đón tiếp bạn!',
          '',
          'Nếu cần thay đổi lịch, vui lòng liên hệ với chúng tôi và cung cấp mã đặt lịch.',
          `Tra cứu lịch hẹn: ${lookupUrl}`,
        ].join('\n'),
      };

    case 'BOOKING_REJECTED':
      return {
        title: 'Thông báo về yêu cầu đặt lịch',
        content: [
          '[THÔNG BÁO VỀ YÊU CẦU ĐẶT LỊCH]',
          '',
          `Xin chào ${booking.customerName}!`,
          '',
          'Rất tiếc, yêu cầu đặt lịch của bạn chưa thể được chấp thuận.',
          '',
          `Mã yêu cầu: ${booking.bookingReference}`,
          `Ngày đặt: ${booking.date}`,
          `Khung giờ: ${booking.startTime}`,
          `Lý do: ${rejectionReason}`,
          '',
          'Bạn có thể quay lại website để lựa chọn khung giờ khác.',
          '',
          'Cảm ơn bạn đã quan tâm và mong bạn thông cảm!',
        ].join('\n'),
      };

    case 'BOOKING_CANCELLED':
      return {
        title: 'Thông báo hủy lịch đặt phòng trà',
        content: [
          '[THÔNG BÁO HỦY LỊCH ĐẶT PHÒNG TRÀ]',
          '',
          `Xin chào ${booking.customerName}!`,
          '',
          'Chúng tôi rất tiếc phải thông báo rằng lịch đặt phòng trà của bạn đã được hủy.',
          '',
          `Mã đặt lịch: ${booking.bookingReference}`,
          `Ngày đặt: ${booking.date}`,
          `Khung giờ: ${booking.startTime} – ${booking.endTime}`,
          `Lý do: ${cancellationReason}`,
          '',
          'Chúng tôi thành thật xin lỗi vì sự bất tiện này.',
          '',
          'Vui lòng liên hệ với chúng tôi nếu bạn cần được hỗ trợ lựa chọn lịch khác.',
        ].join('\n'),
      };

    case 'BOOKING_EXPIRED':
      return {
        title: 'Thông báo yêu cầu đặt lịch hết hạn giữ chỗ',
        content: [
          '[THÔNG BÁO HẾT HẠN GIỮ CHỖ]',
          '',
          `Xin chào ${booking.customerName}!`,
          '',
          `Yêu cầu đặt lịch mã ${booking.bookingReference} (${booking.date}, khung giờ ${booking.startTime} – ${booking.endTime}) đã quá thời hạn chờ duyệt và khung giờ đã được giải phóng tự động.`,
          '',
          'Quý khách có thể quay lại website để gửi yêu cầu đặt lịch mới.',
        ].join('\n'),
      };
  }
}

function enqueueNotificationTx(
  db: DatabaseSync,
  params: {
    bookingId: string;
    bookingReference: string;
    recipientType: NotificationRecipientType;
    recipientAddress: string;
    channel: NotificationChannel;
    notificationType: NotificationType;
    title: string;
    content: string;
    payload?: Record<string, unknown>;
    idempotencyKey: string;
  }
): string {
  const existing = db
    .prepare('SELECT id FROM notification_logs WHERE idempotency_key = ?')
    .get(params.idempotencyKey) as { id: string } | undefined;
  if (existing) {
    return existing.id;
  }

  const id = `ntf-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const nowIso = new Date().toISOString();

  db.prepare(`
    INSERT INTO notification_logs (
      id, booking_id, booking_reference, recipient_type, recipient_address,
      channel, notification_type, title, content, payload_json,
      status, attempt_count, max_attempts, next_retry_at, idempotency_key,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 0, 3, ?, ?, ?, ?)
  `).run(
    id,
    params.bookingId,
    params.bookingReference,
    params.recipientType,
    params.recipientAddress,
    params.channel,
    params.notificationType,
    params.title,
    params.content,
    params.payload ? JSON.stringify(params.payload) : null,
    nowIso,
    params.idempotencyKey,
    nowIso,
    nowIso
  );

  return id;
}

function insertAuditLogTx(
  db: DatabaseSync,
  params: {
    bookingId: string;
    bookingReference: string;
    action: BookingAuditLog['action'];
    fromStatus: BookingStatus | null;
    toStatus: BookingStatus;
    actor: string;
    reason?: string;
    metadata?: Record<string, unknown>;
  }
) {
  const id = `aud-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const nowIso = new Date().toISOString();

  db.prepare(`
    INSERT INTO booking_audit_logs (
      id, booking_id, booking_reference, action, from_status, to_status,
      actor, reason, metadata_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    params.bookingId,
    params.bookingReference,
    params.action,
    params.fromStatus,
    params.toStatus,
    params.actor,
    params.reason || null,
    params.metadata ? JSON.stringify(params.metadata) : null,
    nowIso
  );
}

// ============================================================================
// SERVER-SIDE EXPIRY ENGINE (SECTION VI)
// ============================================================================

export function expireOverdueBookings(nowDate: Date = new Date()): Booking[] {
  const db = getDb();
  const nowIso = nowDate.toISOString();
  const settings = getSystemSettings();

  const expiredIds: string[] = [];

  db.exec('BEGIN IMMEDIATE');
  try {
    const overdueRows = db
      .prepare(`
        SELECT * FROM bookings
        WHERE status = 'pending'
          AND expires_at IS NOT NULL
          AND datetime(expires_at) <= datetime(?)
      `)
      .all(nowIso) as unknown as Record<string, unknown>[];

    for (const row of overdueRows) {
      const b = mapBookingRow(row);
      const res = db
        .prepare(`
          UPDATE bookings
          SET status = 'expired',
              expired_at = ?,
              updated_at = ?
          WHERE id = ? AND status = 'pending'
        `)
        .run(nowIso, nowIso, b.id);

      if (res.changes === 1) {
        expiredIds.push(b.id);
        insertAuditLogTx(db, {
          bookingId: b.id,
          bookingReference: b.bookingReference,
          action: 'EXPIRED',
          fromStatus: 'pending',
          toStatus: 'expired',
          actor: 'system:expiry-worker',
          reason: 'Quá thời hạn giữ chỗ chờ duyệt (Auto-expired)',
        });

        if (settings.notifyCustomerOnExpiry) {
          const msg = buildNotificationMessage(
            {
              id: b.id,
              bookingReference: b.bookingReference,
              roomName: b.roomName || 'Phòng Trà',
              customerName: b.customerName,
              customerPhone: b.customerPhone,
              date: b.date,
              startTime: b.startTime,
              endTime: b.endTime,
              guestCount: b.guestCount,
            },
            'BOOKING_EXPIRED'
          );
          enqueueNotificationTx(db, {
            bookingId: b.id,
            bookingReference: b.bookingReference,
            recipientType: 'CUSTOMER',
            recipientAddress: b.customerEmail || b.customerPhone,
            channel: 'EMAIL',
            notificationType: 'BOOKING_EXPIRED',
            title: msg.title,
            content: msg.content,
            payload: { bookingReference: b.bookingReference, event: 'BOOKING_EXPIRED' },
            idempotencyKey: `BOOKING_EXPIRED:${b.id}`,
          });
        }
      }
    }

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  return expiredIds.map((id) => getBookingById(id)!).filter(Boolean);
}

// ============================================================================
// ROOM API METHODS
// ============================================================================

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
  if (!current) throw new BookingDomainError('Không tìm thấy phòng trà', 'NOT_FOUND', 404);

  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter((entry) => entry[1] !== undefined)
  );
  const updated: Room = { ...current, ...cleanUpdates };
  if (updated.capacityMax < updated.capacityMin) {
    throw new BookingDomainError(
      `Sức chứa tối đa (${updated.capacityMax}) không được nhỏ hơn sức chứa tối thiểu (${updated.capacityMin})`,
      'VALIDATION_ERROR',
      400
    );
  }
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

// ============================================================================
// TEA PACKAGES
// ============================================================================

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
    tags: JSON.parse((r.tags as string) || '[]'),
  }));
}

// ============================================================================
// AVAILABILITY & 4-STATE SLOT ENGINE (SECTION V)
// ============================================================================

export function getBookingsForRoomAndDate(roomId: string, date: string): Booking[] {
  const db = getDb();
  // Ensure expired pending bookings are released first
  expireOverdueBookings();

  const rows = db
    .prepare(`
      SELECT * FROM bookings 
      WHERE room_id = ? AND date = ? AND status IN ('pending', 'confirmed')
      ORDER BY start_time ASC
    `)
    .all(roomId, date);

  return (rows as unknown as Record<string, unknown>[]).map(mapBookingRow);
}

export function evaluateSlotStatus(
  roomId: string,
  date: string,
  startTime: string,
  durationHours: number,
  context?: {
    settings?: SystemSettings;
    existingBookings?: Booking[];
    slotBlocks?: SlotBlock[];
  }
): {
  status: SlotStatus;
  label: string;
  available: boolean;
  reason?: string;
  bookingId?: string;
  bookingReference?: string;
  customerName?: string;
} {
  const settings = context?.settings || getSystemSettings();
  const startMins = timeToMinutes(startTime);
  const endMins = startMins + Math.round(durationHours * 60);
  const openMins = timeToMinutes(settings.openTime);
  const closeMins = timeToMinutes(settings.closeTime);
  const endTime = minutesToTime(endMins);

  // 1. Check past date
  const todayStr = getLocalTodayStr();
  if (date < todayStr) {
    return {
      status: 'UNAVAILABLE',
      label: 'Không khả dụng',
      available: false,
      reason: 'Ngày đặt đã qua.',
    };
  }

  // 2. Check closed holiday dates configured by Admin
  if (settings.closedDates.includes(date)) {
    return {
      status: 'UNAVAILABLE',
      label: 'Không khả dụng',
      available: false,
      reason: 'Phòng trà nghỉ phục vụ vào ngày này.',
    };
  }

  // 3. Check operating hours
  if (startMins < openMins) {
    return {
      status: 'UNAVAILABLE',
      label: 'Không khả dụng',
      available: false,
      reason: `Phòng trà mở cửa từ ${settings.openTime}`,
    };
  }
  if (endMins > closeMins) {
    return {
      status: 'UNAVAILABLE',
      label: 'Không khả dụng',
      available: false,
      reason: `Vượt quá giờ đóng cửa (${settings.closeTime}) với thời lượng ${durationHours}h`,
    };
  }

  // 4. Check manual slot blocks configured by Admin
  const blocks = context?.slotBlocks || getSlotBlocks(date, roomId);
  for (const blk of blocks) {
    if (isOverlapping(startTime, endTime, blk.startTime, blk.endTime, 0)) {
      return {
        status: 'UNAVAILABLE',
        label: 'Không khả dụng',
        available: false,
        reason: `Khung giờ tạm khóa (${blk.startTime} - ${blk.endTime}): ${blk.reason}`,
      };
    }
  }

  // 5. Check active bookings (CONFIRMED takes visual priority if both exist, then PENDING)
  const existingBookings = context?.existingBookings || getBookingsForRoomAndDate(roomId, date);

  for (const b of existingBookings) {
    if (b.status === 'confirmed' && isOverlapping(startTime, endTime, b.startTime, b.endTime, settings.bufferMinutes)) {
      return {
        status: 'CONFIRMED',
        label: 'Đã đặt',
        available: false,
        reason: `Khung giờ đã có khách đặt xác nhận (${b.startTime} - ${b.endTime}) kèm ${settings.bufferMinutes}p chuẩn bị phòng.`,
        bookingId: b.id,
        bookingReference: b.bookingReference,
        customerName: b.customerName,
      };
    }
  }

  for (const b of existingBookings) {
    if (b.status === 'pending' && isOverlapping(startTime, endTime, b.startTime, b.endTime, settings.bufferMinutes)) {
      return {
        status: 'PENDING',
        label: 'Đang chờ duyệt',
        available: false,
        reason: `Khung giờ đang có yêu cầu chờ duyệt (${b.startTime} - ${b.endTime}).`,
        bookingId: b.id,
        bookingReference: b.bookingReference,
        customerName: b.customerName,
      };
    }
  }

  return {
    status: 'AVAILABLE',
    label: 'Còn trống',
    available: true,
  };
}

export function checkAvailability(
  roomId: string,
  date: string,
  startTime: string,
  durationHours: number
): { available: boolean; status: SlotStatus; label: string; reason?: string } {
  const res = evaluateSlotStatus(roomId, date, startTime, durationHours);
  return {
    available: res.available,
    status: res.status,
    label: res.label,
    reason: res.reason,
  };
}

export function getAvailableSlots(
  roomId: string,
  date: string,
  durationHours?: number,
  includeAdminDetails: boolean = false
): TimeSlot[] {
  const settings = getSystemSettings();
  const effectiveDuration = durationHours || settings.defaultDurationHours || 2;
  const openMins = timeToMinutes(settings.openTime);
  const closeMins = timeToMinutes(settings.closeTime);
  const interval = settings.slotIntervalMinutes || 15;

  const existingBookings = getBookingsForRoomAndDate(roomId, date);
  const slotBlocks = getSlotBlocks(date, roomId);

  const slots: TimeSlot[] = [];

  // Generate 15-minute slots across operating hours
  for (let m = openMins; m < closeMins; m += interval) {
    const timeStr = minutesToTime(m);
    const endTimeStr = calculateEndTime(timeStr, effectiveDuration);
    const evaluated = evaluateSlotStatus(roomId, date, timeStr, effectiveDuration, {
      settings,
      existingBookings,
      slotBlocks,
    });

    const slot: TimeSlot = {
      time: timeStr,
      endTime: endTimeStr,
      status: evaluated.status,
      label: evaluated.label,
      available: evaluated.available,
      reason: evaluated.reason,
    };

    if (includeAdminDetails && evaluated.bookingId) {
      slot.bookingId = evaluated.bookingId;
      slot.bookingReference = evaluated.bookingReference;
      slot.customerName = evaluated.customerName;
    }

    slots.push(slot);
  }

  return slots;
}

// ============================================================================
// CONCURRENCY-SAFE TRANSACTIONAL BOOKING CREATION (SECTION VIII & IX)
// ============================================================================

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
  idempotencyKey?: string;
  holdDurationHoursOverride?: number;
}): Booking {
  const db = getDb();
  const settings = getSystemSettings();

  // Check idempotency key first if provided (safe retry on network timeout)
  if (data.idempotencyKey) {
    const existingByIdem = db
      .prepare('SELECT * FROM bookings WHERE idempotency_key = ?')
      .get(data.idempotencyKey) as Record<string, unknown> | undefined;
    if (existingByIdem) {
      return mapBookingRow(existingByIdem);
    }
  }

  // Validate required fields
  if (!data.roomId || !data.customerName?.trim() || !data.customerPhone?.trim() || !data.date || !data.startTime) {
    throw new BookingDomainError('Vui lòng điền đầy đủ các thông tin bắt buộc.', 'VALIDATION_ERROR', 400);
  }

  if (data.customerName.trim().length < 2) {
    throw new BookingDomainError('Họ và tên khách hàng tối thiểu 2 ký tự.', 'VALIDATION_ERROR', 400);
  }

  const cleanPhone = data.customerPhone.replace(/\s+/g, '');
  if (!/^(0|\+84)[0-9]{8,11}$/.test(cleanPhone)) {
    throw new BookingDomainError(
      'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (10 số).',
      'VALIDATION_ERROR',
      400
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    throw new BookingDomainError('Định dạng ngày đặt không hợp lệ (YYYY-MM-DD).', 'VALIDATION_ERROR', 400);
  }

  const today = getLocalTodayStr();
  if (data.date < today) {
    throw new BookingDomainError('Ngày đặt phòng không thể ở trong quá khứ.', 'VALIDATION_ERROR', 400);
  }

  if (settings.closedDates.includes(data.date)) {
    throw new BookingDomainError('Phòng trà nghỉ phục vụ vào ngày quý khách chọn.', 'SLOT_UNAVAILABLE', 409);
  }

  if (!/^\d{2}:\d{2}$/.test(data.startTime)) {
    throw new BookingDomainError('Khung giờ bắt đầu không hợp lệ (HH:mm).', 'VALIDATION_ERROR', 400);
  }

  // Validate room
  const room = getRoomById(data.roomId);
  if (!room || !room.isActive) {
    throw new BookingDomainError('Phòng trà được chọn không tồn tại hoặc đang tạm ngưng.', 'VALIDATION_ERROR', 400);
  }

  if (data.guestCount < room.capacityMin || data.guestCount > room.capacityMax) {
    throw new BookingDomainError(
      `Số lượng khách (${data.guestCount} người) không phù hợp với sức chứa phòng ${room.name} (${room.capacityMin} - ${room.capacityMax} người).`,
      'VALIDATION_ERROR',
      400
    );
  }

  if (!Number.isFinite(data.durationHours) || data.durationHours < 0.5 || data.durationHours > 8) {
    throw new BookingDomainError('Thời lượng đặt phòng phải từ 0.5 giờ đến 8 giờ.', 'VALIDATION_ERROR', 400);
  }

  const startMins = timeToMinutes(data.startTime);
  const openMins = timeToMinutes(settings.openTime);
  const closeMins = timeToMinutes(settings.closeTime);
  const endMins = startMins + Math.round(data.durationHours * 60);

  if (startMins < openMins || endMins > closeMins) {
    throw new BookingDomainError(
      `Khung giờ nằm ngoài giờ phục vụ (${settings.openTime} – ${settings.closeTime}).`,
      'SLOT_UNAVAILABLE',
      400
    );
  }

  const endTime = minutesToTime(endMins);

  // Server-side price calculation
  const roomPrice =
    data.durationHours === 2 ? room.pricePackage2h : Math.round(room.pricePerHour * data.durationHours);

  let teaPackagePrice = 0;
  let teaPackageName = '';
  if (data.teaPackageId) {
    const tea = getAllTeaPackages().find((t) => t.id === data.teaPackageId);
    if (tea) {
      teaPackagePrice = tea.price;
      teaPackageName = tea.name;
    }
  }

  const totalPrice = roomPrice + teaPackagePrice;
  const depositAmount = Math.round(totalPrice * (settings.depositPercentage / 100));

  const dateStr = data.date.replace(/-/g, '');
  const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
  const bookingReference = `LVT-${dateStr}-${randomHex}`;
  const id = `bk-${Date.now()}-${randomHex}`;
  const nowIso = new Date().toISOString();
  const holdHours = data.holdDurationHoursOverride ?? settings.holdDurationHours ?? 24;
  const expiresAtIso = new Date(Date.now() + holdHours * 3600 * 1000).toISOString();

  // Execute in SQLite TRANSACTION with BEGIN IMMEDIATE to guarantee mutual exclusion
  db.exec('BEGIN IMMEDIATE');
  try {
    // 0. First expire any overdue pending bookings on this room & date inside the same atomic lock
    db.prepare(`
      UPDATE bookings
      SET status = 'expired', expired_at = ?, updated_at = ?
      WHERE room_id = ? AND date = ? AND status = 'pending'
        AND expires_at IS NOT NULL AND datetime(expires_at) <= datetime(?)
    `).run(nowIso, nowIso, data.roomId, data.date, nowIso);

    // 1. Check idempotency key inside lock
    if (data.idempotencyKey) {
      const idemRow = db
        .prepare('SELECT * FROM bookings WHERE idempotency_key = ?')
        .get(data.idempotencyKey) as Record<string, unknown> | undefined;
      if (idemRow) {
        db.exec('COMMIT');
        return mapBookingRow(idemRow);
      }
    }

    // 2. Check manual slot blocks inside lock
    const blockRows = db
      .prepare("SELECT * FROM slot_blocks WHERE date = ? AND (room_id = ? OR room_id = 'ALL')")
      .all(data.date, data.roomId) as unknown as Record<string, unknown>[];

    for (const blk of blockRows) {
      if (isOverlapping(data.startTime, endTime, blk.start_time as string, blk.end_time as string, 0)) {
        throw new BookingDomainError(
          `Khung giờ ${data.startTime} - ${endTime} hiện đang tạm khóa (${blk.reason}). Vui lòng chọn khung giờ khác.`,
          'SLOT_UNAVAILABLE',
          409
        );
      }
    }

    // 3. Re-check active bookings inside transaction to prevent race conditions
    const existingRows = db
      .prepare(`
        SELECT * FROM bookings 
        WHERE room_id = ? AND date = ? AND status IN ('pending', 'confirmed')
      `)
      .all(data.roomId, data.date) as unknown as Record<string, unknown>[];

    for (const row of existingRows) {
      const b = mapBookingRow(row);
      if (isOverlapping(data.startTime, endTime, b.startTime, b.endTime, settings.bufferMinutes)) {
        throw new BookingDomainError(
          `Rất tiếc, khung giờ ${data.startTime} - ${endTime} vừa được khách khác giữ chỗ hoặc đã xác nhận (${b.startTime} - ${b.endTime}). Vui lòng chọn khung giờ khác.`,
          'SLOT_UNAVAILABLE',
          409
        );
      }
    }

    // 4. Insert booking with status = 'pending' and expires_at
    db.prepare(`
      INSERT INTO bookings (
        id, booking_reference, room_id, room_name, customer_name, customer_phone, customer_email,
        date, start_time, end_time, duration_hours, guest_count, room_price,
        tea_package_id, tea_package_name, tea_package_price, total_price, deposit_amount,
        status, special_requests, expires_at, idempotency_key, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)
    `).run(
      id,
      bookingReference,
      room.id,
      room.name,
      data.customerName.trim(),
      cleanPhone,
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
      data.specialRequests ? data.specialRequests.trim() : null,
      expiresAtIso,
      data.idempotencyKey || null,
      nowIso,
      nowIso
    );

    // 5. Write audit log inside the same transaction
    insertAuditLogTx(db, {
      bookingId: id,
      bookingReference,
      action: 'CREATED',
      fromStatus: null,
      toStatus: 'pending',
      actor: `customer:${cleanPhone}`,
      reason: 'Khách gửi yêu cầu đặt lịch mới',
      metadata: {
        roomId: room.id,
        date: data.date,
        startTime: data.startTime,
        endTime,
        guestCount: data.guestCount,
        expiresAt: expiresAtIso,
      },
    });

    // 6. Enqueue Admin Email notification in transactional outbox
    const msg = buildNotificationMessage(
      {
        id,
        bookingReference,
        roomName: room.name,
        customerName: data.customerName.trim(),
        customerPhone: cleanPhone,
        date: data.date,
        startTime: data.startTime,
        endTime,
        guestCount: data.guestCount,
        specialRequests: data.specialRequests,
      },
      'BOOKING_REQUESTED'
    );

    const adminEmailRecipient = process.env.ADMIN_NOTIFICATION_EMAIL || 'lenam287202@gmail.com';
    enqueueNotificationTx(db, {
      bookingId: id,
      bookingReference,
      recipientType: 'ADMIN',
      recipientAddress: adminEmailRecipient,
      channel: 'EMAIL',
      notificationType: 'BOOKING_REQUESTED',
      title: msg.title,
      content: msg.content,
      payload: {
        bookingId: id,
        bookingCode: bookingReference,
        customerName: data.customerName.trim(),
        customerPhone: cleanPhone,
        bookingDate: data.date,
        startTime: data.startTime,
        endTime,
        guestCount: data.guestCount,
        notes: data.specialRequests || '',
        status: 'PENDING',
      },
      idempotencyKey: `BOOKING_REQUESTED:${id}`,
    });

    db.exec('COMMIT');

    const created = getBookingById(id);
    if (!created) throw new BookingDomainError('Không thể tạo đơn đặt phòng.', 'DATABASE_ERROR', 500);
    return created;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

// ============================================================================
// ATOMIC ADMIN DECISION WORKFLOWS: APPROVE, REJECT, CANCEL (SECTION IV & IX)
// ============================================================================

export function approveBooking(
  id: string,
  options?: { reviewedBy?: string; adminNotes?: string }
): Booking {
  const db = getDb();
  const settings = getSystemSettings();
  const nowIso = new Date().toISOString();
  const actor = options?.reviewedBy || 'admin';

  db.exec('BEGIN IMMEDIATE');
  try {
    const row = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!row) {
      throw new BookingDomainError('Không tìm thấy đơn đặt lịch.', 'NOT_FOUND', 404);
    }

    const current = mapBookingRow(row);

    // 1. Check if PENDING booking has already expired at the exact moment of approval!
    if (
      current.status === 'pending' &&
      current.expiresAt &&
      new Date(current.expiresAt).getTime() <= new Date(nowIso).getTime()
    ) {
      db.prepare(`
        UPDATE bookings SET status = 'expired', expired_at = ?, updated_at = ?
        WHERE id = ? AND status = 'pending'
      `).run(nowIso, nowIso, id);

      insertAuditLogTx(db, {
        bookingId: id,
        bookingReference: current.bookingReference,
        action: 'EXPIRED',
        fromStatus: 'pending',
        toStatus: 'expired',
        actor: 'system:approve-guard',
        reason: 'Yêu cầu đã hết thời hạn giữ chỗ trước khi quản trị viên duyệt.',
      });

      db.exec('COMMIT');
      throw new BookingDomainError(
        'Yêu cầu đặt lịch này đã quá thời hạn giữ chỗ (EXPIRED) nên không thể duyệt.',
        'BOOKING_EXPIRED',
        409
      );
    }

    // 2. Verify status is strictly 'pending'
    if (current.status !== 'pending') {
      throw new BookingDomainError(
        `Không thể duyệt đơn đang ở trạng thái ${current.statusCode}. Chỉ đơn đang PENDING mới có thể duyệt.`,
        'INVALID_BOOKING_STATE',
        409
      );
    }

    // 3. Verify no other CONFIRMED booking conflicts with this booking's time window
    const conflictingRows = db
      .prepare(`
        SELECT * FROM bookings
        WHERE room_id = ? AND date = ? AND id != ? AND status = 'confirmed'
      `)
      .all(current.roomId, current.date, id) as unknown as Record<string, unknown>[];

    for (const cRow of conflictingRows) {
      const other = mapBookingRow(cRow);
      if (isOverlapping(current.startTime, current.endTime, other.startTime, other.endTime, settings.bufferMinutes)) {
        throw new BookingDomainError(
          `Không thể duyệt: Khung giờ ${current.startTime} - ${current.endTime} đã bị chiếm bởi đơn xác nhận ${other.bookingReference} (${other.startTime} - ${other.endTime}).`,
          'SLOT_UNAVAILABLE',
          409
        );
      }
    }

    // 4. Conditional atomic update: WHERE id = ? AND status = 'pending'
    const updateRes = db
      .prepare(`
        UPDATE bookings
        SET status = 'confirmed',
            reviewed_by = ?,
            reviewed_at = ?,
            admin_notes = COALESCE(?, admin_notes),
            updated_at = ?
        WHERE id = ? AND status = 'pending'
      `)
      .run(actor, nowIso, options?.adminNotes?.trim() || null, nowIso, id);

    if (updateRes.changes !== 1) {
      throw new BookingDomainError(
        'Đơn đặt lịch vừa được xử lý bởi một thao tác khác. Vui lòng tải lại.',
        'INVALID_BOOKING_STATE',
        409
      );
    }

    // 5. Audit log
    insertAuditLogTx(db, {
      bookingId: id,
      bookingReference: current.bookingReference,
      action: 'APPROVED',
      fromStatus: 'pending',
      toStatus: 'confirmed',
      actor,
      reason: options?.adminNotes?.trim() || 'Quản trị viên duyệt xác nhận đặt lịch',
    });

    // 6. Enqueue customer notification in transactional outbox
    const msg = buildNotificationMessage(
      {
        id: current.id,
        bookingReference: current.bookingReference,
        roomName: current.roomName || 'Phòng Trà',
        customerName: current.customerName,
        customerPhone: current.customerPhone,
        date: current.date,
        startTime: current.startTime,
        endTime: current.endTime,
        guestCount: current.guestCount,
      },
      'BOOKING_CONFIRMED'
    );

    enqueueNotificationTx(db, {
      bookingId: current.id,
      bookingReference: current.bookingReference,
      recipientType: 'CUSTOMER',
      recipientAddress: current.customerEmail || current.customerPhone,
      channel: 'EMAIL',
      notificationType: 'BOOKING_CONFIRMED',
      title: msg.title,
      content: msg.content,
      payload: {
        bookingCode: current.bookingReference,
        customerName: current.customerName,
        customerPhone: current.customerPhone,
        bookingDate: current.date,
        startTime: current.startTime,
        endTime: current.endTime,
        guestCount: current.guestCount,
        status: 'CONFIRMED',
      },
      idempotencyKey: `BOOKING_CONFIRMED:${current.id}`,
    });

    db.exec('COMMIT');
    return getBookingById(id)!;
  } catch (err) {
    try {
      db.exec('ROLLBACK');
    } catch {
      // If already committed in expiry branch, ignore
    }
    throw err;
  }
}

export function rejectBooking(
  id: string,
  options?: { reviewedBy?: string; rejectionReason?: string; adminNotes?: string }
): Booking {
  const db = getDb();
  const nowIso = new Date().toISOString();
  const actor = options?.reviewedBy || 'admin';
  const cleanReason =
    options?.rejectionReason?.trim() ||
    options?.adminNotes?.trim() ||
    'Khung giờ quý khách chọn hiện đã kín lịch phục vụ hoặc đang bảo trì không gian.';

  db.exec('BEGIN IMMEDIATE');
  try {
    const row = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!row) {
      throw new BookingDomainError('Không tìm thấy đơn đặt lịch.', 'NOT_FOUND', 404);
    }

    const current = mapBookingRow(row);
    if (current.status !== 'pending') {
      throw new BookingDomainError(
        `Không thể từ chối đơn đang ở trạng thái ${current.statusCode}. Chỉ đơn đang PENDING mới có thể từ chối (nếu đơn đã CONFIRMED, vui lòng dùng chức năng Hủy lịch).`,
        'INVALID_BOOKING_STATE',
        409
      );
    }

    const updateRes = db
      .prepare(`
        UPDATE bookings
        SET status = 'rejected',
            reviewed_by = ?,
            reviewed_at = ?,
            rejection_reason = ?,
            admin_notes = COALESCE(?, admin_notes),
            updated_at = ?
        WHERE id = ? AND status = 'pending'
      `)
      .run(actor, nowIso, cleanReason, options?.adminNotes?.trim() || cleanReason, nowIso, id);

    if (updateRes.changes !== 1) {
      throw new BookingDomainError(
        'Đơn đặt lịch vừa được xử lý bởi thao tác khác.',
        'INVALID_BOOKING_STATE',
        409
      );
    }

    insertAuditLogTx(db, {
      bookingId: id,
      bookingReference: current.bookingReference,
      action: 'REJECTED',
      fromStatus: 'pending',
      toStatus: 'rejected',
      actor,
      reason: cleanReason,
    });

    const msg = buildNotificationMessage(
      {
        id: current.id,
        bookingReference: current.bookingReference,
        roomName: current.roomName || 'Phòng Trà',
        customerName: current.customerName,
        customerPhone: current.customerPhone,
        date: current.date,
        startTime: current.startTime,
        endTime: current.endTime,
        guestCount: current.guestCount,
        rejectionReason: cleanReason,
      },
      'BOOKING_REJECTED'
    );

    enqueueNotificationTx(db, {
      bookingId: current.id,
      bookingReference: current.bookingReference,
      recipientType: 'CUSTOMER',
      recipientAddress: current.customerEmail || current.customerPhone,
      channel: 'EMAIL',
      notificationType: 'BOOKING_REJECTED',
      title: msg.title,
      content: msg.content,
      payload: {
        bookingCode: current.bookingReference,
        customerName: current.customerName,
        customerPhone: current.customerPhone,
        bookingDate: current.date,
        startTime: current.startTime,
        rejectionReason: cleanReason,
        status: 'REJECTED',
      },
      idempotencyKey: `BOOKING_REJECTED:${current.id}`,
    });

    db.exec('COMMIT');
    return getBookingById(id)!;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export function cancelBooking(
  id: string,
  options?: { cancelledBy?: string; cancellationReason?: string; adminNotes?: string }
): Booking {
  const db = getDb();
  const nowIso = new Date().toISOString();
  const actor = options?.cancelledBy || 'admin';
  const cleanReason =
    options?.cancellationReason?.trim() ||
    options?.adminNotes?.trim() ||
    'Theo yêu cầu thay đổi lịch hoặc điều chỉnh vận hành từ phòng trà.';

  db.exec('BEGIN IMMEDIATE');
  try {
    const row = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!row) {
      throw new BookingDomainError('Không tìm thấy đơn đặt lịch.', 'NOT_FOUND', 404);
    }

    const current = mapBookingRow(row);
    if (current.status !== 'confirmed' && current.status !== 'pending') {
      throw new BookingDomainError(
        `Không thể hủy đơn đang ở trạng thái ${current.statusCode}.`,
        'INVALID_BOOKING_STATE',
        409
      );
    }

    const updateRes = db
      .prepare(`
        UPDATE bookings
        SET status = 'cancelled',
            cancelled_at = ?,
            cancellation_reason = ?,
            admin_notes = COALESCE(?, admin_notes),
            updated_at = ?
        WHERE id = ? AND status IN ('confirmed', 'pending')
      `)
      .run(nowIso, cleanReason, options?.adminNotes?.trim() || cleanReason, nowIso, id);

    if (updateRes.changes !== 1) {
      throw new BookingDomainError('Không thể hủy đơn do trạng thái vừa thay đổi.', 'INVALID_BOOKING_STATE', 409);
    }

    insertAuditLogTx(db, {
      bookingId: id,
      bookingReference: current.bookingReference,
      action: 'CANCELLED',
      fromStatus: current.status,
      toStatus: 'cancelled',
      actor,
      reason: cleanReason,
    });

    const msg = buildNotificationMessage(
      {
        id: current.id,
        bookingReference: current.bookingReference,
        roomName: current.roomName || 'Phòng Trà',
        customerName: current.customerName,
        customerPhone: current.customerPhone,
        date: current.date,
        startTime: current.startTime,
        endTime: current.endTime,
        guestCount: current.guestCount,
        cancellationReason: cleanReason,
      },
      'BOOKING_CANCELLED'
    );

    enqueueNotificationTx(db, {
      bookingId: current.id,
      bookingReference: current.bookingReference,
      recipientType: 'CUSTOMER',
      recipientAddress: current.customerEmail || current.customerPhone,
      channel: 'EMAIL',
      notificationType: 'BOOKING_CANCELLED',
      title: msg.title,
      content: msg.content,
      payload: {
        bookingCode: current.bookingReference,
        customerName: current.customerName,
        customerPhone: current.customerPhone,
        bookingDate: current.date,
        startTime: current.startTime,
        endTime: current.endTime,
        cancellationReason: cleanReason,
        status: 'CANCELLED',
      },
      idempotencyKey: `BOOKING_CANCELLED:${current.id}`,
    });

    db.exec('COMMIT');
    return getBookingById(id)!;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

// Backward-compatible status updater that routes through domain workflows
export function updateBookingStatus(
  id: string,
  status: BookingStatus,
  adminNotes?: string,
  actor: string = 'admin'
): Booking {
  const normalized = status.toLowerCase() as BookingStatus;
  if (normalized === 'confirmed') {
    return approveBooking(id, { reviewedBy: actor, adminNotes });
  }
  if (normalized === 'rejected') {
    return rejectBooking(id, { reviewedBy: actor, rejectionReason: adminNotes, adminNotes });
  }
  if (normalized === 'cancelled') {
    return cancelBooking(id, { cancelledBy: actor, cancellationReason: adminNotes, adminNotes });
  }

  const db = getDb();
  const current = getBookingById(id);
  if (!current) throw new BookingDomainError('Không tìm thấy thông tin đặt phòng', 'NOT_FOUND', 404);

  const nowIso = new Date().toISOString();
  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare(`
      UPDATE bookings 
      SET status = ?, admin_notes = COALESCE(?, admin_notes), updated_at = ?
      WHERE id = ?
    `).run(normalized, adminNotes || null, nowIso, id);

    insertAuditLogTx(db, {
      bookingId: id,
      bookingReference: current.bookingReference,
      action: normalized === 'completed' ? 'COMPLETED' : 'UPDATED',
      fromStatus: current.status,
      toStatus: normalized,
      actor,
      reason: adminNotes || `Chuyển trạng thái sang ${normalized}`,
    });

    db.exec('COMMIT');
    return getBookingById(id)!;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

// ============================================================================
// BOOKINGS QUERY, AUDIT LOGS & NOTIFICATION LOGS
// ============================================================================

export function getBookingById(id: string): Booking | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
  return row ? mapBookingRow(row as unknown as Record<string, unknown>) : null;
}

export function getBookingByReference(reference: string): Booking | null {
  const db = getDb();
  expireOverdueBookings();
  const row = db
    .prepare('SELECT * FROM bookings WHERE booking_reference = ?')
    .get(reference.toUpperCase().trim());
  return row ? mapBookingRow(row as unknown as Record<string, unknown>) : null;
}

export function getBookingAuditLogs(bookingId: string): BookingAuditLog[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM booking_audit_logs WHERE booking_id = ? ORDER BY created_at DESC')
    .all(bookingId) as unknown as Record<string, unknown>[];
  return rows.map(mapAuditRow);
}

export function getNotificationsForBooking(bookingId: string): NotificationLog[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM notification_logs WHERE booking_id = ? ORDER BY created_at DESC')
    .all(bookingId) as unknown as Record<string, unknown>[];
  return rows.map(mapNotificationRow);
}

export function getAllNotifications(limit: number = 100, statusFilter?: string): NotificationLog[] {
  const db = getDb();
  let query = 'SELECT * FROM notification_logs WHERE 1=1';
  const params: (string | number)[] = [];
  if (statusFilter && statusFilter !== 'all') {
    query += ' AND status = ?';
    params.push(statusFilter.toUpperCase());
  }
  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);

  const rows = db.prepare(query).all(...params) as unknown as Record<string, unknown>[];
  return rows.map(mapNotificationRow);
}

export function searchBookings(options: {
  date?: string;
  status?: string;
  roomId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Booking[] {
  const db = getDb();
  expireOverdueBookings();

  let query = 'SELECT * FROM bookings WHERE 1=1';
  const params: (string | number)[] = [];

  if (options.date) {
    query += ' AND date = ?';
    params.push(options.date);
  }

  if (options.roomId && options.roomId !== 'all') {
    query += ' AND room_id = ?';
    params.push(options.roomId);
  }

  if (options.status && options.status !== 'all') {
    query += ' AND status = ?';
    params.push(options.status.toLowerCase());
  }

  if (options.search) {
    query += ' AND (booking_reference LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)';
    const searchWild = `%${options.search.trim()}%`;
    params.push(searchWild, searchWild, searchWild);
  }

  query += ' ORDER BY CASE WHEN status = \'pending\' THEN 0 ELSE 1 END, date DESC, start_time ASC, created_at DESC';

  if (options.limit) {
    query += ' LIMIT ? OFFSET ?';
    params.push(options.limit, options.offset || 0);
  }

  const rows = db.prepare(query).all(...params) as unknown as Record<string, unknown>[];
  return rows.map(mapBookingRow);
}

export function getDashboardStats(targetDate?: string) {
  const db = getDb();
  expireOverdueBookings();

  const today = targetDate || getLocalTodayStr();
  const rooms = getAllRooms();

  const todayBookings = (
    db
      .prepare("SELECT COUNT(*) as count FROM bookings WHERE date = ? AND status IN ('pending', 'confirmed')")
      .get(today) as { count: number }
  ).count;

  const todayConfirmedBookings = (
    db
      .prepare("SELECT COUNT(*) as count FROM bookings WHERE date = ? AND status = 'confirmed'")
      .get(today) as { count: number }
  ).count;

  const pendingBookings = (
    db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'pending'").get() as { count: number }
  ).count;

  const rejectedBookings = (
    db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'rejected'").get() as { count: number }
  ).count;

  const expiredBookings = (
    db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'expired'").get() as { count: number }
  ).count;

  const cancelledBookings = (
    db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'cancelled'").get() as { count: number }
  ).count;

  const totalRevenue =
    (
      db
        .prepare("SELECT SUM(total_price) as sum FROM bookings WHERE status IN ('confirmed', 'completed')")
        .get() as { sum: number | null }
    ).sum || 0;

  const totalBookings = (db.prepare('SELECT COUNT(*) as count FROM bookings').get() as { count: number }).count;

  // Count available slots across active rooms for targetDate
  let todayAvailableSlots = 0;
  for (const r of rooms) {
    const slots = getAvailableSlots(r.id, today);
    todayAvailableSlots += slots.filter((s) => s.status === 'AVAILABLE').length;
  }

  // Notification health stats
  const notifSent = (
    db.prepare("SELECT COUNT(*) as count FROM notification_logs WHERE status = 'SENT'").get() as { count: number }
  ).count;
  const notifPending = (
    db.prepare("SELECT COUNT(*) as count FROM notification_logs WHERE status = 'PENDING'").get() as { count: number }
  ).count;
  const notifFailed = (
    db.prepare("SELECT COUNT(*) as count FROM notification_logs WHERE status = 'FAILED'").get() as { count: number }
  ).count;

  return {
    date: today,
    todayBookings,
    todayConfirmedBookings,
    confirmedTodayBookings: todayConfirmedBookings,
    todayAvailableSlots,
    availableSlotsToday: todayAvailableSlots,
    pendingBookings,
    rejectedBookings,
    expiredBookings,
    cancelledBookings,
    totalRevenue,
    totalBookings,
    notificationStats: {
      sent: notifSent,
      pending: notifPending,
      failed: notifFailed,
    },
  };
}

export function resetDemoData() {
  const db = getDb();
  db.exec(`
    DELETE FROM notification_logs;
    DELETE FROM booking_audit_logs;
    DELETE FROM slot_blocks;
    DELETE FROM bookings;
    DELETE FROM rooms;
    DELETE FROM tea_packages;
    DELETE FROM system_settings;
  `);
  initSchema(db);
  return { success: true, message: 'Đã khôi phục dữ liệu mẫu thành công.' };
}
