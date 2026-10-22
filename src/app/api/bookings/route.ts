import { NextRequest, NextResponse } from 'next/server';
import { createBooking } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      roomId,
      customerName,
      customerPhone,
      customerEmail,
      date,
      startTime,
      durationHours,
      guestCount,
      teaPackageId,
      specialRequests,
    } = body;

    // Field validations
    if (!roomId || !customerName || !customerPhone || !date || !startTime) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng điền đầy đủ các thông tin bắt buộc.' },
        { status: 400 }
      );
    }

    if (customerName.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Họ và tên khách hàng tối thiểu 2 ký tự.' },
        { status: 400 }
      );
    }

    // Phone validation
    const cleanPhone = customerPhone.replace(/\s+/g, '');
    if (!/^(0|\+84)[0-9]{8,11}$/.test(cleanPhone)) {
      return NextResponse.json(
        { success: false, error: 'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam 10 số.' },
        { status: 400 }
      );
    }

    // Date validation: can not be in the past
    const today = new Date().toISOString().split('T')[0];
    if (date < today) {
      return NextResponse.json(
        { success: false, error: 'Ngày đặt phòng không thể ở trong quá khứ.' },
        { status: 400 }
      );
    }

    const booking = createBooking({
      roomId,
      customerName: customerName.trim(),
      customerPhone: cleanPhone,
      customerEmail: customerEmail ? customerEmail.trim() : undefined,
      date,
      startTime,
      durationHours: Number(durationHours) || 2,
      guestCount: Number(guestCount) || 2,
      teaPackageId: teaPackageId || undefined,
      specialRequests: specialRequests ? specialRequests.trim() : undefined,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Đặt phòng thành công! Chúng tôi đã ghi nhận yêu cầu của quý khách.',
        data: booking,
      },
      { status: 201 }
    );
  } catch (error: any) {
    const msg = error.message || 'Lỗi xử lý đặt phòng';
    // If it's a conflict / overlap error
    const isConflict = msg.includes('vừa được khách khác giữ chỗ') || msg.includes('đã có khách đặt');
    return NextResponse.json(
      { success: false, error: msg },
      { status: isConflict ? 409 : 400 }
    );
  }
}
