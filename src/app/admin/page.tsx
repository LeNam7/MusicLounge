'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Shield, 
  Lock, 
  Search, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  RefreshCw, 
  Eye, 
  Sliders, 
  DollarSign, 
  Users, 
  LogOut,
  Edit,
  Save,
  Check
} from 'lucide-react';
import { Booking, Room, BookingStatus } from '@/lib/types';
import { BRAND_CONFIG } from '@/lib/config';

export default function AdminPage() {
  const [passcode, setPasscode] = useState<string>('serenity2026');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Dashboard Stats
  const [stats, setStats] = useState<{
    todayBookings: number;
    pendingBookings: number;
    totalRevenue: number;
    totalBookings: number;
  } | null>(null);

  // Bookings list
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');

  // Rooms list & editing
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeTab, setActiveTab] = useState<'bookings' | 'rooms'>('bookings');
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editPricePerHour, setEditPricePerHour] = useState<number>(0);
  const [editPricePackage2h, setEditPricePackage2h] = useState<number>(0);
  const [editCapacityMax, setEditCapacityMax] = useState<number>(0);

  // Selected booking modal for status change
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [actionNotes, setActionNotes] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Notification message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Auth check
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    try {
      const res = await fetch(`/api/admin/stats?passcode=${encodeURIComponent(passcode)}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Mã PIN bảo mật không chính xác.');
      }

      setIsAuthenticated(true);
      setStats(data.data);
      loadBookings(passcode);
      loadRooms();
    } catch (err: any) {
      setAuthError(err.message || 'Lỗi xác thực.');
    }
  };

  // Fetch bookings with filters
  const loadBookings = async (code: string = passcode) => {
    setLoadingBookings(true);
    try {
      const params = new URLSearchParams({ passcode: code });
      if (filterStatus && filterStatus !== 'all') params.append('status', filterStatus);
      if (filterDate) params.append('date', filterDate);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/admin/bookings?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setBookings(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBookings(false);
    }
  };

  // Fetch rooms
  const loadRooms = async () => {
    try {
      const res = await fetch('/api/rooms');
      const data = await res.json();
      if (data.success) {
        setRooms(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger filter reload
  useEffect(() => {
    if (isAuthenticated) {
      loadBookings();
    }
  }, [filterStatus, filterDate]);

  // Update Booking Status
  const handleUpdateStatus = async (status: BookingStatus) => {
    if (!selectedBooking) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/admin/bookings/${selectedBooking.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-passcode': passcode,
        },
        body: JSON.stringify({
          status,
          adminNotes: actionNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Cập nhật thất bại.');
      }

      showToast(`Đã chuyển đơn ${selectedBooking.bookingReference} sang trạng thái: ${status}`);
      setSelectedBooking(null);
      setActionNotes('');
      // Reload stats and bookings
      loadBookings();
      const statsRes = await fetch(`/api/admin/stats?passcode=${encodeURIComponent(passcode)}`);
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.data);
    } catch (err: any) {
      alert(err.message || 'Lỗi cập nhật trạng thái đơn.');
    } finally {
      setActionLoading(false);
    }
  };

  // Save room pricing edit
  const handleSaveRoom = async (room: Room) => {
    try {
      const res = await fetch(`/api/admin/rooms/${room.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-passcode': passcode,
        },
        body: JSON.stringify({
          pricePerHour: editPricePerHour,
          pricePackage2h: editPricePackage2h,
          capacityMax: editCapacityMax,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Cập nhật phòng thất bại.');
      }

      showToast(`Đã cập nhật giá và sức chứa phòng ${room.name}!`);
      setEditingRoomId(null);
      loadRooms();
    } catch (err: any) {
      alert(err.message || 'Lỗi cập nhật');
    }
  };

  // Reset Demo Data
  const handleResetData = async () => {
    if (!confirm('Bạn có chắc chắn muốn nạp lại dữ liệu mẫu ban đầu? Toàn bộ lịch đặt thử nghiệm sẽ được thiết lập lại.')) {
      return;
    }

    try {
      const res = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: { 'x-admin-passcode': passcode },
      });
      const data = await res.json();
      if (data.success) {
        showToast('Đã khôi phục dữ liệu mẫu ban đầu thành công!');
        loadBookings();
        loadRooms();
        const statsRes = await fetch(`/api/admin/stats?passcode=${encodeURIComponent(passcode)}`);
        const statsData = await statsRes.json();
        if (statsData.success) setStats(statsData.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // RENDER: LOGIN FORM
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-walnut/90 border border-brass/40 p-8 rounded-sm shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="relative w-18 h-22 sm:w-20 sm:h-25 mx-auto mb-3">
              <Image
                src="/images/logo-lung-vai-transparent.png"
                alt="Lùng Vài Tea"
                fill
                sizes="80px"
                className="object-contain filter drop-shadow-[0_4px_16px_rgba(141,52,45,0.6)]"
              />
            </div>
            <span className="seal-stamp text-xs px-2 py-0.5 font-sans font-bold">KHU VỰC QUẢN TRỊ</span>
            <h1 className="font-serif text-2xl text-ivory font-normal">
              Bảng Điều Khiển Trà Sư Quản Lý
            </h1>
            <p className="text-xs text-stone-light">
              Nhập mã PIN quản trị để truy cập danh sách đặt phòng và thiết lập giá.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-stone-light mb-1.5 font-medium">
                Mã PIN Quản trị (Mặc định: <code className="text-brass">serenity2026</code>)
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full bg-charcoal border border-stone/30 focus:border-brass text-ivory px-4 py-2.5 rounded-xs text-sm outline-none font-mono"
                />
                <Lock className="w-4 h-4 text-brass absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {authError && (
              <div className="p-3 bg-vermilion/20 border border-vermilion/40 text-xs text-ivory rounded-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-vermilion flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-vermilion hover:bg-vermilion-light text-ivory text-xs uppercase tracking-[0.2em] font-medium rounded-sm shadow-lg transition-all"
            >
              Đăng nhập Quản trị
            </button>
          </form>

          <div className="text-center pt-2">
            <Link href="/" className="text-xs text-stone-light hover:text-brass transition-colors">
              ← Quay lại trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // RENDER: AUTHENTICATED DASHBOARD
  return (
    <div className="min-h-screen bg-charcoal text-ivory pb-20">
      
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-brass text-charcoal px-4 py-2.5 rounded-sm shadow-2xl text-xs font-medium flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Header Bar */}
      <header className="bg-walnut/90 border-b border-brass/30 py-4 px-6 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="relative w-10 h-13 flex-shrink-0">
              <Image
                src="/images/logo-lung-vai-transparent.png"
                alt="Lùng Vài Tea"
                fill
                sizes="40px"
                className="object-contain filter drop-shadow-[0_2px_8px_rgba(141,52,45,0.4)]"
              />
            </div>
            <div>
              <span className="font-serif text-lg text-ivory font-medium">
                {BRAND_CONFIG.brandName} Admin
              </span>
              <span className="text-[10px] text-brass uppercase tracking-wider block">
                Cổng Quản Trị Đặt Phòng & Doanh Thu
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleResetData}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-stone-light hover:text-brass px-3 py-1.5 rounded bg-charcoal/60 border border-stone/20"
              title="Đặt lại dữ liệu phòng & lịch hẹn mẫu"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Nạp lại dữ liệu mẫu</span>
            </button>

            <Link
              href="/"
              target="_blank"
              className="text-xs text-stone-light hover:text-ivory px-3 py-1.5 rounded bg-charcoal/60 border border-stone/20"
            >
              Xem Website Khách
            </Link>

            <button
              onClick={() => setIsAuthenticated(false)}
              className="flex items-center gap-1.5 text-xs text-vermilion-light hover:text-vermilion"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Thoát</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* KPI Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            
            <div className="p-5 bg-walnut/60 border border-stone/20 rounded-sm">
              <span className="text-[11px] uppercase tracking-wider text-stone-light block">
                Lịch hẹn hôm nay
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="font-serif text-3xl text-ivory font-medium">
                  {stats.todayBookings}
                </span>
                <Calendar className="w-4 h-4 text-brass" />
              </div>
            </div>

            <div className="p-5 bg-walnut/60 border border-stone/20 rounded-sm">
              <span className="text-[11px] uppercase tracking-wider text-stone-light block">
                Đơn chờ duyệt (Pending)
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="font-serif text-3xl text-amber-400 font-medium">
                  {stats.pendingBookings}
                </span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
            </div>

            <div className="p-5 bg-walnut/60 border border-stone/20 rounded-sm">
              <span className="text-[11px] uppercase tracking-wider text-stone-light block">
                Tổng doanh thu ước tính
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="font-serif text-2xl text-brass font-medium">
                  {stats.totalRevenue.toLocaleString('vi-VN')} đ
                </span>
                <TrendingUp className="w-4 h-4 text-brass" />
              </div>
            </div>

            <div className="p-5 bg-walnut/60 border border-stone/20 rounded-sm">
              <span className="text-[11px] uppercase tracking-wider text-stone-light block">
                Tổng lượt đặt tích luỹ
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="font-serif text-3xl text-ivory font-medium">
                  {stats.totalBookings}
                </span>
                <Users className="w-4 h-4 text-stone-light" />
              </div>
            </div>

          </div>
        )}

        {/* Tab Controls: Quản lý Đặt phòng vs Cấu hình Giá Phòng */}
        <div className="flex items-center gap-4 border-b border-stone/20">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`pb-3 text-xs uppercase tracking-[0.18em] font-medium border-b-2 transition-all ${
              activeTab === 'bookings'
                ? 'border-brass text-brass'
                : 'border-transparent text-stone-light hover:text-ivory'
            }`}
          >
            Quản lý Đặt phòng ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('rooms')}
            className={`pb-3 text-xs uppercase tracking-[0.18em] font-medium border-b-2 transition-all ${
              activeTab === 'rooms'
                ? 'border-brass text-brass'
                : 'border-transparent text-stone-light hover:text-ivory'
            }`}
          >
            Cấu hình Giá & Sức chứa Phòng ({rooms.length})
          </button>
        </div>

        {/* ================= TAB 1: BOOKINGS LIST ================= */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            
            {/* Filter Bar */}
            <div className="p-4 bg-walnut/50 border border-stone/20 rounded-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                {/* Search */}
                <div className="relative flex-1 sm:w-64">
                  <input
                    type="text"
                    placeholder="Tìm theo mã, tên hoặc SĐT..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') loadBookings();
                    }}
                    className="w-full bg-charcoal border border-stone/30 focus:border-brass text-xs px-3 py-2 rounded-xs text-ivory outline-none"
                  />
                  <Search className="w-3.5 h-3.5 text-stone absolute right-2.5 top-2.5 pointer-events-none" />
                </div>

                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-charcoal border border-stone/30 focus:border-brass text-xs px-3 py-2 rounded-xs text-ivory outline-none"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="pending">Chờ xác nhận (Pending)</option>
                  <option value="confirmed">Đã xác nhận (Confirmed)</option>
                  <option value="completed">Đã hoàn thành (Completed)</option>
                  <option value="cancelled">Đã huỷ (Cancelled)</option>
                </select>

                {/* Date Filter */}
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="bg-charcoal border border-stone/30 focus:border-brass text-xs px-3 py-2 rounded-xs text-ivory outline-none"
                />

                {(searchQuery || filterStatus !== 'all' || filterDate) && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterStatus('all');
                      setFilterDate('');
                    }}
                    className="text-xs text-stone hover:text-brass"
                  >
                    Xoá lọc
                  </button>
                )}
              </div>

              <button
                onClick={() => loadBookings()}
                className="inline-flex items-center gap-1.5 text-xs text-stone-light hover:text-ivory px-3 py-2 bg-charcoal rounded-xs border border-stone/20"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Làm mới</span>
              </button>
            </div>

            {/* Bookings Table */}
            <div className="bg-walnut/70 border border-stone/20 rounded-sm overflow-x-auto shadow-xl">
              <table className="w-full text-left text-xs text-ivory-muted">
                <thead className="bg-charcoal/80 text-stone-light uppercase tracking-wider text-[11px] border-b border-stone/20">
                  <tr>
                    <th className="py-3 px-4">Mã đơn</th>
                    <th className="py-3 px-4">Khách hàng</th>
                    <th className="py-3 px-4">Phòng</th>
                    <th className="py-3 px-4">Ngày & Giờ</th>
                    <th className="py-3 px-4">Khách</th>
                    <th className="py-3 px-4">Chi phí / Cọc</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone/15">
                  {loadingBookings ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-stone-light">
                        Đang nạp danh sách lịch hẹn...
                      </td>
                    </tr>
                  ) : bookings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-stone-light">
                        Không có đơn đặt phòng nào phù hợp điều kiện lọc.
                      </td>
                    </tr>
                  ) : (
                    bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-charcoal/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-brass">
                          {b.bookingReference}
                        </td>
                        <td className="py-3 px-4">
                          <strong className="text-ivory block font-medium">{b.customerName}</strong>
                          <span className="text-[11px] text-stone-light">{b.customerPhone}</span>
                        </td>
                        <td className="py-3 px-4 text-ivory font-serif">
                          {b.roomName}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-ivory block">{b.date}</span>
                          <span className="text-[11px] text-stone-light">{b.startTime} - {b.endTime} ({b.durationHours}h)</span>
                        </td>
                        <td className="py-3 px-4">
                          {b.guestCount} người
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-brass font-medium block">{b.totalPrice.toLocaleString('vi-VN')} đ</span>
                          <span className="text-[10px] text-stone-light">Cọc: {b.depositAmount.toLocaleString('vi-VN')} đ</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                            b.status === 'confirmed'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                              : b.status === 'pending'
                              ? 'bg-amber-950 text-amber-300 border border-amber-700/50'
                              : b.status === 'cancelled'
                              ? 'bg-red-950 text-red-300 border border-red-700/50'
                              : 'bg-stone/20 text-stone-light'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedBooking(b);
                              setActionNotes(b.adminNotes || '');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-charcoal hover:bg-brass hover:text-charcoal border border-stone/30 text-stone-light rounded-xs transition-colors"
                          >
                            <Sliders className="w-3 h-3" />
                            <span>Xử lý</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ================= TAB 2: ROOM PRICING & CAPACITY CONFIG ================= */}
        {activeTab === 'rooms' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rooms.map((r) => {
              const isEditing = editingRoomId === r.id;
              return (
                <div
                  key={r.id}
                  className="p-6 bg-walnut/70 border border-stone/20 rounded-sm space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="seal-stamp text-[10px] px-1.5 mr-2 font-sans font-bold">PHÒNG</span>
                      <span className="font-serif text-xl text-ivory font-normal">Phòng {r.name}</span>
                    </div>
                    <span className="text-xs text-stone-light">{r.floor} • {r.areaSqm}m²</span>
                  </div>

                  {isEditing ? (
                    <div className="space-y-3 pt-2 text-xs">
                      <div>
                        <label className="block text-stone-light mb-1">Giá theo giờ (VNĐ/giờ):</label>
                        <input
                          type="number"
                          value={editPricePerHour}
                          onChange={(e) => setEditPricePerHour(parseInt(e.target.value) || 0)}
                          className="w-full bg-charcoal border border-stone/30 p-2 text-ivory rounded-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-stone-light mb-1">Gói tiêu chuẩn 2 giờ (VNĐ):</label>
                        <input
                          type="number"
                          value={editPricePackage2h}
                          onChange={(e) => setEditPricePackage2h(parseInt(e.target.value) || 0)}
                          className="w-full bg-charcoal border border-stone/30 p-2 text-ivory rounded-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-stone-light mb-1">Sức chứa tối đa (khách):</label>
                        <input
                          type="number"
                          value={editCapacityMax}
                          onChange={(e) => setEditCapacityMax(parseInt(e.target.value) || 0)}
                          className="w-full bg-charcoal border border-stone/30 p-2 text-ivory rounded-xs"
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleSaveRoom(r)}
                          className="px-4 py-2 bg-vermilion text-ivory text-xs font-medium rounded-xs flex items-center gap-1"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Lưu thay đổi</span>
                        </button>
                        <button
                          onClick={() => setEditingRoomId(null)}
                          className="px-3 py-2 bg-charcoal text-stone-light text-xs rounded-xs"
                        >
                          Huỷ
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs text-stone-light pt-2 border-t border-stone/15">
                      <div className="flex justify-between">
                        <span>Giá gói 2 giờ:</span>
                        <strong className="text-brass font-medium">{r.pricePackage2h.toLocaleString('vi-VN')} đ</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Giá theo giờ:</span>
                        <span className="text-ivory">{r.pricePerHour.toLocaleString('vi-VN')} đ/h</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sức chứa:</span>
                        <span className="text-ivory">{r.capacityMin} – {r.capacityMax} người</span>
                      </div>

                      <div className="pt-3 flex justify-end">
                        <button
                          onClick={() => {
                            setEditingRoomId(r.id);
                            setEditPricePerHour(r.pricePerHour);
                            setEditPricePackage2h(r.pricePackage2h);
                            setEditCapacityMax(r.capacityMax);
                          }}
                          className="inline-flex items-center gap-1 text-xs text-brass hover:text-ivory py-1"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Chỉnh sửa giá & sức chứa</span>
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* Booking Action Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-charcoal-dark/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-walnut border border-brass/40 rounded-sm p-6 shadow-2xl space-y-5 animate-fadeIn">
            
            <div className="flex items-center justify-between border-b border-stone/20 pb-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-stone-light block">
                  CẬP NHẬT TRẠNG THÁI ĐƠN
                </span>
                <span className="font-mono text-lg text-brass font-medium">
                  {selectedBooking.bookingReference}
                </span>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-stone hover:text-ivory"
              >
                ✕
              </button>
            </div>

            {/* Quick summary */}
            <div className="text-xs space-y-1.5 p-3 bg-charcoal/70 rounded-xs border border-stone/20 text-stone-light">
              <div className="flex justify-between">
                <span>Khách hàng:</span>
                <strong className="text-ivory">{selectedBooking.customerName} ({selectedBooking.customerPhone})</strong>
              </div>
              <div className="flex justify-between">
                <span>Phòng & Thời gian:</span>
                <span className="text-ivory">{selectedBooking.roomName} • {selectedBooking.date} ({selectedBooking.startTime} - {selectedBooking.endTime})</span>
              </div>
              <div className="flex justify-between">
                <span>Tổng tiền:</span>
                <span className="text-brass font-medium">{selectedBooking.totalPrice.toLocaleString('vi-VN')} đ (Cọc: {selectedBooking.depositAmount.toLocaleString('vi-VN')} đ)</span>
              </div>
              {selectedBooking.specialRequests && (
                <div className="pt-1 text-[11px] italic text-ivory-muted border-t border-stone/15">
                  Yêu cầu: &ldquo;{selectedBooking.specialRequests}&rdquo;
                </div>
              )}
            </div>

            {/* Admin notes input */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-stone-light mb-1.5 font-medium">
                Ghi chú nội bộ / Phản hồi cho khách:
              </label>
              <textarea
                rows={2}
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Ví dụ: Đã nhận cọc chuyển khoản qua Vietcombank, đã gọi điện xác nhận..."
                className="w-full bg-charcoal border border-stone/30 focus:border-brass text-ivory p-2.5 rounded-xs text-xs outline-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleUpdateStatus('confirmed')}
                className="p-2.5 bg-emerald-700 hover:bg-emerald-600 text-ivory text-xs font-medium rounded-xs text-center transition-all disabled:opacity-50"
              >
                ✓ Duyệt cọc (Confirmed)
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleUpdateStatus('completed')}
                className="p-2.5 bg-sky-700 hover:bg-sky-600 text-ivory text-xs font-medium rounded-xs text-center transition-all disabled:opacity-50"
              >
                ★ Hoàn thành
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleUpdateStatus('cancelled')}
                className="p-2.5 bg-red-800 hover:bg-red-700 text-ivory text-xs font-medium rounded-xs text-center transition-all disabled:opacity-50"
              >
                ✕ Huỷ đơn
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleUpdateStatus('pending')}
                className="p-2.5 bg-amber-700 hover:bg-amber-600 text-ivory text-xs font-medium rounded-xs text-center transition-all disabled:opacity-50"
              >
                Chờ cọc (Pending)
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
