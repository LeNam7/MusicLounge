import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles, Flame, Droplets, Leaf } from 'lucide-react';
import { INITIAL_TEA_PACKAGES } from '@/lib/config';

export default function TheArtOfTea() {
  const steps = [
    {
      step: '01',
      title: 'Tuyển Chọn Nguồn Trà Cổ Thụ',
      desc: 'Những búp trà Shan Tuyết 1 tôm 1 lá được đồng bào vùng cao Lùng Vài thu hái lúc bình minh, trên những cây chè cổ thụ hơn 300 năm tuổi ngậm sương mù.',
      icon: Leaf,
    },
    {
      step: '02',
      title: 'Nguồn Nước Suối Khoáng Đầu Nguồn',
      desc: 'Nước pha trà được lọc qua lớp gốm sa thạch và đun trong ấm đồng nguyên chất, duy trì nhiệt độ chuẩn xác từ 85°C - 95°C tuỳ từng loại danh trà.',
      icon: Droplets,
    },
    {
      step: '03',
      title: 'Nghi Thức Pha Trà & Ấm Tử Sa',
      desc: 'Trà được đánh thức trong ấm tử sa Nghi Hưng xốp mịn, giúp lưu giữ và phát triển tối đa tầng hương mật hoa, khói gỗ đàn hương và vị ngọt sâu đậm đà.',
      icon: Flame,
    },
  ];

  return (
    <section id="art-of-tea" className="relative py-28 lg:py-36 bg-charcoal border-b border-stone-dark/30 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 text-brass tracking-[0.3em] uppercase text-xs font-medium">
            <span className="seal-stamp text-[10px] px-1.5 font-sans font-bold">TRÀ</span>
            <span>NGHỆ THUẬT THƯỞNG TRÀ ĐƯƠNG ĐẠI</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-ivory font-normal leading-tight">
            Một chén trà, hội tụ khí thiêng của đất trời
          </h2>
          <p className="text-sm sm:text-base text-stone-light font-light leading-relaxed">
            Thưởng trà không đơn thuần là giải khát, mà là một hành trình thức tỉnh ngũ quan: lắng nghe tiếng nước sôi, chiêm ngưỡng sắc nước hổ phách, ngửi hương trà lan toả và cảm nhận vị ngọt hậu lắng đọng.
          </p>
        </div>

        {/* 3 Ritual Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {steps.map((st, i) => {
            const Icon = st.icon;
            return (
              <div
                key={i}
                className="bg-walnut/40 border border-stone/20 hover:border-brass/40 p-8 rounded-sm transition-all duration-300 relative group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-serif text-2xl text-brass/40 group-hover:text-brass transition-colors font-medium">
                      {st.step}
                    </span>
                    <div className="w-10 h-10 rounded-full bg-charcoal/80 border border-stone/20 flex items-center justify-center text-brass group-hover:border-brass/40 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="font-serif text-xl text-ivory mb-3 font-normal group-hover:text-brass-light transition-colors">
                    {st.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-light leading-relaxed font-light">
                    {st.desc}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-stone/10">
                  <span className="text-[10px] tracking-[0.2em] uppercase text-brass/80">
                    Nghi thức cung đình
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Featured Tea Collection Presentation */}
        <div className="bg-gradient-to-r from-walnut/80 via-walnut to-charcoal-light border border-brass/30 p-8 sm:p-12 rounded-sm shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Column: Tea package visual (Real photo: tea-culture-lungvai.png) */}
            <div className="lg:col-span-5 relative">
              <div className="relative aspect-[3/4] sm:aspect-square rounded-sm overflow-hidden border border-brass/30 shadow-2xl">
                <Image
                  src="/images/tea-culture-lungvai.png"
                  alt="Trà Shan Tuyết Cổ Thụ Lùng Vài thượng hạng"
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover object-center hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 bg-charcoal/80 backdrop-blur-md p-3 rounded-xs border border-brass/20 text-xs">
                  <span className="text-brass font-medium block">Thanh Sơn Trà — Lùng Vài</span>
                  <span className="text-stone-light text-[11px]">Độ cao 1.500m • Cây chè cổ thụ 300 năm</span>
                </div>
              </div>
            </div>

            {/* Right Column: Tea varieties list */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <span className="text-xs uppercase tracking-[0.25em] text-brass font-medium block mb-2">
                  DANH TRÀ THƯỢNG HẠNG
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-ivory font-normal">
                  Tuyển tập danh trà được ủ riêng cho không gian phòng trà
                </h3>
              </div>

              <div className="space-y-4">
                {INITIAL_TEA_PACKAGES.slice(0, 3).map((tea) => (
                  <div
                    key={tea.id}
                    className="p-4 bg-charcoal/60 border border-stone/20 hover:border-brass/30 rounded-xs transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-serif text-base text-ivory font-medium">
                          {tea.name}
                        </h4>
                        <span className="text-[10px] text-stone-light px-1.5 py-0.5 rounded bg-walnut border border-stone/20">
                          {tea.origin}
                        </span>
                      </div>
                      <p className="text-xs text-stone-light mt-1 font-light max-w-lg line-clamp-2">
                        {tea.description}
                      </p>
                    </div>
                    <div className="sm:text-right flex-shrink-0">
                      <span className="font-serif text-base text-brass font-medium block">
                        {tea.price.toLocaleString('vi-VN')} đ
                      </span>
                      <span className="text-[10px] text-stone-light">
                        {tea.servings}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <Link
                  href="/booking"
                  className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-brass hover:text-ivory font-medium transition-colors"
                >
                  <span>Đặt phòng và chọn gói trà thưởng thức</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
