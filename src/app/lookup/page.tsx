'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Search, Calendar, Clock, Users, Phone, Printer, AlertCircle, CheckCircle2, Clock3, XCircle } from 'lucide-react';
import { Booking } from '@/lib/types';
import { BRAND_CONFIG } from '@/lib/config';

function LookupContent() {
  const searchParams = useSearchParams();
  const initialRef = searchParams.get('ref') || '';
  const initialPhone = searchParams.get('phone') || '';

  const [reference, setReference] = useState<string>(initialRef);
  const [phone, setPhone] = useState<string>(initialPhone);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!reference.trim()) {
      setError('Vui lòng nhập mã đặt phòng (ví dụ: OS-20261022-7F9A).');
      return;
    }

    setLoading(true);
    setError(null);
    setBooking(null);

    try {
      const url = `/api/bookings/lookup?reference=${encodeURIComponent(reference.trim())}${
        phone.trim() ? `&phone=${encodeURIComponent(phone.trim())}` : ''
      }`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Không tìm thấy thông tin đơn đặt phòng.');
      }

      setBooking(data.data);
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối khi tra cứu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialRef) {
      handleLookup();
    }
  }, [initialRef]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-600/50">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Đã xác nhận & Giữ chỗ thành công
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-950/70 text-amber-300 border border-amber-600/50">
            <Clock3 className="w-3.5 h-3.5" />
            Đang chờ duyệt cọc (Pending)
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-950/70 text-red-300 border border-red-600/50">
            <XCircle className="w-3.5 h-3.5" />
            Đã huỷ lịch
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-sky-950/70 text-sky-300 border border-sky-600/50">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Đã hoàn thành buổi thưởng trà
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-stone/20 text-stone-light">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* Header */}
      <div className="text-center mb-10 space-y-3">
        <div className="inline-flex items-center gap-2 text-brass tracking-[0.3em] uppercase text-xs font-medium">
          <span className="seal-stamp text-[10px] px-1.5 font-sans font-bold">TRA CỨU</span>
          <span>TRA CỨU TRẠNG THÁI LỊCH HẸN</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-ivory font-normal">
          Tra cứu đơn đặt phòng trà
        </h1>
        <p className="text-xs sm:text-sm text-stone-light max-w-md mx-auto font-light">
          Nhập mã số đơn (dạng <code className="text-brass">LVT-YYYYMMDD-XXXX</code>) đã nhận khi hoàn tất đặt phòng để theo dõi trạng thái.
        </p>
      </div>

      {/* Search Input Card */}
      <div className="bg-walnut/70 border border-brass/30 p-6 sm:p-8 rounded-sm shadow-xl backdrop-blur-md mb-8">
        <form onSubmit={handleLookup} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            
            <div className="sm:col-span-7">
              <label className="block text-xs uppercase tracking-wider text-stone-light mb-1.5 font-medium">
                Mã số đặt phòng *
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: LVT-20261022-7F9A"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full bg-charcoal border border-stone/30 focus:border-brass text-ivory px-4 py-2.5 rounded-xs text-sm uppercase tracking-wider outline-none"
              />
            </div>

            <div className="sm:col-span-5">
              <label className="block text-xs uppercase tracking-wider text-stone-light mb-1.5 font-medium">
                Số điện thoại người đặt (tuỳ chọn)
              </label>
              <input
                type="tel"
                placeholder="Số điện thoại"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-charcoal border border-stone/30 focus:border-brass text-ivory px-4 py-2.5 rounded-xs text-sm outline-none"
              />
            </div>

          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-vermilion hover:bg-vermilion-light text-white text-xs uppercase tracking-[0.18em] font-medium rounded-sm shadow-md transition-all disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? 'Đang tra cứu...' : 'Kiểm tra trạng thái'}</span>
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-vermilion/20 border border-vermilion/40 text-ivory text-xs rounded-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-vermilion flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Result Display Card */}
      {booking && (
        <div className="bg-walnut/90 border border-brass/40 rounded-sm p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6 animate-fadeIn">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone/20 gap-3">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-stone-light block">
                MÃ ĐẶT PHÒNG
              </span>
              <span className="font-serif text-2xl text-brass font-medium tracking-wider">
                {booking.bookingReference}
              </span>
            </div>
            <div>{getStatusBadge(booking.status)}</div>
          </div>

          {/* Key Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-charcoal/70 rounded-xs border border-stone/20 text-xs">
            <div className="space-y-1">
              <span className="text-stone-light flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-brass" />
                Ngày & Giờ:
              </span>
              <span className="font-medium text-ivory block">
                {booking.date} | {booking.startTime} – {booking.endTime}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-stone-light flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-brass" />
                Không gian phòng:
              </span>
              <span className="font-medium text-ivory block">
                Phòng {booking.roomName} ({booking.guestCount} khách)
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-stone-light flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-brass" />
                Khách hàng:
              </span>
              <span className="font-medium text-ivory block">
                {booking.customerName} ({booking.customerPhone})
              </span>
            </div>
          </div>

          {/* Details & Pricing Breakdown */}
          <div className="space-y-2 text-xs border-y border-stone/20 py-4">
            <div className="flex justify-between text-stone-light">
              <span>Thời lượng sử dụng:</span>
              <span className="text-ivory">{booking.durationHours} giờ</span>
            </div>
            {booking.teaPackageName && (
              <div className="flex justify-between text-stone-light">
                <span>Danh trà phục vụ:</span>
                <span className="text-ivory">{booking.teaPackageName}</span>
              </div>
            )}
            {booking.specialRequests && (
              <div className="flex justify-between text-stone-light">
                <span>Yêu cầu đặc biệt:</span>
                <span className="text-ivory italic">{booking.specialRequests}</span>
              </div>
            )}
            <div className="flex justify-between text-stone-light pt-2 border-t border-stone/10">
              <span>Tổng chi phí dự kiến:</span>
              <span className="font-serif text-lg text-brass font-medium">
                {booking.totalPrice.toLocaleString('vi-VN')} đ
              </span>
            </div>
            <div className="flex justify-between text-stone-light">
              <span>Tiền cọc giữ chỗ (30%):</span>
              <span className="text-amber-400 font-medium">
                {booking.depositAmount.toLocaleString('vi-VN')} đ
              </span>
            </div>
          </div>

          {/* Admin Note if confirmed */}
          {booking.adminNotes && (
            <div className="p-3 bg-charcoal/80 border border-brass/20 rounded-xs text-xs text-stone-light">
              <strong className="text-brass block mb-1">Ghi chú từ trà sư quản lý:</strong>
              <p>{booking.adminNotes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <a
              href={`tel:${BRAND_CONFIG.hotline.replace(/\s+/g, '')}`}
              className="text-xs text-brass hover:text-ivory flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Cần hỗ trợ? Gọi hotline: {BRAND_CONFIG.hotline}</span>
            </a>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-stone/30 hover:border-brass text-xs text-ivory rounded-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-brass" />
              <span>In đơn</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
}

export default function LookupPage() {
  return (
    <div className="min-h-screen flex flex-col bg-charcoal text-ivory">
      <Navbar />
      <main className="flex-1 pt-24 pb-20">
        <Suspense fallback={<div className="text-center py-24 text-stone-light">Đang tải trang tra cứu...</div>}>
          <LookupContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
