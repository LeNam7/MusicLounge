import { NextRequest, NextResponse } from 'next/server';
import { getNotificationsForBooking, searchBookings } from '@/lib/db';
import { unauthorizedAdminResponse, verifyAdminRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = verifyAdminRequest(request);
    if (!auth.authorized) {
      return unauthorizedAdminResponse(auth.error);
    }

    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date') || undefined;
    const status = searchParams.get('status') || undefined;
    const roomId = searchParams.get('roomId') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : undefined;

    const bookings = searchBookings({ date, status, roomId, search, limit, offset });

    // Attach latest notification status summary per booking for quick visibility
    const enriched = bookings.map((b) => {
      const notifs = getNotificationsForBooking(b.id);
      return {
        ...b,
        latestNotification: notifs[0] || null,
        notificationCount: notifs.length,
      };
    });

    return NextResponse.json({
      success: true,
      data: enriched,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        code: 'DATABASE_ERROR',
        error: (error as { message?: string })?.message || 'Lỗi lấy danh sách đặt phòng',
      },
      { status: 500 }
    );
  }
}
