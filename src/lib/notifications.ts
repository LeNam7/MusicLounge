import { getDb, mapNotificationRow, getBookingById } from './db';
import { NotificationLog } from './types';
import {
  sendAdminBookingEmail,
  sendCustomerBookingConfirmationEmail,
  sendCustomerBookingRejectionEmail,
  sendCustomerBookingCancellationEmail,
} from './email';

export interface NotificationDeliveryResult {
  success: boolean;
  providerResponse?: string;
  error?: string;
}

export type NotificationTransportFn = (notification: NotificationLog) => Promise<NotificationDeliveryResult>;

let customTestTransport: NotificationTransportFn | null = null;

/**
 * Used in automated test suites to simulate responses (success, errors, retry).
 */
export function setNotificationTransportForTesting(fn: NotificationTransportFn | null) {
  customTestTransport = fn;
}

export function getEmailIntegrationStatus() {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'lenam287202@gmail.com';
  const hasSmtpUser = Boolean(process.env.SMTP_USER);
  const hasSmtpPass = Boolean(process.env.SMTP_PASS);
  const isRealSmtp = hasSmtpUser && hasSmtpPass;

  return {
    adminConfigured: true,
    customerConfigured: true,
    adminEmail,
    isRealSmtp,
    channel: 'EMAIL',
    service: isRealSmtp ? 'Gmail SMTP' : 'Ethereal Test Preview',
    zaloOaConfigured: false,
    zaloWebhookConfigured: false,
    customerWebhookConfigured: false,
    znsConfigured: false,
    mode: 'EMAIL_SMTP_DISPATCH',
    status: 'READY',
  };
}

export function getZaloIntegrationStatus() {
  return getEmailIntegrationStatus();
}

/**
 * Real email transport dispatcher for Admin and Customer notifications.
 */
async function defaultRealTransport(notification: NotificationLog): Promise<NotificationDeliveryResult> {
  const booking = getBookingById(notification.bookingId);
  if (!booking) {
    return {
      success: false,
      error: `Không tìm thấy thông tin đơn đặt phòng ID: ${notification.bookingId}`,
    };
  }

  try {
    // 1. ADMIN NOTIFICATION (e.g. BOOKING_REQUESTED)
    if (notification.recipientType === 'ADMIN') {
      // User requirement: Admin manages and approves bookings directly on the Web App,
      // NOT sending customer information to an admin email for review.
      if (process.env.SEND_ADMIN_EMAIL_ON_BOOKING !== 'true') {
        return {
          success: true,
          providerResponse:
            'Đơn đặt lịch đã ghi nhận trên Bảng điều khiển Quản trị Web App (sẵn sàng chờ duyệt).',
        };
      }

      const adminEmail =
        notification.recipientAddress && notification.recipientAddress.includes('@')
          ? notification.recipientAddress
          : process.env.ADMIN_NOTIFICATION_EMAIL || 'lenam287202@gmail.com';

      const emailResult = await sendAdminBookingEmail(booking, adminEmail);
      if (emailResult.success) {
        return {
          success: true,
          providerResponse: emailResult.previewUrl
            ? `Đã gửi Email tới Quản trị viên ${adminEmail} (Xem trước: ${emailResult.previewUrl})`
            : `Đã gửi Email thành công tới Quản trị viên ${adminEmail} (MessageId: ${emailResult.messageId})`,
        };
      }
      return {
        success: false,
        error: emailResult.error || 'Lỗi gửi email cho Quản trị viên',
      };
    }

    // 2. CUSTOMER NOTIFICATIONS (BOOKING_CONFIRMED, BOOKING_REJECTED, BOOKING_CANCELLED, BOOKING_EXPIRED)
    const customerEmail =
      booking.customerEmail ||
      (notification.recipientAddress && notification.recipientAddress.includes('@')
        ? notification.recipientAddress
        : undefined);

    if (customerEmail) {
      let emailResult;
      if (notification.notificationType === 'BOOKING_CONFIRMED') {
        emailResult = await sendCustomerBookingConfirmationEmail(booking, customerEmail);
      } else if (notification.notificationType === 'BOOKING_REJECTED') {
        const payload = notification.payloadJson ? JSON.parse(notification.payloadJson) : {};
        emailResult = await sendCustomerBookingRejectionEmail(
          booking,
          payload.rejectionReason || booking.rejectionReason,
          customerEmail
        );
      } else if (notification.notificationType === 'BOOKING_CANCELLED') {
        const payload = notification.payloadJson ? JSON.parse(notification.payloadJson) : {};
        emailResult = await sendCustomerBookingCancellationEmail(
          booking,
          payload.cancellationReason || booking.cancellationReason,
          customerEmail
        );
      } else {
        emailResult = await sendCustomerBookingConfirmationEmail(booking, customerEmail);
      }

      if (emailResult.success) {
        return {
          success: true,
          providerResponse: emailResult.previewUrl
            ? `Đã gửi Email cho Khách hàng ${customerEmail} (Xem trước: ${emailResult.previewUrl})`
            : `Đã gửi Email thành công cho Khách hàng ${customerEmail} (MessageId: ${emailResult.messageId})`,
        };
      }
      return {
        success: false,
        error: emailResult.error || 'Lỗi gửi email cho Khách hàng',
      };
    } else {
      // If customer did not provide an email, we record it and notify admin
      return {
        success: true,
        providerResponse: `Khách hàng để lại SĐT (${booking.customerPhone}), chưa nhập Email. Hệ thống ghi nhận để Quản trị viên liên hệ trực tiếp.`,
      };
    }
  } catch (err: unknown) {
    const errorObj = err as { name?: string; message?: string };
    return {
      success: false,
      error: errorObj?.message || 'Lỗi khi gửi email thông báo.',
    };
  }
}

