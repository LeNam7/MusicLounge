'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, X, Gift } from 'lucide-react';
import { GRAND_OPENING_CONFIG } from '@/lib/config';

export default function GrandOpeningBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <aside 
      aria-label="Thông báo tuần lễ khai trương"
      className="relative z-50 bg-gradient-to-r from-[#6B1414] via-[#8D342D] to-[#6B1414] text-white border-b border-[#D4AF37]/30 shadow-md text-xs sm:text-sm font-sans"
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-3">
        {/* Left / Center content */}
        <div className="flex-1 flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 text-center sm:text-left">
          <span className="inline-flex items-center gap-1.5 bg-[#D4AF37]/20 text-[#F5E6C8] px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider uppercase border border-[#D4AF37]/40">
            <Sparkles className="w-3 h-3 text-[#F5E6C8] animate-pulse" />
            <span>Khai Trương Cầu Giấy ({GRAND_OPENING_CONFIG.dateRange})</span>
          </span>

          <span className="font-medium text-[#FFF7EC] text-xs sm:text-[13px]">
            Ưu đãi đặc biệt <strong className="text-[#FFDF9E] font-bold text-sm">GIẢM 20%</strong> tất cả dịch vụ & danh trà • <Gift className="w-3.5 h-3.5 inline text-[#FFDF9E] -mt-0.5 ml-1 mr-0.5" /> Tặng voucher 10%
          </span>

          <Link
            href="/#grand-opening"
            className="inline-flex items-center gap-1 text-xs text-[#FFDF9E] hover:text-white underline underline-offset-4 decoration-[#D4AF37]/60 font-medium transition-colors"
          >
            <span>Chi tiết</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Right close button */}
        <button
          onClick={() => setIsVisible(false)}
          type="button"
          aria-label="Đóng thông báo"
          className="shrink-0 p-1 text-[#F5E6C8]/80 hover:text-white hover:bg-white/10 rounded transition-colors"
          title="Đóng thông báo"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
