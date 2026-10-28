import { NextRequest, NextResponse } from 'next/server';
import { resetDemoData } from '@/lib/db';
import { unauthorizedAdminResponse, verifyAdminRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const auth = verifyAdminRequest(request, { allowQueryPasscode: false });
    if (!auth.authorized) {
      return unauthorizedAdminResponse(auth.error);
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
