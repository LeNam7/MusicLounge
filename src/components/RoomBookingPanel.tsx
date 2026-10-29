'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar as CalendarIcon, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { Room, TimeSlot } from '@/lib/types';
import { BRAND_CONFIG } from '@/lib/config';

interface RoomBookingPanelProps {
  room: Room;
}

export default function RoomBookingPanel({ room }: RoomBookingPanelProps) {
  const router = useRouter();
  const getLocalToday = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const todayStr = getLocalToday();

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [durationHours, setDurationHours] = useState<number>(1.5);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [guestCount, setGuestCount] = useState<number>(room.capacityMin);

  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);

  useEffect(() => {
    let isMounted = true;
    setLoadingSlots(true);

    const fetchRoomSlots = (silent: boolean = false) => {
      if (!silent) setLoadingSlots(true);
      fetch(`/api/availability?roomId=${room.id}&date=${selectedDate}&durationHours=${durationHours}`, {
        cache: 'no-store',
      })
        .then((res) => res.json())
        .then((data) => {
          if (!isMounted) return;
          if (data.success && Array.isArray(data.data?.slots)) {
            setAvailableSlots(data.data.slots);
            if (selectedTime) {
              const stillValid = data.data.slots.find(
                (s: TimeSlot) => s.time === selectedTime && s.status === 'AVAILABLE'
              );
              if (!stillValid) setSelectedTime('');
            }
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted && !silent) setLoadingSlots(false);
        });
    };

    fetchRoomSlots(false);
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchRoomSlots(true);
      }
    }, 10_000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [room.id, selectedDate, durationHours, selectedTime]);

  const handleProceedToBooking = () => {
    const params = new URLSearchParams({
      room: room.slug,
      date: selectedDate,
      duration: durationHours.toString(),
      guests: guestCount.toString(),
    });
    if (selectedTime) {
      params.append('time', selectedTime);
    }
    router.push(`/booking?${params.toString()}`);
  };

  const priceEstimate =
    durationHours === 2 ? room.pricePackage2h : Math.round(room.pricePerHour * durationHours);
  const depositEstimate = Math.round(priceEstimate * (BRAND_CONFIG.depositPercentage / 100));

  return (
    <div className="bg-walnut/90 border border-brass/40 rounded-sm p-6 shadow-2xl backdrop-blur-md sticky top-24 space-y-6">
      <div className="border-b border-stone/20 pb-4">
        <span className="text-[11px] uppercase tracking-[0.2em] text-brass font-medium block">
          ĐẶT PHÒNG NHANH
        </span>
        <div className="flex items-baseline justify-between mt-1">
          <span className="font-serif text-2xl text-ivory font-medium">{room.name}</span>
          <div className="text-right">
            <span className="font-serif text-xl text-brass font-medium">
              {room.pricePackage2h.toLocaleString('vi-VN')} đ
            </span>
            <span className="text-[10px] text-stone-light block">gói tiêu chuẩn 2h</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-wider text-stone-light mb-1.5 font-medium">
            Ngày thưởng trà
          </label>
          <div className="relative">
            <input
              type="date"
              min={todayStr}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-charcoal border border-stone/30 focus:border-brass text-ivory px-3 py-2 rounded-xs text-xs outline-none"
            />
            <CalendarIcon className="w-3.5 h-3.5 text-brass absolute right-3 top-2.5 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-stone-light mb-1.5 font-medium">
            Thời lượng
          </label>
          <select
            value={durationHours}
            onChange={(e) => setDurationHours(parseFloat(e.target.value))}
            className="w-full bg-charcoal border border-stone/30 focus:border-brass text-ivory px-3 py-2 rounded-xs text-xs outline-none"
          >
            <option value={1.5}>1.5 giờ (90 phút — Khuyên dùng)</option>
            <option value={2}>2.0 giờ (Chuẩn trà lễ)</option>
            <option value={3}>3.0 giờ (Đàm đạo)</option>
            <option value={4}>4.0 giờ (Trang trọng)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-stone-light mb-1.5 font-medium">
            Số lượng khách ({room.capacityMin} - {room.capacityMax} người)
          </label>
          <input
            type="number"
            min={room.capacityMin}
            max={room.capacityMax}
            value={guestCount}
            onChange={(e) => setGuestCount(parseInt(e.target.value, 10) || room.capacityMin)}
            className="w-full bg-charcoal border border-stone/30 focus:border-brass text-ivory px-3 py-2 rounded-xs text-xs outline-none"
          />
        </div>

        {/* Quick Time Slot Selector (4 States) */}
        <div className="p-3 rounded-xs bg-[#1E3329] text-white space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] uppercase tracking-wider text-[#E5C384] font-semibold">
              Chọn khung giờ (15p)
            </label>
            <span className="text-[10px] text-white/70">
              {BRAND_CONFIG.openTime} - {BRAND_CONFIG.closeTime}
            </span>
          </div>

          {/* Mini 4-state legend */}
          <div className="grid grid-cols-2 gap-1 text-[10px] text-white/85 pb-1 border-b border-white/10">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-2xs bg-white inline-block" />
              <span>Trắng: Còn trống</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-2xs bg-amber-400 inline-block" />
              <span>Cam: Chờ duyệt</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-2xs bg-emerald-500 inline-block" />
              <span>Xanh: Đã đặt</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-2xs bg-stone-400 inline-block" />
              <span>Xám: Khóa</span>
            </div>
          </div>

          {loadingSlots ? (
            <div className="flex items-center justify-center py-6 text-xs text-white/80 gap-2">
              <Loader2 className="w-3.5 h-3.5 text-[#E5C384] animate-spin" />
              <span>Đang tải...</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {availableSlots.map((slot) => {
                const isSelected = selectedTime === slot.time && slot.status === 'AVAILABLE';
                let cls = '';
                if (slot.status === 'AVAILABLE') {
                  cls = isSelected
                    ? 'bg-[#C69C53] text-[#140E0A] border-[#F5DFB0] font-bold ring-1 ring-[#F5DFB0]'
                    : 'bg-white text-[#1A2E25] border-white hover:bg-[#FAF7F2] cursor-pointer';
                } else if (slot.status === 'PENDING') {
                  cls = 'bg-amber-400 text-amber-950 border-amber-500 cursor-not-allowed';
                } else if (slot.status === 'CONFIRMED') {
                  cls = 'bg-emerald-600 text-white border-emerald-400 cursor-not-allowed';
                } else {
                  cls = 'bg-stone-500/70 text-stone-200 border-stone-400/40 cursor-not-allowed opacity-70';
                }

                return (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={slot.status !== 'AVAILABLE'}
                    onClick={() => setSelectedTime(slot.time)}
                    title={slot.reason || `${slot.time}: ${slot.label}`}
                    className={`py-1.5 px-1 text-[10px] rounded-2xs border text-center transition-all flex flex-col items-center ${cls}`}
                  >
                    <span className="font-mono font-bold">{slot.time}</span>
                    <span className="text-[9px] leading-tight truncate max-w-full">{slot.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Pricing Estimate */}
      <div className="pt-4 border-t border-stone/20 text-xs space-y-1.5 text-stone-light">
        <div className="flex justify-between">
          <span>Tạm tính tiền phòng:</span>
          <span className="text-ivory font-medium">{priceEstimate.toLocaleString('vi-VN')} đ</span>
        </div>
        <div className="flex justify-between">
          <span>Tiền cọc giữ chỗ (30%):</span>
          <span className="text-brass font-medium">{depositEstimate.toLocaleString('vi-VN')} đ</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleProceedToBooking}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-vermilion hover:bg-vermilion-light text-white text-xs uppercase tracking-[0.2em] font-medium rounded-sm shadow-xl shadow-vermilion/25 transition-all cursor-pointer"
      >
        <span>Tiếp tục đặt phòng này</span>
        <ArrowRight className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-2 text-[10px] text-stone-light justify-center">
        <ShieldCheck className="w-3.5 h-3.5 text-brass" />
        <span>Duyệt lịch trực tiếp qua hệ thống quản trị</span>
      </div>
    </div>
  );
}
