'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Volume2, VolumeX, Menu, X, CalendarCheck, Shield, Sparkles, ArrowLeft } from 'lucide-react';
import { BRAND_CONFIG } from '@/lib/config';
import { teaAudio } from '@/lib/audio';
import GrandOpeningBanner from './GrandOpeningBanner';
import BackToHomeButton from './BackToHomeButton';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Sync with global audio state
    const unsubscribe = teaAudio.onStateChange((playing) => {
      setIsPlayingAudio(playing);
    });

    // Attempt auto-play immediately upon entering
    try {
      teaAudio.play();
      setIsPlayingAudio(true);
    } catch {
      // Browser may require first interaction
    }

    // Modern browser autoplay fallback: trigger upon the first user interaction anywhere
    const handleFirstGesture = () => {
      try {
        teaAudio.play();
        setIsPlayingAudio(true);
      } catch {
        // Ignore
      }
      cleanupGestureListeners();
    };

    const cleanupGestureListeners = () => {
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
      window.removeEventListener('scroll', handleFirstGesture);
    };

    window.addEventListener('pointerdown', handleFirstGesture, { passive: true, once: true });
    window.addEventListener('click', handleFirstGesture, { passive: true, once: true });
    window.addEventListener('touchstart', handleFirstGesture, { passive: true, once: true });
    window.addEventListener('keydown', handleFirstGesture, { passive: true, once: true });
    window.addEventListener('scroll', handleFirstGesture, { passive: true, once: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      unsubscribe();
      cleanupGestureListeners();
    };
  }, []);

  const toggleSound = () => {
    const playing = teaAudio.toggle();
    setIsPlayingAudio(playing);
  };

  const navLinks = [
    { href: '/#grand-opening', label: 'Khai trương (-20%)', isPromo: true },
    { href: '/#pricing', label: 'Bảng giá' },
    { href: '/#rooms', label: 'Phòng trà' },
    { href: '/#art-of-tea', label: 'Trà đạo' },
    { href: '/#experiences', label: 'Trải nghiệm' },
    { href: '/#gallery', label: 'Bộ sưu tập' },
    { href: '/lookup', label: 'Tra cứu' },
  ];

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
        <div className="pointer-events-auto">
          <GrandOpeningBanner />
          <header
            className={`transition-all duration-500 ${
              isScrolled
                ? 'bg-[#FAF7F2]/95 backdrop-blur-md border-b border-brass/25 py-2.5 shadow-md shadow-stone/10'
                : 'bg-[#FAF7F2]/90 backdrop-blur-md border-b border-brass/20 py-2.5 sm:py-3 shadow-xs'
            }`}
          >
          <div className="max-w-[1440px] mx-auto px-3 sm:px-6 xl:px-8 flex items-center justify-between gap-2 sm:gap-4">
            {/* Brand Logo & Inscription */}
            <Link href="/" className="flex items-center gap-2.5 sm:gap-3 shrink-0 group">
              <div 
                className="relative w-8 h-11 sm:w-10 sm:h-13 shrink-0 group-hover:scale-105 transition-transform duration-300"
                style={{ position: 'relative', flexShrink: 0, width: '38px', height: '50px' }}
              >
                <Image
                  src="/images/logo-lung-vai-transparent.png"
                  alt="Lùng Vài Tea Logo"
                  fill
                  priority
                  sizes="40px"
                  className="object-contain filter drop-shadow-[0_2px_8px_rgba(141,52,45,0.45)]"
                />
              </div>
              <div className="flex flex-col justify-center whitespace-nowrap">
                <span className="font-serif text-sm sm:text-lg xl:text-xl tracking-[0.14em] uppercase text-ivory group-hover:text-brass transition-colors font-medium leading-tight">
                  {BRAND_CONFIG.brandName}
                </span>
                <span className="text-[8.5px] sm:text-[9.5px] tracking-[0.14em] text-brass uppercase font-sans opacity-90 font-medium mt-0.5 hidden xs:block">
                  {BRAND_CONFIG.brandSubtitle}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links - Shown strictly at xl (>= 1280px) to guarantee zero overflow */}
            <nav className="hidden xl:flex items-center gap-2.5 2xl:gap-5 shrink-0">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`whitespace-nowrap text-[11px] 2xl:text-xs uppercase tracking-[0.08em] 2xl:tracking-[0.12em] font-medium py-1 px-1 relative transition-all ${
                    link.isPromo 
                      ? 'text-[#8D342D] hover:text-[#B83D33] font-bold flex items-center gap-1 bg-[#8D342D]/10 px-2.5 py-1 rounded-full border border-[#8D342D]/25 shadow-2xs hover:bg-[#8D342D]/15'
                      : 'text-ivory/85 hover:text-brass after:content-[\'\'] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] hover:after:w-full after:bg-brass after:transition-all'
                  }`}
                >
                  {link.isPromo && <Sparkles className="w-3 h-3 text-[#8D342D] animate-pulse" />}
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Ambient Audio Toggle */}
              <button
                onClick={toggleSound}
                type="button"
                aria-label={isPlayingAudio ? 'Tắt nhạc phòng trà' : 'Bật nhạc phòng trà'}
                className={`w-8 h-8 sm:w-9 sm:h-9 shrink-0 flex items-center justify-center rounded-full border transition-all duration-300 cursor-pointer ${
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

              {/* Primary Booking CTA - Compact on small screens */}
              <Link
                href="/booking"
                className="whitespace-nowrap shrink-0 relative inline-flex items-center justify-center px-3 sm:px-4 xl:px-5 py-2 sm:py-2.5 text-[10.5px] sm:text-xs uppercase tracking-[0.14em] font-medium text-white bg-vermilion hover:bg-vermilion-light transition-all duration-300 rounded-xs shadow-md shadow-vermilion/20 hover:shadow-vermilion/40 active:translate-y-0.5"
              >
                <span className="flex items-center gap-1.5">
                  <CalendarCheck className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Đặt phòng trà</span>
                  <span className="sm:hidden">Đặt phòng</span>
                </span>
              </Link>

              {/* Hamburger Menu Toggle Button (< 1280px) */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="xl:hidden p-2 text-ivory hover:text-brass focus:outline-none shrink-0"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </header>
      </div>

      {/* Nút Về Trang Chủ lungvaitea.vn cố định ở góc trên, theo sát khi người dùng cuộn trang */}
      {!mobileMenuOpen && (
        <div className="pointer-events-auto max-w-[1440px] mx-auto px-3 sm:px-6 xl:px-8 pt-2.5 sm:pt-3.5 flex justify-start">
          <BackToHomeButton />
        </div>
      )}
    </div>

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
                  className={`font-serif text-lg py-1.5 border-b border-stone/10 flex items-center justify-between transition-colors ${
                    link.isPromo 
                      ? 'text-[#8D342D] font-bold'
                      : 'text-ivory/90 hover:text-brass'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.isPromo && (
                    <span className="text-[10px] font-sans font-semibold bg-[#8D342D]/15 text-[#8D342D] px-2 py-0.5 rounded-full border border-[#8D342D]/25 uppercase tracking-wider">
                      Hot
                    </span>
                  )}
                </Link>
              ))}
              <a
                href="https://lungvaitea.vn/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-xs uppercase tracking-widest text-brass hover:text-white pt-2 font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Về trang chủ (lungvaitea.vn)
              </a>
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-xs uppercase tracking-widest text-stone-light hover:text-brass pt-1"
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
