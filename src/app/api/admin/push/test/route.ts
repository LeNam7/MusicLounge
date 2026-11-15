import { NextRequest, NextResponse } from 'next/server';
import { unauthorizedAdminResponse, verifyAdminRequest } from '@/lib/auth';
import { sendAdminWebPush, sendDirectTestWebPush } from '@/lib/push';

export async function POST(request: NextRequest) {
  const auth = verifyAdminRequest(request);
  if (!auth.authorized) {
    return unauthorizedAdminResponse(auth.error);
  }

  try {
    const body = await request.json().catch(() => ({}));

    // If subscription object is directly provided, test it directly
    if (body.subscription?.endpoint && body.subscription?.keys) {
      const res = await sendDirectTestWebPush({
        endpoint: body.subscription.endpoint,
        p256dh: body.subscription.keys.p256dh,
        auth: body.subscription.keys.auth,
      });

      if (!res.success) {
        return NextResponse.json(
          {
            success: false,
            error: res.error || 'Không thể gửi thông báo thử nghiệm tới thiết bị này.',
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: '🔔 Đã phát chuông thử nghiệm thành công tới iPhone của bạn!',
        sent: 1,
      });
    }

    // Otherwise, broadcast test push to all subscribed admin devices
    const result = await sendAdminWebPush({
      title: '🔔 Chuông Thử Nghiệm — Lùng Vài Tea',
      body: 'iPhone của bạn đã kết nối thành công! Hệ thống sẽ đổ chuông này mỗi khi có khách đặt bàn (kể cả khi bạn khóa màn hình).',
      url: '/admin',
      tag: 'admin-test-ping',
    });

    if (result.total === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Chưa có thiết bị nào kích hoạt chuông báo. Hãy bấm "Bật chuông thông báo" trên điện thoại trước.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `🔔 Đã phát chuông thử nghiệm tới ${result.sent} thiết bị quản trị!`,
      data: result,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: (err as { message?: string })?.message || 'Lỗi gửi chuông thử nghiệm.',
      },
      { status: 500 }
    );
  }
}
