'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  QrCode,
  Loader2,
  Check,
  XCircle,
  RefreshCw,
  Ban,
} from 'lucide-react';
import { Booking, Room, TeaPackage, TimeSlot } from '@/lib/types';
import { BRAND_CONFIG } from '@/lib/config';

interface BookingWizardProps {
  initialRooms: Room[];
  initialTeaPackages: TeaPackage[];
  preselectedRoomSlug?: string;
  preselectedTeaId?: string;
  preselectedDate?: string;
  preselectedTime?: string;
  preselectedDuration?: number;
  preselectedGuests?: number;
  initialStep?: number;
}

export default function BookingWizard({
  initialRooms,
  initialTeaPackages,
  preselectedRoomSlug,
  preselectedTeaId,
  preselectedDate,
  preselectedTime,
  preselectedDuration,
  preselectedGuests,
  initialStep,
}: BookingWizardProps) {
  const [currentStep, setCurrentStep] = useState<number>(() => {
    if (initialStep && initialStep >= 1 && initialStep <= 4) return initialStep;
    if (preselectedRoomSlug && (preselectedDate || preselectedTime)) return 2;
    return 1;
  });

  const [selectedRoomId, setSelectedRoomId] = useState<string>(() => {
    if (preselectedRoomSlug) {
      const match = initialRooms.find((r) => r.slug === preselectedRoomSlug);
      if (match) return match.id;
    }
    return initialRooms[0]?.id || '';
  });

  const getLocalToday = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const todayStr = getLocalToday();
  const [selectedDate, setSelectedDate] = useState<string>(preselectedDate || todayStr);
  const [durationHours, setDurationHours] = useState<number>(preselectedDuration || 1.5);
  const [guestCount, setGuestCount] = useState<number | ''>(preselectedGuests || 2);
  const [selectedStartTime, setSelectedStartTime] = useState<string>(preselectedTime || '');

  const [selectedTeaId, setSelectedTeaId] = useState<string>(() => {
    if (preselectedTeaId && initialTeaPackages.some((t) => t.id === preselectedTeaId)) {
      return preselectedTeaId;
    }
    return 'counter-service'; // Model C: Mặc định Thưởng trà tự do tại quán (0 đ) để đặt lịch siêu tốc
  });

  const [showTeaCatalog, setShowTeaCatalog] = useState<boolean>(() => {
    return !!(preselectedTeaId && preselectedTeaId !== 'counter-service');
  });

  const [teaCategoryFilter, setTeaCategoryFilter] = useState<'all' | 'tea' | 'combo'>('all');

  // Customer information
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [specialRequests, setSpecialRequests] = useState<string>('');
  const [agreedTerms, setAgreedTerms] = useState<boolean>(true);

  // Availability query state
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [slotNotice, setSlotNotice] = useState<string | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [copiedRef, setCopiedRef] = useState<boolean>(false);

  // Idempotency key per form submission intent
  const idempotencyKeyRef = useRef<string>('');

  const selectedRoom = initialRooms.find((r) => r.id === selectedRoomId) || initialRooms[0];
  const selectedTea = initialTeaPackages.find((t) => t.id === selectedTeaId);

  // Reset idempotency key when booking parameters change
  useEffect(() => {
    idempotencyKeyRef.current = `idem-${selectedRoomId}-${selectedDate}-${selectedStartTime}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 7)}`;
  }, [selectedRoomId, selectedDate, selectedStartTime, durationHours, customerPhone]);

  // Sync guest count with room capacity only when room changes (avoid interrupting active typing)
  useEffect(() => {
    if (selectedRoom) {
      setGuestCount((prev) => {
        const num = Number(prev) || selectedRoom.capacityMin;
        if (num < selectedRoom.capacityMin) return selectedRoom.capacityMin;
        if (num > selectedRoom.capacityMax) return selectedRoom.capacityMax;
        return num;
      });
    }
  }, [selectedRoomId]);

  // Fetch available slots from backend (source of truth)
  const fetchSlots = useCallback(
    async (silent: boolean = false) => {
      if (!selectedRoomId || !selectedDate) return;

      if (!silent) {
        setLoadingSlots(true);
        setAvailabilityError(null);
      }

      try {
        const res = await fetch(
          `/api/availability?roomId=${encodeURIComponent(selectedRoomId)}&date=${encodeURIComponent(
            selectedDate
          )}&durationHours=${encodeURIComponent(String(durationHours))}`,
          { cache: 'no-store' }
        );
        const data = await res.json();

        if (res.ok && data.success && Array.isArray(data.data?.slots)) {
          const slots: TimeSlot[] = data.data.slots;
          setAvailableSlots(slots);
          setAvailabilityError(null);

          // If previously selected slot is no longer AVAILABLE, notify user and clear selection
          if (selectedStartTime) {
            const matching = slots.find((s) => s.time === selectedStartTime);
            if (!matching || matching.status !== 'AVAILABLE') {
              setSelectedStartTime('');
              setSlotNotice(
                `Khung giờ ${selectedStartTime} vừa chuyển sang trạng thái "${
                  matching?.label || 'Không khả dụng'
                }". Vui lòng chọn khung giờ khác.`
              );
            }
          }
        } else if (!silent) {
          setAvailabilityError(data.error || 'Không thể tải trạng thái khung giờ từ máy chủ.');
          setAvailableSlots([]);
        }
      } catch {
        if (!silent) {
          setAvailabilityError(
            'Lỗi kết nối máy chủ khi kiểm tra lịch trống. Hệ thống tạm khóa chọn giờ để đảm bảo chính xác.'
          );
          setAvailableSlots([]);
        }
      } finally {
        if (!silent) {
          setLoadingSlots(false);
        }
      }
    },
    [selectedRoomId, selectedDate, durationHours, selectedStartTime]
  );

  // Initial load on room/date/duration change
  useEffect(() => {
    void fetchSlots(false);
  }, [selectedRoomId, selectedDate, durationHours]);

  // Smart Polling on Step 2 (every 10 seconds when tab is visible)
  useEffect(() => {
    if (currentStep !== 2) return;

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        void fetchSlots(true);
      }
    }, 10_000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void fetchSlots(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [currentStep, fetchSlots]);

  // Live Status Polling on Step 4 (so customer sees approval/rejection in real time)
  useEffect(() => {
    if (currentStep !== 4 || !createdBooking) return;

    const interval = setInterval(async () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      try {
        const res = await fetch(
          `/api/bookings/${encodeURIComponent(createdBooking.bookingReference)}/status?phone=${encodeURIComponent(
            createdBooking.customerPhone
          )}`,
          { cache: 'no-store' }
        );
        const data = await res.json();
        if (res.ok && data.success && data.data) {
          setCreatedBooking((prev) =>
            prev
              ? {
                  ...prev,
                  status: data.data.status,
                  statusCode: data.data.statusCode,
                  rejectionReason: data.data.rejectionReason,
                  cancellationReason: data.data.cancellationReason,
                  reviewedAt: data.data.reviewedAt,
                }
              : prev
          );
        }
      } catch {
        // Ignore transient polling error
      }
    }, 8_000);

    return () => clearInterval(interval);
  }, [currentStep, createdBooking]);

  const calculatePricing = () => {
    if (!selectedRoom) return { roomPrice: 0, teaPrice: 0, total: 0, deposit: 0 };

    const roomPrice =
      durationHours === 2
        ? selectedRoom.pricePackage2h
        : Math.round(selectedRoom.pricePerHour * durationHours);

    const teaPrice = selectedTea ? selectedTea.price : 0;
    const total = roomPrice + teaPrice;
    const deposit = Math.round(total * (BRAND_CONFIG.depositPercentage / 100));

    return { roomPrice, teaPrice, total, deposit };
  };

  const pricing = calculatePricing();

  const getEndTime = (startTime: string, hours: number) => {
    if (!startTime) return '';
    const [h, m] = startTime.split(':').map(Number);
    const endMinutes = h * 60 + m + Math.round(hours * 60);
    const eh = Math.floor(endMinutes / 60);
    const em = endMinutes % 60;
    return `${eh.toString().padStart(2, '0')}:${em.toString().padStart(2, '0')}`;
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setSubmitError(null);

    if (!customerName.trim() || !customerPhone.trim()) {
      setSubmitError('Vui lòng nhập đầy đủ họ tên và số điện thoại liên hệ.');
      return;
    }

    if (!selectedStartTime) {
      setSubmitError('Vui lòng quay lại Bước 2 để chọn một khung giờ còn trống.');
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
        headers: {
          'Content-Type': 'application/json',
          'x-idempotency-key': idempotencyKeyRef.current,
        },
        body: JSON.stringify({
          roomId: selectedRoom.id,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim() || undefined,
          date: selectedDate,
          startTime: selectedStartTime,
          durationHours,
          guestCount: Number(guestCount) || selectedRoom.capacityMin,
          teaPackageId:
            selectedTeaId && selectedTeaId !== 'counter-service' ? selectedTeaId : undefined,
          specialRequests: specialRequests.trim() || undefined,
          idempotencyKey: idempotencyKeyRef.current,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (res.status === 409 || data.code === 'SLOT_UNAVAILABLE') {
          void fetchSlots(false);
        }
        throw new Error(data.error || 'Gửi yêu cầu đặt lịch không thành công. Vui lòng thử lại.');
      }

      setCreatedBooking(data.data);
      void fetchSlots(true);
      setCurrentStep(4);
    } catch (err: unknown) {
      setSubmitError(
        (err as { message?: string })?.message ||
          'Đã có lỗi xảy ra. Vui lòng kiểm tra lại kết nối mạng.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
            { step: 2, label: 'Ngày & Giờ' },
            { step: 3, label: 'Thông tin & Đặt chỗ' },
            { step: 4, label: 'Trạng thái' },
          ].map((item) => (
            <div key={item.step} className="relative z-10 flex flex-col items-center">
              <button
                type="button"
                disabled={item.step > currentStep && !createdBooking}
                onClick={() => {
                  if (item.step < currentStep && !createdBooking) setCurrentStep(item.step);
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
              <span
                className={`text-[10px] sm:text-[11px] mt-1.5 sm:mt-2 tracking-wider font-serif uppercase text-center max-w-[60px] sm:max-w-none leading-tight ${
                  currentStep === item.step ? 'text-brass font-medium' : 'text-stone-light'
                }`}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Wizard Form Container */}
      <div className="bg-walnut/85 border border-brass/30 rounded-sm p-6 sm:p-10 shadow-2xl backdrop-blur-md">
        {/* ================= STEP 1: SELECT A ROOM ================= */}
        {currentStep === 1 && (
          <div className="space-y-8 animate-fadeIn">
            <div className="border-b border-stone/20 pb-4">
              <span className="text-xs uppercase tracking-[0.2em] text-brass font-medium">Bước 1 trên 3</span>
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

                      <h3 className="font-serif text-xl text-ivory font-normal">Phòng {room.name}</h3>
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
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-vermilion hover:bg-vermilion-light text-white text-xs uppercase tracking-[0.2em] font-medium rounded-sm shadow-lg transition-all cursor-pointer"
              >
                <span>Tiếp tục: Chọn ngày & khung giờ</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: SELECT DATE AND TIME (4 SLOT STATES) ================= */}
        {currentStep === 2 && (
          <div className="space-y-8 animate-fadeIn">
            <div className="border-b border-stone/20 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-[0.2em] text-brass font-medium">Bước 2 trên 3</span>
                <h2 className="font-serif text-2xl sm:text-3xl text-ivory mt-1">
                  Chọn ngày & khung giờ thưởng trà
                </h2>
                <p className="text-xs sm:text-sm text-stone-light mt-1">
                  Phòng đang chọn: <strong className="text-ivory font-medium font-serif">Phòng {selectedRoom.name}</strong> ({selectedRoom.floor})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-xs text-brass hover:text-ivory underline self-start sm:self-auto cursor-pointer"
              >
                Đổi phòng khác
              </button>
            </div>

            {/* Select Date, Duration & Guests */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-[0.15em] text-ivory-muted font-medium mb-2">
                  1. Ngày đặt lịch:
                </label>
                <div className="relative">
                  <input
                    type="date"
                    min={todayStr}
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSlotNotice(null);
                    }}
                    className="w-full bg-white border border-stone-dark/80 focus:border-brass text-ivory px-4 py-2.5 rounded-sm text-sm outline-none transition-colors shadow-2xs"
                  />
                  <CalendarIcon className="w-4 h-4 text-brass absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.15em] text-ivory-muted font-medium mb-2">
                  2. Thời lượng sử dụng:
                </label>
                <select
                  value={durationHours}
                  onChange={(e) => {
                    setDurationHours(parseFloat(e.target.value));
                    setSlotNotice(null);
                  }}
                  className="w-full bg-white border border-stone-dark/80 focus:border-brass text-ivory px-4 py-2.5 rounded-sm text-sm outline-none transition-colors shadow-2xs"
                >
                  <option value={1.5}>1.5 giờ (90 phút — Khuyên dùng)</option>
                  <option value={2}>2.0 giờ (Chuẩn trà lễ)</option>
                  <option value={3}>3.0 giờ (Thong thả đàm đạo)</option>
                  <option value={4}>4.0 giờ (Họp mặt trang trọng)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.15em] text-ivory-muted font-medium mb-2">
                  3. Số lượng khách ({selectedRoom.capacityMin} - {selectedRoom.capacityMax} người):
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const cur = Number(guestCount) || selectedRoom.capacityMin;
                      if (cur > selectedRoom.capacityMin) {
                        setGuestCount(cur - 1);
                      }
                    }}
                    disabled={Number(guestCount) <= selectedRoom.capacityMin}
                    className="w-10 h-10 rounded-sm bg-stone-light/10 hover:bg-stone-light/20 active:bg-stone-light/30 border border-stone-dark/40 text-ivory font-bold text-lg flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all shadow-2xs select-none active:scale-95"
                    title="Giảm 1 khách"
                  >
                    −
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={guestCount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setGuestCount(val === '' ? '' : parseInt(val, 10));
                    }}
                    onBlur={() => {
                      const num = Number(guestCount);
                      if (!num || num < selectedRoom.capacityMin) {
                        setGuestCount(selectedRoom.capacityMin);
                      } else if (num > selectedRoom.capacityMax) {
                        setGuestCount(selectedRoom.capacityMax);
                      }
                    }}
                    className="w-20 text-center bg-white border border-stone-dark/80 focus:border-brass text-ivory py-2 rounded-sm text-base font-semibold outline-none transition-colors shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const cur = Number(guestCount) || selectedRoom.capacityMin;
                      if (cur < selectedRoom.capacityMax) {
                        setGuestCount(cur + 1);
                      }
                    }}
                    disabled={Number(guestCount) >= selectedRoom.capacityMax}
                    className="w-10 h-10 rounded-sm bg-stone-light/10 hover:bg-stone-light/20 active:bg-stone-light/30 border border-stone-dark/40 text-ivory font-bold text-lg flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all shadow-2xs select-none active:scale-95"
                    title="Tăng 1 khách"
                  >
                    +
                  </button>
                  <div className="flex items-center gap-1 text-xs text-stone-light ml-1 whitespace-nowrap">
                    <Users className="w-4 h-4 text-brass" />
                    <span>khách</span>
                  </div>
                </div>
              </div>
            </div>

            {slotNotice && (
              <div className="p-3.5 bg-amber-50 border border-amber-400 text-amber-900 text-xs rounded-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>{slotNotice}</span>
              </div>
            )}

            {/* Time Slot Picker Container with Deep Moss Green & Warm Luxury Theme */}
            <div className="p-5 sm:p-6 rounded-sm bg-[#1E3329] text-white border border-[#2F4D3E] shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/15 pb-4">
                <div>
                  <span className="text-xs uppercase tracking-[0.18em] text-[#E5C384] font-semibold block">
                    4. Chọn khung giờ bắt đầu (Mốc 15 phút)
                  </span>
                  <span className="text-[11px] text-white/75">
                    Giờ mở cửa phục vụ: {BRAND_CONFIG.openTime} – {BRAND_CONFIG.closeTime} • Tự động đồng bộ trạng thái
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => void fetchSlots(false)}
                  className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xs bg-white/10 hover:bg-white/20 text-[11px] text-[#E5C384] transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingSlots ? 'animate-spin' : ''}`} />
                  <span>Cập nhật trạng thái</span>
                </button>
              </div>

              {/* 4-State Slot Legend (Chú thích trạng thái) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xs bg-black/25 border border-white/10 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-xs bg-white border border-stone-300 shrink-0 shadow-2xs" />
                  <span className="text-white/95 font-medium">Trắng: Còn trống</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-xs bg-amber-400 border border-amber-600 shrink-0" />
                  <span className="text-amber-200 font-medium">Vàng cam: Đang chờ duyệt</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-xs bg-emerald-500 border border-emerald-700 shrink-0" />
                  <span className="text-emerald-200 font-medium">Xanh lá: Đã xác nhận</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-xs bg-stone-400 border border-stone-500 shrink-0" />
                  <span className="text-stone-300 font-medium">Xám: Không khả dụng</span>
                </div>
              </div>

              {/* Time Slots Grid */}
              {loadingSlots ? (
                <div className="flex items-center justify-center py-14 text-white/80 gap-3 text-xs tracking-wider">
                  <Loader2 className="w-5 h-5 text-[#E5C384] animate-spin" />
                  <span>Đang tải trạng thái các khung giờ từ hệ thống...</span>
                </div>
              ) : availabilityError ? (
                <div className="p-4 bg-red-950/80 border border-red-400/50 text-red-100 text-xs rounded-sm flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-300 shrink-0" />
                    <span>{availabilityError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void fetchSlots(false)}
                    className="px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-xs text-[11px] whitespace-nowrap cursor-pointer"
                  >
                    Thử lại
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-2.5">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedStartTime === slot.time && slot.status === 'AVAILABLE';

                    // State styling per specification (Section V: 5.1)
                    let stateClasses = '';
                    let badgeText = slot.label;

                    if (slot.status === 'AVAILABLE') {
                      if (isSelected) {
                        stateClasses =
                          'bg-[#C69C53] border-[#F5DFB0] text-[#140E0A] ring-2 ring-[#F5DFB0] shadow-lg scale-[1.02] cursor-pointer';
                        badgeText = 'Đang chọn';
                      } else {
                        stateClasses =
                          'bg-white hover:bg-[#FAF7F2] border-white text-[#1A2E25] hover:border-[#E5C384] shadow-sm cursor-pointer';
                        badgeText = 'Còn trống';
                      }
                    } else if (slot.status === 'PENDING') {
                      stateClasses =
                        'bg-amber-400/95 border-amber-500 text-amber-950 cursor-not-allowed opacity-95';
                      badgeText = 'Đang chờ duyệt';
                    } else if (slot.status === 'CONFIRMED') {
                      stateClasses =
                        'bg-emerald-600 border-emerald-400 text-white cursor-not-allowed opacity-95';
                      badgeText = 'Đã đặt';
                    } else {
                      stateClasses =
                        'bg-stone-500/70 border-stone-400/50 text-stone-200 cursor-not-allowed opacity-75';
                      badgeText = 'Không khả dụng';
                    }

                    return (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={slot.status !== 'AVAILABLE'}
                        onClick={() => {
                          if (slot.status === 'AVAILABLE') {
                            setSelectedStartTime(slot.time);
                            setSlotNotice(null);
                          }
                        }}
                        title={slot.reason || `${slot.time} – ${slot.endTime}: ${badgeText}`}
                        className={`py-2.5 px-2 rounded-xs border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${stateClasses}`}
                      >
                        <span className="font-mono text-xs sm:text-sm font-bold tracking-tight">
                          {slot.time}
                        </span>
                        <span className="text-[10px] font-medium leading-tight line-clamp-1">
                          {badgeText}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected Summary bar */}
            {selectedStartTime && (
              <div className="p-4 bg-charcoal border border-brass/50 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-sm">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-brass shrink-0" />
                  <span>
                    Khung giờ đã chọn:{' '}
                    <strong className="text-ivory font-semibold">
                      {selectedDate} | {selectedStartTime} – {getEndTime(selectedStartTime, durationHours)}
                    </strong>{' '}
                    ({durationHours} giờ • {guestCount} khách)
                  </span>
                </div>
                <span className="text-brass font-semibold">
                  Tạm tính phòng: {pricing.roomPrice.toLocaleString('vi-VN')} đ
                </span>
              </div>
            )}

            {/* Step navigation */}
            <div className="pt-6 border-t border-stone/20 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="inline-flex items-center justify-center gap-2 text-xs uppercase tracking-wider text-stone-light hover:text-ivory py-3 px-4 border border-stone/20 sm:border-transparent rounded-xs cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại</span>
              </button>

              <button
                type="button"
                disabled={!selectedStartTime}
                onClick={() => setCurrentStep(3)}
                className={`inline-flex items-center justify-center gap-2 px-8 py-3.5 text-xs uppercase tracking-[0.2em] font-medium rounded-sm shadow-lg transition-all ${
                  selectedStartTime
                    ? 'bg-vermilion hover:bg-vermilion-light text-white cursor-pointer'
                    : 'bg-stone-dark/50 text-stone-light/50 cursor-not-allowed'
                }`}
              >
                <span>Tiếp tục: Nhập thông tin & Đặt phòng</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: CUSTOMER INFORMATION & OPTIONAL TEA PAIRING (MODEL C) ================= */}
        {currentStep === 3 && (
          <form onSubmit={handleSubmitBooking} className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="border-b border-stone/20 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-[0.2em] text-brass font-medium">Bước 3 trên 3</span>
                <h2 className="font-serif text-2xl sm:text-3xl text-ivory mt-1">
                  Thông tin người đặt & Xác nhận đặt phòng
                </h2>
                <p className="text-xs sm:text-sm text-stone-light mt-1">
                  Chỉ mất 30 giây để hoàn tất. Lịch của quý khách sẽ được giữ tạm thời và gửi ngay đến quản trị viên để duyệt xác nhận.
                </p>
              </div>
              <span className="seal-stamp text-[10px] px-2 py-0.5 self-start sm:self-auto font-sans font-bold">
                MÔ HÌNH TINH GỌN
              </span>
            </div>

            {/* Quick Overview Strip */}
            <div className="p-4 bg-sand border border-stone-200/90 rounded-sm flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
              <div className="flex flex-wrap items-center gap-3 text-stone-700">
                <span className="inline-flex items-center gap-1 font-semibold text-stone-900">
                  <span className="seal-stamp text-[9px] px-1 py-0 font-sans">PHÒNG</span>
                  <span>Phòng {selectedRoom.name}</span>
                </span>
                <span className="text-stone-300">•</span>
                <span>
                  📅 <strong>{selectedDate}</strong> ({selectedStartTime} – {getEndTime(selectedStartTime, durationHours)}, {durationHours}h)
                </span>
                <span className="text-stone-300">•</span>
                <span>
                  👥 <strong>{guestCount} khách</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="text-xs text-brass hover:text-brass-dark underline font-medium cursor-pointer"
              >
                Đổi khung giờ
              </button>
            </div>

            {submitError && (
              <div className="p-4 bg-vermilion/15 border border-vermilion/40 text-ivory text-xs rounded-sm flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-vermilion mt-0.5 shrink-0" />
                <div>
                  <strong className="block font-medium">Không thể gửi yêu cầu đặt lịch:</strong>
                  <span>{submitError}</span>
                </div>
              </div>
            )}

            {/* Contact Input Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                  className="w-full bg-white border border-stone/30 focus:border-brass text-ivory px-4 py-3 rounded-sm text-sm outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.15em] text-ivory-muted font-medium mb-2">
                  Số điện thoại liên hệ *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ví dụ: 0989 92 92 69"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-white border border-stone/30 focus:border-brass text-ivory px-4 py-3 rounded-sm text-sm outline-none transition-colors"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs uppercase tracking-[0.15em] text-ivory-muted font-medium mb-2">
                  Email nhận xác nhận đặt phòng (Gmail / Email) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="Ví dụ: lenam287202@gmail.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-white border border-stone/30 focus:border-brass text-ivory px-4 py-3 rounded-sm text-sm outline-none transition-colors"
                />
                <p className="text-[11px] text-stone-500 mt-1">
                  Trà quán sẽ gửi thư xác nhận lịch hẹn và thông tin chi tiết qua địa chỉ email này.
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs uppercase tracking-[0.15em] text-ivory-muted font-medium mb-2">
                  Ghi chú / Yêu cầu đặc biệt (tuỳ chọn)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Yêu cầu chuẩn bị ấm tử sa chu nê, hẹn gặp đối tác trang trọng..."
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full bg-white border border-stone/30 focus:border-brass text-ivory px-4 py-3 rounded-sm text-sm outline-none transition-colors resize-none"
                />
              </div>
            </div>

            {/* Model C: Flexible Tea Selection (Default to 0đ Free Ordering, Optional Luxury Preorder) */}
            <div className="border-2 border-stone-200/90 rounded-sm p-5 bg-white space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🍵</span>
                  <div>
                    <h3 className="font-serif text-base sm:text-lg font-bold text-stone-900">
                      Danh trà thưởng thức & Điểm tâm
                    </h3>
                    <p className="text-xs text-stone-500">
                      Quý khách có thể thưởng trà tự do hoặc đặt trước dòng trà yêu thích
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-brass-dark font-medium self-start sm:self-auto bg-stone-50 px-2.5 py-1 rounded border border-stone-200">
                  Linh hoạt theo nhu cầu
                </span>
              </div>

              {/* 2 Quick Selection Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Option 1: Thưởng trà tự do (Khuyên dùng) */}
                <div
                  onClick={() => {
                    setSelectedTeaId('counter-service');
                    setShowTeaCatalog(false);
                  }}
                  className={`p-4 rounded-xs border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    selectedTeaId === 'counter-service' || !selectedTeaId
                      ? 'border-vermilion bg-[#FFFDFB] ring-2 ring-vermilion/15 shadow-sm'
                      : 'border-stone-200 bg-stone-50/60 hover:border-brass/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            selectedTeaId === 'counter-service' || !selectedTeaId
                              ? 'border-vermilion bg-vermilion text-white'
                              : 'border-stone-300'
                          }`}
                        >
                          {(selectedTeaId === 'counter-service' || !selectedTeaId) && (
                            <Check className="w-3 h-3 stroke-[3]" />
                          )}
                        </div>
                        <span className="font-serif text-sm sm:text-base font-bold text-stone-900">
                          Thưởng trà tự do
                        </span>
                      </div>
                      <span className="text-[10px] bg-green-100 text-green-800 font-semibold px-2 py-0.5 rounded-xs uppercase">
                        Khuyên dùng
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed font-light pl-6">
                      Trà sư sẽ tư vấn trực tiếp các danh trà theo mùa khi quý khách đến phòng. Quý khách thanh toán tiền trà theo thực đơn thực tế.
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs pl-6">
                    <span className="text-stone-500">Phí đặt trước:</span>
                    <span className="font-serif font-bold text-stone-800 text-sm">0 đ (Gọi tại quán)</span>
                  </div>
                </div>

                {/* Option 2: Đặt trước danh trà Shan Tuyết & Bánh */}
                <div
                  onClick={() => {
                    setShowTeaCatalog(true);
                    if (selectedTeaId === 'counter-service' || !selectedTeaId) {
                      setSelectedTeaId('tea-lung-vai');
                    }
                  }}
                  className={`p-4 rounded-xs border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    selectedTeaId && selectedTeaId !== 'counter-service'
                      ? 'border-vermilion bg-[#FFFDFB] ring-2 ring-vermilion/15 shadow-sm'
                      : 'border-stone-200 bg-stone-50/60 hover:border-brass/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            selectedTeaId && selectedTeaId !== 'counter-service'
                              ? 'border-vermilion bg-vermilion text-white'
                              : 'border-stone-300'
                          }`}
                        >
                          {selectedTeaId && selectedTeaId !== 'counter-service' && (
                            <Check className="w-3 h-3 stroke-[3]" />
                          )}
                        </div>
                        <span className="font-serif text-sm sm:text-base font-bold text-stone-900">
                          Đặt trước danh trà & bánh
                        </span>
                      </div>
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-xs uppercase">
                        VIP
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed font-light pl-6">
                      Chuẩn bị sẵn danh trà cổ thụ ủ nước nguyên khoáng nóng hoặc set bánh thủ công để sẵn sàng khi quý khách bước vào phòng.
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs pl-6">
                    <span className="text-stone-500 line-clamp-1">
                      {selectedTea && selectedTeaId !== 'counter-service'
                        ? selectedTea.name
                        : 'Bấm để xem danh mục'}
                    </span>
                    <span className="font-serif font-bold text-vermilion text-sm shrink-0">
                      {selectedTea && selectedTeaId !== 'counter-service'
                        ? `${selectedTea.price.toLocaleString('vi-VN')} đ`
                        : 'Xem menu ▾'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Collapsible / Expandable Tea Catalog */}
              {showTeaCatalog && (
                <div className="pt-4 border-t border-stone-200 space-y-4 animate-fadeIn">
                  {/* Category Filter Tabs */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        { id: 'all', label: 'Tất cả (7)' },
                        { id: 'tea', label: 'Danh trà Cổ Thụ (5)' },
                        { id: 'combo', label: 'Hộp quà & Bánh (2)' },
                      ].map((tab) => {
                        const isActive = teaCategoryFilter === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setTeaCategoryFilter(tab.id as 'all' | 'tea' | 'combo')}
                            className={`px-3 py-1.5 rounded-xs text-xs font-medium transition-all cursor-pointer ${
                              isActive
                                ? 'bg-vermilion text-white shadow-xs'
                                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                            }`}
                          >
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTeaId('counter-service');
                        setShowTeaCatalog(false);
                      }}
                      className="text-xs text-stone-500 hover:text-stone-800 underline cursor-pointer"
                    >
                      Thu gọn danh mục trà (Thưởng trà tự do)
                    </button>
                  </div>

                  {/* 3-Column Luxury Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {initialTeaPackages
                      .filter((tea) => {
                        if (teaCategoryFilter === 'all') return true;
                        if (teaCategoryFilter === 'tea') {
                          return tea.id !== 'combo-teatime-banh' && tea.id !== 'tea-goi-thuong-pham-lung-vai';
                        }
                        if (teaCategoryFilter === 'combo') {
                          return tea.id === 'combo-teatime-banh' || tea.id === 'tea-goi-thuong-pham-lung-vai';
                        }
                        return true;
                      })
                      .map((tea) => {
                        const isSelected = selectedTeaId === tea.id;
                        const primaryTag = tea.tags?.[0] || 'Shan Tuyết';

                        return (
                          <div
                            key={tea.id}
                            onClick={() => setSelectedTeaId(tea.id)}
                            className={`group relative rounded-sm overflow-hidden border-2 cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                              isSelected
                                ? 'border-vermilion bg-white shadow-lg ring-2 ring-vermilion/20'
                                : 'border-stone-200 bg-white hover:border-brass/70 hover:shadow-md'
                            }`}
                          >
                            <div>
                              <div className="relative aspect-[16/11] w-full overflow-hidden bg-stone-100 border-b border-stone-200/60">
                                {tea.imageUrl ? (
                                  <Image
                                    src={tea.imageUrl}
                                    alt={tea.name}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-400">
                                    🍵
                                  </div>
                                )}
                                <div className="absolute top-2 left-2">
                                  <span className="bg-black/65 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-xs tracking-wide shadow-xs">
                                    {primaryTag}
                                  </span>
                                </div>
                                <div className="absolute top-2 right-2">
                                  {isSelected && (
                                    <span className="bg-vermilion text-white text-[11px] font-semibold px-2 py-0.5 rounded-xs shadow-md flex items-center gap-1">
                                      <Check className="w-3 h-3 stroke-[3]" /> Đã chọn
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="p-3.5">
                                <h4 className="font-serif text-sm sm:text-base font-bold text-stone-900 group-hover:text-vermilion transition-colors line-clamp-1">
                                  {tea.name}
                                </h4>
                                <p className="text-[11px] font-medium text-brass-dark mt-0.5 line-clamp-1">
                                  {tea.vietnameseName}
                                </p>
                                <p className="text-[11px] text-stone-600 mt-1.5 line-clamp-2 leading-relaxed font-light">
                                  {tea.description}
                                </p>
                              </div>
                            </div>

                            <div className="p-3.5 pt-0">
                              <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between">
                                <span className="font-serif text-base font-bold text-vermilion">
                                  {tea.price.toLocaleString('vi-VN')} đ
                                </span>
                                {isSelected ? (
                                  <span className="px-2.5 py-1 bg-vermilion text-white text-[11px] font-semibold rounded-xs shadow-xs flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Đã chọn
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 bg-stone-100 group-hover:bg-brass group-hover:text-white text-stone-700 text-[11px] font-medium rounded-xs transition-colors">
                                    Chọn gói
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Price Snapshot Review Box */}
            <div className="p-6 bg-white border-2 border-stone-200/90 rounded-sm space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between border-b border-stone-200/80 pb-3">
                <span className="text-xs uppercase tracking-[0.2em] text-brass-dark font-bold flex items-center gap-2">
                  <span className="seal-stamp text-[10px] px-1.5">CHI PHÍ</span>
                  BẢNG DỰ TÍNH TỔNG HỢP
                </span>
                <span className="text-xs text-stone-500">Đã bao gồm phục vụ trà sư</span>
              </div>

              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between text-stone-600">
                  <span>Phòng {selectedRoom.name} ({durationHours} giờ):</span>
                  <span className="font-medium text-stone-900">{pricing.roomPrice.toLocaleString('vi-VN')} đ</span>
                </div>

                <div className="flex justify-between text-stone-600">
                  <span>
                    Danh trà:{' '}
                    {selectedTea && selectedTeaId !== 'counter-service'
                      ? selectedTea.name
                      : 'Thưởng trà tự do (Gọi tại quán)'}:
                  </span>
                  <span className="font-medium text-stone-900">
                    {selectedTea && selectedTeaId !== 'counter-service'
                      ? `${pricing.teaPrice.toLocaleString('vi-VN')} đ`
                      : '0 đ (Gọi món riêng)'}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t-2 border-dashed border-stone-200 flex justify-between items-baseline">
                <span className="text-sm sm:text-base font-medium text-stone-900">Tổng chi phí dự tính:</span>
                <span className="font-serif text-2xl sm:text-3xl text-vermilion font-bold">
                  {pricing.total.toLocaleString('vi-VN')} đ
                </span>
              </div>

              <div className="flex justify-between text-xs text-stone-500 pt-1 border-t border-stone-100">
                <span>Tiền cọc giữ phòng ({BRAND_CONFIG.depositPercentage}%):</span>
                <span className="text-stone-800 font-semibold">
                  {pricing.deposit.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            {/* Terms Agreement */}
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="mt-0.5 rounded-xs accent-vermilion"
              />
              <span className="text-xs text-stone-light leading-relaxed">
                Tôi hiểu rằng lịch đặt chỉ chính thức được xác nhận sau khi quản trị viên {BRAND_CONFIG.brandName} duyệt yêu cầu, và đồng ý với quy định giữ không gian tĩnh lặng chung.
              </span>
            </label>

            {/* Step 3 Action Navigation */}
            <div className="pt-6 border-t border-stone/20 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setCurrentStep(2)}
                className="inline-flex items-center justify-center gap-2 text-xs uppercase tracking-wider text-stone-light hover:text-ivory py-3 px-4 border border-stone/20 sm:border-transparent rounded-xs cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại chọn ngày giờ</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-vermilion hover:bg-vermilion-light text-white text-xs uppercase tracking-[0.2em] font-medium rounded-sm shadow-xl shadow-vermilion/30 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang gửi yêu cầu...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Gửi yêu cầu đặt lịch ngay</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ================= STEP 4: REQUEST RECEIVED & LIVE STATUS TRACKING ================= */}
        {currentStep === 4 && createdBooking && (
          <div className="space-y-8 animate-fadeIn text-center">
            <div 
              className="relative w-16 h-22 mx-auto mb-2"
              style={{ width: '64px', height: '88px', maxWidth: '64px', maxHeight: '88px' }}
            >
              <Image
                src="/images/logo-lung-vai-transparent.png"
                alt="Lùng Vài Tea"
                fill
                sizes="64px"
                className="object-contain"
              />
            </div>

            {createdBooking.status === 'pending' && (
              <div className="space-y-3 max-w-2xl mx-auto">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  ĐANG CHỜ QUẢN TRỊ VIÊN DUYỆT (PENDING)
                </span>
                <h2 className="font-serif text-2xl sm:text-4xl text-ivory font-normal">
                  Đã tiếp nhận yêu cầu đặt lịch của quý khách
                </h2>
                <div className="p-4 bg-amber-50/90 border border-amber-400 rounded-sm text-xs sm:text-sm text-amber-950 font-medium leading-relaxed shadow-xs">
                  Yêu cầu đặt lịch của bạn đã được tiếp nhận. Vui lòng chờ phòng trà xác nhận. Lịch chỉ được xác nhận sau khi quản trị viên duyệt thành công.
                </div>
              </div>
            )}

            {createdBooking.status === 'confirmed' && (
              <div className="space-y-3 max-w-2xl mx-auto">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-500">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  ĐÃ XÁC NHẬN ĐẶT LỊCH THÀNH CÔNG (CONFIRMED)
                </span>
                <h2 className="font-serif text-2xl sm:text-4xl text-ivory font-normal">
                  Phòng trà đã xác nhận lịch hẹn của quý khách!
                </h2>
                <div className="p-4 bg-emerald-50 border border-emerald-500 rounded-sm text-xs sm:text-sm text-emerald-950 font-medium leading-relaxed">
                  Phòng trà xác nhận yêu cầu đặt lịch của bạn đã được chấp thuận. Rất mong được đón tiếp quý khách tại {BRAND_CONFIG.brandName}!
                </div>
              </div>
            )}

            {createdBooking.status === 'rejected' && (
              <div className="space-y-3 max-w-2xl mx-auto">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-900 border border-red-400">
                  <XCircle className="w-4 h-4 text-red-700" />
                  YÊU CẦU CHƯA ĐƯỢC CHẤP THUẬN (REJECTED)
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl text-ivory font-normal">
                  Rất tiếc, yêu cầu đặt lịch chưa thể được chấp thuận
                </h2>
                <div className="p-4 bg-red-50 border border-red-300 rounded-sm text-xs sm:text-sm text-red-950 leading-relaxed">
                  <strong>Lý do:</strong>{' '}
                  {createdBooking.rejectionReason ||
                    'Khung giờ quý khách chọn hiện không thể đáp ứng.'}
                </div>
              </div>
            )}

            {createdBooking.status === 'cancelled' && (
              <div className="space-y-3 max-w-2xl mx-auto">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-stone-200 text-stone-800 border border-stone-400">
                  <Ban className="w-4 h-4 text-stone-700" />
                  LỊCH ĐẶT ĐÃ HỦY (CANCELLED)
                </span>
                <div className="p-4 bg-stone-100 border border-stone-300 rounded-sm text-xs sm:text-sm text-stone-800">
                  <strong>Lý do hủy:</strong>{' '}
                  {createdBooking.cancellationReason || 'Đã hủy theo yêu cầu.'}
                </div>
              </div>
            )}

            {/* Reference Badge Card */}
            <div className="max-w-md mx-auto bg-charcoal p-6 rounded-sm border border-brass/40 shadow-xl space-y-4">
              <span className="text-[11px] uppercase tracking-[0.25em] text-stone-light block">
                MÃ YÊU CẦU ĐẶT LỊCH DUY NHẤT
              </span>
              <div className="flex items-center justify-center gap-3">
                <span className="font-serif text-2xl sm:text-3xl text-brass tracking-wider font-semibold">
                  {createdBooking.bookingReference}
                </span>
                <button
                  type="button"
                  onClick={handleCopyRef}
                  className="p-2 rounded bg-walnut border border-stone/30 text-stone-light hover:text-ivory hover:border-brass transition-colors cursor-pointer"
                  title="Sao chép mã"
                >
                  {copiedRef ? <Check className="w-4 h-4 text-brass" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              {copiedRef && (
                <span className="text-[11px] text-brass block">
                  Đã sao chép mã số vào bộ nhớ tạm!
                </span>
              )}
              <p className="text-[11px] text-stone-light">
                Trang này tự động cập nhật trạng thái mỗi 8 giây khi quản trị viên xử lý yêu cầu.
              </p>
            </div>

            {/* Booking Details Card */}
            <div className="max-w-md mx-auto text-left bg-charcoal/60 border border-stone/20 p-5 rounded-sm text-xs space-y-2">
              <div className="flex justify-between py-1 border-b border-stone/15">
                <span className="text-stone-light">Khách hàng:</span>
                <span className="text-ivory font-medium">
                  {createdBooking.customerName} ({createdBooking.customerPhone})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone/15">
                <span className="text-stone-light">Phòng thưởng trà:</span>
                <span className="text-ivory font-medium">{createdBooking.roomName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone/15">
                <span className="text-stone-light">Ngày đặt:</span>
                <span className="text-ivory font-medium">{createdBooking.date}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone/15">
                <span className="text-stone-light">Khung giờ:</span>
                <span className="text-ivory font-medium">
                  {createdBooking.startTime} – {createdBooking.endTime} ({createdBooking.durationHours} giờ)
                </span>
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
                <span className="text-brass font-medium">
                  {createdBooking.totalPrice.toLocaleString('vi-VN')} đ
                </span>
              </div>
              {createdBooking.expiresAt && createdBooking.status === 'pending' && (
                <div className="flex justify-between py-1">
                  <span className="text-stone-light">Giữ khung giờ chờ duyệt đến:</span>
                  <span className="text-amber-700 font-medium">
                    {new Date(createdBooking.expiresAt).toLocaleString('vi-VN')}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-stone/30 hover:border-brass bg-charcoal text-ivory text-xs uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-brass" />
                <span>In phiếu yêu cầu</span>
              </button>

              <Link
                href={`/lookup?ref=${encodeURIComponent(
                  createdBooking.bookingReference
                )}&phone=${encodeURIComponent(createdBooking.customerPhone)}`}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-vermilion hover:bg-vermilion-light text-white text-xs uppercase tracking-wider font-medium rounded-sm transition-colors shadow-lg"
              >
                <span>Mở trang Tra cứu trạng thái</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
