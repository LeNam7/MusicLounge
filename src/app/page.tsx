import React from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import GrandOpeningSection from '@/components/GrandOpeningSection';
import BrandStatement from '@/components/BrandStatement';
import ExploreTheTeaRooms from '@/components/ExploreTheTeaRooms';
import PricingSection from '@/components/PricingSection';
import TheArtOfTea from '@/components/TheArtOfTea';
import ExperiencesSection from '@/components/ExperiencesSection';
import VisualGallery from '@/components/VisualGallery';
import TestimonialsSection from '@/components/TestimonialsSection';
import FinalBookingInvitation from '@/components/FinalBookingInvitation';
import Footer from '@/components/Footer';
import CurtainIntro from '@/components/CurtainIntro';
import { getAllRooms } from '@/lib/db';

export default function HomePage() {
  const rooms = getAllRooms();

  return (
    <div className="min-h-screen flex flex-col bg-charcoal text-ivory">
      {/* Hiệu ứng kéo rèm mở màn đón khách */}
      <CurtainIntro />

      {/* Fixed Navigation Bar with Announcement Banner */}
      <Navbar />

      <main className="flex-1">
        {/* Section 1: Cinematic Hero */}
        <Hero />

        {/* Section 2: Tuần Lễ Khai Trương (16 - 22/11/2026 - Giảm 20% Dịch vụ & Sản phẩm trà) */}
        <GrandOpeningSection />

        {/* Section 3: Brand Philosophy & Statement */}
        <BrandStatement />

        {/* Section 4: Explore The Tea Rooms */}
        <ExploreTheTeaRooms rooms={rooms} />

        {/* Section 5: Bảng Giá Dịch Vụ Thưởng Trà & 10 Phẩm Danh Trà */}
        <PricingSection />

        {/* Section 6: The Art of Tea (Trà Đạo) */}
        <TheArtOfTea />

        {/* Section 7: Tea Experiences */}
        <ExperiencesSection />

        {/* Section 8: Visual Gallery with Lightbox */}
        <VisualGallery />

        {/* Section 9: Guest Reflections & Testimonials */}
        <TestimonialsSection />

        {/* Section 10: Final Booking Invitation */}
        <FinalBookingInvitation />
      </main>

      {/* Section 11: Comprehensive Footer */}
      <Footer />
    </div>
  );
}
