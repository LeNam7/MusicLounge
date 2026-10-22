import React from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import BrandStatement from '@/components/BrandStatement';
import ExploreTheTeaRooms from '@/components/ExploreTheTeaRooms';
import TheArtOfTea from '@/components/TheArtOfTea';
import ExperiencesSection from '@/components/ExperiencesSection';
import VisualGallery from '@/components/VisualGallery';
import TestimonialsSection from '@/components/TestimonialsSection';
import FinalBookingInvitation from '@/components/FinalBookingInvitation';
import Footer from '@/components/Footer';
import { getAllRooms } from '@/lib/db';



export default function HomePage() {
  const rooms = getAllRooms();

  return (
    <div className="min-h-screen flex flex-col bg-charcoal text-ivory">
      {/* Fixed Navigation Bar */}
      <Navbar />

      <main className="flex-1">
        {/* Section 1: Cinematic Hero */}
        <Hero />

        {/* Section 2: Brand Philosophy & Statement */}
        <BrandStatement />

        {/* Section 3: Explore The Tea Rooms */}
        <ExploreTheTeaRooms rooms={rooms} />

        {/* Section 4: The Art of Tea (Trà Đạo) */}
        <TheArtOfTea />

        {/* Section 5: Tea Experiences */}
        <ExperiencesSection />

        {/* Section 6: Visual Gallery with Lightbox */}
        <VisualGallery />

        {/* Section 7: Guest Reflections & Testimonials */}
        <TestimonialsSection />

        {/* Section 8: Final Booking Invitation */}
        <FinalBookingInvitation />
      </main>

      {/* Section 9: Comprehensive Footer */}
      <Footer />
    </div>
  );
}
