import { NextResponse } from 'next/server';
import { getAllRooms } from '@/lib/db';

export async function GET() {
  try {
    const rooms = getAllRooms();
    return NextResponse.json({ success: true, data: rooms });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi nạp danh sách phòng' },
      { status: 500 }
    );
  }
}
