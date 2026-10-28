'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CalendarCheck, Compass } from 'lucide-react';
import { BRAND_CONFIG } from '@/lib/config';

export default function Hero() {
  const scrollToRooms = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById('rooms');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-screen flex flex-col justify-between pt-[68px] overflow-hidden bg-[#120D0A]">
      {/* Background Hero Image - 100% Luminous, Elegant, 5-Star Architectural Tea Lounge */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-tea-lounge-luminous.jpg"
          alt="Không gian phòng trà đạo sang trọng Lùng Vài Tea"
          fill
          priority
          unoptimized
          className="object-cover object-center"
        />

        {/* Designer Luminous Scrim:
            Soft, warm atmospheric gradient that maintains radiant daylight & room depth
            while ensuring ivory & gold typography floats with supreme legibility. */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/25 to-[#120D0A]/80 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(255,252,242,0.14)_0%,rgba(18,13,10,0.15)_55%,rgba(18,13,10,0.38)_100%)] pointer-events-none" />
      </div>

      {/* Main Editorial Content - Centered Vertically & Horizontally Across All Viewports */}
      <div className="relative z-10 flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-8 sm:py-12 flex flex-col items-center justify-center">
        
        {/* Brand Seal Emblem - Stamped in the center with a soft warm golden-ivory backlight */}
        <div className="relative flex items-center justify-center mb-4 sm:mb-5 group">
          {/* Subtle warm ambient light halo behind the seal */}
          <div className="absolute -inset-6 rounded-full bg-[radial-gradient(circle,rgba(255,250,240,0.65)_0%,rgba(245,223,176,0.28)_45%,transparent_75%)] blur-md pointer-events-none" />
          <div className="relative w-16 h-22 sm:w-20 sm:h-28 lg:w-22 lg:h-30 brightness-115 saturate-115 drop-shadow-[0_0_14px_rgba(255,248,235,0.85)] group-hover:scale-105 transition-transform duration-500">
            <Image
              src="/images/logo-lung-vai-transparent.png"
              alt="Lùng Vài Tea Seal"
              fill
              priority
              sizes="(max-width: 640px) 64px, 88px"
              className="object-contain"
            />
          </div>
        </div>

        {/* Minimalist Luxury Eyebrow */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 mb-3.5 sm:mb-4">
          <span className="w-6 sm:w-12 h-[1px] bg-[#F5DFB0]/75 shadow-xs" />
          <span className="whitespace-nowrap text-[10px] sm:text-xs uppercase tracking-[0.28em] sm:tracking-[0.32em] text-[#F5DFB0] font-semibold drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
            KHÔNG GIAN TRÀ ĐẠO ĐƯƠNG ĐẠI
          </span>
          <span className="w-6 sm:w-12 h-[1px] bg-[#F5DFB0]/75 shadow-xs" />
        </div>

        {/* Major Editorial Headline */}
        <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-normal tracking-wide text-[#FAF7F2] leading-[1.14] text-balance drop-shadow-[0_3px_22px_rgba(0,0,0,0.85)]">
          Nơi thời gian chậm lại, <br />
          <span className="italic font-light text-[#E5C384]">
            và lòng người an yên.
          </span>
        </h1>

        {/* Concise Poetic Subtagline - Floating cleanly without any box */}
        <p className="mt-4 sm:mt-5 text-xs sm:text-base md:text-[17px] text-[#F2ECE1]/95 max-w-2xl mx-auto font-light leading-relaxed tracking-wide drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
          {BRAND_CONFIG.brandSubtagline}
        </p>

        {/* Primary & Secondary Actions */}
        <div className="mt-7 sm:mt-9 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-5 w-full sm:w-auto">
          <Link
            href="/booking"
            className="whitespace-nowrap w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 sm:px-8 py-3.5 bg-vermilion hover:bg-vermilion-light text-white text-xs uppercase tracking-[0.2em] font-medium transition-all duration-300 rounded-xs shadow-xl shadow-black/50 active:translate-y-0.5"
          >
            <CalendarCheck className="w-4 h-4 shrink-0" />
            <span>Đặt phòng trà trực tuyến</span>
          </Link>

          <a
            href="#rooms"
            onClick={scrollToRooms}
            className="whitespace-nowrap w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 sm:px-8 py-3.5 border border-[#E5C384]/60 hover:border-[#E5C384] bg-black/30 hover:bg-black/45 backdrop-blur-xs text-[#FAF7F2] transition-all duration-300 text-xs uppercase tracking-[0.2em] font-medium rounded-xs shadow-lg shadow-black/30"
          >
            <Compass className="w-4 h-4 text-[#E5C384] shrink-0" />
            <span>Khám phá các phòng</span>
          </a>
        </div>
      </div>

      {/* Minimalist Architectural Footer Strip inside Hero */}
      <div className="relative z-10 w-full border-t border-white/15 bg-black/30 backdrop-blur-[2px]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 flex flex-wrap items-center justify-center sm:justify-between gap-y-2 gap-x-6 text-[10px] sm:text-xs text-[#EAE2D3]/90 tracking-[0.16em] uppercase font-light">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-[#E5C384] font-serif italic text-sm">01</span>
            <span>Phòng riêng biệt lập</span>
          </div>
          <span className="hidden sm:inline text-white/20">|</span>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-[#E5C384] font-serif italic text-sm">02</span>
            <span>Shan Tuyết cổ thụ Lùng Vài</span>
          </div>
          <span className="hidden sm:inline text-white/20">|</span>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-[#E5C384] font-serif italic text-sm">03</span>
            <span>Trà sư hỗ trợ nghi lễ</span>
          </div>
        </div>
      </div>
    </section>
  );
}
