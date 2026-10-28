import { getDb, getBookingById, mapNotificationRow } from '../src/lib/db';
import { deliverNotificationById } from '../src/lib/notifications';

const db = getDb();
const bookingRow = db
  .prepare("SELECT id FROM bookings WHERE customer_email = 'lenam287202@gmail.com' ORDER BY created_at DESC LIMIT 1")
  .get() as { id: string } | undefined;

if (!bookingRow) {
  console.log('No booking found');
  process.exit(1);
}

const booking = getBookingById(bookingRow.id);
console.log('LATEST BOOKING:', {
  id: booking?.id,
  code: booking?.bookingReference,
  customerName: booking?.customerName,
  customerEmail: booking?.customerEmail,
  roomName: booking?.roomName,
  date: booking?.date,
  startTime: booking?.startTime,
  status: booking?.status,
});

const notifs = db
  .prepare('SELECT * FROM notification_logs WHERE booking_id = ?')
  .all(bookingRow.id) as Record<string, unknown>[];

console.log('NOTIFICATIONS COUNT:', notifs.length);
for (const n of notifs) {
  const notif = mapNotificationRow(n);
  console.log('NOTIF:', {
    id: notif.id,
    type: notif.notificationType,
    recipient: notif.recipientAddress,
    status: notif.status,
    response: notif.providerResponse,
    error: notif.lastError,
  });
}
