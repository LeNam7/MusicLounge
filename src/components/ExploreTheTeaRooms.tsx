'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Users, Clock, Sparkles, ArrowRight, ShieldCheck, Check, Calendar } from 'lucide-react';
import { Room } from '@/lib/types';

interface ExploreRoomsProps {
  rooms: Room[];
}

export default function ExploreTheTeaRooms({ rooms }: ExploreRoomsProps) {
  const [activeRoomIndex, setActiveRoomIndex] = useState(0);
  const activeRoom = rooms[activeRoomIndex] || rooms[0];

  return (
    <section id="rooms" className="relative py-28 lg:py-36 bg-charcoal-light border-b border-stone-dark/30 overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brass/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-vermilion/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 text-brass tracking-[0.3em] uppercase text-xs font-medium">
              <span className="seal-stamp text-[10px] px-1.5 font-sans font-bold">PHÒNG</span>
              <span>BỘ SƯU TẬP PHÒNG TRÀ RIÊNG TƯ</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-ivory font-normal">
              Bốn không gian, bốn phong vị tĩnh tại
            </h2>
            <p className="text-sm sm:text-base text-stone-light max-w-xl font-light">
              Mỗi phòng trà tại Oriental Serenity được kiến tạo với một linh hồn và khí chất riêng biệt, phù hợp từ buổi đối ẩm 2 người đến tiệc trà trang trọng 16 khách.
            </p>
          </div>

          <Link
            href="/booking"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-brass hover:text-ivory pb-1 border-b border-brass/50 hover:border-ivory transition-all self-start md:self-end font-medium"
          >
            <span>Xem lịch & Đặt phòng ngay</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Room Navigation Tabs */}
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-4 scrollbar-none border-b border-stone/20 mb-10">
          {rooms.map((room, idx) => (
            <button
              key={room.id}
              onClick={() => setActiveRoomIndex(idx)}
              className={`flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 rounded-t-sm transition-all text-left whitespace-nowrap ${
                activeRoomIndex === idx
                  ? 'bg-walnut text-ivory border-t-2 border-brass shadow-md'
                  : 'text-stone-light hover:text-ivory hover:bg-walnut/30'
              }`}
            >
              <span className="font-serif text-base sm:text-lg font-medium text-brass">
                Phòng {room.name}
              </span>
              <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-charcoal/60 text-stone-light">
                {room.capacityMin}-{room.capacityMax} khách
              </span>
            </button>
          ))}
        </div>

        {/* Active Room Featured Showcase */}
        {activeRoom && (
          <div className="bg-walnut/70 border border-brass/30 rounded-sm overflow-hidden shadow-2xl backdrop-blur-md">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
              
              {/* Left Column: Room Photography with Gallery Thumbnails */}
              <div className="lg:col-span-7 relative flex flex-col justify-between bg-charcoal min-h-[380px] lg:min-h-[520px]">
                <div className="relative w-full h-[360px] lg:h-full overflow-hidden group">
                  <Image
                    src={activeRoom.images[0] || '/images/hero-tea-ceremony.png'}
                    alt={`Phòng trà ${activeRoom.name}`}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-transparent to-transparent opacity-80" />
                  
                  {/* Floating Floor Badge */}
                  <div className="absolute top-4 left-4 bg-charcoal/80 backdrop-blur-md border border-brass/30 px-3 py-1 rounded-sm text-xs text-brass font-serif tracking-widest uppercase">
                    {activeRoom.floor} • {activeRoom.areaSqm}m²
                  </div>
                </div>

                {/* Gallery Thumbnail Preview Bar */}
                <div className="p-3 bg-charcoal/90 border-t border-stone/20 flex items-center gap-3 overflow-x-auto">
                  {activeRoom.images.map((imgUrl, i) => (
                    <div
                      key={i}
                      className="relative w-16 h-12 flex-shrink-0 rounded-xs overflow-hidden border border-brass/20 cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
                    >
                      <Image
                        src={imgUrl}
                        alt={`Ảnh chi tiết ${i + 1}`}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                  ))}
                  <span className="text-[11px] text-stone-light tracking-wider pl-2 whitespace-nowrap">
                    {activeRoom.images.length} góc chụp chi tiết
                  </span>
                </div>
              </div>

              {/* Right Column: Room Details, Amenities & Pricing */}
              <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6">
                <div>
                  {/* Category and Chinese Seal */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="seal-stamp text-xs px-1.5 py-0.5 font-sans font-bold">VIP</span>
                      <span className="text-xs uppercase tracking-[0.2em] text-brass font-medium">
                        Phòng Trà Cao Cấp
                      </span>
                    </div>
                    <span className="text-xs text-stone-light">
                      Diện tích: {activeRoom.areaSqm}m²
                    </span>
                  </div>

                  {/* Room Name & Tagline */}
                  <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-ivory font-normal">
                    Phòng {activeRoom.name}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-brass-light italic font-serif">
                    &ldquo;{activeRoom.tagline}&rdquo;
                  </p>

                  {/* Description */}
                  <p className="mt-4 text-xs sm:text-sm text-ivory-muted leading-relaxed font-light">
                    {activeRoom.description}
                  </p>

                  {/* Key Specifications Grid */}
                  <div className="mt-6 grid grid-cols-2 gap-3 py-4 border-y border-stone/20 text-xs">
                    <div className="flex items-center gap-2 text-ivory-muted">
                      <Users className="w-4 h-4 text-brass" />
                      <span>Sức chứa: <strong className="text-ivory font-medium">{activeRoom.capacityMin} - {activeRoom.capacityMax} khách</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-ivory-muted">
                      <Clock className="w-4 h-4 text-brass" />
                      <span>Thời lượng: <strong className="text-ivory font-medium">1.5h - 4h</strong></span>
                    </div>
                  </div>

                  {/* Highlights / Amenities list */}
                  <div className="mt-6 space-y-2">
                    <span className="text-[11px] uppercase tracking-[0.2em] text-stone-light block mb-2 font-medium">
                      Tiện ích & Dịch vụ đi kèm:
                    </span>
                    <ul className="grid grid-cols-1 gap-2 text-xs text-ivory-muted">
                      {activeRoom.amenities.slice(0, 4).map((amenity, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-brass mt-0.5 flex-shrink-0" />
                          <span>{amenity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Pricing & CTA Section */}
                <div className="pt-6 border-t border-stone/20 space-y-4">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-stone-light block">
                        Gói trà đạo tiêu chuẩn (2 Giờ):
                      </span>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="font-serif text-2xl sm:text-3xl font-medium text-brass">
                          {activeRoom.pricePackage2h.toLocaleString('vi-VN')}
                        </span>
                        <span className="text-xs text-stone-light">VNĐ / 2 giờ</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-stone-light uppercase tracking-wider block">
                        Thuê theo giờ:
                      </span>
                      <span className="text-xs text-ivory-muted font-medium">
                        {activeRoom.pricePerHour.toLocaleString('vi-VN')} đ/h
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Link
                      href={`/rooms/${activeRoom.slug}`}
                      className="inline-flex items-center justify-center gap-1.5 py-3 px-4 border border-brass/50 hover:border-brass bg-walnut/50 hover:bg-walnut text-ivory text-xs uppercase tracking-[0.15em] font-medium rounded-sm transition-all"
                    >
                      Chi tiết phòng
                    </Link>

                    <Link
                      href={`/booking?room=${activeRoom.slug}`}
                      className="inline-flex items-center justify-center gap-1.5 py-3 px-4 bg-vermilion hover:bg-vermilion-light text-ivory text-xs uppercase tracking-[0.15em] font-medium rounded-sm shadow-lg shadow-vermilion/20 transition-all active:translate-y-0.5"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Đặt phòng này
                    </Link>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

      </div>
    </section>
  );
}
