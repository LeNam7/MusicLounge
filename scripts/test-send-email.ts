import { sendAdminBookingEmail } from '../src/lib/email';
import { getDb, getBookingById } from '../src/lib/db';

async function main() {
  const db = getDb();
  const row = db.prepare('SELECT id FROM bookings ORDER BY created_at DESC LIMIT 1').get() as { id: string } | undefined;
  if (!row) {
    console.error('No booking found in DB');
    return;
  }
  const booking = getBookingById(row.id);
  if (!booking) {
    console.error('Booking not found');
    return;
  }
  console.log(`[Test Email] Preparing email for booking: ${booking.bookingReference} (Khách: ${booking.customerName})`);

  const result = await sendAdminBookingEmail(booking, 'lenam287202@gmail.com');
  console.log('[Test Email Result]:', JSON.stringify(result, null, 2));

  if (result.previewUrl) {
    console.log('\n======================================================');
    console.log('🔗 BẠN CÓ THỂ MỞ ĐƯỜNG DẪN DƯỚI ĐÂY ĐỂ XEM TRỰC TIẾP GIAO DIỆN EMAIL:');
    console.log(result.previewUrl);
    console.log('======================================================\n');
  }
}

main().catch(console.error);
