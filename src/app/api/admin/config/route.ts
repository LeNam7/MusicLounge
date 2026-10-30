import { NextRequest, NextResponse } from 'next/server';
import { getSlotBlocks, getSystemSettings, updateSystemSettings } from '@/lib/db';
import { getZaloIntegrationStatus } from '@/lib/notifications';
import { unauthorizedAdminResponse, verifyAdminRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = verifyAdminRequest(request);
    if (!auth.authorized) {
      return unauthorizedAdminResponse(auth.error);
    }

    const settings = getSystemSettings();
    const slotBlocks = getSlotBlocks();
    const zaloStatus = getZaloIntegrationStatus();

    return NextResponse.json({
      success: true,
      data: {
        settings,
        slotBlocks,
        zaloStatus,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        code: 'DATABASE_ERROR',
        error: (error as { message?: string })?.message || 'Lỗi tải cấu hình hệ thống',
      },
      { status: 500 }
    );
  }
}

async function handleUpdateConfig(request: NextRequest) {
  try {
    const auth = verifyAdminRequest(request, { allowQueryPasscode: false });
    if (!auth.authorized) {
      return unauthorizedAdminResponse(auth.error);
    }

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

    const updated = updateSystemSettings(body);

    return NextResponse.json({
      success: true,
      message: 'Đã lưu cấu hình vận hành phòng trà thành công.',
      data: updated,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        code: 'VALIDATION_ERROR',
        error: (error as { message?: string })?.message || 'Lỗi cập nhật cấu hình',
      },
      { status: 400 }
    );
  }
}

export async function PUT(request: NextRequest) {
  return handleUpdateConfig(request);
}

export async function PATCH(request: NextRequest) {
  return handleUpdateConfig(request);
}
