import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_COOKIE_NAME,
  checkRateLimit,
  createAdminSessionToken,
  getAdminPasscode,
  verifyAdminRequest,
} from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = verifyAdminRequest(request, { allowQueryPasscode: false });
  if (!auth.authorized) {
    // Khách mở /admin lần đầu (chưa có cookie phiên): đây là trạng thái bình thường,
    // trả 200 để trình duyệt không ghi lỗi đỏ trong console. Cookie sai/hết hạn vẫn trả 401.
    const hasSessionCookie = Boolean(request.cookies.get(ADMIN_COOKIE_NAME)?.value);
    const hasPasscodeHeader = Boolean(request.headers.get('x-admin-passcode'));
    if (!hasSessionCookie && !hasPasscodeHeader) {
      return NextResponse.json({ success: true, authenticated: false });
    }
    return NextResponse.json({ success: false, authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    success: true,
    authenticated: true,
    actor: auth.actor,
  });
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'local';

    const body = await request.json();
    const passcode = String(body?.passcode || '').trim();
    const actor = String(body?.actor || 'admin').trim() || 'admin';

    // If correct passcode, grant session immediately
    if (passcode && passcode === getAdminPasscode()) {
      const token = createAdminSessionToken(actor, 24);
      const response = NextResponse.json({
        success: true,
        authenticated: true,
        actor,
        message: 'Đăng nhập quản trị thành công.',
      });

      response.cookies.set(ADMIN_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 3600,
      });

      return response;
    }

    // Rate check on invalid passcode attempts
    const rateCheck = checkRateLimit(`admin-login:${ip}`, 12, 300_000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          code: 'RATE_LIMITED',
          error: `Quá nhiều lần đăng nhập sai. Vui lòng thử lại sau ${rateCheck.retryAfterSeconds} giây.`,
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        code: 'UNAUTHORIZED',
        error: 'Mã PIN quản trị không chính xác.',
      },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        code: 'VALIDATION_ERROR',
        error: 'Yêu cầu đăng nhập không hợp lệ.',
      },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: 'Đã đăng xuất khỏi phiên quản trị.',
  });
  response.cookies.delete(ADMIN_COOKIE_NAME);
  return response;
}
