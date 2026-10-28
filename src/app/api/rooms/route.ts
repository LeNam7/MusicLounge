import { NextResponse } from 'next/server';
import { getAllRooms } from '@/lib/db';

export async function GET() {
  try {
    const rooms = getAllRooms();
    return NextResponse.json({ success: true, data: rooms });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Lỗi nạp danh sách phòng';
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
