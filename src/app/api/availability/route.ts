import { NextRequest, NextResponse } from 'next/server';
import { getAllRooms, getAvailableSlots, getSystemSettings } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    let roomId = searchParams.get('roomId');
    const date = searchParams.get('date');
    const settings = getSystemSettings();
    const durationStr = searchParams.get('durationHours') || String(settings.defaultDurationHours || 2);
    const durationHours = parseFloat(durationStr);

    if (!date) {
      return NextResponse.json(
        {
          success: false,
          code: 'VALIDATION_ERROR',
          error: 'Thiếu thông tin ngày đặt (date=YYYY-MM-DD).',
        },
        { status: 400 }
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        {
          success: false,
          code: 'VALIDATION_ERROR',
          error: 'Định dạng ngày không hợp lệ (YYYY-MM-DD).',
        },
        { status: 400 }
      );
    }

    if (!roomId) {
      const rooms = getAllRooms();
      roomId = rooms[0]?.id || 'room-1';
    }

    const includeAdminParam = searchParams.get('includeAdmin') === '1';
    const isAdmin = includeAdminParam && verifyAdminRequest(request).authorized;

    const slots = getAvailableSlots(roomId, date, durationHours, isAdmin);

    const summary = {
      total: slots.length,
      available: slots.filter((s) => s.status === 'AVAILABLE').length,
      pending: slots.filter((s) => s.status === 'PENDING').length,
      confirmed: slots.filter((s) => s.status === 'CONFIRMED').length,
      unavailable: slots.filter((s) => s.status === 'UNAVAILABLE').length,
    };

    return NextResponse.json({
      success: true,
      data: {
        roomId,
        date,
        durationHours,
        slotIntervalMinutes: settings.slotIntervalMinutes,
        openTime: settings.openTime,
        closeTime: settings.closeTime,
        summary,
        slots,
      },
    });
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string; httpStatus?: number };
    return NextResponse.json(
      {
        success: false,
        code: err.code || 'DATABASE_ERROR',
        error: err.message || 'Lỗi kiểm tra khung giờ trống',
      },
      { status: err.httpStatus || 500 }
    );
  }
}
