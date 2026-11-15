import { NextRequest, NextResponse } from 'next/server';
import { unauthorizedAdminResponse, verifyAdminRequest } from '@/lib/auth';
import { deletePushSubscription, getPushSubscriptionCount, savePushSubscription } from '@/lib/db';

export async function GET(request: NextRequest) {
  const auth = verifyAdminRequest(request);
  if (!auth.authorized) {
    return unauthorizedAdminResponse(auth.error);
  }

  const count = getPushSubscriptionCount();
  return NextResponse.json({
    success: true,
    subscribedDevicesCount: count,
  });
}

export async function POST(request: NextRequest) {
  const auth = verifyAdminRequest(request);
  if (!auth.authorized) {
    return unauthorizedAdminResponse(auth.error);
  }

  try {
    const body = await request.json();
    const subscription = body.subscription;

    if (!subscription || !subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dữ liệu đăng ký Push Notification không hợp lệ.',
        },
        { status: 400 }
      );
    }

    const userAgent = request.headers.get('user-agent') || undefined;

    const saved = savePushSubscription({
      endpoint: String(subscription.endpoint),
      p256dh: String(subscription.keys.p256dh),
      auth: String(subscription.keys.auth),
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: 'Đã kích hoạt chuông báo trên thiết bị này thành công!',
      data: saved,
      subscribedDevicesCount: getPushSubscriptionCount(),
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: (err as { message?: string })?.message || 'Lỗi khi lưu đăng ký thông báo đẩy.',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = verifyAdminRequest(request);
  if (!auth.authorized) {
    return unauthorizedAdminResponse(auth.error);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const endpoint = body.endpoint || request.nextUrl.searchParams.get('endpoint');

    if (!endpoint) {
      return NextResponse.json(
        { success: false, error: 'Thiếu endpoint cần hủy đăng ký.' },
        { status: 400 }
      );
    }

    deletePushSubscription(String(endpoint));

    return NextResponse.json({
      success: true,
      message: 'Đã hủy nhận chuông báo trên thiết bị này.',
      subscribedDevicesCount: getPushSubscriptionCount(),
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: (err as { message?: string })?.message || 'Lỗi hủy đăng ký thông báo.',
      },
      { status: 500 }
    );
  }
}
