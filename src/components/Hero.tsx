'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowDown, CalendarCheck, Compass, Sparkles } from 'lucide-react';
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
    <section className="relative min-h-[92vh] lg:min-h-screen flex items-center justify-center overflow-hidden bg-charcoal">
      {/* Background Hero Image with atmospheric overlays */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-tea-ceremony.png"
          alt="Không gian trà đạo đương đại tĩnh lặng tại Lùng Vài Tea"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center scale-105 transform motion-safe:transition-transform motion-safe:duration-[10000ms] motion-safe:hover:scale-100"
        />
        {/* Multilayered radial and gradient darkening to guarantee high editorial readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/70 to-charcoal/40" />
        <div className="absolute inset-0 bg-radial-at-c from-transparent via-charcoal/50 to-charcoal-dark/95" />
        {/* Subtle Chinese lattice pattern overlay */}
        <div className="absolute inset-0 bg-lattice-subtle opacity-40 mix-blend-overlay pointer-events-none" />
      </div>

      {/* Decorative vertical poetry column on the right */}
      <div className="hidden lg:flex absolute right-12 top-1/2 -translate-y-1/2 z-10 flex-col items-center gap-4 pointer-events-none select-none opacity-85">
        <div className="w-[1px] h-16 bg-gradient-to-b from-transparent to-brass/40" />
        <span className="font-serif text-xs tracking-[0.35em] text-brass uppercase [writing-mode:vertical-rl] select-none">
          TRÀ ĐẠO TĨNH TẠI
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-vermilion" />
        <span className="font-serif text-xs tracking-[0.35em] text-brass uppercase [writing-mode:vertical-rl] select-none">
          PHÒNG TRÀ RIÊNG TƯ
        </span>
        <div className="w-[1px] h-16 bg-gradient-to-t from-transparent to-brass/40" />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-24 pb-16 flex flex-col items-center">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-brass/40 bg-walnut/60 backdrop-blur-md mb-6 shadow-lg shadow-charcoal-dark/50">
          <span className="seal-stamp text-[10px] px-1.5 py-0.5 font-sans font-bold text-vermilion">LV</span>
          <span className="text-xs uppercase tracking-[0.25em] text-ivory-muted font-medium">
            MỘT KHOẢNG LẶNG GIỮA NHỊP SỐNG
          </span>
        </div>

        {/* Major Editorial Headline */}
        <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-normal tracking-wide text-ivory leading-[1.18] max-w-4xl text-balance">
          Nơi thời gian chậm lại, <br />
          <span className="italic font-light text-ivory-light">và lòng người an yên.</span>
        </h1>

        {/* Poetic Inscription */}
        <div className="mt-5 flex items-center justify-center gap-2 text-brass-light font-serif text-base sm:text-lg tracking-[0.08em] opacity-95">
          <span className="italic">
            &ldquo;Một chén trà thanh, một khoảng trời tĩnh lặng&rdquo;
          </span>
        </div>

        {/* Supporting description */}
        <p className="mt-6 text-sm sm:text-base md:text-lg text-ivory/80 max-w-2xl font-light leading-relaxed">
          {BRAND_CONFIG.brandSubtagline}
        </p>

        {/* Primary and Secondary CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 w-full sm:w-auto">
          <Link
            href="/booking"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-vermilion hover:bg-vermilion-light text-ivory text-xs uppercase tracking-[0.2em] font-medium transition-all duration-300 rounded-sm shadow-xl shadow-vermilion/25 hover:shadow-vermilion/45 active:translate-y-0.5"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Đặt phòng trà trực tuyến</span>
          </Link>

          <a
            href="#rooms"
            onClick={scrollToRooms}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 border border-brass/50 hover:border-brass bg-walnut/40 hover:bg-walnut/70 backdrop-blur-sm text-ivory hover:text-brass transition-all duration-300 text-xs uppercase tracking-[0.2em] font-medium rounded-sm"
          >
            <Compass className="w-4 h-4 text-brass" />
            <span>Khám phá không gian</span>
          </a>
        </div>

        {/* Ambient detail tags */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs text-stone-light tracking-widest uppercase">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brass/80" />
            <span>Phòng trà riêng tư tuyệt đối</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brass/80" />
            <span>Shan Tuyết cổ thụ & Danh trà Á Đông</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brass/80" />
            <span>Trà sư hướng dẫn nghi thức</span>
          </div>
        </div>

        {/* Discreet Scroll Indicator */}
        <a
          href="#rooms"
          onClick={scrollToRooms}
          className="mt-14 inline-flex flex-col items-center gap-2 text-stone hover:text-brass transition-colors group cursor-pointer"
          aria-label="Cuộn xuống để khám phá các phòng trà"
        >
          <span className="text-[10px] tracking-[0.3em] uppercase opacity-70 group-hover:opacity-100">
            Khám phá
          </span>
          <ArrowDown className="w-4 h-4 animate-bounce text-brass/70 group-hover:text-brass" />
        </a>
      </div>

      {/* Bottom border line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-brass/30 to-transparent" />
    </section>
  );
}
