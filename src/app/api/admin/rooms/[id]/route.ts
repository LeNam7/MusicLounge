import { NextRequest, NextResponse } from 'next/server';
import { updateRoom } from '@/lib/db';
import { unauthorizedAdminResponse, verifyAdminRequest } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = verifyAdminRequest(request, { allowQueryPasscode: false });
    if (!auth.authorized) {
      return unauthorizedAdminResponse(auth.error);
    }

    const { id } = await params;
    const body = await request.json();

    const updated = updateRoom(id, {
      pricePerHour: body.pricePerHour !== undefined ? Number(body.pricePerHour) : undefined,
      pricePackage2h: body.pricePackage2h !== undefined ? Number(body.pricePackage2h) : undefined,
      capacityMax: body.capacityMax !== undefined ? Number(body.capacityMax) : undefined,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Cập nhật thông tin phòng thành công',
      data: updated,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        code: 'DATABASE_ERROR',
        error: (error as { message?: string })?.message || 'Lỗi cập nhật phòng',
      },
      { status: 500 }
    );
  }
}
