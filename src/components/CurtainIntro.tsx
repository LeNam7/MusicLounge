'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface CurtainIntroProps {
  /**
   * Nếu bật true, chỉ hiển thị 1 lần duy nhất trong phiên duyệt (lưu ở sessionStorage).
   * Mặc định false để bạn có thể trải nghiệm lại mỗi lần F5 / reload trang.
   */
  oncePerSession?: boolean;
}

export default function CurtainIntro({ oncePerSession = false }: CurtainIntroProps) {
  const [stage, setStage] = useState<'initial' | 'opening' | 'finished'>('initial');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    if (oncePerSession && typeof window !== 'undefined') {
      const hasSeen = sessionStorage.getItem('lungvai_curtain_seen');
      if (hasSeen) {
        setStage('finished');
        return;
      }
    }

    // Giai đoạn 1: Giữ rèm đóng trong 850ms để người thưởng ngoạn chiêm ngưỡng triện ấn
    const timerOpening = setTimeout(() => {
      setStage('opening');
      if (oncePerSession && typeof window !== 'undefined') {
        sessionStorage.setItem('lungvai_curtain_seen', 'true');
      }
    }, 850);

    // Giai đoạn 2: Hoàn tất hoạt cảnh sau khi rèm tách hẳn sang hai bên (1400ms)
    const timerFinished = setTimeout(() => {
      setStage('finished');
    }, 2450);

    return () => {
      clearTimeout(timerOpening);
      clearTimeout(timerFinished);
    };
  }, [oncePerSession]);

  const handleSkip = () => {
    setStage('opening');
    setTimeout(() => {
      setStage('finished');
    }, 600);
  };

  // Tránh hydration mismatch & dọn sạch DOM khi kết thúc
  if (!mounted || stage === 'finished') {
    return null;
  }

  const isOpening = stage === 'opening';

  return (
    <div
      className={`fixed inset-0 z-[9999] overflow-hidden select-none transition-all duration-700 ${
        isOpening ? 'pointer-events-none' : 'pointer-events-auto'
      }`}
      aria-label="Khai màn thưởng trà Lùng Vài"
      role="dialog"
      aria-modal="true"
    >
      {/* ===================== CÁNH RÈM BÊN TRÁI (LEFT CURTAIN) ===================== */}
      <div
        className={`absolute top-0 left-0 w-1/2 h-full z-10 transition-transform duration-[1400ms] will-change-transform ${
          isOpening ? '-translate-x-full' : 'translate-x-0'
        }`}
        style={{
          transitionTimingFunction: 'cubic-bezier(0.77, 0, 0.175, 1)',
          background: `
            repeating-linear-gradient(
              90deg,
              #0F251C 0px,
              #183F2F 28px,
              #122F23 56px,
              #1D4A38 84px,
              #143527 112px
            )
          `,
          boxShadow: 'inset -15px 0 35px rgba(0, 0, 0, 0.65)',
        }}
      >
        {/* Nếp gấp lụa nhung & họa tiết sợi dệt Á Đông */}
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#C5A059_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        
        {/* Vệt bóng đổ nếp gấp rèm dọc (Fabric fold shadows) */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/30 pointer-events-none" />

        {/* Nẹp chỉ viền đồng & chỉ thêu viền vàng bên mép tiếp giáp rèm */}
        <div className="absolute top-0 right-0 w-[5px] h-full bg-gradient-to-b from-[#BF9C5E] via-[#E8D19F] to-[#7A5F30] shadow-[0_0_12px_rgba(232,209,159,0.5)]" />
        <div className="absolute top-0 right-[5px] w-[2px] h-full bg-black/40" />

        {/* Góc triện hoa văn đồng thau cổ điển (Góc trên & dưới) */}
        <div className="absolute top-8 right-6 text-[#BF9C5E]/60 text-xs tracking-widest uppercase font-serif hidden sm:block">
          ✦ THƯỢNG PHẨM TRÀ THẤT
        </div>
      </div>

      {/* ===================== CÁNH RÈM BÊN PHẢI (RIGHT CURTAIN) ===================== */}
      <div
        className={`absolute top-0 right-0 w-1/2 h-full z-10 transition-transform duration-[1400ms] will-change-transform ${
          isOpening ? 'translate-x-full' : 'translate-x-0'
        }`}
        style={{
          transitionTimingFunction: 'cubic-bezier(0.77, 0, 0.175, 1)',
          background: `
            repeating-linear-gradient(
              -90deg,
              #0F251C 0px,
              #183F2F 28px,
              #122F23 56px,
              #1D4A38 84px,
              #143527 112px
            )
          `,
          boxShadow: 'inset 15px 0 35px rgba(0, 0, 0, 0.65)',
        }}
      >
        {/* Nếp gấp lụa nhung & họa tiết sợi dệt Á Đông */}
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#C5A059_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        {/* Vệt bóng đổ nếp gấp rèm dọc */}
        <div className="absolute inset-0 bg-gradient-to-l from-black/50 via-transparent to-black/30 pointer-events-none" />

        {/* Nẹp chỉ viền đồng & chỉ thêu viền vàng bên mép tiếp giáp rèm */}
        <div className="absolute top-0 left-0 w-[5px] h-full bg-gradient-to-b from-[#BF9C5E] via-[#E8D19F] to-[#7A5F30] shadow-[0_0_12px_rgba(232,209,159,0.5)]" />
        <div className="absolute top-0 left-[5px] w-[2px] h-full bg-black/40" />

        {/* Góc triện hoa văn đồng thau cổ điển */}
        <div className="absolute top-8 left-6 text-[#BF9C5E]/60 text-xs tracking-widest uppercase font-serif hidden sm:block">
          SHAN TUYẾT CỔ THỤ ✦
        </div>
      </div>

      {/* ===================== TRUNG TÂM: HUY HIỆU & TRIỆN ẤN KHÓA RÈM ===================== */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center justify-center transition-all duration-700 ${
          isOpening ? 'opacity-0 scale-125 blur-sm' : 'opacity-100 scale-100'
        }`}
      >
        {/* Vầng hào quang ánh kim tỏa dịu sau huy hiệu */}
        <div className="absolute -inset-10 rounded-full bg-[radial-gradient(circle,rgba(232,209,159,0.45)_0%,rgba(191,156,94,0.15)_50%,transparent_75%)] blur-xl animate-pulse pointer-events-none" />

        {/* Khối triện ấn tròn trung tâm */}
        <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-full border-2 border-[#BF9C5E] bg-[#143527]/95 shadow-[0_15px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(191,156,94,0.4)] backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          {/* Viền đôi hoa văn viền đồng */}
          <div className="absolute inset-1.5 rounded-full border border-[#BF9C5E]/40 pointer-events-none" />
          
          {/* Logo Lùng Vài Tea dạng ấn nổi */}
          <div className="relative w-16 h-20 sm:w-20 sm:h-24 brightness-125 drop-shadow-[0_0_12px_rgba(255,248,235,0.9)]">
            <Image
              src="/images/logo-lung-vai-transparent.png"
              alt="Lùng Vài Tea"
              fill
              priority
              className="object-contain"
            />
          </div>

          {/* Dòng chữ khai màn */}
          <div className="mt-1">
            <span className="block text-[11px] sm:text-xs font-serif tracking-[0.25em] text-[#E8D19F] uppercase font-medium">
              Khai Màn Thưởng Trà
            </span>
          </div>
        </div>

        {/* Nút lướt nhanh / Bỏ qua */}
        <button
          onClick={handleSkip}
          type="button"
          className="mt-6 px-4 py-1.5 rounded-full border border-[#BF9C5E]/50 bg-black/40 hover:bg-[#1D4A38] text-[#E8D19F] text-xs font-serif tracking-widest transition-all duration-300 hover:scale-105 cursor-pointer backdrop-blur-sm shadow-md"
        >
          Vào Không Gian →
        </button>
      </div>

      {/* Ánh sáng vàng dịu bừng sáng ở khe giữa rèm khi bắt đầu mở */}
      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-32 h-full z-15 bg-gradient-to-r from-transparent via-[#FFF7E6]/40 to-transparent transition-opacity duration-500 pointer-events-none ${
          isOpening ? 'opacity-100 scale-x-150' : 'opacity-0'
        }`}
      />
    </div>
  );
}
