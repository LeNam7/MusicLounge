'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, Maximize2, Sparkles } from 'lucide-react';
import { GALLERY_ITEMS } from '@/lib/config';

export default function VisualGallery() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const categories = [
    { id: 'all', label: 'Tất cả hình ảnh' },
    { id: 'Không Gian Phòng Riêng', label: 'Phòng Trà Riêng Tư' },
    { id: 'Trà Cụ & Nghi Thức', label: 'Trà Cụ & Nghi Thức' },
    { id: 'Nội Thất & Chi Tiết', label: 'Chi Tiết Kiến Trúc' },
  ];

  const filteredItems = selectedCategory === 'all'
    ? GALLERY_ITEMS
    : GALLERY_ITEMS.filter((item) => item.category === selectedCategory);

  // Keyboard navigation for Lightbox
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (lightboxIndex === null) return;
    if (e.key === 'Escape') {
      setLightboxIndex(null);
    } else if (e.key === 'ArrowRight') {
      setLightboxIndex((prev) => (prev !== null ? (prev + 1) % filteredItems.length : null));
    } else if (e.key === 'ArrowLeft') {
      setLightboxIndex((prev) => (prev !== null ? (prev - 1 + filteredItems.length) % filteredItems.length : null));
    }
  }, [lightboxIndex, filteredItems.length]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const activeImage = lightboxIndex !== null ? filteredItems[lightboxIndex] : null;

  return (
    <section id="gallery" className="relative py-28 lg:py-36 bg-charcoal border-b border-stone-dark/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 text-brass tracking-[0.3em] uppercase text-xs font-medium">
            <span className="seal-stamp text-[10px] px-1.5 font-sans font-bold">ẢNH</span>
            <span>BỘ SƯU TẬP HÌNH ẢNH</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-ivory font-normal">
            Không gian & Hơi thở phương Đông
          </h2>
          <p className="text-sm sm:text-base text-stone-light font-light">
            Từng góc nhỏ đều mang dấu ấn của sự kỳ công: vân gỗ óc chó tự nhiên, gốm sứ thủ công, vòm nguyệt môn và ánh đèn dịu êm.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mb-12">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 sm:px-5 py-2 text-xs uppercase tracking-[0.15em] font-medium rounded-xs transition-all ${
                selectedCategory === cat.id
                  ? 'bg-brass text-charcoal shadow-md shadow-brass/20'
                  : 'bg-walnut/50 text-stone-light hover:text-ivory hover:bg-walnut border border-stone/20'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Masonry / Grid Gallery */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredItems.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => setLightboxIndex(idx)}
              className={`relative rounded-sm overflow-hidden border border-stone/20 hover:border-brass/50 group cursor-pointer shadow-lg transition-all duration-500 ${
                idx === 0 || idx === 7 ? 'sm:col-span-2 sm:row-span-2 aspect-[4/3] sm:aspect-auto sm:min-h-[420px]' : 'aspect-[4/3]'
              }`}
            >
              <Image
                src={item.imageUrl}
                alt={item.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal-dark via-charcoal/30 to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />
              
              {/* Overlay Content */}
              <div className="absolute inset-0 p-5 flex flex-col justify-between opacity-90 group-hover:opacity-100 transition-opacity">
                <div className="flex justify-end">
                  <span className="p-2 rounded-full bg-charcoal/70 backdrop-blur-sm text-brass opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-brass block mb-1 font-medium">
                    {item.category}
                  </span>
                  <h3 className="font-serif text-base sm:text-lg text-ivory font-normal leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-stone-light mt-0.5 line-clamp-1">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Interactive Lightbox Modal */}
      {lightboxIndex !== null && activeImage && (
        <div
          className="fixed inset-0 z-50 bg-charcoal-dark/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-6 right-6 z-50 p-2.5 rounded-full bg-walnut/70 border border-brass/30 text-ivory hover:text-brass hover:bg-walnut transition-colors"
            aria-label="Đóng xem ảnh"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Prev Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((prev) => (prev !== null ? (prev - 1 + filteredItems.length) % filteredItems.length : null));
            }}
            className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-walnut/70 border border-brass/30 text-ivory hover:text-brass hover:bg-walnut transition-colors"
            aria-label="Ảnh trước"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Next Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((prev) => (prev !== null ? (prev + 1) % filteredItems.length : null));
            }}
            className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-walnut/70 border border-brass/30 text-ivory hover:text-brass hover:bg-walnut transition-colors"
            aria-label="Ảnh tiếp theo"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Modal Image & Caption Container */}
          <div
            className="relative max-w-5xl max-h-[85vh] w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-[65vh] sm:h-[72vh] rounded-sm overflow-hidden border border-brass/30 shadow-2xl">
              <Image
                src={activeImage.imageUrl}
                alt={activeImage.title}
                fill
                priority
                sizes="(max-width: 1280px) 90vw, 1200px"
                className="object-contain"
              />
            </div>
            
            {/* Caption bar */}
            <div className="mt-4 text-center">
              <span className="text-[11px] uppercase tracking-[0.25em] text-brass font-medium">
                {activeImage.category} • Ảnh {lightboxIndex + 1} / {filteredItems.length}
              </span>
              <h4 className="font-serif text-lg sm:text-xl text-ivory mt-1">
                {activeImage.title}
              </h4>
              <p className="text-xs sm:text-sm text-stone-light">
                {activeImage.subtitle}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
