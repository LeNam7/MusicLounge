import { NextRequest, NextResponse } from 'next/server';
import { resetDemoData } from '@/lib/db';

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'serenity2026';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('x-admin-passcode') || request.nextUrl.searchParams.get('passcode');
    if (authHeader !== ADMIN_PASSCODE) {
      return NextResponse.json(
        { success: false, error: 'Truy cập quản trị bị từ chối.' },
        { status: 401 }
      );
    }

    const res = resetDemoData();
    return NextResponse.json(res);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi đặt lại dữ liệu' },
      { status: 500 }
    );
  }
}
