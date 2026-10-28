import { NextRequest, NextResponse } from 'next/server';
import { getBookingByReference } from '@/lib/db';

function maskPhone(phone: string): string {
  const clean = phone.replace(/\s+/g, '');
  if (clean.length <= 6) return '***';
  return `${clean.slice(0, 3)}***${clean.slice(-4)}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const phone = request.nextUrl.searchParams.get('phone');

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          code: 'VALIDATION_ERROR',
          error: 'Thiếu mã đặt lịch.',
        },
        { status: 400 }
      );
    }

    const booking = getBookingByReference(code);
    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          code: 'NOT_FOUND',
          error: 'Không tìm thấy đơn đặt lịch.',
        },
        { status: 404 }
      );
    }

    let phoneVerified = false;
    if (phone && phone.trim()) {
      const cleanInput = phone.replace(/[^0-9]/g, '');
      const cleanDb = booking.customerPhone.replace(/[^0-9]/g, '');
      if (cleanDb.endsWith(cleanInput) || cleanInput.endsWith(cleanDb)) {
        phoneVerified = true;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        bookingCode: booking.bookingReference,
        roomId: booking.roomId,
        roomName: booking.roomName,
        bookingDate: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        durationHours: booking.durationHours,
        guestCount: booking.guestCount,
        status: booking.status,
        statusCode: booking.statusCode,
        customerName: phoneVerified ? booking.customerName : `${booking.customerName.slice(0, 1)}***`,
        customerPhone: phoneVerified ? booking.customerPhone : maskPhone(booking.customerPhone),
        rejectionReason: booking.rejectionReason,
        cancellationReason: booking.cancellationReason,
        expiresAt: booking.expiresAt,
        reviewedAt: booking.reviewedAt,
        updatedAt: booking.updatedAt,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        code: 'DATABASE_ERROR',
        error: (error as { message?: string })?.message || 'Lỗi tra cứu trạng thái booking',
      },
      { status: 500 }
    );
  }
}
