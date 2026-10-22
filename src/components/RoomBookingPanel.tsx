'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar as CalendarIcon, Clock, Users, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { Room } from '@/lib/types';
import { BRAND_CONFIG } from '@/lib/config';

interface RoomBookingPanelProps {
  room: Room;
}

export default function RoomBookingPanel({ room }: RoomBookingPanelProps) {
  const router = useRouter();
  const todayStr = new Date().toISOString().split('T')[0];
  
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [durationHours, setDurationHours] = useState<number>(2);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [guestCount, setGuestCount] = useState<number>(room.capacityMin);
  
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [availableSlots, setAvailableSlots] = useState<{ time: string; available: boolean; reason?: string }[]>([]);

  useEffect(() => {
    let isMounted = true;
    setLoadingSlots(true);

    fetch(`/api/availability?roomId=${room.id}&date=${selectedDate}&durationHours=${durationHours}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && data.data?.slots) {
          setAvailableSlots(data.data.slots);
          if (selectedTime) {
            const stillValid = data.data.slots.find((s: any) => s.time === selectedTime && s.available);
            if (!stillValid) setSelectedTime('');
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoadingSlots(false);
      });

    return () => {
      isMounted = false;
    };
  }, [room.id, selectedDate, durationHours]);

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

  const priceEstimate = durationHours === 2 ? room.pricePackage2h : Math.round(room.pricePerHour * durationHours);
  const depositEstimate = Math.round(priceEstimate * (BRAND_CONFIG.depositPercentage / 100));

  return (
    <div className="bg-walnut/90 border border-brass/40 rounded-sm p-6 shadow-2xl backdrop-blur-md sticky top-24 space-y-6">
      
      <div className="border-b border-stone/20 pb-4">
        <span className="text-[11px] uppercase tracking-[0.2em] text-brass font-medium block">
          ĐẶT PHÒNG NHANH
        </span>
        <div className="flex items-baseline justify-between mt-1">
          <span className="font-serif text-2xl text-ivory font-medium">
            {room.name}
          </span>
          <div className="text-right">
            <span className="font-serif text-xl text-brass font-medium">
              {room.pricePackage2h.toLocaleString('vi-VN')} đ
            </span>
            <span className="text-[10px] text-stone-light block">gói tiêu chuẩn 2h</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        
        {/* Date */}
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

        {/* Duration */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-stone-light mb-1.5 font-medium">
            Thời lượng
          </label>
          <select
            value={durationHours}
            onChange={(e) => setDurationHours(parseFloat(e.target.value))}
            className="w-full bg-charcoal border border-stone/30 focus:border-brass text-ivory px-3 py-2 rounded-xs text-xs outline-none"
          >
            <option value={1.5}>1.5 giờ (Nhanh)</option>
            <option value={2}>2.0 giờ (Chuẩn trà lễ)</option>
            <option value={3}>3.0 giờ (Đàm đạo)</option>
            <option value={4}>4.0 giờ (Trang trọng)</option>
          </select>
        </div>

        {/* Guest Count */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-stone-light mb-1.5 font-medium">
            Số lượng khách ({room.capacityMin} - {room.capacityMax} người)
          </label>
          <input
            type="number"
            min={room.capacityMin}
            max={room.capacityMax}
            value={guestCount}
            onChange={(e) => setGuestCount(parseInt(e.target.value) || room.capacityMin)}
            className="w-full bg-charcoal border border-stone/30 focus:border-brass text-ivory px-3 py-2 rounded-xs text-xs outline-none"
          />
        </div>

        {/* Quick Time Slot Selector */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs uppercase tracking-wider text-stone-light font-medium">
              Khung giờ trống
            </label>
            <span className="text-[10px] text-stone">Giờ mở cửa {BRAND_CONFIG.openTime} - {BRAND_CONFIG.closeTime}</span>
          </div>

          {loadingSlots ? (
            <div className="flex items-center justify-center py-4 text-xs text-stone-light gap-2">
              <Loader2 className="w-3.5 h-3.5 text-brass animate-spin" />
              <span>Đang kiểm tra...</span>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto pr-1">
              {availableSlots.slice(0, 16).map((slot) => {
                const isSelected = selectedTime === slot.time;
                return (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => setSelectedTime(slot.time)}
                    className={`py-1.5 text-[11px] rounded-xs border text-center transition-all ${
                      !slot.available
                        ? 'bg-charcoal/30 border-stone-dark/30 text-stone-dark line-through cursor-not-allowed opacity-40'
                        : isSelected
                        ? 'bg-brass text-charcoal border-brass font-semibold shadow-sm'
                        : 'bg-charcoal/80 border-stone/30 text-ivory hover:border-brass/70'
                    }`}
                  >
                    {slot.time}
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

      {/* Action Button */}
      <button
        type="button"
        onClick={handleProceedToBooking}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-vermilion hover:bg-vermilion-light text-ivory text-xs uppercase tracking-[0.2em] font-medium rounded-sm shadow-xl shadow-vermilion/25 transition-all"
      >
        <span>Tiếp tục đặt phòng này</span>
        <ArrowRight className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-2 text-[10px] text-stone-light justify-center">
        <ShieldCheck className="w-3.5 h-3.5 text-brass" />
        <span>Xác nhận tức thì • Hỗ trợ đổi lịch trước 4h</span>
      </div>

    </div>
  );
}
