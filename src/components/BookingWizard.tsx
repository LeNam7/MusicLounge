'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  Copy, 
  Printer, 
  Phone, 
  Sparkles,
  QrCode,
  ShieldAlert,
  Loader2,
  Check
} from 'lucide-react';
import { Booking, Room, TeaPackage } from '@/lib/types';
import { BRAND_CONFIG } from '@/lib/config';

interface BookingWizardProps {
  initialRooms: Room[];
  initialTeaPackages: TeaPackage[];
  preselectedRoomSlug?: string;
  preselectedTeaId?: string;
}

export default function BookingWizard({
  initialRooms,
  initialTeaPackages,
  preselectedRoomSlug,
  preselectedTeaId,
}: BookingWizardProps) {
  // Wizard Step (1 to 5)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [selectedRoomId, setSelectedRoomId] = useState<string>(() => {
    if (preselectedRoomSlug) {
      const match = initialRooms.find(r => r.slug === preselectedRoomSlug);
      if (match) return match.id;
    }
    return initialRooms[0]?.id || '';
  });

  // Today formatted as YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [durationHours, setDurationHours] = useState<number>(2);
  const [guestCount, setGuestCount] = useState<number>(2);
  const [selectedStartTime, setSelectedStartTime] = useState<string>('');
  
  // Tea package selection
  const [selectedTeaId, setSelectedTeaId] = useState<string>(() => {
    if (preselectedTeaId && initialTeaPackages.some(t => t.id === preselectedTeaId)) {
      return preselectedTeaId;
    }
    return 'tea-lung-vai';
  });

  // Customer information
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [specialRequests, setSpecialRequests] = useState<string>('');
  const [agreedTerms, setAgreedTerms] = useState<boolean>(true);

  // Availability query state
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [availableSlots, setAvailableSlots] = useState<{ time: string; available: boolean; reason?: string }[]>([]);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [copiedRef, setCopiedRef] = useState<boolean>(false);

  // Selected Room and Tea objects
  const selectedRoom = initialRooms.find((r) => r.id === selectedRoomId) || initialRooms[0];
  const selectedTea = initialTeaPackages.find((t) => t.id === selectedTeaId);

  // Sync guest count with room capacity
  useEffect(() => {
    if (selectedRoom) {
      if (guestCount < selectedRoom.capacityMin) {
        setGuestCount(selectedRoom.capacityMin);
      } else if (guestCount > selectedRoom.capacityMax) {
        setGuestCount(selectedRoom.capacityMax);
      }
    }
  }, [selectedRoomId, selectedRoom]);

  // Fetch available slots whenever room, date, or duration changes
  useEffect(() => {
    if (!selectedRoomId || !selectedDate) return;

    let isMounted = true;
    setLoadingSlots(true);
    setAvailabilityError(null);

    fetch(`/api/availability?roomId=${selectedRoomId}&date=${selectedDate}&durationHours=${durationHours}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && data.data?.slots) {
          setAvailableSlots(data.data.slots);
          // If previously selected slot is no longer available, reset it
          if (selectedStartTime) {
            const stillValid = data.data.slots.find((s: any) => s.time === selectedStartTime && s.available);
            if (!stillValid) setSelectedStartTime('');
          }
        } else {
          setAvailabilityError(data.error || 'Không thể kiểm tra khung giờ');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setAvailabilityError('Lỗi kết nối máy chủ khi kiểm tra lịch trống.');
      })
      .finally(() => {
        if (isMounted) setLoadingSlots(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedRoomId, selectedDate, durationHours]);

  // Price calculations
  const calculatePricing = () => {
    if (!selectedRoom) return { roomPrice: 0, teaPrice: 0, total: 0, deposit: 0 };
    
    let roomPrice = 0;
    if (durationHours === 2) {
      roomPrice = selectedRoom.pricePackage2h;
    } else {
      roomPrice = Math.round(selectedRoom.pricePerHour * durationHours);
    }

    const teaPrice = selectedTea ? selectedTea.price : 0;
    const total = roomPrice + teaPrice;
    const deposit = Math.round(total * (BRAND_CONFIG.depositPercentage / 100));

    return { roomPrice, teaPrice, total, deposit };
  };

  const pricing = calculatePricing();

  // End time calculation
  const getEndTime = (startTime: string, hours: number) => {
    if (!startTime) return '';
    const [h, m] = startTime.split(':').map(Number);
    const endMinutes = h * 60 + m + Math.round(hours * 60);
    const eh = Math.floor(endMinutes / 60);
    const em = endMinutes % 60;
    return `${eh.toString().padStart(2, '0')}:${em.toString().padStart(2, '0')}`;
  };

  // Submit Booking to Server
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Frontend validations
    if (!customerName.trim() || !customerPhone.trim()) {
      setSubmitError('Vui lòng nhập họ tên và số điện thoại liên hệ.');
      return;
    }

    if (!agreedTerms) {
      setSubmitError('Vui lòng đồng ý với nội quy và chính sách đặt phòng.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: selectedRoom.id,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim() || undefined,
          date: selectedDate,
          startTime: selectedStartTime,
          durationHours,
          guestCount,
          teaPackageId: selectedTeaId || undefined,
          specialRequests: specialRequests.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Đặt phòng không thành công. Vui lòng thử lại.');
      }

      setCreatedBooking(data.data);
      setCurrentStep(5); // Advance to confirmation step
    } catch (err: any) {
      setSubmitError(err.message || 'Đã có lỗi xảy ra. Vui lòng kiểm tra lại kết nối mạng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy booking code to clipboard
  const handleCopyRef = () => {
    if (!createdBooking) return;
    navigator.clipboard.writeText(createdBooking.bookingReference);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* Wizard Progress Steps Indicator */}
      <div className="mb-12">
        <div className="flex items-center justify-between max-w-2xl mx-auto relative">
          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-stone-dark -translate-y-1/2 z-0" />
          
          {[
            { step: 1, label: 'Chọn phòng' },
            { step: 2, label: 'Thời gian' },
            { step: 3, label: 'Trà & Bánh' },
            { step: 4, label: 'Thông tin' },
            { step: 5, label: 'Xác nhận' },
          ].map((item) => (
            <div key={item.step} className="relative z-10 flex flex-col items-center">
              <button
                type="button"
                disabled={item.step > currentStep && !createdBooking}
                onClick={() => {
                  if (item.step < currentStep) setCurrentStep(item.step);
                }}
                className={`w-9 h-9 rounded-full flex items-center justify-center font-serif text-sm transition-all duration-300 ${
                  currentStep === item.step
                    ? 'bg-brass text-white font-semibold shadow-lg shadow-brass/30 ring-4 ring-charcoal'
                    : currentStep > item.step
                    ? 'bg-vermilion text-white ring-2 ring-charcoal'
                    : 'bg-walnut text-stone-light border border-stone-dark'
                }`}
              >
                {currentStep > item.step ? <Check className="w-4 h-4" /> : item.step}
              </button>
              <span className={`text-[10px] sm:text-[11px] mt-1.5 sm:mt-2 tracking-wider font-serif uppercase text-center max-w-[56px] sm:max-w-none leading-tight ${
                currentStep === item.step ? 'text-brass font-medium' : 'text-stone-light'
              }`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Wizard Form Container */}
      <div className="bg-walnut/70 border border-brass/30 rounded-sm p-6 sm:p-10 shadow-2xl backdrop-blur-md">
        
        {/* ================= STEP 1: SELECT A ROOM ================= */}
        {currentStep === 1 && (
          <div className="space-y-8 animate-fadeIn">
            <div className="border-b border-stone/20 pb-4">
              <span className="text-xs uppercase tracking-[0.2em] text-brass font-medium">Bước 1 trên 4</span>
              <h2 className="font-serif text-2xl sm:text-3xl text-ivory mt-1">
                Lựa chọn không gian phòng trà riêng tư
              </h2>
              <p className="text-xs sm:text-sm text-stone-light mt-1">
                Mỗi phòng đều có vách ngăn cách âm tuyệt đối, ấm tử sa chuyên dụng và hỗ trợ trà sư.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {initialRooms.map((room) => {
                const isSelected = selectedRoomId === room.id;
                return (
                  <div
                    key={room.id}
                    onClick={() => setSelectedRoomId(room.id)}
                    className={`relative rounded-sm overflow-hidden border p-5 cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                      isSelected
                        ? 'bg-walnut border-brass shadow-lg shadow-brass/10 ring-1 ring-brass'
                        : 'bg-charcoal/60 border-stone/20 hover:border-brass/40 hover:bg-walnut/40'
                    }`}
                  >
                    <div>
                      <div className="relative aspect-[16/10] rounded-xs overflow-hidden mb-4 border border-stone/20">
                        <Image
                          src={room.images[0] || '/images/hero-tea-ceremony.png'}
                          alt={room.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-charcoal/80 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-brass font-serif tracking-widest uppercase">
                          {room.floor}
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-vermilion text-white p-1 rounded-full shadow">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mb-1">
                        <span className="seal-stamp text-[10px] px-1.5 font-sans font-bold">VIP</span>
                        <span className="text-xs text-stone-light">
                          {room.capacityMin} - {room.capacityMax} khách
                        </span>
                      </div>

                      <h3 className="font-serif text-xl text-ivory font-normal">
                        Phòng {room.name}
                      </h3>
                      <p className="text-xs text-brass-light italic font-serif mt-0.5">
                        &ldquo;{room.tagline}&rdquo;
                      </p>
                      <p className="text-xs text-stone-light mt-2 line-clamp-2 font-light">
                        {room.description}
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-stone/15 flex items-baseline justify-between">
                      <span className="text-[11px] text-stone-light uppercase tracking-wider">
                        Gói 2 giờ:
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="font-serif text-lg font-medium text-brass">
                          {room.pricePackage2h.toLocaleString('vi-VN')}
                        </span>
                        <span className="text-[11px] text-stone-light">đ</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-6 border-t border-stone/20 flex justify-end">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-vermilion hover:bg-vermilion-light text-white text-xs uppercase tracking-[0.2em] font-medium rounded-sm shadow-lg transition-all"
              >
                <span>Tiếp tục: Chọn ngày & giờ</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: SELECT DATE AND TIME ================= */}
        {currentStep === 2 && (
          <div className="space-y-8 animate-fadeIn">
            <div className="border-b border-stone/20 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-[0.2em] text-brass font-medium">Bước 2 trên 4</span>
                <h2 className="font-serif text-2xl sm:text-3xl text-ivory mt-1">
                  Chọn ngày & khung giờ thưởng trà
                </h2>
                <p className="text-xs sm:text-sm text-stone-light mt-1">
                  Phòng đang chọn: <strong className="text-ivory font-medium font-serif">{selectedRoom.name}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-xs text-brass hover:text-ivory underline self-start sm:self-auto"
              >
                Đổi phòng khác
              </button>
            </div>

            {/* Select Date, Duration & Guests */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              
              {/* Date Input */}
              <div>
                <label className="block text-xs uppercase tracking-[0.15em] text-ivory-muted font-medium mb-2">
                  1. Ngày đặt phòng:
                </label>
                <div className="relative">
                  <input
                    type="date"
                    min={todayStr}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-charcoal border border-stone/30 focus:border-brass text-ivory px-4 py-2.5 rounded-sm text-sm outline-none transition-colors"
                  />
                  <CalendarIcon className="w-4 h-4 text-brass absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Duration Selector */}
              <div>
                <label className="block text-xs uppercase tracking-[0.15em] text-ivory-muted font-medium mb-2">
                  2. Thời lượng trải nghiệm:
                </label>
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(parseFloat(e.target.value))}
                  className="w-full bg-charcoal border border-stone/30 focus:border-brass text-ivory px-4 py-2.5 rounded-sm text-sm outline-none transition-colors"
                >
                  <option value={1.5}>1.5 giờ (Gói nhanh)</option>
                  <option value={2}>2.0 giờ (Khuyên dùng - Chuẩn trà lễ)</option>
                  <option value={3}>3.0 giờ (Thong thả đàm đạo)</option>
                  <option value={4}>4.0 giờ (Họp mặt trang trọng)</option>
                </select>
              </div>

              {/* Guest Count */}
              <div>
                <label className="block text-xs uppercase tracking-[0.15em] text-ivory-muted font-medium mb-2">
                  3. Số lượng khách ({selectedRoom.capacityMin} - {selectedRoom.capacityMax} người):
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={selectedRoom.capacityMin}
                    max={selectedRoom.capacityMax}
                    value={guestCount}
                    onChange={(e) => setGuestCount(parseInt(e.target.value) || selectedRoom.capacityMin)}
                    className="w-full bg-charcoal border border-stone/30 focus:border-brass text-ivory px-4 py-2.5 rounded-sm text-sm outline-none transition-colors"
                  />
                  <div className="flex items-center gap-1 text-xs text-stone-light whitespace-nowrap">
                    <Users className="w-4 h-4 text-brass" />
                    <span>khách</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Time Slot Picker Grid */}
            <div className="pt-4 border-t border-stone/15">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase tracking-[0.15em] text-ivory-muted font-medium">
                  4. Chọn khung giờ bắt đầu:
                </span>
                <span className="text-xs text-stone-light">
                  Mở cửa: {BRAND_CONFIG.openTime} - {BRAND_CONFIG.closeTime}
                </span>
              </div>

              {loadingSlots ? (
                <div className="flex items-center justify-center py-12 text-stone-light gap-3 text-xs tracking-wider">
                  <Loader2 className="w-5 h-5 text-brass animate-spin" />
                  <span>Đang tải các khung giờ trống...</span>
                </div>
              ) : availabilityError ? (
                <div className="p-4 bg-vermilion/20 border border-vermilion/40 text-ivory text-xs rounded-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-vermilion" />
                  <span>{availabilityError}</span>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedStartTime === slot.time;
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => setSelectedStartTime(slot.time)}
                        title={slot.reason || `Khung giờ ${slot.time}`}
                        className={`py-2 px-1 text-xs rounded-xs border text-center transition-all ${
                          !slot.available
                            ? 'bg-charcoal/30 border-stone-dark/30 text-stone-dark cursor-not-allowed line-through opacity-40'
                            : isSelected
                            ? 'bg-brass border-brass text-white font-semibold shadow-md'
                            : 'bg-charcoal/70 border-stone/30 text-ivory hover:border-brass/70 hover:bg-walnut'
                        }`}
                      >
                        {slot.time}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Slot Legend */}
              <div className="mt-4 flex items-center gap-6 text-[11px] text-stone-light">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-xs bg-charcoal/70 border border-stone/30" />
                  <span>Còn trống</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-xs bg-brass" />
                  <span>Đang chọn</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-xs bg-charcoal/30 border border-stone-dark/30 line-through opacity-50" />
                  <span>Đã có khách đặt</span>
                </div>
              </div>
            </div>

            {/* Selected Summary bar */}
            {selectedStartTime && (
              <div className="p-4 bg-walnut border border-brass/30 rounded-sm flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-brass" />
                  <span>
                    Khung giờ đã chọn: <strong className="text-ivory font-medium">{selectedStartTime} – {getEndTime(selectedStartTime, durationHours)}</strong> ({durationHours} tiếng)
                  </span>
                </div>
                <span className="text-brass font-medium">
                  {pricing.roomPrice.toLocaleString('vi-VN')} đ
                </span>
              </div>
            )}

            {/* Step navigation */}
            <div className="pt-6 border-t border-stone/20 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-stone-light hover:text-ivory py-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại</span>
              </button>

              <button
                type="button"
                disabled={!selectedStartTime}
                onClick={() => setCurrentStep(3)}
                className={`inline-flex items-center gap-2 px-8 py-3.5 text-xs uppercase tracking-[0.2em] font-medium rounded-sm shadow-lg transition-all ${
                  selectedStartTime
                    ? 'bg-vermilion hover:bg-vermilion-light text-white cursor-pointer'
                    : 'bg-stone-dark/50 text-stone-light/50 cursor-not-allowed'
                }`}
              >
                <span>Tiếp tục: Chọn trà</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: REVIEW THE BOOKING & TEA PAIRING ================= */}
        {currentStep === 3 && (
          <div className="space-y-8 animate-fadeIn">
            <div className="border-b border-stone/20 pb-4">
              <span className="text-xs uppercase tracking-[0.2em] text-brass font-medium">Bước 3 trên 4</span>
              <h2 className="font-serif text-2xl sm:text-3xl text-ivory mt-1">
                Lựa chọn danh trà thưởng thức & điểm tâm
              </h2>
              <p className="text-xs sm:text-sm text-stone-light mt-1">
                Quý khách có thể chọn danh trà ủ nguyên khoáng để chuẩn bị sẵn sàng khi bước vào phòng.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {initialTeaPackages.map((tea) => {
                const isSelected = selectedTeaId === tea.id;
                return (
                  <div
                    key={tea.id}
                    onClick={() => setSelectedTeaId(tea.id)}
                    className={`p-4 rounded-sm border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-walnut border-brass ring-1 ring-brass shadow-md'
                        : 'bg-white border-stone-dark/40 hover:border-brass/40 shadow-xs'
                    }`}
                  >
                    <div className="flex gap-3.5">
                      {tea.imageUrl && (
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-xs overflow-hidden border border-stone-dark/30 bg-sand">
                          <Image
                            src={tea.imageUrl}
                            alt={tea.name}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-xs sm:text-sm font-serif font-medium text-ivory line-clamp-1">
                            {tea.name}
                          </span>
                          <span className="text-xs font-serif text-brass font-semibold flex-shrink-0">
                            {tea.price.toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                        <p className="text-[11px] text-brass-light font-serif italic mb-1 line-clamp-1">
                          {tea.vietnameseName}
                        </p>
                        <p className="text-[11px] sm:text-xs text-stone-light line-clamp-2 font-light">
                          {tea.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-stone-dark/20 flex items-center justify-between text-[11px] text-stone-light">
                      <span className="line-clamp-1">{tea.servings}</span>
                      {isSelected ? (
                        <span className="text-brass flex items-center gap-1 font-medium flex-shrink-0">
                          <Check className="w-3.5 h-3.5" /> Đã chọn
                        </span>
                      ) : (
                        <span className="text-stone-light/70 flex-shrink-0">Bấm để chọn</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Price Snapshot Review Box */}
            <div className="p-6 bg-charcoal/80 border border-brass/30 rounded-sm space-y-3">
              <span className="text-xs uppercase tracking-[0.2em] text-brass font-medium block">
                BẢNG TẠM TÍNH CHI PHÍ
              </span>
              <div className="flex justify-between text-xs text-ivory-muted">
                <span>Phòng {selectedRoom.name} ({durationHours} tiếng):</span>
                <span>{pricing.roomPrice.toLocaleString('vi-VN')} đ</span>
              </div>
              {selectedTea && (
                <div className="flex justify-between text-xs text-ivory-muted">
                  <span>Danh trà: {selectedTea.name}:</span>
                  <span>{pricing.teaPrice.toLocaleString('vi-VN')} đ</span>
                </div>
              )}
              <div className="pt-3 border-t border-stone/20 flex justify-between items-baseline">
                <span className="text-sm font-medium text-ivory">Tổng chi phí dự tính:</span>
                <span className="font-serif text-2xl text-brass font-medium">
                  {pricing.total.toLocaleString('vi-VN')} đ
                </span>
              </div>
              <div className="flex justify-between text-xs text-stone-light pt-1">
                <span>Tiền cọc giữ chỗ (30% theo quy định):</span>
                <span className="text-ivory font-medium">{pricing.deposit.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            {/* Step navigation */}
            <div className="pt-6 border-t border-stone/20 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-stone-light hover:text-ivory py-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-vermilion hover:bg-vermilion-light text-white text-xs uppercase tracking-[0.2em] font-medium rounded-sm shadow-lg transition-all"
              >
                <span>Tiếp tục: Nhập thông tin</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 4: CUSTOMER INFORMATION ================= */}
        {currentStep === 4 && (
          <form onSubmit={handleSubmitBooking} className="space-y-8 animate-fadeIn">
            <div className="border-b border-stone/20 pb-4">
              <span className="text-xs uppercase tracking-[0.2em] text-brass font-medium">Bước 4 trên 4</span>
              <h2 className="font-serif text-2xl sm:text-3xl text-ivory mt-1">
                Thông tin người đặt & Yêu cầu đặc biệt
              </h2>
              <p className="text-xs sm:text-sm text-stone-light mt-1">
                Chúng tôi cam kết bảo mật tuyệt đối thông tin khách hàng theo tiêu chuẩn dịch vụ cao cấp.
              </p>
            </div>

            {submitError && (
              <div className="p-4 bg-vermilion/20 border border-vermilion/40 text-ivory text-xs rounded-sm flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-vermilion mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="block font-medium">Không thể hoàn tất đơn đặt:</strong>
                  <span>{submitError}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Full Name */}
              <div>
                <label className="block text-xs uppercase tracking-[0.15em] text-ivory-muted font-medium mb-2">
                  Họ và tên quý khách *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-charcoal border border-stone/30 focus:border-brass text-ivory px-4 py-3 rounded-sm text-sm outline-none transition-colors"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs uppercase tracking-[0.15em] text-ivory-muted font-medium mb-2">
                  Số điện thoại liên hệ *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ví dụ: 0988 288 368"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-charcoal border border-stone/30 focus:border-brass text-ivory px-4 py-3 rounded-sm text-sm outline-none transition-colors"
                />
              </div>

              {/* Email (Optional) */}
              <div className="sm:col-span-2">
                <label className="block text-xs uppercase tracking-[0.15em] text-ivory-muted font-medium mb-2">
                  Email nhận hoá đơn & thư xác nhận (tuỳ chọn)
                </label>
                <input
                  type="email"
                  placeholder="Ví dụ: an.nguyen@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-charcoal border border-stone/30 focus:border-brass text-ivory px-4 py-3 rounded-sm text-sm outline-none transition-colors"
                />
              </div>

              {/* Special Requests */}
              <div className="sm:col-span-2">
                <label className="block text-xs uppercase tracking-[0.15em] text-ivory-muted font-medium mb-2">
                  Yêu cầu bài trí phòng hoặc lưu ý đặc biệt (tuỳ chọn)
                </label>
                <textarea
                  rows={3}
                  placeholder="Ví dụ: Yêu cầu chuẩn bị ấm tử sa chu nê, hẹn gặp đối tác trang trọng, cần chuẩn bị hoa tươi nhã nhặn..."
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full bg-charcoal border border-stone/30 focus:border-brass text-ivory px-4 py-3 rounded-sm text-sm outline-none transition-colors resize-none"
                />
              </div>

            </div>

            {/* Summary details review */}
            <div className="p-4 bg-charcoal/60 border border-stone/20 rounded-sm text-xs space-y-1.5 text-stone-light">
              <div className="flex justify-between">
                <span>Phòng:</span>
                <span className="text-ivory font-medium">{selectedRoom.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Thời gian:</span>
                <span className="text-ivory font-medium">{selectedDate} | {selectedStartTime} - {getEndTime(selectedStartTime, durationHours)}</span>
              </div>
              <div className="flex justify-between">
                <span>Số khách:</span>
                <span className="text-ivory font-medium">{guestCount} khách</span>
              </div>
              <div className="flex justify-between">
                <span>Tổng chi phí dự tính:</span>
                <span className="text-brass font-medium">{pricing.total.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            {/* Agreement checkbox */}
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="mt-0.5 rounded-xs accent-vermilion"
              />
              <span className="text-xs text-stone-light leading-relaxed">
                Tôi đồng ý với chính sách giữ chỗ cọc 30% và quy định giữ không gian tĩnh lặng chung của phòng trà {BRAND_CONFIG.brandName}.
              </span>
            </label>

            {/* Submit navigation */}
            <div className="pt-6 border-t border-stone/20 flex items-center justify-between">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setCurrentStep(3)}
                className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-stone-light hover:text-ivory py-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-8 py-4 bg-vermilion hover:bg-vermilion-light text-white text-xs uppercase tracking-[0.2em] font-medium rounded-sm shadow-xl shadow-vermilion/30 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang khởi tạo đơn...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Hoàn tất & Nhận mã đặt phòng</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ================= STEP 5: SUBMIT AND CONFIRM ================= */}
        {currentStep === 5 && createdBooking && (
          <div className="space-y-8 animate-fadeIn text-center">
            
            <div className="relative w-16 h-20 mx-auto mb-2">
              <Image
                src="/images/logo-lung-vai-transparent.png"
                alt="Lùng Vài Tea"
                fill
                sizes="64px"
                className="object-contain filter drop-shadow-[0_4px_16px_rgba(141,52,45,0.6)]"
              />
            </div>

            <div className="space-y-2">
              <span className="seal-stamp text-xs px-2 py-0.5 font-sans font-medium">TIẾP NHẬN THÀNH CÔNG</span>
              <h2 className="font-serif text-3xl sm:text-4xl text-ivory font-normal">
                Kính gửi quý khách {createdBooking.customerName}
              </h2>
              <p className="text-xs sm:text-sm text-stone-light max-w-lg mx-auto font-light">
                Yêu cầu đặt phòng của quý khách đã được lưu trữ an toàn trên hệ thống máy chủ của {BRAND_CONFIG.brandName}.
              </p>
            </div>

            {/* Reference Badge Card */}
            <div className="max-w-md mx-auto bg-charcoal p-6 rounded-sm border border-brass/40 shadow-xl space-y-4">
              <span className="text-[11px] uppercase tracking-[0.25em] text-stone-light block">
                MÃ SỐ ĐẶT PHÒNG DUY NHẤT
              </span>
              <div className="flex items-center justify-center gap-3">
                <span className="font-serif text-2xl sm:text-3xl text-brass tracking-wider font-semibold">
                  {createdBooking.bookingReference}
                </span>
                <button
                  type="button"
                  onClick={handleCopyRef}
                  className="p-2 rounded bg-walnut border border-stone/30 text-stone-light hover:text-ivory hover:border-brass transition-colors"
                  title="Sao chép mã"
                >
                  {copiedRef ? <Check className="w-4 h-4 text-brass" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              {copiedRef && (
                <span className="text-[11px] text-brass block">Đã sao chép mã số vào bộ nhớ tạm!</span>
              )}

              {/* Status Badge */}
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-900/40 text-amber-300 border border-amber-600/50">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  Trạng thái: Chờ xác nhận đặt cọc (Pending)
                </span>
              </div>
            </div>

            {/* Booking Details Card */}
            <div className="max-w-md mx-auto text-left bg-charcoal/60 border border-stone/20 p-5 rounded-sm text-xs space-y-2">
              <div className="flex justify-between py-1 border-b border-stone/15">
                <span className="text-stone-light">Phòng thưởng trà:</span>
                <span className="text-ivory font-medium">{createdBooking.roomName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone/15">
                <span className="text-stone-light">Ngày thưởng trà:</span>
                <span className="text-ivory font-medium">{createdBooking.date}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone/15">
                <span className="text-stone-light">Khung giờ:</span>
                <span className="text-ivory font-medium">{createdBooking.startTime} – {createdBooking.endTime} ({createdBooking.durationHours} giờ)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone/15">
                <span className="text-stone-light">Số lượng khách:</span>
                <span className="text-ivory font-medium">{createdBooking.guestCount} người</span>
              </div>
              {createdBooking.teaPackageName && (
                <div className="flex justify-between py-1 border-b border-stone/15">
                  <span className="text-stone-light">Danh trà chọn kèm:</span>
                  <span className="text-ivory font-medium">{createdBooking.teaPackageName}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-stone/15">
                <span className="text-stone-light">Tổng chi phí dự kiến:</span>
                <span className="text-brass font-medium">{createdBooking.totalPrice.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-stone-light">Tiền cọc giữ chỗ (30%):</span>
                <span className="text-amber-400 font-semibold">{createdBooking.depositAmount.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            {/* Payment Guidance Box */}
            <div className="max-w-md mx-auto bg-walnut border border-brass/30 p-5 rounded-sm text-left text-xs space-y-3">
              <div className="flex items-center gap-2 text-brass font-medium uppercase tracking-wider">
                <QrCode className="w-4 h-4" />
                <span>Hướng dẫn hoàn tất giữ chỗ</span>
              </div>
              <p className="text-stone-light leading-relaxed font-light">
                Quý khách vui lòng chuyển khoản khoản tiền cọc <strong>{createdBooking.depositAmount.toLocaleString('vi-VN')} đ</strong> vào tài khoản sau để giữ chỗ:
              </p>
              <div className="bg-charcoal p-3 rounded-xs border border-stone/20 space-y-1 font-mono text-[11px] text-ivory">
                <div>Ngân hàng: <strong>Vietcombank (Hà Nội)</strong></div>
                <div>Số tài khoản: <strong>0011 004 888 999</strong></div>
                <div>Chủ tài khoản: <strong>LUNG VAI TEA CO LTD</strong></div>
                <div>Nội dung CK: <strong className="text-brass">{createdBooking.bookingReference}</strong></div>
              </div>
              <p className="text-[11px] text-stone-light italic">
                Sau khi nhận được tiền cọc, Trà sư quản lý sẽ liên hệ quý khách qua số <strong>{createdBooking.customerPhone}</strong> để xác nhận và chào đón.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-stone/30 hover:border-brass bg-charcoal text-ivory text-xs uppercase tracking-wider rounded-sm transition-colors"
              >
                <Printer className="w-4 h-4 text-brass" />
                <span>In xác nhận / Lưu PDF</span>
              </button>

              <Link
                href={`/lookup?ref=${createdBooking.bookingReference}&phone=${createdBooking.customerPhone}`}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-vermilion hover:bg-vermilion-light text-white text-xs uppercase tracking-wider font-medium rounded-sm transition-colors shadow-lg"
              >
                <span>Xem trạng thái đơn tại mục Tra cứu</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
