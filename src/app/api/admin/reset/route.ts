import { NextRequest, NextResponse } from 'next/server';
import { resetDemoData } from '@/lib/db';
import { unauthorizedAdminResponse, verifyAdminRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const auth = verifyAdminRequest(request, { allowQueryPasscode: false });
    if (!auth.authorized) {
      return unauthorizedAdminResponse(auth.error);
    }

    // Bảo vệ dữ liệu đặt bàn thật: không cho phép xoá/nạp lại dữ liệu mẫu trên production
    // trừ khi chủ động bật ALLOW_DEMO_RESET=true (chỉ dùng cho môi trường kiểm thử).
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_RESET !== 'true') {
      return NextResponse.json(
        {
          success: false,
          code: 'FORBIDDEN',
          error: 'Chức năng nạp lại dữ liệu mẫu đã bị khoá trên môi trường thật để bảo vệ lịch đặt của khách.',
        },
        { status: 403 }
      );
    }

    const result = resetDemoData();
    return NextResponse.json(result);
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        code: 'DATABASE_ERROR',
        error: (error as { message?: string })?.message || 'Lỗi khôi phục dữ liệu mẫu',
      },
      { status: 500 }
    );
  }
}
