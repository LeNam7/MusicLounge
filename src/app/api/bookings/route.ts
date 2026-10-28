import { NextRequest, NextResponse } from 'next/server';
import { BookingDomainError, createBooking } from '@/lib/db';
import { processNotificationsForBooking } from '@/lib/notifications';
import { checkRateLimit } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'local';

    const rateCheck = checkRateLimit(`booking:${ip}`, 30, 60_000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          code: 'RATE_LIMITED',
          error: `Quý khách thao tác quá nhanh. Vui lòng thử lại sau ${rateCheck.retryAfterSeconds} giây.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      roomId,
      customerName,
      customerPhone,
      customerEmail,
      date,
      startTime,
      durationHours,
      guestCount,
      teaPackageId,
      specialRequests,
      idempotencyKey,
    } = body;

    if (!roomId || !customerName || !customerPhone || !date || !startTime) {
      return NextResponse.json(
        {
          success: false,
          code: 'VALIDATION_ERROR',
          error: 'Vui lòng điền đầy đủ các thông tin bắt buộc (phòng, họ tên, số điện thoại, ngày đặt, khung giờ).',
        },
        { status: 400 }
      );
    }

    const booking = createBooking({
      roomId,
      customerName: String(customerName).trim(),
      customerPhone: String(customerPhone).trim(),
      customerEmail: customerEmail ? String(customerEmail).trim() : undefined,
      date: String(date).trim(),
      startTime: String(startTime).trim(),
      durationHours: Number(durationHours) || 2,
      guestCount: Number(guestCount) || 2,
      teaPackageId: teaPackageId || undefined,
      specialRequests: specialRequests ? String(specialRequests).trim() : undefined,
      idempotencyKey: idempotencyKey || request.headers.get('x-idempotency-key') || undefined,
    });

    // Trigger notification outbox processor asynchronously outside the DB transaction
    void processNotificationsForBooking(booking.id).catch((err) => {
      console.error('[NotificationOutbox] Async delivery error:', err);
    });

    return NextResponse.json(
      {
        success: true,
        message:
          'Yêu cầu đặt lịch của bạn đã được tiếp nhận. Vui lòng chờ phòng trà xác nhận. Lịch chỉ được xác nhận sau khi quản trị viên duyệt thành công.',
        data: booking,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof BookingDomainError) {
      return NextResponse.json(
        {
          success: false,
          code: error.code,
          error: error.message,
        },
        { status: error.httpStatus }
      );
    }

    const msg = (error as { message?: string })?.message || 'Lỗi xử lý đặt phòng';
    const isConflict = msg.includes('vừa được khách khác giữ chỗ') || msg.includes('đã có khách đặt');
    return NextResponse.json(
      {
        success: false,
        code: isConflict ? 'SLOT_UNAVAILABLE' : 'VALIDATION_ERROR',
        error: msg,
      },
      { status: isConflict ? 409 : 400 }
    );
  }
}
