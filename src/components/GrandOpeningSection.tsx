'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Sparkles, 
  MapPin, 
  Gift, 
  Calendar, 
  ArrowRight, 
  Check, 
  Copy, 
  Eye, 
  X,
  PhoneCall,
  Clock
} from 'lucide-react';
import { BRAND_CONFIG, GRAND_OPENING_CONFIG } from '@/lib/config';

export default function GrandOpeningSection() {
  const [copied, setCopied] = useState(false);
  const [showPosterModal, setShowPosterModal] = useState(false);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(GRAND_OPENING_CONFIG.locationAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section 
      id="grand-opening" 
      className="relative py-20 lg:py-28 overflow-hidden bg-gradient-to-b from-[#601212] via-[#4F0F0F] to-[#360909] text-white border-y border-[#D4AF37]/30"
    >
      {/* Decorative Cloud & Pattern Background */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="cloud-pattern" width="120" height="80" patternUnits="userSpaceOnUse">
              <path 
                d="M20,40 Q30,20 50,30 Q70,10 90,30 Q105,25 110,40 Q115,55 95,55 Q85,65 65,60 Q45,65 35,55 Q15,55 20,40 Z" 
                fill="none" 
                stroke="#D4AF37" 
                strokeWidth="1.2" 
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cloud-pattern)" />
        </svg>
      </div>

      {/* Radial Glow highlights */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 right-10 w-96 h-96 bg-[#8D342D]/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Brand Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-3">
            <div 
              className="relative w-10 h-13 shrink-0"
              style={{ position: 'relative', width: '40px', height: '52px' }}
            >
              <Image
                src="/images/logo-lung-vai-transparent.png"
                alt="Lùng Vài Tea Logo"
                fill
                sizes="40px"
                className="object-contain filter drop-shadow-[0_2px_10px_rgba(212,175,55,0.6)]"
              />
            </div>
            <div className="text-left">
              <span className="font-serif text-xl sm:text-2xl tracking-[0.2em] uppercase font-bold text-[#FFDF9E] block leading-tight">
                LÙNG VÀI TEA
              </span>
              <span className="text-[11px] sm:text-xs tracking-[0.25em] text-[#F5E6C8]/90 font-serif italic uppercase block">
                Di sản trong từng vị trà
              </span>
            </div>
          </div>

          {/* Main Title */}
          <div className="pt-2">
            <div className="inline-block relative">
              <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal tracking-wide text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)] uppercase">
                Tuần lễ <span className="text-[#FFDF9E] font-medium">KHAI TRƯƠNG</span>
              </h2>
              {/* Golden line accent */}
              <div className="w-24 sm:w-36 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto mt-3" />
            </div>
          </div>

          {/* Date Badge */}
          <div className="pt-2">
            <div className="inline-flex items-center gap-2 bg-[#FAF7F2] text-[#4A0E0E] px-6 py-2.5 rounded-full font-serif font-bold text-base sm:text-xl shadow-lg shadow-black/20 border-2 border-[#D4AF37]">
              <Calendar className="w-5 h-5 text-[#8D342D]" />
              <span>{GRAND_OPENING_CONFIG.dateRange}</span>
            </div>
          </div>
        </div>

        {/* Center Grand Offer Card */}
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-[#731717]/90 via-[#5A1212]/95 to-[#420C0C]/90 border-2 border-[#D4AF37]/60 rounded-2xl p-6 sm:p-10 lg:p-12 shadow-2xl shadow-black/40 backdrop-blur-md relative overflow-hidden">
          
          {/* Corner gold ornaments */}
          <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-[#D4AF37]" />
          <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-[#D4AF37]" />
          <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-[#D4AF37]" />
          <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-[#D4AF37]" />

          {/* Main 20% Discount Callout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center border-b border-[#D4AF37]/30 pb-10">
            {/* Left: Giant 20% */}
            <div className="md:col-span-5 text-center md:text-left flex flex-col justify-center">
              <span className="text-xs sm:text-sm tracking-[0.25em] text-[#F5E6C8] uppercase font-sans font-semibold mb-1">
                ĐẶC QUYỀN KHAI TRƯƠNG
              </span>
              <div className="flex items-baseline justify-center md:justify-start gap-1">
                <span className="font-serif text-2xl sm:text-3xl text-[#FFDF9E] font-light">Giảm giá</span>
                <span className="font-serif text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-[#FFDF9E] drop-shadow-[0_4px_12px_rgba(212,175,55,0.4)]">
                  20%
                </span>
              </div>
              <p className="text-xs text-[#F5E6C8]/80 mt-1 font-light italic">
                Áp dụng trực tiếp trong suốt tuần lễ khai trương cơ sở Cầu Giấy
              </p>
            </div>

            {/* Vertical Separator for Desktop */}
            <div className="hidden md:block md:col-span-1 h-32 w-[1px] bg-gradient-to-b from-transparent via-[#D4AF37]/50 to-transparent mx-auto" />

            {/* Right: Targets */}
            <div className="md:col-span-6 space-y-4">
              <div className="bg-[#420B0B]/70 border border-[#D4AF37]/30 rounded-xl p-4 flex items-start gap-3.5 hover:border-[#D4AF37]/70 transition-colors">
                <div className="w-9 h-9 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center shrink-0 text-[#FFDF9E]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif text-lg sm:text-xl text-white font-medium">
                    Các Dịch Vụ Thưởng Trà
                  </h4>
                  <p className="text-xs text-[#F5E6C8]/80 leading-relaxed mt-0.5 font-light">
                    Thuê phòng trà riêng tư, dịch vụ trà nương chuẩn Gongfu, trà đàm đạo và sự kiện văn hóa trà.
                  </p>
                </div>
              </div>

              <div className="bg-[#420B0B]/70 border border-[#D4AF37]/30 rounded-xl p-4 flex items-start gap-3.5 hover:border-[#D4AF37]/70 transition-colors">
                <div className="w-9 h-9 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center shrink-0 text-[#FFDF9E]">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif text-lg sm:text-xl text-white font-medium">
                    Các Sản Phẩm Trà Thượng Hạng
                  </h4>
                  <p className="text-xs text-[#F5E6C8]/80 leading-relaxed mt-0.5 font-light">
                    10 phẩm danh trà Shan Tuyết cổ thụ, trà bánh Phổ Nhĩ, bạch trà tiên và hộp quà tặng tri ân.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Location & Gift Voucher Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
            
            {/* Location Card */}
            <div className="bg-[#3D0A0A]/80 border border-[#D4AF37]/30 rounded-xl p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-[#FFDF9E] font-serif text-base sm:text-lg font-medium mb-2.5">
                  <MapPin className="w-5 h-5 text-[#FFDF9E] shrink-0" />
                  <span>{GRAND_OPENING_CONFIG.locationName}</span>
                </div>
                <p className="text-xs sm:text-sm text-[#FAF7F2] font-light leading-relaxed mb-4">
                  {GRAND_OPENING_CONFIG.locationAddress}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-[#D4AF37]/20 text-xs">
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-[#FFDF9E] transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Đã sao chép' : 'Sao chép địa chỉ'}</span>
                </button>

                <a
                  href={`tel:${BRAND_CONFIG.hotline.replace(/[^+\d]/g, '')}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-[#FAF7F2] transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-[#FFDF9E]" />
                  <span>Hotline: {BRAND_CONFIG.hotline}</span>
                </a>
              </div>
            </div>

            {/* Next Order Gift Voucher Card */}
            <div className="bg-gradient-to-br from-[#FAF7F2] to-[#F2ECE1] text-[#28221D] rounded-xl p-5 sm:p-6 border-2 border-[#D4AF37] relative flex flex-col justify-between shadow-md">
              <div className="absolute top-3 right-3">
                <span className="text-2xl" role="img" aria-label="ribbon">🎀</span>
              </div>

              <div>
                <span className="text-[11px] font-sans uppercase font-bold text-[#8D342D] tracking-widest block mb-1">
                  MÓN QUÀ TRI ÂN
                </span>
                <h4 className="font-serif text-lg sm:text-xl font-bold text-[#1F1914] mb-2">
                  Lùng Vài Tea xin gửi tặng Quý trà hữu
                </h4>
                <div className="inline-block bg-[#8D342D] text-white px-3 py-1 rounded-sm text-sm sm:text-base font-serif font-bold shadow-xs">
                  Ưu đãi 10% cho đơn tiếp theo
                </div>
                <p className="text-xs text-[#574E43] mt-2.5 font-light leading-relaxed">
                  Quý khách ghé thăm và thưởng trà trong tuần lễ khai trương sẽ được tặng kèm voucher giảm 10% cho lần trải nghiệm kế tiếp.
                </p>
              </div>

              <div className="pt-4 border-t border-[#D8CEBD] text-[11px] text-[#786D5F] flex items-center justify-between">
                <span>Áp dụng toàn bộ hệ thống</span>
                <span className="font-medium text-[#8D342D]">Lùng Vài Tea</span>
              </div>
            </div>

          </div>

          {/* Action CTAs */}
          <div className="mt-10 pt-8 border-t border-[#D4AF37]/30 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/booking"
              className="px-6 sm:px-8 py-3.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B89428] hover:from-[#E5C158] hover:to-[#C9A233] text-[#2C0A0A] font-serif font-bold text-sm sm:text-base tracking-wider uppercase shadow-xl hover:shadow-[#D4AF37]/30 transition-all transform hover:-translate-y-0.5 inline-flex items-center gap-2"
            >
              <span>Đặt phòng nhận ưu đãi 20%</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/#pricing"
              className="px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-[#D4AF37]/60 text-[#FFDF9E] hover:text-white font-sans text-xs sm:text-sm font-medium tracking-wide transition-all inline-flex items-center gap-2"
            >
              <span>Xem bảng giá dịch vụ</span>
            </Link>

            <button
              type="button"
              onClick={() => setShowPosterModal(true)}
              className="px-5 py-3.5 rounded-full bg-black/30 hover:bg-black/50 border border-white/20 text-[#FAF7F2] text-xs sm:text-sm font-medium transition-all inline-flex items-center gap-1.5"
            >
              <Eye className="w-4 h-4 text-[#FFDF9E]" />
              <span>Xem poster gốc</span>
            </button>
          </div>

        </div>

      </div>

      {/* Lightbox Modal for Poster */}
      {showPosterModal && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-label="Poster Tuần lễ Khai trương Lùng Vài Tea"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowPosterModal(false)}
        >
          <div 
            className="relative max-w-2xl w-full max-h-[90vh] bg-[#3B0C0C] rounded-xl overflow-hidden border-2 border-[#D4AF37] shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#260505] border-b border-[#D4AF37]/30">
              <span className="font-serif text-sm sm:text-base text-[#FFDF9E] font-medium">
                Ấn phẩm: Tuần lễ Khai trương Lùng Vài Tea Cầu Giấy
              </span>
              <button
                type="button"
                onClick={() => setShowPosterModal(false)}
                className="p-1 rounded text-[#FAF7F2]/80 hover:text-white hover:bg-white/10"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Poster Image */}
            <div className="relative w-full aspect-[3/4] max-h-[75vh] bg-[#2A0606]">
              <Image
                src="/images/tuan-le-khai-truong.jpg"
                alt="Poster Tuần lễ Khai trương Lùng Vài Tea"
                fill
                sizes="(max-width: 768px) 100vw, 700px"
                className="object-contain"
              />
            </div>

            {/* Footer */}
            <div className="p-3 bg-[#260505] border-t border-[#D4AF37]/30 flex items-center justify-between text-xs text-[#FAF7F2]/80">
              <span>Cơ sở: 12/1 Dịch Vọng Hậu, Cầu Giấy, Hà Nội</span>
              <Link
                href="/booking"
                className="text-[#FFDF9E] hover:underline font-medium"
                onClick={() => setShowPosterModal(false)}
              >
                Đặt bàn ngay →
              </Link>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
