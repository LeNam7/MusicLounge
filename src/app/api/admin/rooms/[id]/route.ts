import { NextRequest, NextResponse } from 'next/server';
import { updateRoom } from '@/lib/db';

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'serenity2026';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('x-admin-passcode') || request.nextUrl.searchParams.get('passcode');
    if (authHeader !== ADMIN_PASSCODE) {
      return NextResponse.json(
        { success: false, error: 'Truy cập quản trị bị từ chối.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const updated = updateRoom(id, body);
    return NextResponse.json({
      success: true,
      message: 'Cập nhật phòng thành công',
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi cập nhật phòng' },
      { status: 500 }
    );
  }
}