/**
 * Delivers a single notification record safely outside any booking transaction.
 * Implements idempotency (never re-sends an already SENT record) and exponential backoff retry.
 */
export async function deliverNotificationById(
  notificationId: string,
  forceManualRetry: boolean = false
): Promise<NotificationLog | null> {
  const db = getDb();
  const row = db
    .prepare('SELECT * FROM notification_logs WHERE id = ?')
    .get(notificationId) as Record<string, unknown> | undefined;

  if (!row) return null;
  const notification = mapNotificationRow(row);

  // Never re-send an already SENT notification (prevents duplicate messages)
  if (notification.status === 'SENT') {
    return notification;
  }

  // Respect maxAttempts unless an Admin explicitly clicked manual retry
  if (!forceManualRetry && notification.attemptCount >= notification.maxAttempts) {
    return notification;
  }

  const transport = customTestTransport || defaultRealTransport;
  const result = await transport(notification);
  const nowIso = new Date().toISOString();
  const newAttemptCount = notification.attemptCount + 1;

  if (result.success) {
    db.prepare(`
      UPDATE notification_logs
      SET status = 'SENT',
          attempt_count = ?,
          sent_at = ?,
          last_error = NULL,
          provider_response = ?,
          next_retry_at = NULL,
          updated_at = ?
      WHERE id = ? AND status != 'SENT'
    `).run(newAttemptCount, nowIso, result.providerResponse || 'OK', nowIso, notification.id);
  } else {
    // Exponential backoff: 30s, 120s, 300s
    const backoffSeconds = Math.min(300, 30 * Math.pow(2, newAttemptCount - 1));
    const nextRetryIso =
      newAttemptCount < notification.maxAttempts
        ? new Date(Date.now() + backoffSeconds * 1000).toISOString()
        : null;

    db.prepare(`
      UPDATE notification_logs
      SET status = 'FAILED',
          attempt_count = ?,
          last_error = ?,
          next_retry_at = ?,
          updated_at = ?
      WHERE id = ? AND status != 'SENT'
    `).run(newAttemptCount, result.error || 'Gửi thông báo thất bại', nextRetryIso, nowIso, notification.id);
  }

  const updatedRow = db
    .prepare('SELECT * FROM notification_logs WHERE id = ?')
    .get(notificationId) as Record<string, unknown> | undefined;
  return updatedRow ? mapNotificationRow(updatedRow) : null;
}

/**
 * Processes all pending/retryable notifications for a specific booking.
 */
export async function processNotificationsForBooking(bookingId: string): Promise<NotificationLog[]> {
  const db = getDb();
  const rows = db
    .prepare(`
      SELECT id FROM notification_logs
      WHERE booking_id = ?
        AND status != 'SENT'
        AND attempt_count < max_attempts
      ORDER BY created_at ASC
    `)
    .all(bookingId) as Array<{ id: string }>;

  const results: NotificationLog[] = [];
  for (const r of rows) {
    const updated = await deliverNotificationById(r.id, false);
    if (updated) results.push(updated);
  }
  return results;
}

/**
 * Background worker batch processor for transactional outbox.
 */
export async function processOutboxQueue(limit: number = 20): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  const db = getDb();
  const nowIso = new Date().toISOString();

  const rows = db
    .prepare(`
      SELECT id FROM notification_logs
      WHERE status IN ('PENDING', 'FAILED')
        AND attempt_count < max_attempts
        AND (next_retry_at IS NULL OR datetime(next_retry_at) <= datetime(?))
      ORDER BY created_at ASC
      LIMIT ?
    `)
    .all(nowIso, limit) as Array<{ id: string }>;

  let sent = 0;
  let failed = 0;

  for (const r of rows) {
    const res = await deliverNotificationById(r.id, false);
    if (res?.status === 'SENT') sent++;
    else failed++;
  }

  return {
    processed: rows.length,
    sent,
    failed,
  };
}
