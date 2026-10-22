import { NextRequest, NextResponse } from 'next/server';
import { getAvailableSlots } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const roomId = searchParams.get('roomId');
    const date = searchParams.get('date');
    const durationStr = searchParams.get('durationHours') || '2';
    const durationHours = parseFloat(durationStr);

    if (!roomId || !date) {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin phòng hoặc ngày đặt.' },
        { status: 400 }
      );
    }

    // Validate date format YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { success: false, error: 'Định dạng ngày không hợp lệ (YYYY-MM-DD).' },
        { status: 400 }
      );
    }

    const slots = getAvailableSlots(roomId, date, durationHours);

    return NextResponse.json({
      success: true,
      data: {
        roomId,
        date,
        durationHours,
        slots,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi kiểm tra khung giờ trống' },
      { status: 500 }
    );
  }
}
