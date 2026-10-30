import { NextRequest, NextResponse } from 'next/server';
import { BookingDomainError, updateRoom } from '@/lib/db';
import { unauthorizedAdminResponse, verifyAdminRequest } from '@/lib/auth';
import type { Room } from '@/lib/types';

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
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          code: 'VALIDATION_ERROR',
          error: 'Dữ liệu JSON không hợp lệ',
        },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, code: 'VALIDATION_ERROR', error: 'Dữ liệu cập nhật phòng không hợp lệ' },
        { status: 400 }
      );
    }

    const invalid = (message: string) =>
      NextResponse.json({ success: false, code: 'VALIDATION_ERROR', error: message }, { status: 400 });

    const patchData: Record<string, unknown> = {};
    if (body.pricePerHour !== undefined) {
      const v = Number(body.pricePerHour);
      if (!Number.isFinite(v) || v < 0) return invalid('Giá theo giờ phải là số không âm');
      patchData.pricePerHour = Math.round(v);
    }
    if (body.pricePackage2h !== undefined) {
      const v = Number(body.pricePackage2h);
      if (!Number.isFinite(v) || v < 0) return invalid('Giá gói 2 giờ phải là số không âm');
      patchData.pricePackage2h = Math.round(v);
    }
    if (body.capacityMax !== undefined) {
      const v = Number(body.capacityMax);
      if (!Number.isInteger(v) || v < 1 || v > 100) return invalid('Sức chứa tối đa phải là số nguyên từ 1 đến 100');
      patchData.capacityMax = v;
    }
    if (body.isActive !== undefined) patchData.isActive = Boolean(body.isActive);

    const updated = updateRoom(id, patchData as Partial<Room>);

    return NextResponse.json({
      success: true,
      message: 'Cập nhật thông tin phòng thành công',
      data: updated,
    });
  } catch (error: unknown) {
    if (error instanceof BookingDomainError) {
      return NextResponse.json(
        {
          success: false,
          code: error.code,
          error: error.message,
        },
        { status: (error as { statusCode?: number }).statusCode || error.httpStatus || 400 }
      );
    }
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
