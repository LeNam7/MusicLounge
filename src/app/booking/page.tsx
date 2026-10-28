import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BookingWizard from '@/components/BookingWizard';
import { getAllRooms, getAllTeaPackages } from '@/lib/db';
import { BRAND_CONFIG } from '@/lib/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Đặt Phòng Trà Riêng Tư Trực Tuyến | ${BRAND_CONFIG.brandName}`,
  description:
    'Đặt phòng trà đạo riêng tư tại Lùng Vài Tea. Kiểm tra lịch trống trực tiếp theo khung giờ 15 phút, lựa chọn danh trà Shan Tuyết cổ thụ và theo dõi trạng thái duyệt lịch.',
};

interface BookingPageProps {
  searchParams: Promise<{
    room?: string;
    tea?: string;
    date?: string;
    time?: string;
    duration?: string;
    guests?: string;
    step?: string;
  }>;
}

export default async function BookingPage({ searchParams }: BookingPageProps) {
  const {
    room: preselectedRoomSlug,
    tea: preselectedTeaId,
    date: preselectedDate,
    time: preselectedTime,
    duration: preselectedDuration,
    guests: preselectedGuests,
    step: preselectedStep,
  } = await searchParams;
  const rooms = getAllRooms();
  const teaPackages = getAllTeaPackages();

  return (
    <div className="min-h-screen flex flex-col bg-charcoal text-ivory">
      <Navbar />

      <main className="flex-1 pt-24 pb-20">
        {/* Page Header */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-8 pb-4">
          <div className="inline-flex items-center gap-2 text-brass tracking-[0.3em] uppercase text-xs font-medium mb-3">
            <span className="seal-stamp text-[10px] px-1.5 font-sans font-bold">LỊCH HẸN</span>
            <span>HỆ THỐNG ĐẶT PHÒNG TRỰC TUYẾN</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-ivory font-normal">
            Chọn không gian cho buổi đàm đạo
          </h1>
          <p className="text-xs sm:text-sm text-stone-light max-w-xl mx-auto mt-2 font-light">
            Vui lòng chọn phòng, ngày và khung giờ mong muốn. Trạng thái khung giờ được đồng bộ trực tiếp từ hệ thống quản lý lịch của phòng trà.
          </p>
        </div>

        {/* Complete 5-Step Booking Wizard */}
        <BookingWizard
          initialRooms={rooms}
          initialTeaPackages={teaPackages}
          preselectedRoomSlug={preselectedRoomSlug}
          preselectedTeaId={preselectedTeaId}
          preselectedDate={preselectedDate}
          preselectedTime={preselectedTime}
          preselectedDuration={preselectedDuration ? parseFloat(preselectedDuration) : undefined}
          preselectedGuests={preselectedGuests ? parseInt(preselectedGuests, 10) : undefined}
          initialStep={preselectedStep ? parseInt(preselectedStep, 10) : undefined}
        />
      </main>

      <Footer />
    </div>
  );
}
