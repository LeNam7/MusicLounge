import { NextRequest, NextResponse } from 'next/server';
import { getBookingByReference } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ref = searchParams.get('reference');
    const phone = searchParams.get('phone');

    if (!ref) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng cung cấp mã đặt phòng (ví dụ: OS-20261022-7F9A).' },
        { status: 400 }
      );
    }

    const booking = getBookingByReference(ref);
    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy thông tin đặt phòng với mã số này.' },
        { status: 404 }
      );
    }

    // Optional phone number check for privacy
    if (phone) {
      const cleanInput = phone.replace(/\s+/g, '');
      const cleanDb = booking.customerPhone.replace(/\s+/g, '');
      if (!cleanDb.endsWith(cleanInput) && !cleanInput.endsWith(cleanDb)) {
        return NextResponse.json(
          { success: false, error: 'Số điện thoại không khớp với thông tin đơn đặt phòng.' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ success: true, data: booking });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi tra cứu đơn đặt phòng' },
      { status: 500 }
    );
  }
}
