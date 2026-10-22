'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Volume2, VolumeX, Menu, X, CalendarCheck, Phone, Shield } from 'lucide-react';
import { BRAND_CONFIG } from '@/lib/config';
import { teaAudio } from '@/lib/audio';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

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
            ? 'bg-charcoal/90 backdrop-blur-md border-b border-brass/20 py-3.5 shadow-2xl shadow-charcoal-dark/80'
            : 'bg-gradient-to-b from-charcoal-dark/80 via-charcoal-dark/40 to-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Brand Logo & Inscription */}
          <Link href="/" className="flex items-center gap-3 group">
            <span className="seal-stamp text-xs md:text-sm px-1.5 py-0.5 font-sans font-bold" title="Oriental Serenity">
              OS
            </span>
            <div className="flex flex-col">
              <span className="font-serif text-lg sm:text-xl tracking-[0.2em] uppercase text-ivory group-hover:text-brass transition-colors font-medium">
                {BRAND_CONFIG.brandName}
              </span>
              <span className="text-[10px] tracking-[0.25em] text-brass uppercase font-sans opacity-90">
                {BRAND_CONFIG.brandSubtitle}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs uppercase tracking-[0.15em] text-ivory/80 hover:text-brass transition-colors font-medium py-1 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-brass hover:after:w-full after:transition-all"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-4">
            {/* Ambient Audio Toggle */}
            <button
              onClick={toggleSound}
              type="button"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs tracking-wider transition-all duration-300 ${
                isPlayingAudio
                  ? 'bg-brass/20 border-brass text-brass shadow-sm shadow-brass/30'
                  : 'bg-walnut/40 border-stone/30 text-stone-light hover:text-ivory hover:border-brass/50'
              }`}
              title={isPlayingAudio ? 'Tắt âm thanh tĩnh tâm' : 'Bật âm thanh tĩnh tâm (tiếng nước chảy & cổ cầm)'}
            >
              {isPlayingAudio ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-brass animate-pulse" />
                  <span className="hidden xl:inline text-[11px]">Âm sắc thiền</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline text-[11px]">Âm thanh</span>
                </>
              )}
            </button>

            {/* Hotline Link */}
            <a
              href={`tel:${BRAND_CONFIG.hotline.replace(/\s+/g, '')}`}
              className="hidden md:flex items-center gap-1.5 text-xs tracking-wider text-ivory-muted hover:text-brass transition-colors"
            >
              <Phone className="w-3 h-3 text-brass" />
              <span>{BRAND_CONFIG.hotline}</span>
            </a>

            {/* Primary Booking CTA */}
            <Link
              href="/booking"
              className="relative inline-flex items-center justify-center px-4 py-2 text-xs uppercase tracking-[0.18em] font-medium text-ivory bg-vermilion hover:bg-vermilion-light transition-all duration-300 rounded-sm shadow-lg shadow-vermilion/20 hover:shadow-vermilion/40 active:translate-y-0.5"
            >
              <span className="flex items-center gap-1.5">
                <CalendarCheck className="w-3.5 h-3.5" />
                Đặt phòng trà
              </span>
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={toggleSound}
              className="p-2 text-stone-light hover:text-brass"
              title="Âm thanh"
            >
              {isPlayingAudio ? <Volume2 className="w-4 h-4 text-brass" /> : <VolumeX className="w-4 h-4" />}
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

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-charcoal/95 backdrop-blur-xl pt-24 px-6 flex flex-col justify-between pb-10 sm:hidden">
          <div className="space-y-6">
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
                  className="font-serif text-lg text-ivory/90 hover:text-brass transition-colors py-1 border-b border-stone/10"
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

          <div className="space-y-4 pt-6 border-t border-brass/20">
            <div className="flex items-center justify-between text-xs text-stone-light">
              <span>Hotline phục vụ:</span>
              <a href={`tel:${BRAND_CONFIG.hotline.replace(/\s+/g, '')}`} className="text-brass font-medium">
                {BRAND_CONFIG.hotline}
              </a>
            </div>
            <Link
              href="/booking"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-vermilion hover:bg-vermilion-light text-ivory text-xs uppercase tracking-[0.2em] font-medium rounded-sm"
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
