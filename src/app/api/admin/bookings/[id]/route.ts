import { NextRequest, NextResponse } from 'next/server';
import {
  BookingDomainError,
  getBookingAuditLogs,
  getBookingById,
  getNotificationsForBooking,
  updateBookingStatus,
} from '@/lib/db';
import { processNotificationsForBooking } from '@/lib/notifications';
import { unauthorizedAdminResponse, verifyAdminRequest } from '@/lib/auth';
import { BookingStatus } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = verifyAdminRequest(request);
    if (!auth.authorized) {
      return unauthorizedAdminResponse(auth.error);
    }

    const { id } = await params;
    const booking = getBookingById(id);
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

    const auditLogs = getBookingAuditLogs(id);
    const notifications = getNotificationsForBooking(id);

    return NextResponse.json({
      success: true,
      data: {
        ...booking,
        booking,
        auditLogs,
        notifications,
        notificationLogs: notifications,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        code: 'DATABASE_ERROR',
        error: (error as { message?: string })?.message || 'Lỗi truy vấn chi tiết booking',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = verifyAdminRequest(request, { allowQueryPasscode: false });
    if (!auth.authorized) {
      return unauthorizedAdminResponse(auth.error);
    }

    const { id } = await params;
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          code: 'VALIDATION_ERROR',
          error: 'Dữ liệu JSON không hợp lệ',
        },
        { status: 400 }
      );
    }
    const statusRaw = String(body?.status || '').toLowerCase() as BookingStatus;
    const adminNotes = body?.adminNotes ? String(body.adminNotes).trim() : undefined;

    const validStatuses: BookingStatus[] = [
      'pending',
      'confirmed',
      'rejected',
      'expired',
      'cancelled',
      'completed',
    ];
    if (!statusRaw || !validStatuses.includes(statusRaw)) {
      return NextResponse.json(
        {
          success: false,
          code: 'VALIDATION_ERROR',
          error: 'Trạng thái không hợp lệ.',
        },
        { status: 400 }
      );
    }

    const updated = updateBookingStatus(id, statusRaw, adminNotes, auth.actor);

    // Trigger notification delivery outside transaction
    void processNotificationsForBooking(updated.id).catch((err) => {
      console.error('[NotificationOutbox] Async delivery error:', err);
    });

    return NextResponse.json({
      success: true,
      message: 'Cập nhật trạng thái thành công',
      data: updated,
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
        error: (error as { message?: string })?.message || 'Lỗi cập nhật đặt phòng',
      },
      { status: 500 }
    );
  }
}
