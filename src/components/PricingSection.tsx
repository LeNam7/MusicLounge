'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Info, 
  Clock, 
  Users, 
  Coffee, 
  Sparkles, 
  ArrowRight, 
  Eye, 
  X, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  FileText,
  BadgePercent
} from 'lucide-react';
import { 
  BRAND_CONFIG, 
  OFFICIAL_ROOM_RENTAL_PRICING, 
  OFFICIAL_PRICING_NOTES, 
  OFFICIAL_TEA_MENU, 
  GRAND_OPENING_CONFIG 
} from '@/lib/config';
import { OfficialTeaMenuItem } from '@/lib/types';

export default function PricingSection() {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showOriginalModal, setShowOriginalModal] = useState<boolean>(false);
  const [selectedTeaForModal, setSelectedTeaForModal] = useState<OfficialTeaMenuItem | null>(null);

  const categories = [
    { id: 'all', label: 'Tất Cả 10 Danh Trà' },
    { id: 'luc-tra', label: 'Lục Trà Cổ Thụ' },
    { id: 'hong-tra', label: 'Hồng Trà & Trà Hoang Dã' },
    { id: 'bach-tra', label: 'Bạch Trà Tiên & Di Sản' },
    { id: 'banh-tra', label: 'Phổ Nhĩ Sống (Tản & Bánh)' },
  ];

  const filteredTeas = activeCategory === 'all'
    ? OFFICIAL_TEA_MENU
    : OFFICIAL_TEA_MENU.filter((t) => {
        if (activeCategory === 'banh-tra') return t.category === 'banh-tra';
        return t.category === activeCategory;
      });

  return (
    <section 
      id="pricing" 
      className="relative py-20 lg:py-28 bg-[#FAF7F2] text-[#28221D] border-b border-[#D8CEBD]/60 overflow-hidden"
    >
      {/* Background delicate rice-paper watermark & oriental ornaments */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#9E7D42_0.8px,transparent_0.8px)] [background-size:20px_20px] opacity-25 pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#9E7D42]/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#8D342D]/10 blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Main Paper Document Container */}
        <div className="bg-[#FFFDF9] border-2 border-[#8D342D]/40 rounded-xl shadow-xl shadow-stone-300/40 p-5 sm:p-10 lg:p-14 relative">
          
          {/* Classic Double Frame Line (Like traditional tea price list) */}
          <div className="absolute inset-2 sm:inset-3 border border-[#8D342D]/20 rounded-lg pointer-events-none" />

          {/* Document Header */}
          <div className="relative text-center pb-8 border-b-2 border-[#8D342D]/30 mb-10">
            {/* Top Brand & Seal */}
            <div className="flex flex-col items-center justify-center gap-2 mb-4">
              <div 
                className="relative w-12 h-15 shrink-0"
                style={{ position: 'relative', width: '48px', height: '60px' }}
              >
                <Image
                  src="/images/logo-lung-vai-transparent.png"
                  alt="Lùng Vài Tea"
                  fill
                  sizes="48px"
                  className="object-contain filter drop-shadow-[0_2px_8px_rgba(141,52,45,0.4)]"
                />
              </div>
              <div>
                <h3 className="font-serif text-2xl sm:text-3xl text-[#8D342D] tracking-[0.18em] uppercase font-bold">
                  Lùng Vài Tea
                </h3>
                <p className="font-serif italic text-xs sm:text-sm text-[#7A5F30] tracking-[0.2em] uppercase font-medium mt-0.5">
                  Di sản trong từng vị trà
                </p>
              </div>
            </div>

            {/* Document Main Heading */}
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#8D342D] tracking-tight uppercase mt-2">
              Bảng giá dịch vụ thưởng trà
            </h2>
            <p className="font-sans italic text-xs sm:text-sm text-[#574E43] mt-2 max-w-2xl mx-auto font-normal">
              Dịch vụ thuê phòng trà riêng và sử dụng trà. Đơn giá <strong className="text-[#8D342D] font-bold">ĐÃ bao gồm VAT</strong>.
            </p>

            {/* Grand Opening Discount Highlight Ribbon */}
            <div className="mt-4 inline-flex items-center gap-2 bg-[#8D342D] text-[#FFF7EC] px-4 py-1.5 rounded-full text-xs font-serif font-medium shadow-xs">
              <BadgePercent className="w-4 h-4 text-[#FFDF9E]" />
              <span>
                Đang trong tuần lễ khai trương ({GRAND_OPENING_CONFIG.dateRange}): <strong>Giảm 20%</strong> cho toàn bộ giá niêm yết dưới đây!
              </span>
            </div>

            {/* Top Action to View Original Uploaded Poster */}
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowOriginalModal(true)}
                className="inline-flex items-center gap-1.5 text-xs text-[#8D342D] hover:text-[#574E43] underline underline-offset-4 decoration-[#8D342D]/40 font-medium transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Xem ảnh bảng giá niêm yết gốc</span>
              </button>
            </div>
          </div>

          {/* SECTION I: CHI PHÍ THUÊ PHÒNG TRÀ RIÊNG */}
          <div className="mb-14">
            <div className="flex items-center gap-2.5 mb-5">
              <span className="font-serif text-xl sm:text-2xl font-bold text-[#8D342D] tracking-wide uppercase">
                I. CHI PHÍ THUÊ PHÒNG TRÀ RIÊNG
              </span>
            </div>

            {/* Table for Room Rental */}
            <div className="overflow-x-auto rounded-lg border border-[#8D342D]/30 shadow-xs bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF7F2] text-[#8D342D] border-b border-[#8D342D]/30 font-serif text-xs sm:text-sm uppercase tracking-wider">
                    <th className="py-3 px-3 sm:px-4 font-bold text-center w-14">STT</th>
                    <th className="py-3 px-3 sm:px-6 font-bold">Hạng mục</th>
                    <th className="py-3 px-3 sm:px-6 font-bold text-center">Thời lượng</th>
                    <th className="py-3 px-3 sm:px-6 font-bold text-center">Số lượng khách</th>
                    <th className="py-3 px-3 sm:px-6 font-bold text-right">Đơn giá (VNĐ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4DAC8] text-xs sm:text-sm font-sans">
                  {OFFICIAL_ROOM_RENTAL_PRICING.map((item) => (
                    <tr 
                      key={item.stt}
                      className="hover:bg-[#FAF7F2]/80 transition-colors"
                    >
                      <td className="py-3.5 px-3 sm:px-4 text-center font-serif font-bold text-sm sm:text-base text-[#8D342D]">
                        {item.stt}
                      </td>
                      <td className="py-3.5 px-3 sm:px-6 text-[#1F1914]">
                        <div className="font-serif text-sm sm:text-base font-semibold text-[#1F1914] tracking-tight">
                          {item.title}
                        </div>
                        {item.note && (
                          <div className="text-xs text-[#605548] font-normal mt-0.5 sm:hidden">
                            {item.note}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3 sm:px-6 text-center text-[#3D352E] font-medium whitespace-nowrap">
                        {item.duration}
                      </td>
                      <td className="py-3.5 px-3 sm:px-6 text-center text-[#3D352E] font-medium">
                        {item.capacity}
                      </td>
                      <td className="py-3.5 px-3 sm:px-6 text-right font-serif font-bold text-base sm:text-lg text-[#8D342D] whitespace-nowrap">
                        {item.price.toLocaleString('vi-VN')}
                        <span className="text-xs font-sans font-normal text-[#786D5F] ml-1">đ</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Note under Table I */}
            <div className="mt-3 bg-[#FAF7F2] border-l-4 border-[#8D342D] px-4 py-2.5 rounded-r text-xs sm:text-sm text-[#8D342D] font-serif italic">
              <strong>* Ghi chú:</strong> Giá thuê phòng đã bao gồm trà nương phục vụ trong suốt thời gian sử dụng.
            </div>
          </div>

          {/* SECTION II: BẢNG GIÁ TRÀ */}
          <div className="mb-14">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <span className="font-serif text-xl sm:text-2xl font-bold text-[#8D342D] tracking-wide uppercase">
                II. BẢNG GIÁ TRÀ
              </span>

              {/* View Switcher Controls */}
              <div className="inline-flex items-center gap-1 bg-[#FAF7F2] p-1 rounded-lg border border-[#D8CEBD] text-xs font-sans">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                    viewMode === 'table'
                      ? 'bg-[#8D342D] text-white shadow-xs'
                      : 'text-[#574E43] hover:text-[#1F1914]'
                  }`}
                >
                  Dạng Bảng Chuẩn
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                    viewMode === 'cards'
                      ? 'bg-[#8D342D] text-white shadow-xs'
                      : 'text-[#574E43] hover:text-[#1F1914]'
                  }`}
                >
                  Dạng Thẻ Chi Tiết
                </button>
              </div>
            </div>

            {/* Category Filter Pills (when in cards view) */}
            {viewMode === 'cards' && (
              <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-thin">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                      activeCategory === cat.id
                        ? 'bg-[#8D342D] text-white shadow-xs'
                        : 'bg-white text-[#574E43] border border-[#D8CEBD] hover:border-[#8D342D]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            )}

            {/* Table View (Faithful to Image 1) */}
            {viewMode === 'table' ? (
              <div className="overflow-x-auto rounded-lg border border-[#8D342D]/30 shadow-xs bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FAF7F2] text-[#8D342D] border-b border-[#8D342D]/30 font-serif text-xs sm:text-sm uppercase tracking-wider">
                      <th className="py-3 px-3 sm:px-4 font-bold text-center w-12 sm:w-14">STT</th>
                      <th className="py-3 px-3 sm:px-6 font-bold">Loại trà</th>
                      <th className="py-3 px-3 sm:px-4 font-bold text-center hidden md:table-cell">Hình thức phục vụ</th>
                      <th className="py-3 px-3 sm:px-4 font-bold text-center">Đơn vị tính</th>
                      <th className="py-3 px-3 sm:px-6 font-bold text-right">Đơn giá (VNĐ)</th>
                      <th className="py-3 px-3 sm:px-4 font-bold text-center w-24">Đặt trà</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4DAC8] text-xs sm:text-sm font-sans">
                    {OFFICIAL_TEA_MENU.map((tea) => (
                      <tr 
                        key={tea.stt}
                        className="hover:bg-[#FAF7F2]/80 transition-colors group"
                      >
                        <td className="py-3.5 px-3 sm:px-4 text-center font-serif font-bold text-sm sm:text-base text-[#8D342D]">
                          {tea.stt}
                        </td>
                        <td className="py-3.5 px-3 sm:px-6">
                          <div className="font-serif text-base sm:text-[17px] font-bold text-[#1F1914] group-hover:text-[#8D342D] transition-colors leading-snug tracking-tight">
                            {tea.name}
                          </div>
                          <div className="text-xs sm:text-[13px] text-[#554A3E] font-serif italic mt-0.5 leading-snug">
                            ({tea.categoryName})
                          </div>
                        </td>
                        <td className="py-3.5 px-3 sm:px-4 text-center text-[#2E2822] font-medium hidden md:table-cell">
                          <span className="inline-flex items-center gap-1 bg-[#FAF7F2] px-2 py-0.5 rounded text-xs border border-[#E4DAC8]">
                            <Coffee className="w-3 h-3 text-[#9E7D42]" />
                            <span>{tea.servingType}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-3 sm:px-4 text-center text-[#2E2822] font-medium whitespace-nowrap">
                          {tea.unit}
                        </td>
                        <td className="py-3.5 px-3 sm:px-6 text-right font-serif font-bold text-base sm:text-[17px] text-[#8D342D] whitespace-nowrap">
                          {tea.price.toLocaleString('vi-VN')}
                          <span className="text-xs font-sans font-normal text-[#786D5F] ml-1">đ</span>
                        </td>
                        <td className="py-3.5 px-3 sm:px-4 text-center">
                          <Link
                            href={`/booking?tea=${tea.id}`}
                            className="inline-flex items-center justify-center p-1.5 sm:px-3 sm:py-1 rounded bg-[#FAF7F2] hover:bg-[#8D342D] text-[#8D342D] hover:text-white border border-[#8D342D]/40 text-xs font-medium transition-colors"
                            title={`Đặt phòng với ${tea.name}`}
                          >
                            <span className="hidden sm:inline">Chọn</span>
                            <ArrowRight className="w-3 h-3 sm:hidden" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Cards View */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredTeas.map((tea) => (
                  <div
                    key={tea.id}
                    className="bg-white border border-[#8D342D]/30 hover:border-[#8D342D] rounded-xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <span className="font-serif text-xs font-bold text-[#8D342D] bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#8D342D]/20">
                            Số {tea.stt}
                          </span>
                          <h4 className="font-serif text-lg sm:text-xl font-bold text-[#1F1914] group-hover:text-[#8D342D] transition-colors mt-1.5">
                            {tea.name}
                          </h4>
                          <span className="text-xs font-serif italic text-[#786D5F]">
                            {tea.categoryName}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-serif font-bold text-lg text-[#8D342D]">
                            {tea.price.toLocaleString('vi-VN')} đ
                          </div>
                          <span className="text-[11px] text-[#786D5F] block">{tea.unit} / {tea.servingType}</span>
                        </div>
                      </div>

                      <p className="text-xs text-[#574E43] font-light leading-relaxed mb-4 line-clamp-3">
                        {tea.description}
                      </p>

                      {/* Flavor & Steeping details */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-[#786D5F] bg-[#FAF7F2] p-2.5 rounded-lg border border-[#E4DAC8] mb-4">
                        <div>
                          <span className="font-medium text-[#1F1914] block">Hương vị:</span>
                          <span className="line-clamp-1">{tea.tasteNotes}</span>
                        </div>
                        <div>
                          <span className="font-medium text-[#1F1914] block">Số tuần nước:</span>
                          <span>{tea.steepingCount}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#E4DAC8] flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => setSelectedTeaForModal(tea)}
                        className="text-[#8D342D] hover:underline font-medium"
                      >
                        Chi tiết trà cụ & pha →
                      </button>

                      <Link
                        href={`/booking?tea=${tea.id}`}
                        className="inline-flex items-center gap-1 bg-[#8D342D] text-white px-3.5 py-1.5 rounded-md hover:bg-[#6E241E] font-medium transition-colors"
                      >
                        <span>Đặt phòng</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION III: LƯU Ý */}
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <span className="font-serif text-xl sm:text-2xl font-bold text-[#8D342D] tracking-wide uppercase">
                III. LƯU Ý
              </span>
            </div>

            <div className="bg-[#FAF7F2] border border-[#8D342D]/30 rounded-xl p-5 sm:p-6 shadow-xs">
              <ul className="space-y-3 text-xs sm:text-sm text-[#28221D] font-normal leading-relaxed">
                {OFFICIAL_PRICING_NOTES.map((note, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="text-[#8D342D] font-bold text-base leading-none mt-0.5">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* SECTION IV: THÔNG TIN PHÁP NHÂN & CƠ SỞ (Chân trang ấn phẩm) */}
          <div className="pt-8 border-t-2 border-[#8D342D]/30 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            {/* Left: Producer name & Brand Logo */}
            <div className="md:col-span-5 flex items-start gap-3.5">
              <div 
                className="relative w-11 h-15 shrink-0 pt-0.5"
                style={{ position: 'relative', width: '44px', height: '58px' }}
              >
                <Image
                  src="/images/logo-lung-vai-transparent.png"
                  alt="Lùng Vài Tea Logo"
                  fill
                  sizes="44px"
                  className="object-contain filter drop-shadow-[0_2px_6px_rgba(141,52,45,0.35)]"
                />
              </div>
              <div className="text-xs">
                <span className="font-sans font-bold text-[#8D342D] uppercase block text-[11px] tracking-wider">
                  Sản xuất & Phân phối bởi:
                </span>
                <span className="font-serif font-bold text-[#1F1914] text-xs sm:text-sm block mt-0.5">
                  CÔNG TY CỔ PHẦN TRÀ LÙNG VÀI
                </span>
                <p className="text-[11px] text-[#574E43] mt-1 font-light leading-relaxed">
                  <strong>Trụ sở chính:</strong> {BRAND_CONFIG.headquarters}
                </p>
              </div>
            </div>

            {/* Right: Factory, Location & Contact */}
            <div className="md:col-span-7 space-y-1.5 text-xs text-[#574E43] border-t md:border-t-0 md:border-l border-[#8D342D]/20 pt-4 md:pt-0 md:pl-6">
              <p className="text-[11px] leading-relaxed">
                <strong className="text-[#1F1914]">Xưởng sản xuất:</strong> {BRAND_CONFIG.factory}
              </p>
              <p className="text-[11px] leading-relaxed">
                <strong className="text-[#1F1914]">Cơ sở phục vụ (Cầu Giấy):</strong> {BRAND_CONFIG.cauGiayAddress}
              </p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-[11px] text-[#8D342D] font-medium">
                <a href={`mailto:${BRAND_CONFIG.email}`} className="hover:underline flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  <span>{BRAND_CONFIG.email}</span>
                </a>
                <span className="text-[#D8CEBD]">•</span>
                <a href="https://lungvaitea.vn" target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  <span>{BRAND_CONFIG.website}</span>
                </a>
                <span className="text-[#D8CEBD]">•</span>
                <a href={`tel:${BRAND_CONFIG.hotline.replace(/[^+\d]/g, '')}`} className="hover:underline flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  <span>{BRAND_CONFIG.hotline}</span>
                </a>
                {BRAND_CONFIG.secondaryHotline && (
                  <>
                    <span className="text-[#D8CEBD]">•</span>
                    <a href={`tel:${BRAND_CONFIG.secondaryHotline.replace(/[^+\d]/g, '')}`} className="hover:underline">
                      <span>{BRAND_CONFIG.secondaryHotline}</span>
                    </a>
                  </>
                )}
              </div>
            </div>

          </div>

          {/* Quick Book Room Action Button */}
          <div className="mt-10 text-center pt-6 border-t border-[#8D342D]/20">
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#8D342D] hover:bg-[#6E241E] text-white font-serif font-bold text-sm sm:text-base tracking-wider uppercase shadow-md hover:shadow-lg transition-all"
            >
              <span>Đặt phòng thưởng trà ngay</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>

      </div>

      {/* Lightbox Modal for Original Price List Poster */}
      {showOriginalModal && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-label="Bảng giá dịch vụ thưởng trà niêm yết gốc"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowOriginalModal(false)}
        >
          <div 
            className="relative max-w-3xl w-full max-h-[92vh] bg-[#FAF7F2] rounded-xl overflow-hidden border-2 border-[#8D342D] shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#8D342D] text-white">
              <span className="font-serif text-sm sm:text-base font-bold">
                Ấn phẩm gốc: Bảng giá dịch vụ thưởng trà — Lùng Vài Tea
              </span>
              <button
                type="button"
                onClick={() => setShowOriginalModal(false)}
                className="p-1 rounded text-white/80 hover:text-white hover:bg-white/10"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Poster Image */}
            <div className="relative w-full aspect-[3/4] max-h-[78vh] bg-[#FAF7F2]">
              <Image
                src="/images/bang-gia-dich-vu-thuong-tra.jpg"
                alt="Bảng giá dịch vụ thưởng trà Lùng Vài Tea gốc"
                fill
                sizes="(max-width: 768px) 100vw, 800px"
                className="object-contain"
              />
            </div>

            {/* Footer */}
            <div className="p-3 bg-[#FAF7F2] border-t border-[#8D342D]/20 flex items-center justify-between text-xs text-[#574E43]">
              <span>Đơn giá ĐÃ bao gồm VAT</span>
              <Link
                href="/booking"
                className="text-[#8D342D] hover:underline font-bold"
                onClick={() => setShowOriginalModal(false)}
              >
                Tiến hành đặt phòng trực tuyến →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Tea Detail Modal (When user clicks in card view) */}
      {selectedTeaForModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Chi tiết ${selectedTeaForModal.name}`}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedTeaForModal(null)}
        >
          <div
            className="relative max-w-lg w-full bg-[#FFFDF9] rounded-xl p-6 border-2 border-[#8D342D]/50 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedTeaForModal(null)}
              className="absolute top-4 right-4 text-[#786D5F] hover:text-[#8D342D]"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="font-serif text-xs font-bold text-[#8D342D] bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#8D342D]/20">
              STT: {selectedTeaForModal.stt}
            </span>

            <h3 className="font-serif text-2xl font-bold text-[#1F1914] mt-2">
              {selectedTeaForModal.name}
            </h3>
            <p className="font-serif italic text-sm text-[#786D5F] mb-4">
              {selectedTeaForModal.categoryName}
            </p>

            <div className="bg-[#FAF7F2] p-3 rounded-lg border border-[#E4DAC8] mb-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#786D5F]">Đơn giá:</span>
                <span className="font-bold text-[#8D342D] font-serif text-base">
                  {selectedTeaForModal.price.toLocaleString('vi-VN')} đ / {selectedTeaForModal.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#786D5F]">Hình thức:</span>
                <span className="font-medium text-[#1F1914]">{selectedTeaForModal.servingType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#786D5F]">Nhiệt độ pha:</span>
                <span className="font-medium text-[#1F1914]">{selectedTeaForModal.temperature}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#786D5F]">Số tuần nước:</span>
                <span className="font-medium text-[#1F1914]">{selectedTeaForModal.steepingCount}</span>
              </div>
            </div>

            <p className="text-xs text-[#574E43] leading-relaxed mb-6 font-light">
              {selectedTeaForModal.description}
            </p>

            <div className="flex items-center gap-3">
              <Link
                href={`/booking?tea=${selectedTeaForModal.id}`}
                className="flex-1 py-2.5 rounded-lg bg-[#8D342D] hover:bg-[#6E241E] text-white text-center font-medium text-xs transition-colors"
                onClick={() => setSelectedTeaForModal(null)}
              >
                Đặt phòng thưởng thức trà này
              </Link>
              <button
                type="button"
                onClick={() => setSelectedTeaForModal(null)}
                className="px-4 py-2.5 rounded-lg border border-[#D8CEBD] text-xs font-medium hover:bg-[#FAF7F2]"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
