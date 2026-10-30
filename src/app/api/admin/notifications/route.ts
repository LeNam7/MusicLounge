import { NextRequest, NextResponse } from 'next/server';
import { expireOverdueBookings, getAllNotifications } from '@/lib/db';
import { deliverNotificationById, getZaloIntegrationStatus, processOutboxQueue } from '@/lib/notifications';
import { unauthorizedAdminResponse, verifyAdminRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = verifyAdminRequest(request);
    if (!auth.authorized) {
      return unauthorizedAdminResponse(auth.error);
    }

    const status = request.nextUrl.searchParams.get('status') || undefined;
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100', 10);

    const notifications = getAllNotifications(limit, status);
    const zaloStatus = getZaloIntegrationStatus();

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        zaloStatus,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        code: 'DATABASE_ERROR',
        error: (error as { message?: string })?.message || 'Lỗi tải nhật ký thông báo',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = verifyAdminRequest(request, { allowQueryPasscode: false });
    if (!auth.authorized) {
      return unauthorizedAdminResponse(auth.error);
    }

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
    const action = body?.action || 'retry_one';

    if (action === 'run_worker') {
      const expired = expireOverdueBookings();
      const queueResult = await processOutboxQueue(30);
      return NextResponse.json({
        success: true,
        message: `Đã quét hết hạn (${expired.length} đơn) và xử lý hàng đợi thông báo (${queueResult.sent} thành công, ${queueResult.failed} lỗi).`,
        data: {
          expiredCount: expired.length,
          ...queueResult,
        },
      });
    }

    const notificationId = body?.notificationId;
    if (!notificationId) {
      return NextResponse.json(
        {
          success: false,
          code: 'VALIDATION_ERROR',
          error: 'Thiếu mã thông báo cần gửi lại (notificationId).',
        },
        { status: 400 }
      );
    }

    const updated = await deliverNotificationById(notificationId, true);
    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          code: 'NOT_FOUND',
          error: 'Không tìm thấy bản ghi thông báo.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: updated.status === 'SENT',
      code: updated.status === 'SENT' ? undefined : 'NOTIFICATION_ERROR',
      message:
        updated.status === 'SENT'
          ? 'Đã gửi lại thông báo thành công!'
          : `Gửi thông báo chưa thành công: ${updated.lastError}`,
      data: updated,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        code: 'NOTIFICATION_ERROR',
        error: (error as { message?: string })?.message || 'Lỗi gửi lại thông báo',
      },
      { status: 500 }
    );
  }
}
