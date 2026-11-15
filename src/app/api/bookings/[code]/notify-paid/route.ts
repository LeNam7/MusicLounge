import { NextRequest, NextResponse } from 'next/server';
import { notifyBookingPayment } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    if (!code) {
      return NextResponse.json(
        {
          success: false,
          code: 'VALIDATION_ERROR',
          error: 'Thiếu mã đơn đặt lịch.',
        },
        { status: 400 }
      );
    }

    let phone: string | undefined;
    try {
      const body = await request.json();
      phone = body?.phone;
    } catch {
      // Body is optional
    }

    const updated = notifyBookingPayment(code, phone);

    return NextResponse.json({
      success: true,
      message: 'Đã ghi nhận thông báo chuyển khoản.',
      data: updated,
    });
  } catch (error: unknown) {
    const err = error as { message?: string; statusCode?: number; code?: string };
    return NextResponse.json(
      {
        success: false,
        code: err.code || 'OPERATION_FAILED',
        error: err.message || 'Không thể cập nhật trạng thái thanh toán.',
      },
      { status: err.statusCode || 500 }
    );
  }
}
