'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Volume2, VolumeX, Menu, X, CalendarCheck, Shield } from 'lucide-react';
import { BRAND_CONFIG } from '@/lib/config';
import { teaAudio } from '@/lib/audio';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleSound = () => {
    const playing = teaAudio.toggle();
    setIsPlayingAudio(playing);
  };

  const navLinks = [
    { href: '/#rooms', label: 'Không gian phòng trà' },
    { href: '/#art-of-tea', label: 'Nghệ thuật trà' },
    { href: '/#experiences', label: 'Trải nghiệm' },
    { href: '/#gallery', label: 'Bộ sưu tập' },
    { href: '/lookup', label: 'Tra cứu đặt phòng' },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'bg-[#FAF7F2]/95 backdrop-blur-md border-b border-brass/25 py-2.5 shadow-md shadow-stone/10'
            : 'bg-[#FAF7F2]/90 backdrop-blur-md border-b border-brass/20 py-3 shadow-xs'
        }`}
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 flex items-center justify-between gap-4">
          {/* Brand Logo & Inscription - Never wraps */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div 
              className="relative w-9 h-12 sm:w-10 sm:h-13 shrink-0 group-hover:scale-105 transition-transform duration-300"
              style={{ position: 'relative', flexShrink: 0, width: '40px', height: '52px', maxWidth: '40px', maxHeight: '52px' }}
            >
              <Image
                src="/images/logo-lung-vai-transparent.png"
                alt="Lùng Vài Tea Logo"
                fill
                priority
                sizes="44px"
                className="object-contain filter drop-shadow-[0_2px_8px_rgba(141,52,45,0.45)]"
              />
            </div>
            <div className="flex flex-col justify-center whitespace-nowrap">
              <span className="font-serif text-base sm:text-xl xl:text-[22px] tracking-[0.16em] uppercase text-ivory group-hover:text-brass transition-colors font-medium leading-tight">
                {BRAND_CONFIG.brandName}
              </span>
              <span className="text-[9px] sm:text-[10px] tracking-[0.15em] text-brass uppercase font-sans opacity-90 font-medium mt-0.5">
                {BRAND_CONFIG.brandSubtitle}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links - Single line guaranteed */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-7 2xl:gap-8 shrink-0">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="whitespace-nowrap text-[11px] xl:text-xs uppercase tracking-[0.12em] xl:tracking-[0.14em] text-ivory/85 hover:text-brass transition-colors font-medium py-1 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-brass hover:after:w-full after:transition-all"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Action Buttons - Single line guaranteed */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            {/* Ambient Audio Toggle - Icon Only */}
            <button
              onClick={toggleSound}
              type="button"
              aria-label={isPlayingAudio ? 'Tắt nhạc phòng trà' : 'Bật nhạc phòng trà'}
              className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-full border transition-all duration-300 cursor-pointer ${
                isPlayingAudio
                  ? 'bg-brass/20 border-brass text-vermilion shadow-sm shadow-brass/25'
                  : 'bg-walnut/80 border-stone/35 text-ivory hover:text-brass hover:border-brass/60'
              }`}
              title={isPlayingAudio ? 'Tắt nhạc phòng trà' : 'Bật nhạc phòng trà (Đàn Cổ Tranh & Tiêu Trúc)'}
            >
              {isPlayingAudio ? (
                <Volume2 className="w-4 h-4 text-vermilion animate-pulse" />
              ) : (
                <VolumeX className="w-4 h-4 text-brass" />
              )}
            </button>

            {/* Primary Booking CTA */}
            <Link
              href="/booking"
              className="whitespace-nowrap shrink-0 relative inline-flex items-center justify-center px-4 lg:px-5 py-2.5 text-[11px] lg:text-xs uppercase tracking-[0.16em] font-medium text-white bg-vermilion hover:bg-vermilion-light transition-all duration-300 rounded-xs shadow-md shadow-vermilion/20 hover:shadow-vermilion/40 active:translate-y-0.5"
            >
              <span className="flex items-center gap-1.5">
                <CalendarCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Đặt phòng trà</span>
              </span>
            </Link>

            {/* Compact Menu Toggle for Tablet (< 1024px) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-ivory hover:text-brass focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile Menu Toggle Button (< 640px) */}
          <div className="flex sm:hidden items-center gap-2 shrink-0">
            <button
              onClick={toggleSound}
              className="p-2 text-stone-light hover:text-brass"
              title="Nhạc phòng trà"
            >
              {isPlayingAudio ? <Volume2 className="w-4 h-4 text-vermilion animate-pulse" /> : <VolumeX className="w-4 h-4 text-brass" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-ivory hover:text-brass focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Responsive Drawer Menu (< 1280px) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-charcoal/98 backdrop-blur-xl pt-24 px-6 flex flex-col justify-between pb-10 xl:hidden">
          <div className="max-w-lg mx-auto w-full space-y-6">
            <div className="border-b border-brass/20 pb-4">
              <span className="text-xs uppercase tracking-[0.2em] text-brass">
                {BRAND_CONFIG.brandSubtitle}
              </span>
              <p className="font-serif text-lg text-ivory mt-1">
                {BRAND_CONFIG.brandTagline}
              </p>
            </div>
            <nav className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-serif text-lg text-ivory/90 hover:text-brass transition-colors py-1.5 border-b border-stone/10"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-xs uppercase tracking-widest text-stone-light hover:text-brass pt-2"
              >
                <Shield className="w-3.5 h-3.5" />
                Khu vực Quản trị
              </Link>
            </nav>
          </div>

          <div className="max-w-lg mx-auto w-full space-y-4 pt-6 border-t border-brass/20">
            <div className="flex items-center justify-between text-xs text-stone-light">
              <span>Hotline phục vụ:</span>
              <a href={`tel:${BRAND_CONFIG.hotline.replace(/[^+\d]/g, '')}`} className="text-brass font-medium">
                {BRAND_CONFIG.hotline}
              </a>
            </div>
            <Link
              href="/booking"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-vermilion hover:bg-vermilion-light text-white text-xs uppercase tracking-[0.2em] font-medium rounded-xs shadow-md"
            >
              <CalendarCheck className="w-4 h-4" />
              Đặt phòng trà trực tuyến
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
