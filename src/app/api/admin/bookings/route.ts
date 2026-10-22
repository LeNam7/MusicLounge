import { NextRequest, NextResponse } from 'next/server';
import { searchBookings } from '@/lib/db';

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'serenity2026';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('x-admin-passcode') || request.nextUrl.searchParams.get('passcode');
    if (authHeader !== ADMIN_PASSCODE) {
      return NextResponse.json(
        { success: false, error: 'Truy cập quản trị bị từ chối. Mã PIN không đúng.' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    const bookings = searchBookings({ date, status, search });
    return NextResponse.json({ success: true, data: bookings });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi lấy danh sách đặt phòng' },
      { status: 500 }
    );
  }
}
