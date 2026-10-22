import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CalendarCheck, PhoneCall, Sparkles } from 'lucide-react';
import { BRAND_CONFIG } from '@/lib/config';

export default function FinalBookingInvitation() {
  return (
    <section className="relative py-28 lg:py-36 bg-charcoal overflow-hidden border-b border-stone-dark/30">
      {/* Background visual with rich dark overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/courtyard-twilight.jpg"
          alt="Sân vườn nguyệt môn tĩnh lặng lúc hoàng hôn tại Lùng Vài Tea"
          fill
          sizes="100vw"
          className="object-cover object-center opacity-30 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/80 to-charcoal" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-8">
        
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-brass/40 bg-walnut/70 backdrop-blur-md shadow-lg">
          <span className="seal-stamp text-[10px] px-1.5 font-sans font-bold">LỜI MỜI</span>
          <span className="text-xs uppercase tracking-[0.25em] text-ivory-muted font-medium">
            LỜI MỜI THƯỞNG TRÀ
          </span>
        </div>

        <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal text-ivory leading-[1.2]">
          Một chén trà, một khoảng riêng <br />
          <span className="italic text-brass-light">dành cho bạn.</span>
        </h2>

        <p className="text-sm sm:text-base md:text-lg text-ivory-muted max-w-2xl mx-auto font-light leading-relaxed">
          Chọn không gian phù hợp và dành cho mình một khoảng thời gian thật chậm. Để hương trầm, sắc gỗ và dòng nước ấm xoa dịu tâm trí sau những ngày tháng bộn bề.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          <Link
            href="/booking"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-vermilion hover:bg-vermilion-light text-ivory text-xs uppercase tracking-[0.2em] font-medium rounded-sm shadow-xl shadow-vermilion/30 hover:shadow-vermilion/50 transition-all active:translate-y-0.5"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Chọn phòng và đặt lịch</span>
          </Link>

          <a
            href={`tel:${BRAND_CONFIG.hotline.replace(/\s+/g, '')}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 border border-brass/40 hover:border-brass bg-walnut/40 hover:bg-walnut/70 backdrop-blur-sm text-ivory hover:text-brass text-xs uppercase tracking-[0.2em] font-medium rounded-sm transition-all"
          >
            <PhoneCall className="w-4 h-4 text-brass" />
            <span>Hotline: {BRAND_CONFIG.hotline}</span>
          </a>
        </div>

        <div className="pt-6 text-xs text-stone-light">
          <span>* Hệ thống cập nhật khung giờ trống theo thời gian thực. Đặt trước tối thiểu 1 tiếng để chúng tôi chuẩn bị ấm chén & trà cụ tốt nhất.</span>
        </div>

      </div>
    </section>
  );
}
