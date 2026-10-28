import { NextRequest, NextResponse } from 'next/server';
import { BookingDomainError, createSlotBlock, deleteSlotBlock, getSlotBlocks } from '@/lib/db';
import { unauthorizedAdminResponse, verifyAdminRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = verifyAdminRequest(request);
    if (!auth.authorized) {
      return unauthorizedAdminResponse(auth.error);
    }

    const date = request.nextUrl.searchParams.get('date') || undefined;
    const roomId = request.nextUrl.searchParams.get('roomId') || undefined;
    const blocks = getSlotBlocks(date, roomId);

    return NextResponse.json({
      success: true,
      data: blocks,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        code: 'DATABASE_ERROR',
        error: (error as { message?: string })?.message || 'Lỗi tải danh sách khóa giờ',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = verifyAdminRequest(request, { allowQueryPasscode: false });
    if (!auth.authorized) {
      return unauthorizedAdminResponse(auth.error);
    }

    const body = await request.json();
    const { roomId, date, startTime, endTime, reason } = body;

    if (!date || !startTime || !endTime) {
      return NextResponse.json(
        {
          success: false,
          code: 'VALIDATION_ERROR',
          error: 'Vui lòng chọn ngày, giờ bắt đầu và giờ kết thúc cần khóa.',
        },
        { status: 400 }
      );
    }

    const created = createSlotBlock({
      roomId: roomId || 'ALL',
      date,
      startTime,
      endTime,
      reason: reason || 'Khóa lịch phục vụ theo cấu hình quản trị',
      createdBy: auth.actor,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Đã khóa khung giờ thành công.',
        data: created,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof BookingDomainError) {
      return NextResponse.json(
        {
          success: false,
          code: error.code,
          error: error.message,
        },
        { status: error.httpStatus }
      );
    }
    return NextResponse.json(
      {
        success: false,
        code: 'DATABASE_ERROR',
        error: (error as { message?: string })?.message || 'Lỗi khóa khung giờ',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = verifyAdminRequest(request, { allowQueryPasscode: false });
    if (!auth.authorized) {
      return unauthorizedAdminResponse(auth.error);
    }

    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          code: 'VALIDATION_ERROR',
          error: 'Thiếu mã khóa giờ (id).',
        },
        { status: 400 }
      );
    }

    const deleted = deleteSlotBlock(id);
    return NextResponse.json({
      success: deleted,
      message: deleted ? 'Đã mở khóa khung giờ.' : 'Không tìm thấy mục khóa giờ.',
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        code: 'DATABASE_ERROR',
        error: (error as { message?: string })?.message || 'Lỗi mở khóa khung giờ',
      },
      { status: 500 }
    );
  }
}
