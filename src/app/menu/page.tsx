import React from 'react';
import { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PricingSection from '@/components/PricingSection';
import GrandOpeningSection from '@/components/GrandOpeningSection';
import { BRAND_CONFIG, GRAND_OPENING_CONFIG } from '@/lib/config';

export const metadata: Metadata = {
  title: `Bảng Giá Dịch Vụ Thưởng Trà & Tuần Lễ Khai Trương | ${BRAND_CONFIG.brandName}`,
  description:
    'Bảng giá chính thức dịch vụ thuê phòng trà riêng, phụ thu, và 10 dòng danh trà Shan Tuyết cổ thụ tại Lùng Vài Tea. Đặc quyền giảm giá 20% trong tuần lễ khai trương.',
};

export default function MenuPage() {
  return (
    <div className="min-h-screen flex flex-col bg-charcoal text-ivory">
      <Navbar />

      <main className="flex-1 pt-24">
        {/* Tuần Lễ Khai Trương Highlights */}
        <GrandOpeningSection />

        {/* Bảng Giá Dịch Vụ Thưởng Trà Chi Tiết */}
        <PricingSection />
      </main>

      <Footer />
    </div>
  );
}
