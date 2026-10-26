'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowRight, 
  Sparkles, 
  Flame, 
  Droplets, 
  Leaf, 
  Eye, 
  X, 
  Award, 
  Compass, 
  Clock, 
  Check,
  CheckCircle2
} from 'lucide-react';
import { INITIAL_TEA_PACKAGES } from '@/lib/config';
import { TeaPackage } from '@/lib/types';

type CategoryFilter = 'all' | 'luc-tra' | 'bach-tra' | 'hong-tra' | 'banh-tra' | 'combo';

export default function TheArtOfTea() {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [selectedTea, setSelectedTea] = useState<TeaPackage | null>(null);

  const categories: { id: CategoryFilter; label: string; count: number }[] = [
    { id: 'all', label: 'Tất Cả Danh Trà', count: INITIAL_TEA_PACKAGES.length },
    { id: 'luc-tra', label: 'Lục Trà Cổ Thụ', count: INITIAL_TEA_PACKAGES.filter(t => t.category === 'luc-tra').length },
    { id: 'bach-tra', label: 'Bạch Trà Di Sản', count: INITIAL_TEA_PACKAGES.filter(t => t.category === 'bach-tra').length },
    { id: 'hong-tra', label: 'Xích Vân Hồng Shan', count: INITIAL_TEA_PACKAGES.filter(t => t.category === 'hong-tra').length },
    { id: 'banh-tra', label: 'Trà Ép Bánh & Hộp Quà', count: INITIAL_TEA_PACKAGES.filter(t => t.category === 'banh-tra').length },
    { id: 'combo', label: 'Điểm Tâm Trà Thất', count: INITIAL_TEA_PACKAGES.filter(t => t.category === 'combo').length },
  ];

  const filteredTeas = activeCategory === 'all'
    ? INITIAL_TEA_PACKAGES
    : INITIAL_TEA_PACKAGES.filter(t => t.category === activeCategory);

  const heroTea = INITIAL_TEA_PACKAGES.find(t => t.isHero) || INITIAL_TEA_PACKAGES[0];

  const steps = [
    {
      step: '01',
      title: 'Búp Chè Cổ Thụ Ngậm Sương',
      desc: 'Những búp trà Shan Tuyết 1 tôm 2 lá được thu hái thủ công từ rạng sáng trên những cây chè cổ thụ hơn 300 năm tuổi tại độ cao 1.500m dưới đỉnh Tây Côn Lĩnh hùng vĩ.',
      icon: Leaf,
    },
    {
      step: '02',
      title: 'Nước Suối Khoáng & Nhiệt Độ Chuẩn',
      desc: 'Nước pha trà được lọc qua tầng gốm sa thạch và đun sôi chuẩn xác từ 85°C - 95°C tuỳ theo độ non của búp trà để đánh thức trọn vẹn tinh dầu và vị ngọt sâu tự nhiên.',
      icon: Droplets,
    },
    {
      step: '03',
      title: 'Ấm Tử Sa Nghi Hưng & Thể Trà',
      desc: 'Được dưỡng trong ấm tử sa nguyên khoáng xốp mịn, lưu giữ hương mật ong rừng Tây Bắc và để lại hậu ngọt sâu thẳm, kéo dài mãi nơi vòm họng sau từng ngụm trà.',
      icon: Flame,
    },
  ];

  return (
    <section id="art-of-tea" className="relative py-24 lg:py-32 bg-sand-light border-b border-stone-dark/20 overflow-hidden">
      
      {/* Subtle Oriental background watermarks */}
      <div className="absolute top-12 -left-20 w-96 h-96 rounded-full bg-brass/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-12 -right-20 w-96 h-96 rounded-full bg-vermilion/5 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 text-brass tracking-[0.3em] uppercase text-xs font-medium">
            <span className="seal-stamp text-[10px] px-1.5 font-sans font-bold">TRÀ</span>
            <span>DANH TRÀ SHAN TUYẾT LÙNG VÀI</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-ivory font-normal leading-tight">
            Một chén trà, hội tụ tinh hoa đất trời Tây Côn Lĩnh
          </h2>
          <p className="text-sm sm:text-base text-stone-light font-light leading-relaxed">
            Khám phá bộ sưu tập danh trà Shan Tuyết cổ thụ chính hãng của <strong className="font-medium text-ivory">Lùng Vài Tea</strong> — nơi tiên phong đưa Lùng Vài từ một địa danh trên bản đồ thành vùng trà được biết đến bởi chất lượng đỉnh cao, sự minh bạch và câu chuyện văn hoá thuần Việt.
          </p>
        </div>

        {/* 1. HERO SPOTLIGHT: Flagship Product Box (Lục Trà Shan Tuyết 1 Tôm 2 Lá) */}
        <div className="mb-20 bg-white border border-brass/30 rounded-xs shadow-md overflow-hidden relative group">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            
            {/* Left: Real Packaging Image (1772x1772) */}
            <div className="lg:col-span-5 relative min-h-[340px] sm:min-h-[420px] bg-sand">
              <Image
                src={heroTea.imageUrl}
                alt={heroTea.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent lg:hidden" />
              
              {/* Seal Badge */}
              <div className="absolute top-4 left-4 bg-vermilion text-white text-[11px] font-serif px-3 py-1.5 shadow-md flex items-center gap-1.5 uppercase tracking-wider">
                <Award className="w-3.5 h-3.5" />
                <span>Sản Phẩm Trọng Tâm</span>
              </div>

              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm p-3 border border-stone-dark/20 text-xs shadow-sm">
                <span className="text-brass font-medium block">{heroTea.name}</span>
                <span className="text-stone-light text-[11px] block">{heroTea.origin}</span>
              </div>
            </div>

            {/* Right: Story & Attributes */}
            <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-brass font-semibold px-2 py-0.5 rounded-xs bg-brass/10 border border-brass/30">
                    DI SẢN TRÀ VIỆT
                  </span>
                  <span className="text-[10px] text-stone-light px-2 py-0.5 rounded-xs bg-sand border border-stone-dark/20">
                    Cổ Thụ Trên 300 Năm Tuổi
                  </span>
                  <span className="text-[10px] text-vermilion font-medium px-2 py-0.5 rounded-xs bg-vermilion/10 border border-vermilion/20">
                    1 Tôm 2 Lá
                  </span>
                </div>

                <h3 className="font-serif text-2xl sm:text-3xl text-ivory font-normal leading-snug">
                  {heroTea.name}
                </h3>
                <p className="font-serif italic text-sm text-brass-light">
                  {heroTea.vietnameseName}
                </p>

                <p className="text-xs sm:text-sm text-stone-light font-light leading-relaxed">
                  {heroTea.description}
                </p>

                {/* Flavor & Ritual Specs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-sand/60 rounded-xs border border-stone-dark/15 text-xs">
                    <span className="text-[10px] tracking-wider uppercase text-brass block font-medium mb-1">
                      Hương & Sắc Nước
                    </span>
                    <span className="text-ivory font-light block leading-relaxed">
                      {heroTea.liquorColor || 'Xanh trong sánh vàng, hương cốm non'}
                    </span>
                  </div>
                  <div className="p-3 bg-sand/60 rounded-xs border border-stone-dark/15 text-xs">
                    <span className="text-[10px] tracking-wider uppercase text-brass block font-medium mb-1">
                      Vị Giác & Hậu Ngọt
                    </span>
                    <span className="text-ivory font-light block leading-relaxed">
                      {heroTea.tasteNotes || 'Chát thanh êm dịu, hậu vị ngọt sâu bền lâu'}
                    </span>
                  </div>
                </div>

                {/* Cultural Quote */}
                <div className="p-3.5 bg-walnut/40 border-l-2 border-brass text-xs text-ivory-muted font-light italic">
                  &ldquo;Lùng Vài Trà tiên phong đưa Lùng Vài từ một địa danh trên bản đồ thành vùng trà được biết đến bởi chất lượng, sự minh bạch và câu chuyện văn hoá!&rdquo;
                </div>
              </div>

              {/* Action row */}
              <div className="pt-4 border-t border-stone-dark/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] text-stone-light">Giá một ấm thưởng trà tại phòng:</div>
                  <div className="font-serif text-2xl text-brass font-medium">
                    {heroTea.price.toLocaleString('vi-VN')} đ
                  </div>
                  <div className="text-[11px] text-stone-light">{heroTea.servings}</div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedTea(heroTea)}
                    className="px-4 py-2.5 border border-stone-dark/40 hover:border-brass text-xs tracking-wider uppercase text-ivory hover:text-brass transition-colors inline-flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Xem Chi Tiết</span>
                  </button>
                  <Link
                    href={`/booking?tea=${heroTea.id}`}
                    className="px-5 py-2.5 bg-brass hover:bg-brass-light text-white font-medium text-xs tracking-wider uppercase transition-colors inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <span>Đặt Phòng Thưởng Trà</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* 2. CATEGORY FILTER TABS */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs uppercase tracking-[0.25em] text-brass font-medium block">
                THỰC ĐƠN DANH TRÀ LÙNG VÀI
              </span>
              <h3 className="font-serif text-xl sm:text-2xl text-ivory font-normal mt-1">
                Tuyển chọn theo từng tầng hương & phương pháp chế biến
              </h3>
            </div>
            <span className="hidden sm:inline-block text-xs text-stone-light">
              Hiển thị: <strong className="text-brass">{filteredTeas.length}</strong> danh trà
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 pb-1">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3.5 py-1.5 text-xs font-serif tracking-wider transition-all rounded-xs border ${
                    isActive
                      ? 'bg-brass text-white border-brass font-medium shadow-xs'
                      : 'bg-white text-stone-light border-stone-dark/30 hover:border-brass/40 hover:text-ivory'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/20 text-white font-bold' : 'bg-sand text-stone-light'
                  }`}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. PRODUCT CATALOG GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-20">
          {filteredTeas.map((tea) => {
            return (
              <div
                key={tea.id}
                className="bg-white border border-stone-dark/30 hover:border-brass/50 rounded-xs overflow-hidden transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-md group"
              >
                <div>
                  {/* Image container */}
                  <div className="relative aspect-[4/3] bg-sand overflow-hidden">
                    <Image
                      src={tea.imageUrl}
                      alt={tea.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* High-Contrast Tags Overlay */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                      {tea.tags.slice(0, 2).map((tg, idx) => (
                        <span
                          key={idx}
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-xs shadow-sm tracking-wide ${
                            idx === 0
                              ? 'bg-vermilion text-white border border-vermilion-light/40'
                              : 'bg-charcoal-dark/95 backdrop-blur-xs text-ivory border border-stone-dark/40 font-semibold'
                          }`}
                        >
                          {tg}
                        </span>
                      ))}
                    </div>

                    {/* Quick view button overlay */}
                    <button
                      onClick={() => setSelectedTea(tea)}
                      className="absolute bottom-3 right-3 bg-white hover:bg-brass text-ivory hover:text-white p-2 rounded-full shadow-md transition-colors border border-stone-dark/30"
                      title="Xem chi tiết danh trà"
                      aria-label="Xem chi tiết danh trà"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Body Info */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-stone-light">
                      <span className="flex items-center gap-1 text-brass font-medium">
                        <Compass className="w-3 h-3" />
                        {tea.origin.split(',')[0]}
                      </span>
                      <span>{tea.servings.split('(')[0]}</span>
                    </div>

                    <h4 className="font-serif text-lg text-ivory font-medium group-hover:text-brass-light transition-colors line-clamp-1">
                      {tea.name}
                    </h4>

                    <p className="text-[11px] font-serif italic text-brass-light line-clamp-1">
                      {tea.vietnameseName}
                    </p>

                    <p className="text-xs text-stone-light font-light leading-relaxed line-clamp-2">
                      {tea.description}
                    </p>

                    {tea.tasteNotes && (
                      <div className="pt-2 border-t border-stone-dark/15 text-[11px] text-stone-light flex items-start gap-1.5">
                        <Sparkles className="w-3 h-3 text-brass mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-1 italic">{tea.tasteNotes}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer price & CTA */}
                <div className="p-5 pt-0 border-t border-stone-dark/15 flex items-center justify-between gap-2 mt-2">
                  <div>
                    <span className="text-[10px] text-stone-light block">Giá thưởng thức</span>
                    <span className="font-serif text-base text-brass font-semibold">
                      {tea.price.toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedTea(tea)}
                      className="text-xs text-stone-light hover:text-ivory px-2 py-1.5 transition-colors"
                    >
                      Chi tiết
                    </button>
                    <Link
                      href={`/booking?tea=${tea.id}`}
                      className="px-3.5 py-1.5 bg-sand hover:bg-brass hover:text-white text-ivory text-xs font-serif tracking-wider transition-colors rounded-xs border border-stone-dark/40 flex items-center gap-1 shadow-xs font-medium"
                    >
                      <span>Chọn Trà</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* 4. TEA CEREMONY & CULTURE STORY (with real landscape photo: vung-tra-lung-vai.jpg) */}
        <div className="bg-white border border-stone-dark/30 rounded-xs p-8 sm:p-12 mb-20 shadow-sm relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-2 text-brass tracking-[0.25em] uppercase text-xs font-medium">
                <span className="seal-stamp text-[10px] px-1.5 font-sans font-bold">NGUỒN CỘI</span>
                <span>VÙNG TRÀ SHAN TUYẾT LÙNG VÀI</span>
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl text-ivory font-normal leading-snug">
                Nơi mây mù bao phủ búp chè đại thụ hàng trăm năm
              </h3>
              <p className="text-xs sm:text-sm text-stone-light font-light leading-relaxed">
                Nằm ẩn mình dưới chân dãy Tây Côn Lĩnh hùng vĩ, bản Lùng Vài quanh năm sương phủ mờ trắng. Cây chè Shan Tuyết ở đây sinh trưởng hoàn toàn tự nhiên giữa rừng nguyên sinh, rễ cắm sâu vào lòng đá núi hút trọn khoáng chất tinh tuý của đất mẹ.
              </p>
              <p className="text-xs sm:text-sm text-stone-light font-light leading-relaxed">
                Mỗi mẻ trà của Lùng Vài Tea đều được chế tác thủ công bởi các nghệ nhân bản địa am hiểu sâu sắc từng tuần trăng, nhiệt độ và độ ẩm, giữ lại lớp lông tơ tuyết trắng óng ánh và vị ngọt thanh diệu kỳ của núi rừng Hà Giang.
              </p>
              <div className="pt-2 flex flex-wrap gap-4 text-xs text-stone-light">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brass" />
                  <span>100% Cổ thụ tự nhiên Tây Côn Lĩnh</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brass" />
                  <span>Minh bạch xuất xứ & quy trình làm trà</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 relative aspect-[16/10] rounded-xs overflow-hidden border border-stone-dark/20 shadow-md">
              <Image
                src="/images/tea-products/vung-tra-lung-vai.jpg"
                alt="Vùng trà Shan Tuyết Cổ Thụ Lùng Vài - Hà Giang"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 text-white text-xs bg-charcoal/80 backdrop-blur-xs p-2.5 rounded-xs border border-brass/20">
                <span className="font-serif text-brass font-medium block">Bản Lùng Vài, Phương Độ, Hà Giang</span>
                <span className="text-[11px] text-stone-light">Độ cao trên 1.500m • Vùng chè di sản hàng trăm năm</span>
              </div>
            </div>

          </div>
        </div>

        {/* 5. THREE RITUAL PILLARS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((st, i) => {
            const Icon = st.icon;
            return (
              <div
                key={i}
                className="bg-white border border-stone-dark/40 hover:border-brass p-8 rounded-xs transition-all duration-300 relative group flex flex-col justify-between shadow-xs hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-serif text-2xl text-brass/40 group-hover:text-brass transition-colors font-medium">
                      {st.step}
                    </span>
                    <div className="w-10 h-10 rounded-full bg-sand border border-stone-dark/20 flex items-center justify-center text-brass group-hover:border-brass/40 transition-colors">
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
                <div className="mt-6 pt-4 border-t border-stone-dark/15">
                  <span className="text-[10px] tracking-[0.2em] uppercase text-brass/80">
                    Nghi Thức Trà Đạo Cung Đình
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* 6. MODAL: QUICK VIEW DETAIL MODAL */}
      {selectedTea && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedTea(null)}
        >
          <div 
            className="bg-white border border-brass/40 rounded-xs max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedTea(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/95 border border-stone-dark/30 hover:bg-vermilion text-ivory hover:text-white flex items-center justify-center transition-colors shadow-sm"
              aria-label="Đóng chi tiết"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2">
              
              {/* Product Image */}
              <div className="relative aspect-square sm:aspect-auto sm:min-h-full bg-sand">
                <Image
                  src={selectedTea.imageUrl}
                  alt={selectedTea.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 350px"
                  className="object-cover"
                />
                <div className="absolute top-3 left-3 bg-vermilion text-white text-[10px] font-serif px-2.5 py-1 shadow uppercase tracking-wider">
                  Chính Hãng Lùng Vài Tea
                </div>
              </div>

              {/* Product Details */}
              <div className="p-6 sm:p-8 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-brass font-medium">
                    DANH TRÀ THƯỢNG PHẨM
                  </div>
                  <h3 className="font-serif text-2xl text-ivory font-medium leading-snug">
                    {selectedTea.name}
                  </h3>
                  <p className="font-serif italic text-xs text-brass-light">
                    {selectedTea.vietnameseName}
                  </p>
                  <p className="text-xs text-stone-light font-light leading-relaxed">
                    {selectedTea.description}
                  </p>

                  {/* Attributes list */}
                  <div className="space-y-2 pt-2 border-t border-stone-dark/15 text-xs">
                    {selectedTea.liquorColor && (
                      <div className="flex items-start gap-2">
                        <span className="text-[11px] font-medium text-brass w-20 flex-shrink-0">Sắc nước:</span>
                        <span className="text-stone-light font-light">{selectedTea.liquorColor}</span>
                      </div>
                    )}
                    {selectedTea.aroma && (
                      <div className="flex items-start gap-2">
                        <span className="text-[11px] font-medium text-brass w-20 flex-shrink-0">Hương thơm:</span>
                        <span className="text-stone-light font-light">{selectedTea.aroma}</span>
                      </div>
                    )}
                    {selectedTea.tasteNotes && (
                      <div className="flex items-start gap-2">
                        <span className="text-[11px] font-medium text-brass w-20 flex-shrink-0">Vị giác:</span>
                        <span className="text-stone-light font-light">{selectedTea.tasteNotes}</span>
                      </div>
                    )}
                    {selectedTea.temperature && (
                      <div className="flex items-start gap-2">
                        <span className="text-[11px] font-medium text-brass w-20 flex-shrink-0">Nhiệt độ:</span>
                        <span className="text-stone-light font-light">{selectedTea.temperature}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <span className="text-[11px] font-medium text-brass w-20 flex-shrink-0">Xuất xứ:</span>
                      <span className="text-stone-light font-light">{selectedTea.origin}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-dark/15 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-stone-light block">Giá thưởng thức</span>
                    <span className="font-serif text-xl text-brass font-semibold">
                      {selectedTea.price.toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  <Link
                    href={`/booking?tea=${selectedTea.id}`}
                    onClick={() => setSelectedTea(null)}
                    className="px-4 py-2.5 bg-brass hover:bg-brass-light text-white font-medium text-xs tracking-wider uppercase transition-colors inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <span>Đặt Phòng Thưởng Trà</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

    </section>
  );
}