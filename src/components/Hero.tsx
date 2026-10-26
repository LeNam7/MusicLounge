'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowDown, CalendarCheck, Compass } from 'lucide-react';
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
    <section className="relative min-h-[95vh] lg:min-h-screen flex items-center justify-center overflow-hidden bg-charcoal">
      {/* Background Hero Image - The user's authentic tea lounge photo */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/tea-room-main.jpg"
          alt="Không gian phòng trà đạo sang trọng Lùng Vài Tea"
          fill
          priority
          unoptimized
          className="object-cover object-center"
        />

        {/* Seamless Luminous Aura: A soft, borderless radial halo of warm natural light directly behind the center */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[1000px] h-[720px] max-w-full bg-[radial-gradient(ellipse_80%_70%_at_50%_45%,_rgba(255,255,255,0.95)_0%,_rgba(255,255,255,0.8)_42%,_rgba(255,255,255,0.3)_68%,_transparent_86%)]" />
        </div>

        {/* Soft light diffusion over the tiled floor so text is effortlessly readable */}
        <div className="absolute inset-x-0 bottom-0 h-64 sm:h-72 bg-gradient-to-t from-charcoal via-charcoal/85 to-transparent pointer-events-none" />
      </div>

      {/* Decorative vertical poetry column on the right */}
      <div className="hidden xl:flex absolute right-10 top-1/2 -translate-y-1/2 z-10 flex-col items-center gap-4 pointer-events-none select-none opacity-90 drop-shadow-sm">
        <div className="w-[1px] h-16 bg-gradient-to-b from-transparent to-brass/80" />
        <span className="font-serif text-xs tracking-[0.35em] text-[#2B221B] uppercase [writing-mode:vertical-rl] select-none font-semibold">
          TRÀ ĐẠO TĨNH TẠI
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-vermilion" />
        <span className="font-serif text-xs tracking-[0.35em] text-[#2B221B] uppercase [writing-mode:vertical-rl] select-none font-semibold">
          PHÒNG TRÀ RIÊNG TƯ
        </span>
        <div className="w-[1px] h-16 bg-gradient-to-t from-transparent to-brass/80" />
      </div>

      {/* Main Content Area - Masterclass Editorial Typographic Lockup */}
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-28 pb-16 flex flex-col items-center">
        
        {/* Brand Seal Emblem */}
        <div className="relative w-16 h-22 sm:w-20 sm:h-27 mb-3 drop-shadow-[0_2px_10px_rgba(158,45,35,0.3)] group hover:scale-105 transition-transform duration-300">
          <Image
            src="/images/logo-lung-vai-transparent.png"
            alt="Lùng Vài Tea Seal"
            fill
            priority
            sizes="80px"
            className="object-contain"
          />
        </div>

        {/* Architectural Eyebrow Heading with delicate brass hair-lines */}
        <div className="flex items-center justify-center gap-3 mb-3.5">
          <span className="w-8 sm:w-12 h-[1px] bg-brass/60" />
          <span className="seal-stamp text-[10px] px-1.5 py-0.5 font-sans font-bold">TRÀ THẤT</span>
          <span className="text-[11px] sm:text-xs uppercase tracking-[0.25em] text-[#745828] font-semibold">
            KHÔNG GIAN TRÀ ĐẠO ĐƯƠNG ĐẠI
          </span>
          <span className="w-8 sm:w-12 h-[1px] bg-brass/60" />
        </div>

        {/* Major Editorial Headline - High contrast, razor-sharp typography */}
        <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-[4rem] font-normal tracking-wide text-[#1A1410] leading-[1.16] text-balance">
          Nơi thời gian chậm lại, <br />
          <span className="italic font-light text-vermilion">và lòng người an yên.</span>
        </h1>

        {/* Poetic Inscription - Crisp and legible in deep sepia ink */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[#3D332A] font-serif text-base sm:text-lg tracking-[0.06em] font-medium italic">
          <span>&ldquo;Một chén trà thanh, một khoảng trời tĩnh lặng&rdquo;</span>
        </div>

        {/* Supporting description - Pure elegant paragraph with no clunky box */}
        <p className="mt-3.5 text-xs sm:text-sm md:text-base text-[#4A3F35] max-w-xl mx-auto font-normal leading-relaxed">
          {BRAND_CONFIG.brandSubtagline}
        </p>

        {/* Primary and Secondary CTA Buttons */}
        <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 w-full sm:w-auto">
          <Link
            href="/booking"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-vermilion hover:bg-vermilion-light text-white text-xs uppercase tracking-[0.2em] font-medium transition-all duration-300 rounded-sm shadow-xl shadow-vermilion/30 hover:shadow-vermilion/50 active:translate-y-0.5"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Đặt phòng trà trực tuyến</span>
          </Link>

          <a
            href="#rooms"
            onClick={scrollToRooms}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 border border-brass/60 hover:border-brass bg-white/95 hover:bg-white text-[#2B221B] hover:text-brass transition-all duration-300 text-xs uppercase tracking-[0.2em] font-medium rounded-sm shadow-sm"
          >
            <Compass className="w-4 h-4 text-brass" />
            <span>Khám phá các phòng</span>
          </a>
        </div>

        {/* Clean, Unified Trust Ribbon with translucent frosted backing for pristine legibility */}
        <div className="mt-7 inline-flex flex-wrap items-center justify-center gap-2.5 sm:gap-5 px-5 py-2.5 rounded-full bg-white/90 backdrop-blur-md border border-stone-dark/40 shadow-xs text-[11px] sm:text-xs text-[#1A1410] font-semibold tracking-wide uppercase">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-vermilion" />
            <span>Phòng riêng biệt lập</span>
          </div>
          <span className="text-brass/60 hidden sm:inline">•</span>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-vermilion" />
            <span>Shan Tuyết cổ thụ Lùng Vài</span>
          </div>
          <span className="text-brass/60 hidden sm:inline">•</span>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-vermilion" />
            <span>Trà sư hỗ trợ nghi lễ</span>
          </div>
        </div>

        {/* Discreet Scroll Indicator with frosted micro-badge */}
        <a
          href="#rooms"
          onClick={scrollToRooms}
          className="mt-6 inline-flex flex-col items-center gap-1.5 text-[#1A1410] hover:text-vermilion transition-colors group cursor-pointer"
          aria-label="Cuộn xuống để khám phá các phòng trà"
        >
          <span className="px-3.5 py-1 rounded-full bg-white/90 backdrop-blur-sm border border-stone-dark/30 shadow-2xs text-[10px] tracking-[0.25em] uppercase font-bold text-[#1A1410] group-hover:border-vermilion/50 transition-colors">
            Khám phá phòng trà
          </span>
          <ArrowDown className="w-3.5 h-3.5 animate-bounce text-vermilion" />
        </a>
      </div>

      {/* Bottom border line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-brass/40 to-transparent" />
    </section>
  );
}
