import { NextRequest, NextResponse } from 'next/server';
import { approveBooking, BookingDomainError, getBookingAuditLogs, getNotificationsForBooking } from '@/lib/db';
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
    let body: { adminNotes?: string; reviewedBy?: string } = {};
    try {
      body = await request.json();
    } catch {
      // Optional JSON body
    }

    const updated = approveBooking(id, {
      reviewedBy: body.reviewedBy || auth.actor,
      adminNotes: body.adminNotes,
    });

    // Deliver customer notification outside DB transaction
    const notifications = await processNotificationsForBooking(updated.id);
    const auditLogs = getBookingAuditLogs(updated.id);

    return NextResponse.json({
      success: true,
      message: `Đã duyệt xác nhận lịch đặt phòng ${updated.bookingReference} thành công.`,
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
        error: (error as { message?: string })?.message || 'Lỗi khi duyệt yêu cầu đặt lịch.',
      },
      { status: 500 }
    );
  }
}
