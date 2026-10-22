import { NextRequest, NextResponse } from 'next/server';
import { updateBookingStatus } from '@/lib/db';
import { BookingStatus } from '@/lib/types';

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'serenity2026';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('x-admin-passcode') || request.nextUrl.searchParams.get('passcode');
    if (authHeader !== ADMIN_PASSCODE) {
      return NextResponse.json(
        { success: false, error: 'Truy cập quản trị bị từ chối. Mã PIN không đúng.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status, adminNotes } = body;

    const validStatuses: BookingStatus[] = ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Trạng thái không hợp lệ.' },
        { status: 400 }
      );
    }

    const updated = updateBookingStatus(id, status, adminNotes);
    return NextResponse.json({
      success: true,
      message: 'Cập nhật trạng thái thành công',
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi cập nhật đặt phòng' },
      { status: 500 }
    );
  }
}
