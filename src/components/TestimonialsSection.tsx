import React from 'react';
import { TESTIMONIALS } from '@/lib/config';
import { Quote } from 'lucide-react';

export default function TestimonialsSection() {
  return (
    <section className="relative py-28 lg:py-36 bg-charcoal-light border-b border-stone-dark/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 text-brass tracking-[0.3em] uppercase text-xs font-medium">
            <span className="seal-stamp text-[10px] px-1.5 font-sans font-bold">ĐÁNH GIÁ</span>
            <span>CẢM NHẬN TỪ KHÁCH THƯỞNG TRÀ</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-ivory font-normal">
            Khoảng lặng lưu dấu trong lòng khách quý
          </h2>
          <p className="text-sm sm:text-base text-stone-light font-light">
            Những chia sẻ chân thành từ những vị khách đã dành thời gian thưởng trà và đàm đạo tại Lùng Vài Tea.
          </p>
        </div>

        {/* Testimonials 3 Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.id}
              className="bg-walnut/40 border border-stone/20 hover:border-brass/40 p-8 rounded-sm transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <Quote className="w-8 h-8 text-brass/40 mb-4 group-hover:text-brass transition-colors" />
                <p className="font-serif text-base text-ivory/90 leading-relaxed italic mb-6">
                  &ldquo;{t.content}&rdquo;
                </p>
              </div>

              <div className="pt-4 border-t border-stone/15 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-medium text-ivory">
                    {t.author}
                  </h4>
                  <span className="text-stone-light text-[11px] block">
                    {t.role}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-charcoal text-brass border border-brass/20">
                    {t.room}
                  </span>
                  <span className="text-[10px] text-stone-light block mt-1">
                    {t.date}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
