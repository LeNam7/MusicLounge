import { NextRequest, NextResponse } from 'next/server';
import { getDashboardStats } from '@/lib/db';
import { getZaloIntegrationStatus } from '@/lib/notifications';
import { unauthorizedAdminResponse, verifyAdminRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = verifyAdminRequest(request);
    if (!auth.authorized) {
      return unauthorizedAdminResponse(auth.error);
    }

    const targetDate = request.nextUrl.searchParams.get('date') || undefined;
    const stats = getDashboardStats(targetDate);
    const zaloStatus = getZaloIntegrationStatus();

    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        zaloStatus,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        code: 'DATABASE_ERROR',
        error: (error as { message?: string })?.message || 'Lỗi thống kê',
      },
      { status: 500 }
    );
  }
}
