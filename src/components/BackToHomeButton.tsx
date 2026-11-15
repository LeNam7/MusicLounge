'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface BackToHomeButtonProps {
  className?: string;
  href?: string;
  label?: string;
}

export default function BackToHomeButton({
  className = '',
  href = 'https://lungvaitea.vn/',
  label = 'Về trang chủ',
}: BackToHomeButtonProps) {
  return (
    <a
      href={href}
      className={`group relative inline-flex items-center gap-2 sm:gap-2.5 px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-full 
        bg-[#FAF7F2]/95 hover:bg-white 
        backdrop-blur-md
        border border-[#9E7D42]/35 hover:border-[#9E7D42]
        shadow-[0_6px_20px_rgba(0,0,0,0.2),0_2px_6px_rgba(0,0,0,0.1)] 
        hover:shadow-[0_10px_28px_rgba(0,0,0,0.25),0_3px_8px_rgba(0,0,0,0.12)]
        text-[#28221D] hover:text-[#1D4A38] 
        text-xs sm:text-[13.5px] font-serif font-medium tracking-wide
        transition-all duration-300 ease-out
        transform hover:-translate-y-0.5 active:translate-y-0 active:scale-98
        cursor-pointer select-none ${className}`}
      title="Quay lại trang chủ chính thức Lùng Vài Tea (lungvaitea.vn)"
    >
      {/* Icon Mũi Tên Đơn Giản & Tinh Tế */}
      <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#9E7D42] group-hover:text-[#1D4A38] group-hover:-translate-x-1 transition-all duration-300 shrink-0" />
      
      {/* Chữ Về Trang Chủ - Rõ Nét, Sáng Sủa */}
      <span className="whitespace-nowrap transition-colors duration-300">
        {label}
      </span>
    </a>
  );
}
