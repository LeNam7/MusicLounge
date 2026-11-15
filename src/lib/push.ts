import { setVapidDetails, sendNotification } from 'web-push';
import { getAllPushSubscriptions, deletePushSubscription } from './db';
import { PushSubscriptionRecord } from './types';

const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BCxnwDq1dImMnFHUhpJhdvKH1vhkzKdV8cSu8zE8zeceBufZI0KBKvUStjIYORiHQXlkDArgIZ2i5cELWr-KFVI';

const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY || '2Mpm-iZqM2WTJYOPUanLePxRHiUCaTXAFTrdhwhy6ec';

const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:lenam287202@gmail.com';

// Configure Web Push with VAPID credentials
try {
  setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} catch (err) {
  console.error('[WebPush] Error configuring VAPID details:', err);
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  timestamp?: number;
}

/**
 * Dispatches Web Push Notification to all subscribed admin devices (iPhone PWA, Android, Desktop).
 */
export async function sendAdminWebPush(
  payload: PushPayload
): Promise<{ sent: number; failed: number; total: number }> {
  const subscriptions = getAllPushSubscriptions();
  if (!subscriptions || subscriptions.length === 0) {
    return { sent: 0, failed: 0, total: 0 };
  }

  const notificationPayload = JSON.stringify({
    title: payload.title || 'Lùng Vài Tea — Quản Trị',
    body: payload.body,
    url: payload.url || '/admin',
    tag: payload.tag || `booking-${Date.now()}`,
    timestamp: payload.timestamp || Date.now(),
  });

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await sendNotification(pushSubscription, notificationPayload, {
          TTL: 60 * 60 * 24, // 24 hours
          urgency: 'high',
        });
        return { success: true, endpoint: sub.endpoint };
      } catch (err: unknown) {
        const error = err as { statusCode?: number; message?: string };
        // If subscription is expired or unsubscribed on device (404 Not Found or 410 Gone), remove it
        if (error.statusCode === 404 || error.statusCode === 410) {
          deletePushSubscription(sub.endpoint);
        }
        throw err;
      }
    })
  );

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  return { sent, failed, total: subscriptions.length };
}

/**
 * Sends a single test notification to a specific subscription endpoint.
 */
export async function sendDirectTestWebPush(
  sub: { endpoint: string; p256dh: string; auth: string }
): Promise<{ success: boolean; error?: string }> {
  const notificationPayload = JSON.stringify({
    title: '🔔 Chuông Thử Nghiệm — Lùng Vài Tea',
    body: 'Chúc mừng! iPhone của bạn đã kết nối thành công. Bạn sẽ nhận được chuông báo này mỗi khi có khách đặt bàn ngay cả khi khóa màn hình.',
    url: '/admin',
    tag: 'test-ping',
    timestamp: Date.now(),
  });

  try {
    await sendNotification(
      {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      },
      notificationPayload,
      {
        TTL: 60,
        urgency: 'high',
      }
    );
    return { success: true };
  } catch (err: unknown) {
    const error = err as { statusCode?: number; message?: string };
    return { success: false, error: error.message || 'Lỗi gửi Web Push thử nghiệm' };
  }
}
