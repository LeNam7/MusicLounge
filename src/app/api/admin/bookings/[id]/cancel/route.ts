import { NextRequest, NextResponse } from 'next/server';
import { BookingDomainError, cancelBooking, getBookingAuditLogs } from '@/lib/db';
import { processNotificationsForBooking } from '@/lib/notifications';
import { unauthorizedAdminResponse, verifyAdminRequest } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = verifyAdminRequest(request, { allowQueryPasscode: false });
    if (!auth.authorized) {
      return unauthorizedAdminResponse(auth.error);
    }

    const { id } = await params;
    let body: { cancellationReason?: string; reason?: string; adminNotes?: string; cancelledBy?: string } = {};
    try {
      body = await request.json();
    } catch {
      // Optional JSON body
    }

    const updated = cancelBooking(id, {
      cancelledBy: body.cancelledBy || auth.actor,
      cancellationReason: body.cancellationReason || body.reason,
      adminNotes: body.adminNotes,
    });

    // Deliver customer notification outside DB transaction
    const notifications = await processNotificationsForBooking(updated.id);
    const auditLogs = getBookingAuditLogs(updated.id);

    return NextResponse.json({
      success: true,
      message: `Đã hủy lịch đặt phòng ${updated.bookingReference} và giải phóng khung giờ.`,
      data: {
        ...updated,
        notifications,
        auditLogs,
      },
    });
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
    return NextResponse.json(
      {
        success: false,
        code: 'DATABASE_ERROR',
        error: (error as { message?: string })?.message || 'Lỗi khi hủy lịch đặt phòng.',
      },
      { status: 500 }
    );
  }
}
