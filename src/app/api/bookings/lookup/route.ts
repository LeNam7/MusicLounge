import { NextRequest, NextResponse } from 'next/server';
import { getBookingByReference } from '@/lib/db';

function maskPhone(phone: string): string {
  const clean = phone.replace(/\s+/g, '');
  if (clean.length <= 6) return '***';
  return `${clean.slice(0, 3)}***${clean.slice(-4)}`;
}

function maskName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return `${name.slice(0, 1)}***`;
  return `${parts[0]} *** ${parts[parts.length - 1]}`;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ref = searchParams.get('reference');
    const phone = searchParams.get('phone');

    if (!ref) {
      return NextResponse.json(
        {
          success: false,
          code: 'VALIDATION_ERROR',
          error: 'Vui lòng cung cấp mã đặt phòng (ví dụ: LVT-20261028-7F9A).',
        },
        { status: 400 }
      );
    }

    const booking = getBookingByReference(ref);
    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          code: 'NOT_FOUND',
          error: 'Không tìm thấy thông tin đặt phòng với mã số này.',
        },
        { status: 404 }
      );
    }

    let isPhoneVerified = false;
    if (phone && phone.trim()) {
      const cleanInput = phone.replace(/[^0-9]/g, '');
      const cleanDb = booking.customerPhone.replace(/[^0-9]/g, '');
      const normInput = cleanInput.startsWith('84') ? `0${cleanInput.slice(2)}` : cleanInput;
      const normDb = cleanDb.startsWith('84') ? `0${cleanDb.slice(2)}` : cleanDb;

      if (normDb !== normInput && !normDb.endsWith(normInput)) {
        return NextResponse.json(
          {
            success: false,
            code: 'FORBIDDEN',
            error: 'Số điện thoại không khớp với thông tin đơn đặt phòng.',
          },
          { status: 403 }
        );
      }
      isPhoneVerified = true;
    }

    // Protect customer PII when phone is not provided for verification
    const safeBooking = isPhoneVerified
      ? booking
      : {
          ...booking,
          customerName: maskName(booking.customerName),
          customerPhone: maskPhone(booking.customerPhone),
          customerEmail: undefined,
          specialRequests: undefined,
        };

    return NextResponse.json({
      success: true,
      verified: isPhoneVerified,
      data: safeBooking,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        code: 'DATABASE_ERROR',
        error: (error as { message?: string })?.message || 'Lỗi tra cứu đơn đặt phòng',
      },
      { status: 500 }
    );
  }
}
