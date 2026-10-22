import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BookingWizard from '@/components/BookingWizard';
import { getAllRooms, getAllTeaPackages } from '@/lib/db';
import { BRAND_CONFIG } from '@/lib/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Đặt Phòng Trà Riêng Tư Trực Tuyến | ${BRAND_CONFIG.brandName}`,
  description: 'Đặt phòng trà đạo riêng tư tại Oriental Serenity. Kiểm tra lịch trống trực tiếp, lựa chọn danh trà Shan Tuyết cổ thụ và xác nhận tức thì.',
};



interface BookingPageProps {
  searchParams: Promise<{ room?: string }>;
}

export default async function BookingPage({ searchParams }: BookingPageProps) {
  const { room: preselectedRoomSlug } = await searchParams;
  const rooms = getAllRooms();
  const teaPackages = getAllTeaPackages();

  return (
    <div className="min-h-screen flex flex-col bg-charcoal text-ivory">
      <Navbar />

      <main className="flex-1 pt-24 pb-20">
        
        {/* Page Header */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-8 pb-4">
          <div className="inline-flex items-center gap-2 text-brass tracking-[0.3em] uppercase text-xs font-medium mb-3">
            <span className="seal-stamp text-[10px] px-1">定</span>
            <span>HỆ THỐNG ĐẶT PHÒNG TRỰC TUYẾN</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-ivory font-normal">
            Chọn không gian cho buổi đàm đạo
          </h1>
          <p className="text-xs sm:text-sm text-stone-light max-w-xl mx-auto mt-2 font-light">
            Vui lòng chọn phòng, ngày và khung giờ mong muốn. Lịch trống được cập nhật theo thời gian thực và tự động bảo lưu qua hệ thống khoá giờ.
          </p>
        </div>

        {/* Complete 5-Step Booking Wizard */}
        <BookingWizard
          initialRooms={rooms}
          initialTeaPackages={teaPackages}
          preselectedRoomSlug={preselectedRoomSlug}
        />

      </main>

      <Footer />
    </div>
  );
}
