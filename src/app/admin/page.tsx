'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Lock,
  Search,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  Sliders,
  Users,
  LogOut,
  Edit,
  Save,
  Check,
  Bell,
  Send,
  Trash2,
  Plus,
  History,
  Settings,
  LayoutGrid,
  Smartphone,
} from 'lucide-react';
import {
  Booking,
  Room,
  TimeSlot,
  SlotBlock,
  SystemSettings,
  NotificationLog,
  BookingAuditLog,
} from '@/lib/types';
import { BRAND_CONFIG, getTodayDateString } from '@/lib/config';

interface DashboardStats {
  todayBookings: number;
  confirmedTodayBookings: number;
  pendingBookings: number;
  rejectedBookings: number;
  expiredBookings: number;
  availableSlotsToday: number;
  totalRevenue: number;
  totalBookings: number;
  notificationStats: {
    sent: number;
    pending: number;
    failed: number;
  };
}

interface ZaloEnvStatus {
  zaloOaConfigured: boolean;
  zaloWebhookConfigured: boolean;
  customerWebhookConfigured: boolean;
  znsConfigured: boolean;
}

function AdminDashboardContent() {
  const searchParams = useSearchParams();
  const deepLinkBookingId = searchParams.get('bookingId');
  const queryPasscode = searchParams.get('passcode');
  const querySubTab = searchParams.get('subtab');
  const initialSubTab: 'pending' | 'confirmed' | 'all' =
    querySubTab === 'confirmed' || querySubTab === 'all' ? querySubTab : 'pending';

  const [passcode, setPasscode] = useState<string>(queryPasscode || '');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [checkingSession, setCheckingSession] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<
    'bookings' | 'calendar' | 'config' | 'notifications' | 'rooms'
  >('bookings');

  // Dashboard Stats
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Bookings list & filters
  const [bookingSubTab, setBookingSubTab] = useState<'pending' | 'confirmed' | 'all'>(initialSubTab);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>(initialSubTab);
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterRoomId, setFilterRoomId] = useState<string>('all');
  const [quickApprovingId, setQuickApprovingId] = useState<string | null>(null);

  // Rooms list & editing
  const [rooms, setRooms] = useState<Room[]>([]);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editPricePerHour, setEditPricePerHour] = useState<number | ''>(0);
  const [editPricePackage2h, setEditPricePackage2h] = useState<number | ''>(0);
  const [editCapacityMax, setEditCapacityMax] = useState<number | ''>(0);

  // Daily Slot Calendar state
  const [calendarDate, setCalendarDate] = useState<string>(getTodayDateString());
  const [calendarRoomId, setCalendarRoomId] = useState<string>('room-1');
  const [calendarDuration, setCalendarDuration] = useState<number>(1.5);
  const [calendarSlots, setCalendarSlots] = useState<TimeSlot[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState<boolean>(false);

  // Config & Slot Blocks state
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [slotBlocks, setSlotBlocks] = useState<SlotBlock[]>([]);
  const [zaloStatus, setZaloStatus] = useState<ZaloEnvStatus | null>(null);
  const [closedDatesInput, setClosedDatesInput] = useState<string>('');
  const [newBlockRoomId, setNewBlockRoomId] = useState<string>('ALL');
  const [newBlockDate, setNewBlockDate] = useState<string>(getTodayDateString());
  const [newBlockStart, setNewBlockStart] = useState<string>('12:00');
  const [newBlockEnd, setNewBlockEnd] = useState<string>('14:00');
  const [newBlockReason, setNewBlockReason] = useState<string>('Bảo trì / Sự kiện nội bộ');

  // Notification Logs tab
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [notifFilterStatus, setNotifFilterStatus] = useState<string>('ALL');
  const [loadingNotifications, setLoadingNotifications] = useState<boolean>(false);

  // Selected Booking Modal state
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingAuditLogs, setBookingAuditLogs] = useState<BookingAuditLog[]>([]);
  const [bookingNotifications, setBookingNotifications] = useState<NotificationLog[]>([]);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [actionNotes, setActionNotes] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [cancellationReason, setCancellationReason] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // PWA & Mobile App states
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [showPwaInstallModal, setShowPwaInstallModal] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [isIos, setIsIos] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const playChimeSound = useCallback(() => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.15);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(659.25, now + 0.08);
      osc2.frequency.exponentialRampToValueAtTime(1046.5, now + 0.3);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now + 0.08);
      osc1.stop(now + 1.2);
      osc2.stop(now + 1.2);
    } catch {
      // Audio context might be restricted before interaction
    }
  }, []);

  const authHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (passcode) {
      headers['x-admin-passcode'] = passcode;
    }
    return headers;
  }, [passcode]);

  // Fetch Dashboard Stats
  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats', {
        headers: passcode ? { 'x-admin-passcode': passcode } : undefined,
        cache: 'no-store',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStats((prevStats) => {
          if (prevStats && data.data.pendingBookings > prevStats.pendingBookings) {
            playChimeSound();
            showToast(`🔔 Có yêu cầu đặt phòng mới (${data.data.pendingBookings} đơn chờ duyệt)!`);
          }
          return data.data;
        });
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  }, [passcode, playChimeSound]);

  // Fetch Bookings with filters
  const loadBookings = useCallback(async () => {
    setLoadingBookings(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus && filterStatus !== 'all') params.append('status', filterStatus);
      if (filterDate) params.append('date', filterDate);
      if (filterRoomId && filterRoomId !== 'all') params.append('roomId', filterRoomId);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/admin/bookings?${params.toString()}`, {
        headers: passcode ? { 'x-admin-passcode': passcode } : undefined,
        cache: 'no-store',
      });
      const data = await res.json();
      if (data.success) {
        setBookings(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBookings(false);
    }
  }, [filterStatus, filterDate, filterRoomId, searchQuery, passcode]);

  // Fetch Rooms
  const loadRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/rooms', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setRooms(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Fetch Calendar Slots for selected date & room
  const loadCalendarSlots = useCallback(async () => {
    if (!calendarDate || !calendarRoomId) return;
    setLoadingCalendar(true);
    try {
      const res = await fetch(
        `/api/availability?roomId=${encodeURIComponent(calendarRoomId)}&date=${encodeURIComponent(
          calendarDate
        )}&durationHours=${calendarDuration}`,
        { cache: 'no-store' }
      );
      const data = await res.json();
      if (data.success && data.data?.slots) {
        setCalendarSlots(data.data.slots);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCalendar(false);
    }
  }, [calendarDate, calendarRoomId, calendarDuration]);

  // Fetch System Settings & Slot Blocks
  const loadConfigAndBlocks = useCallback(async () => {
    try {
      const [cfgRes, blkRes] = await Promise.all([
        fetch('/api/admin/config', {
          headers: passcode ? { 'x-admin-passcode': passcode } : undefined,
          cache: 'no-store',
        }),
        fetch('/api/admin/slot-blocks', {
          headers: passcode ? { 'x-admin-passcode': passcode } : undefined,
          cache: 'no-store',
        }),
      ]);
      const cfgData = await cfgRes.json();
      if (cfgData.success) {
        setSettings(cfgData.data.settings);
        setClosedDatesInput((cfgData.data.settings.closedDates || []).join(', '));
        setZaloStatus(cfgData.data.zaloStatus || cfgData.data.zaloConfig || null);
      }
      const blkData = await blkRes.json();
      if (blkData.success) {
        setSlotBlocks(blkData.data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [passcode]);

  // Fetch Notification Logs
  const loadNotifications = useCallback(async () => {
    setLoadingNotifications(true);
    try {
      const params = new URLSearchParams();
      if (notifFilterStatus !== 'ALL') {
        params.append('status', notifFilterStatus);
      }
      const res = await fetch(`/api/admin/notifications?${params.toString()}`, {
        headers: passcode ? { 'x-admin-passcode': passcode } : undefined,
        cache: 'no-store',
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingNotifications(false);
    }
  }, [notifFilterStatus, passcode]);

  // Open Booking Detail Modal with full audit & notification logs
  const openBookingDetail = useCallback(
    async (bookingId: string) => {
      setLoadingDetail(true);
      setActionError(null);
      try {
        const res = await fetch(`/api/admin/bookings/${encodeURIComponent(bookingId)}`, {
          headers: passcode ? { 'x-admin-passcode': passcode } : undefined,
          cache: 'no-store',
        });
        const data = await res.json();
        if (res.ok && data.success && data.data) {
          const b: Booking = data.data.booking || data.data;
          if (b && typeof b === 'object') {
            setSelectedBooking(b);
            setBookingAuditLogs(data.data.auditLogs || []);
            setBookingNotifications(data.data.notificationLogs || data.data.notifications || []);
            setActionNotes(b.adminNotes || '');
            setRejectionReason(b.rejectionReason || '');
            setCancellationReason(b.cancellationReason || '');
          }
        } else {
          showToast(data.error || 'Không tìm thấy đơn đặt lịch.');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingDetail(false);
      }
    },
    [passcode]
  );

  // Check existing session cookie or queryPasscode on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (queryPasscode) {
          const authRes = await fetch('/api/admin/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ passcode: queryPasscode }),
          });
          const authData = await authRes.json();
          if (mounted && authData.success) {
            setIsAuthenticated(true);
            return;
          }
        }
        const res = await fetch('/api/admin/auth', { cache: 'no-store' });
        const data = await res.json();
        if (mounted && data.authenticated) {
          setIsAuthenticated(true);
        }
      } catch {
        // Not authenticated yet
      } finally {
        if (mounted) setCheckingSession(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [queryPasscode]);

  // Load initial data once authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    loadStats();
    loadBookings();
    loadRooms();
    loadConfigAndBlocks();
    loadNotifications();

    if (deepLinkBookingId) {
      openBookingDetail(deepLinkBookingId);
    }
  }, [
    isAuthenticated,
    deepLinkBookingId,
    loadStats,
    loadBookings,
    loadRooms,
    loadConfigAndBlocks,
    loadNotifications,
    openBookingDetail,
  ]);

  // Reload bookings when filters change
  useEffect(() => {
    if (isAuthenticated) {
      loadBookings();
    }
  }, [isAuthenticated, filterStatus, filterDate, filterRoomId, loadBookings]);

  // Reload calendar when calendar tab or filters change
  useEffect(() => {
    if (isAuthenticated && activeTab === 'calendar') {
      loadCalendarSlots();
    }
  }, [isAuthenticated, activeTab, calendarDate, calendarRoomId, calendarDuration, loadCalendarSlots]);

  // Reload notifications when tab or filter changes
  useEffect(() => {
    if (isAuthenticated && activeTab === 'notifications') {
      loadNotifications();
    }
  }, [isAuthenticated, activeTab, notifFilterStatus, loadNotifications]);

  // PWA standalone detection & install prompt listener
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      Boolean((window.navigator as unknown as { standalone?: boolean }).standalone);
    setIsStandalone(standalone);

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIos(/iphone|ipad|ipod/.test(ua));

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // Auto-poll every 10 seconds for real-time mobile updates
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        loadStats();
        if (activeTab === 'bookings') loadBookings();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, activeTab, loadStats, loadBookings]);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      const promptEvent = deferredPrompt as unknown as {
        prompt: () => void;
        userChoice: Promise<{ outcome: string }>;
      };
      promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === 'accepted') {
        setIsStandalone(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowPwaInstallModal(true);
    }
  };

  // Login Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Mã PIN bảo mật không chính xác.');
      }

      setIsAuthenticated(true);
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Lỗi xác thực.');
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    setIsAuthenticated(false);
    setPasscode('');
  };

  // Approve PENDING booking -> CONFIRMED
  const handleApproveBooking = async () => {
    if (!selectedBooking) return;
    setActionLoading(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/admin/bookings/${selectedBooking.id}/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          adminNotes: actionNotes.trim() || undefined,
          reviewedBy: 'Trà Sư Quản Trị',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Duyệt lịch thất bại.');
      }

      showToast(`Đã xác nhận (CONFIRMED) lịch hẹn ${selectedBooking.bookingReference}!`);
      await openBookingDetail(selectedBooking.id);
      loadBookings();
      loadStats();
      if (activeTab === 'calendar') loadCalendarSlots();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Lỗi khi xác nhận đặt lịch.');
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Approve directly from Mobile Card or Desktop Row without opening modal
  const handleQuickApprove = async (bookingId: string, bookingRef: string) => {
    setQuickApprovingId(bookingId);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/approve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          adminNotes: 'Lùng Vài Tea đã chuẩn bị sẵn bàn trà và hân hạnh được đón tiếp Quý khách!',
          reviewedBy: 'Quản trị viên',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Duyệt lịch thất bại.');
      }
      showToast(`✓ Đã duyệt thành công đơn ${bookingRef} và gửi email xác nhận cho khách hàng!`);
      loadBookings();
      loadStats();
    } catch (err: unknown) {
      showToast(`❌ ${err instanceof Error ? err.message : 'Lỗi duyệt đơn'}`);
    } finally {
      setQuickApprovingId(null);
    }
  };

  // Reject PENDING booking -> REJECTED
  const handleRejectBooking = async () => {
    if (!selectedBooking) return;
    setActionLoading(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/admin/bookings/${selectedBooking.id}/reject`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          reason:
            rejectionReason.trim() ||
            'Phòng trà đã kín lịch hoặc có sự kiện bảo trì đột xuất trong khung giờ này.',
          adminNotes: actionNotes.trim() || undefined,
          reviewedBy: 'Trà Sư Quản Trị',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Từ chối lịch thất bại.');
      }

      showToast(`Đã từ chối (REJECTED) yêu cầu ${selectedBooking.bookingReference} và mở lại khung giờ!`);
      await openBookingDetail(selectedBooking.id);
      loadBookings();
      loadStats();
      if (activeTab === 'calendar') loadCalendarSlots();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Lỗi khi từ chối yêu cầu.');
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel CONFIRMED booking -> CANCELLED
  const handleCancelBooking = async () => {
    if (!selectedBooking) return;
    if (!cancellationReason.trim()) {
      setActionError('Vui lòng nhập lý do hủy lịch đã xác nhận để thông báo cho khách hàng.');
      return;
    }

    setActionLoading(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/admin/bookings/${selectedBooking.id}/cancel`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          reason: cancellationReason.trim(),
          adminNotes: actionNotes.trim() || undefined,
          reviewedBy: 'Trà Sư Quản Trị',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Hủy lịch thất bại.');
      }

      showToast(`Đã hủy lịch ${selectedBooking.bookingReference} và giải phóng khung giờ!`);
      await openBookingDetail(selectedBooking.id);
      loadBookings();
      loadStats();
      if (activeTab === 'calendar') loadCalendarSlots();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Lỗi khi hủy lịch.');
    } finally {
      setActionLoading(false);
    }
  };

  // Mark CONFIRMED booking as COMPLETED
  const handleMarkCompleted = async () => {
    if (!selectedBooking) return;
    setActionLoading(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/admin/bookings/${selectedBooking.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          status: 'completed',
          adminNotes: actionNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Cập nhật thất bại.');
      }

      showToast(`Đã đánh dấu hoàn thành buổi thưởng trà ${selectedBooking.bookingReference}!`);
      await openBookingDetail(selectedBooking.id);
      loadBookings();
      loadStats();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Lỗi khi cập nhật.');
    } finally {
      setActionLoading(false);
    }
  };

  // Retry a single notification
  const handleRetryNotification = async (notificationId: string) => {
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ action: 'retry_one', notificationId }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const log: NotificationLog = data.data;
        if (log.status === 'SENT') {
          showToast('Đã gửi lại thông báo thành công (SENT)!');
        } else {
          showToast(`Gửi lại thất bại: ${log.lastError || 'Lỗi gửi email'}`);
        }
        if (selectedBooking) {
          await openBookingDetail(selectedBooking.id);
        }
        loadNotifications();
        loadStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Run worker (expire overdue bookings + process outbox retry)
  const handleRunWorker = async () => {
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ action: 'run_worker' }),
      });
      const data = await res.json();
      if (data.success) {
        const expired = data.data.expiredCount ?? data.data.expiredBookingsCount ?? 0;
        const processed = data.data.sent ?? data.data.retriedNotificationsCount ?? 0;
        showToast(
          `Đã quét hệ thống: Hết hạn ${expired} đơn quá hạn, xử lý ${processed} thông báo.`
        );
        loadStats();
        loadBookings();
        loadNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save System Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      const closedDates = closedDatesInput
        .split(',')
        .map((s) => s.trim())
        .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s));

      const res = await fetch('/api/admin/config', {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          openTime: settings.openTime,
          closeTime: settings.closeTime,
          slotIntervalMinutes: settings.slotIntervalMinutes,
          defaultDurationHours: settings.defaultDurationHours,
          holdDurationHours: settings.holdDurationHours,
          closedDates,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSettings(data.data);
        showToast('Đã lưu cấu hình vận hành hệ thống đặt lịch!');
      } else {
        alert(data.error || 'Lỗi lưu cấu hình.');
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi lưu cấu hình.');
    }
  };

  // Create Manual Slot Block
  const handleCreateSlotBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/slot-blocks', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          roomId: newBlockRoomId,
          date: newBlockDate,
          startTime: newBlockStart,
          endTime: newBlockEnd,
          reason: newBlockReason,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Đã khóa khung giờ ${newBlockStart} - ${newBlockEnd} ngày ${newBlockDate}!`);
        loadConfigAndBlocks();
        loadStats();
      } else {
        alert(data.error || 'Không thể khóa khung giờ.');
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi khóa khung giờ.');
    }
  };

  // Delete Slot Block
  const handleDeleteSlotBlock = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/slot-blocks?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Đã mở khóa khung giờ thành công!');
        loadConfigAndBlocks();
        loadStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save Room Pricing
  const handleSaveRoom = async (room: Room) => {
    try {
      const res = await fetch(`/api/admin/rooms/${room.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          pricePerHour: Number(editPricePerHour) || room.pricePerHour,
          pricePackage2h: Number(editPricePackage2h) || room.pricePackage2h,
          capacityMax: Number(editCapacityMax) || room.capacityMax,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Cập nhật phòng thất bại.');
      }

      showToast(`Đã cập nhật giá và sức chứa phòng ${room.name}!`);
      setEditingRoomId(null);
      loadRooms();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi cập nhật');
    }
  };

  // Reset Demo Data
  const handleResetData = async () => {
    if (
      !confirm(
        'Bạn có chắc chắn muốn nạp lại dữ liệu mẫu ban đầu? Toàn bộ lịch đặt thử nghiệm sẽ được thiết lập lại.'
      )
    ) {
      return;
    }

    try {
      const res = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Đã khôi phục dữ liệu mẫu ban đầu thành công!');
        loadBookings();
        loadRooms();
        loadStats();
        loadNotifications();
      } else {
        showToast(data.error || 'Không thể nạp lại dữ liệu mẫu.');
      }
    } catch (err) {
      console.error(err);
      showToast('Lỗi kết nối máy chủ, vui lòng thử lại.');
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#EDF5F0] text-[#1D4A38] border border-[#B8D9C5]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#28604A]" />
            CONFIRMED (Đã duyệt)
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#FAF4E8] text-[#8C6D34] border border-[#E5D7BD]">
            <Clock className="w-3.5 h-3.5 text-[#9E7D42] animate-pulse" />
            PENDING (Chờ duyệt)
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#FAF0EE] text-[#7A3631] border border-[#E8CECB]">
            <XCircle className="w-3.5 h-3.5 text-[#9C4B45]" />
            REJECTED (Từ chối)
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-medium bg-[#F4EFEA] text-[#696156] border border-[#DDD5CA]">
            <Clock className="w-3.5 h-3.5 text-[#8A8175]" />
            EXPIRED (Hết hạn)
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-medium bg-[#F6EEEC] text-[#7A403A] border border-[#E3CBC8]">
            <XCircle className="w-3.5 h-3.5 text-[#94514B]" />
            CANCELLED (Đã hủy)
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#EEF5F8] text-[#2C5266] border border-[#C5DCE6]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#356882]" />
            COMPLETED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded text-[11px] bg-[#F4EFEA] text-[#696156] border border-[#DDD5CA]">
            {status}
          </span>
        );
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center text-stone-light text-sm">
        Đang kiểm tra phiên đăng nhập quản trị...
      </div>
    );
  }

  // RENDER: LOGIN FORM
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-walnut/90 border border-brass/40 p-8 rounded-sm shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div 
              className="relative w-18 h-22 sm:w-20 sm:h-25 mx-auto mb-3"
              style={{ position: 'relative', flexShrink: 0, width: '80px', height: '100px', maxWidth: '80px', maxHeight: '100px' }}
            >
              <Image
                src="/images/logo-lung-vai-transparent.png"
                alt="Lùng Vài Tea"
                fill
                sizes="80px"
                className="object-contain filter drop-shadow-[0_4px_16px_rgba(141,52,45,0.6)]"
              />
            </div>
            <span className="seal-stamp text-xs px-2 py-0.5 font-sans font-bold">
              KHU VỰC QUẢN TRỊ
            </span>
            <h1 className="font-serif text-2xl text-ivory font-normal">
              Bảng Điều Khiển Duyệt Lịch Phòng Trà
            </h1>
            <p className="text-xs text-stone-light">
              Xác thực quyền Quản trị viên để duyệt yêu cầu đặt lịch, quản lý khung giờ và theo dõi thông báo Email.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-stone-light mb-1.5 font-medium">
                Mã PIN Quản trị
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Nhập mã PIN bảo mật..."
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full bg-charcoal border border-stone/30 focus:border-brass text-ivory px-4 py-2.5 rounded-xs text-sm outline-none font-mono"
                />
                <Lock className="w-4 h-4 text-brass absolute right-3 top-3 pointer-events-none" />
              </div>
              <span className="text-[11px] text-stone block mt-1">
                {process.env.NODE_ENV !== 'production' ? (
                  <>
                    Cấu hình qua biến môi trường <code className="text-brass">ADMIN_PASSCODE</code> (Mặc định dev: <code className="text-brass">teaanf2026</code>)
                  </>
                ) : (
                  <>Vui lòng nhập mã PIN quản trị nội bộ để tiếp tục.</>
                )}
              </span>
            </div>

            {authError && (
              <div className="p-3 bg-vermilion/20 border border-vermilion/40 text-xs text-ivory rounded-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-vermilion flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-vermilion hover:bg-vermilion-light text-white text-xs uppercase tracking-[0.2em] font-medium rounded-sm shadow-lg transition-all cursor-pointer"
            >
              Đăng nhập Quản trị
            </button>
          </form>

          <div className="pt-2 border-t border-stone/20 text-center space-y-3">
            <Link
              href="/install"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-tea-green/20 hover:bg-tea-green/30 border border-tea-green/40 text-tea-sage text-xs font-semibold rounded-xs transition-all shadow-sm"
            >
              <Smartphone className="w-4 h-4" />
              Cài đặt App lên màn hình điện thoại
            </Link>
            <div>
              <Link href="/" className="text-xs text-stone-light hover:text-brass transition-colors">
                ← Quay lại trang chủ Lùng Vài Tea
              </Link>
            </div>
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
        <div className="fixed bottom-6 right-6 z-50 bg-brass text-white px-4 py-3 rounded-sm shadow-2xl text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Header Bar */}
      <header className="bg-walnut/90 border-b border-brass/30 py-4 px-6 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div 
              className="relative w-10 h-13 flex-shrink-0"
              style={{ position: 'relative', flexShrink: 0, width: '40px', height: '52px', maxWidth: '40px', maxHeight: '52px' }}
            >
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
                {BRAND_CONFIG.brandName} — Quản Trị Đặt Lịch
              </span>
              <span className="text-[10px] text-brass uppercase tracking-wider block">
                Hệ Thống Duyệt Lịch Tập Trung & Thông Báo Gmail Tức Thì
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {!isStandalone && (
              <button
                onClick={handleInstallPwa}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-vermilion hover:bg-vermilion-light text-white text-xs font-semibold rounded-xs shadow-md transition-all cursor-pointer"
                title="Cài đặt App lên màn hình điện thoại"
              >
                <span className="text-sm">📱</span>
                <span className="hidden sm:inline">Cài App Điện Thoại</span>
                <span className="sm:hidden">Cài App</span>
              </button>
            )}

            <button
              onClick={handleRunWorker}
              className="hidden md:inline-flex items-center gap-1.5 text-xs text-stone-light hover:text-brass px-3 py-1.5 rounded bg-charcoal/60 border border-stone/20 cursor-pointer"
              title="Quét đơn PENDING quá hạn & gửi lại thông báo Outbox"
            >
              <Clock className="w-3.5 h-3.5 text-brass" />
              <span>Quét đơn quá hạn & Outbox</span>
            </button>

            <Link
              href="/booking"
              target="_blank"
              className="text-xs text-stone-light hover:text-ivory px-3 py-1.5 rounded bg-charcoal/60 border border-stone/20"
            >
              Mở Trang Đặt Lịch
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-vermilion-light hover:text-vermilion cursor-pointer"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Thoát</span>
            </button>
          </div>
        </div>
      </header>

      {/* PWA Mobile Banner */}
      {!isStandalone && (
        <div className="bg-gradient-to-r from-walnut to-charcoal border-b border-brass/30 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-stone-light">
              <span className="text-base">📱</span>
              <span>
                <strong className="text-ivory">Gợi ý quản trị trên Di Động:</strong> Cài App Lùng Vài Tea ra màn hình chính để mở toàn màn hình, đổ chuông khi có khách đặt và duyệt lịch 1 chạm.
              </span>
            </div>
            <button
              onClick={handleInstallPwa}
              className="self-start sm:self-auto text-brass hover:text-ivory font-semibold underline cursor-pointer"
            >
              Xem hướng dẫn cài App →
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* KPI Stats Cards (Section 10.1) */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div
              onClick={() => {
                setActiveTab('bookings');
                setFilterStatus('pending');
              }}
              className="p-4 bg-[#FAF7F0] border border-[#E7DECA] rounded-sm cursor-pointer hover:border-[#1D4A38] hover:shadow-sm transition-all"
            >
              <span className="text-[10px] uppercase tracking-wider text-[#8C6D34] font-semibold block">
                Chờ duyệt (PENDING)
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="font-serif text-3xl text-[#1D4A38] font-bold">
                  {stats.pendingBookings}
                </span>
                <Clock className="w-4 h-4 text-[#9E7D42]" />
              </div>
              <span className="text-[10px] text-[#7A633B] font-medium mt-1 block">
                Nhấn để xem đơn cần duyệt
              </span>
            </div>

            <div className="p-4 bg-[#F2F7F4] border border-[#CDE3D5] rounded-sm">
              <span className="text-[10px] uppercase tracking-wider text-[#1D4A38] font-semibold block">
                Đã xác nhận hôm nay
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="font-serif text-3xl text-[#1D4A38] font-bold">
                  {stats.confirmedTodayBookings}
                </span>
                <CheckCircle2 className="w-4 h-4 text-[#28604A]" />
              </div>
              <span className="text-[10px] text-[#28604A] font-medium mt-1 block">
                Tổng lịch hôm nay: {stats.todayBookings}
              </span>
            </div>

            <div
              onClick={() => setActiveTab('calendar')}
              className="p-4 bg-walnut/60 border border-stone/20 rounded-sm cursor-pointer hover:border-brass/50 transition-all"
            >
              <span className="text-[10px] uppercase tracking-wider text-stone-light block">
                Slot trống hôm nay
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="font-serif text-3xl text-ivory font-medium">
                  {stats.availableSlotsToday}
                </span>
                <LayoutGrid className="w-4 h-4 text-brass" />
              </div>
              <span className="text-[10px] text-brass mt-1 block">Xem lịch lưới 15 phút →</span>
            </div>

            <div className="p-4 bg-walnut/60 border border-stone/20 rounded-sm">
              <span className="text-[10px] uppercase tracking-wider text-stone-light block">
                Từ chối / Hết hạn
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="font-serif text-2xl text-ivory font-medium">
                  {stats.rejectedBookings} / {stats.expiredBookings}
                </span>
                <XCircle className="w-4 h-4 text-red-600" />
              </div>
              <span className="text-[10px] text-stone-light mt-1 block">
                Đã giải phóng khung giờ
              </span>
            </div>

            <div
              onClick={() => setActiveTab('notifications')}
              className="p-4 bg-walnut/60 border border-stone/20 rounded-sm cursor-pointer hover:border-brass/50 transition-all"
            >
              <span className="text-[10px] uppercase tracking-wider text-stone-light block">
                Thông báo Email / Outbox
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="font-mono text-lg text-ivory font-semibold">
                  <span className="text-emerald-700 font-bold">{stats.notificationStats.sent}</span>
                  {' / '}
                  <span className="text-amber-700 font-bold">{stats.notificationStats.pending}</span>
                  {' / '}
                  <span className="text-red-700 font-bold">{stats.notificationStats.failed}</span>
                </span>
                <Bell className="w-4 h-4 text-brass" />
              </div>
              <span className="text-[10px] text-stone-light mt-1 block">
                Đã gửi / Chờ / Lỗi cấu hình
              </span>
            </div>

            <div className="p-4 bg-walnut/60 border border-stone/20 rounded-sm">
              <span className="text-[10px] uppercase tracking-wider text-stone-light block">
                Doanh thu xác nhận
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="font-serif text-xl text-brass font-medium">
                  {stats.totalRevenue.toLocaleString('vi-VN')} đ
                </span>
                <TrendingUp className="w-4 h-4 text-brass" />
              </div>
              <span className="text-[10px] text-stone-light mt-1 block">
                Tổng {stats.totalBookings} lượt đặt
              </span>
            </div>
          </div>
        )}

        {/* Navigation Tabs (Smooth horizontal scrolling on mobile, full width on desktop) */}
        <div className="flex items-center gap-2 sm:gap-6 border-b border-stone/20 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`pb-3 px-2 text-xs uppercase tracking-[0.15em] font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'bookings'
                ? 'border-brass text-brass'
                : 'border-transparent text-stone-light hover:text-ivory'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>1. Danh sách Yêu cầu ({bookings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`pb-3 px-2 text-xs uppercase tracking-[0.15em] font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'calendar'
                ? 'border-brass text-brass'
                : 'border-transparent text-stone-light hover:text-ivory'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>2. Lịch Khung Giờ Theo Ngày</span>
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`pb-3 px-2 text-xs uppercase tracking-[0.15em] font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'config'
                ? 'border-brass text-brass'
                : 'border-transparent text-stone-light hover:text-ivory'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>3. Khóa Giờ & Cấu Hình ({slotBlocks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`pb-3 px-2 text-xs uppercase tracking-[0.15em] font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'notifications'
                ? 'border-brass text-brass'
                : 'border-transparent text-stone-light hover:text-ivory'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>4. Nhật Ký Gửi Email ({stats?.notificationStats.sent || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('rooms')}
            className={`pb-3 px-2 text-xs uppercase tracking-[0.15em] font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'rooms'
                ? 'border-brass text-brass'
                : 'border-transparent text-stone-light hover:text-ivory'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>5. Giá & Sức Chứa Phòng</span>
          </button>
        </div>

        {/* ================= TAB 1: BOOKINGS LIST ================= */}
        {activeTab === 'bookings' && (
          <div className="space-y-5">
            {/* 1. Sub-Tab Navigation: Tách riêng Đơn Chờ Duyệt (Mặc định) vs Đã Duyệt vs Toàn bộ */}
            <div className="flex items-center gap-2.5 border-b border-[#DDD5CA] pb-3 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
              <button
                onClick={() => {
                  setBookingSubTab('pending');
                  setFilterStatus('pending');
                }}
                className={`py-2 px-3.5 rounded-sm text-xs font-semibold tracking-wider flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                  bookingSubTab === 'pending'
                    ? 'bg-[#1D4A38] text-white shadow-sm ring-1 ring-[#1D4A38]/30 font-bold'
                    : 'bg-white text-[#574E43] hover:bg-[#F5EFE6] hover:text-[#1D4A38] border border-[#DDD5CA]'
                }`}
              >
                <span>⏳ Đơn Chờ Duyệt (Chính)</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                  bookingSubTab === 'pending' ? 'bg-white/20 text-[#FAF7F2]' : 'bg-[#1D4A38]/10 text-[#1D4A38]'
                }`}>
                  {stats?.pendingBookings || 0}
                </span>
              </button>

              <button
                onClick={() => {
                  setBookingSubTab('confirmed');
                  setFilterStatus('confirmed');
                }}
                className={`py-2 px-3.5 rounded-sm text-xs font-semibold tracking-wider flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                  bookingSubTab === 'confirmed'
                    ? 'bg-[#1D4A38] text-white shadow-sm ring-1 ring-[#1D4A38]/30 font-bold'
                    : 'bg-white text-[#574E43] hover:bg-[#F5EFE6] hover:text-[#1D4A38] border border-[#DDD5CA]'
                }`}
              >
                <span>✓ Đã Duyệt &amp; Xác Nhận</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                  bookingSubTab === 'confirmed' ? 'bg-white/20 text-[#FAF7F2]' : 'bg-emerald-600/10 text-emerald-800'
                }`}>
                  {stats?.confirmedTodayBookings || 0}
                </span>
              </button>

              <button
                onClick={() => {
                  setBookingSubTab('all');
                  setFilterStatus('all');
                }}
                className={`py-2 px-3.5 rounded-sm text-xs font-semibold tracking-wider flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                  bookingSubTab === 'all'
                    ? 'bg-[#9E7D42] text-white shadow-sm font-bold'
                    : 'bg-white text-[#574E43] hover:bg-[#F5EFE6] hover:text-[#1D4A38] border border-[#DDD5CA]'
                }`}
              >
                <span>📋 Toàn Bộ / Lịch Sử</span>
                <span className={`text-[11px] font-mono ${bookingSubTab === 'all' ? 'text-white/80' : 'text-[#8A8175]'}`}>
                  ({stats?.totalBookings || 0})
                </span>
              </button>
            </div>

            {/* 2. Banner diễn giải theo tab hiện tại */}
            {bookingSubTab === 'pending' && (
              <div className="p-3.5 bg-[#FAF6EE] border border-[#E7DECA] rounded-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-[#28221D]">
                  <span className="text-base text-[#9E7D42]">⚡</span>
                  <span>
                    <strong className="text-[#1D4A38] font-bold">{bookings.length} yêu cầu</strong> đang chờ bạn duyệt. Bấm <strong className="text-[#1D4A38] font-bold">Duyệt đơn ngay</strong> để chuyển trạng thái và tự động gửi email cho khách.
                  </span>
                </div>
                <button
                  onClick={() => { loadBookings(); loadStats(); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-[#ECE4D8] text-[#1D4A38] border border-[#D5CBB9] rounded-xs text-[11px] font-semibold transition-all cursor-pointer self-end sm:self-auto shadow-2xs"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Làm mới</span>
                </button>
              </div>
            )}

            {bookingSubTab === 'confirmed' && (
              <div className="p-3.5 bg-[#EDF5F0] border border-[#C5DFD0] rounded-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-[#1D4A38]">
                  <span className="text-base font-bold text-[#28604A]">✓</span>
                  <span>
                    Danh sách các lịch hẹn <strong>ĐÃ DUYỆT THÀNH CÔNG</strong>. Bàn trà và phòng ốc đã sẵn sàng đón tiếp.
                  </span>
                </div>
                <button
                  onClick={() => { loadBookings(); loadStats(); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-[#E0EFE5] text-[#1D4A38] border border-[#C5DFD0] rounded-xs text-[11px] font-semibold transition-all cursor-pointer self-end sm:self-auto shadow-2xs"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Làm mới</span>
                </button>
              </div>
            )}

            {/* 3. Filter Bar */}
            <div className="p-3.5 bg-walnut/50 border border-stone/20 rounded-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Search */}
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Tìm mã đơn, tên hoặc SĐT..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') loadBookings();
                    }}
                    className="w-full bg-charcoal border border-stone/30 focus:border-brass text-xs px-3 py-2 rounded-xs text-ivory outline-none"
                  />
                  <Search className="w-3.5 h-3.5 text-stone absolute right-2.5 top-2.5 pointer-events-none" />
                </div>

                {/* Status Filter (Chỉ ở tab Toàn bộ) */}
                {bookingSubTab === 'all' && (
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-charcoal border border-stone/30 focus:border-brass text-xs px-3 py-2 rounded-xs text-ivory outline-none"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="pending">⏳ Đang chờ duyệt (PENDING)</option>
                    <option value="confirmed">✓ Đã xác nhận (CONFIRMED)</option>
                    <option value="rejected">✕ Đã từ chối (REJECTED)</option>
                    <option value="expired">⌛ Đã hết hạn (EXPIRED)</option>
                    <option value="cancelled">✕ Đã hủy (CANCELLED)</option>
                    <option value="completed">★ Đã hoàn thành (COMPLETED)</option>
                  </select>
                )}

                {/* Room Filter */}
                <select
                  value={filterRoomId}
                  onChange={(e) => setFilterRoomId(e.target.value)}
                  className="bg-charcoal border border-stone/30 focus:border-brass text-xs px-3 py-2 rounded-xs text-ivory outline-none"
                >
                  <option value="all">Tất cả phòng trà</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Phòng {r.name}
                    </option>
                  ))}
                </select>

                {/* Date Filter */}
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="bg-charcoal border border-stone/30 focus:border-brass text-xs px-3 py-2 rounded-xs text-ivory outline-none"
                />

                {(searchQuery || filterDate || filterRoomId !== 'all' || (bookingSubTab === 'all' && filterStatus !== 'all')) && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterDate('');
                      setFilterRoomId('all');
                      if (bookingSubTab === 'all') setFilterStatus('all');
                    }}
                    className="text-xs text-brass hover:underline cursor-pointer"
                  >
                    Xoá bộ lọc
                  </button>
                )}
              </div>

              {bookingSubTab === 'all' && (
                <button
                  onClick={() => {
                    loadBookings();
                    loadStats();
                  }}
                  className="inline-flex items-center justify-center gap-1.5 text-xs text-stone-light hover:text-ivory px-3 py-2 bg-charcoal rounded-xs border border-stone/20 cursor-pointer self-start lg:self-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Làm mới</span>
                </button>
              )}
            </div>

            {/* 4. GIAO DIỆN DI ĐỘNG (MOBILE CARD VIEW) - Tối ưu 100% cho điện thoại, không cần cuộn ngang */}
            <div className="block lg:hidden space-y-3.5">
              {loadingBookings ? (
                <div className="py-12 text-center bg-walnut/40 border border-stone/20 rounded-sm text-stone-light text-xs">
                  Đang tải danh sách đặt phòng...
                </div>
              ) : bookings.length === 0 ? (
                <div className="py-12 text-center bg-walnut/40 border border-stone/20 rounded-sm text-stone-light text-xs">
                  {bookingSubTab === 'pending'
                    ? '🎉 Không có đơn nào đang chờ duyệt. Mọi yêu cầu đã được xử lý!'
                    : 'Không có đơn nào phù hợp với bộ lọc hiện tại.'}
                </div>
              ) : (
                bookings.map((b) => {
                  const isPending = b.status === 'pending';
                  return (
                    <div
                      key={b.id}
                      className={`p-4 rounded-sm border transition-all ${
                        isPending
                          ? 'bg-white border-[#DDD5CA] border-l-4 border-l-[#1D4A38] shadow-sm text-[#28221D]'
                          : 'bg-[#FAF8F5] border-[#E5DFD5] border-l-4 border-l-[#9E7D42] shadow-2xs text-[#4A4237]'
                      }`}
                    >
                      {/* Top Header Card: Mã + Trạng thái */}
                      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#EAE3D6]">
                        <span className="font-mono font-bold text-xs text-[#9E7D42] tracking-wider">
                          #{b.bookingReference}
                        </span>
                        <div>{renderStatusBadge(b.status)}</div>
                      </div>

                      {/* Thông tin Khách hàng */}
                      <div className="pt-2.5">
                        <div className="flex items-baseline justify-between gap-2">
                          <h4 className="text-base font-bold text-[#1D4A38]">
                            {b.customerName}
                          </h4>
                          <span className="text-xs font-semibold text-[#9E7D42]">
                            Phòng {b.roomName}
                          </span>
                        </div>

                        {/* Nút bấm gọi điện thoại & Email nhanh */}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <a
                            href={`tel:${b.customerPhone}`}
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-[#F5EFE6] hover:bg-[#EAE1D4] text-[#1D4A38] font-bold border border-[#DDD5CA] active:scale-95 transition-transform"
                          >
                            📞 {b.customerPhone}
                          </a>
                          {b.customerEmail && (
                            <a
                              href={`mailto:${b.customerEmail}`}
                              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-[#EDF5F0] hover:bg-[#DFECE3] text-[#1D4A38] font-semibold border border-[#C5DFD0] transition-colors"
                            >
                              ✉️ {b.customerEmail}
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Chi tiết lịch hẹn dạng 2 cột */}
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#EAE3D6] text-xs">
                        <div>
                          <span className="block text-[11px] text-[#786D5F]">Ngày thưởng trà:</span>
                          <span className="font-semibold text-[#28221D]">{b.date}</span>
                        </div>
                        <div>
                          <span className="block text-[11px] text-[#786D5F]">Khung giờ:</span>
                          <span className="font-semibold text-[#1D4A38]">
                            {b.startTime} – {b.endTime} ({b.durationHours}h)
                          </span>
                        </div>
                        <div>
                          <span className="block text-[11px] text-[#786D5F]">Số lượng khách:</span>
                          <span className="font-semibold text-[#28221D]">{b.guestCount} khách</span>
                        </div>
                        <div>
                          <span className="block text-[11px] text-[#786D5F]">Tổng chi phí:</span>
                          <span className="font-bold text-[#1D4A38]">
                            {b.totalPrice.toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      </div>

                      {/* Hạn giữ chỗ nếu pending */}
                      {isPending && b.expiresAt && (
                        <div className="mt-2.5 text-[11px] px-2.5 py-1.5 rounded bg-[#FAF6EE] text-[#695328] border border-[#E7DECA] font-medium flex items-center gap-1">
                          <span>⏰ Hạn duyệt:</span>
                          <span className="font-mono font-semibold">
                            {new Date(b.expiresAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ngày {new Date(b.expiresAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      )}

                      {/* Ghi chú của khách nếu có */}
                      {b.specialRequests && (
                        <div className="mt-2.5 p-2.5 rounded bg-[#F8F5EE] border border-[#ECE5D8] text-[11px] text-[#5A5144] italic">
                          &ldquo;{b.specialRequests}&rdquo;
                        </div>
                      )}

                      {/* NÚT BẤM THAO TÁC TRỰC TIẾP TRÊN MOBILE (TO RÕ, DỄ BẤM BẰNG TAY) */}
                      <div className="mt-3.5 pt-3 border-t border-[#EAE3D6] flex items-center gap-2">
                        {isPending ? (
                          <>
                            <button
                              onClick={() => handleQuickApprove(b.id, b.bookingReference)}
                              disabled={quickApprovingId === b.id}
                              className="flex-1 py-3 px-3 bg-[#1D4A38] hover:bg-[#28604A] text-white text-xs uppercase tracking-wider font-bold rounded flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all border border-[#28604A] cursor-pointer"
                            >
                              {quickApprovingId === b.id ? (
                                <span>Đang duyệt &amp; gửi mail...</span>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-4 h-4 text-[#A7F3D0]" />
                                  <span>Duyệt đơn ngay</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => openBookingDetail(b.id)}
                              className="py-3 px-3.5 bg-[#F5EFE6] hover:bg-[#ECE4D8] text-[#28221D] text-xs font-bold rounded border border-[#DDD5CA] active:scale-95 transition-all cursor-pointer"
                            >
                              Chi tiết
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => openBookingDetail(b.id)}
                            className="w-full py-2.5 px-3 bg-white hover:bg-[#F5EFE6] text-[#1D4A38] text-xs font-semibold rounded border border-[#DDD5CA] flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                          >
                            <Sliders className="w-3.5 h-3.5 text-[#9E7D42]" />
                            <span>Xem chi tiết &amp; Nhật ký</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* 5. GIAO DIỆN MÁY TÍNH (DESKTOP TABLE VIEW) - Hiển thị bảng đầy đủ trên màn hình lớn */}
            <div className="hidden lg:block bg-walnut/70 border border-stone/20 rounded-sm overflow-x-auto shadow-xl">
              <table className="w-full text-left text-xs text-ivory-muted">
                <thead className="bg-charcoal/80 text-stone-light uppercase tracking-wider text-[11px] border-b border-stone/20">
                  <tr>
                    <th className="py-3 px-4">Mã booking</th>
                    <th className="py-3 px-4">Khách hàng</th>
                    <th className="py-3 px-4">Phòng trà</th>
                    <th className="py-3 px-4">Ngày &amp; Khung giờ</th>
                    <th className="py-3 px-4">Số khách</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4">Thời gian gửi / Giữ chỗ</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone/15">
                  {loadingBookings ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-stone-light">
                        Đang tải danh sách yêu cầu đặt lịch...
                      </td>
                    </tr>
                  ) : bookings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-stone-light">
                        {bookingSubTab === 'pending'
                          ? '🎉 Không có đơn nào đang chờ duyệt. Mọi yêu cầu đã được xử lý!'
                          : 'Không có đơn đặt phòng nào phù hợp với điều kiện lọc.'}
                      </td>
                    </tr>
                  ) : (
                    bookings.map((b) => {
                      const isPending = b.status === 'pending';
                      return (
                        <tr
                          key={b.id}
                          className={`transition-colors ${
                            isPending
                              ? 'bg-amber-50/80 hover:bg-amber-100/70 border-l-4 border-l-amber-500'
                              : 'hover:bg-charcoal-light/50'
                          }`}
                        >
                          <td className="py-3.5 px-4 font-mono font-semibold text-brass">
                            {b.bookingReference}
                          </td>
                          <td className="py-3.5 px-4">
                            <strong className="text-ivory block font-medium">
                              {b.customerName}
                            </strong>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                              <a
                                href={`tel:${b.customerPhone}`}
                                className="text-[11px] text-stone-700 hover:text-vermilion font-medium"
                                title="Gọi điện cho khách"
                              >
                                {b.customerPhone}
                              </a>
                              {b.customerEmail && (
                                <a
                                  href={`mailto:${b.customerEmail}`}
                                  className="inline-flex items-center px-1.5 py-0.2 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-semibold transition-colors"
                                  title={`Gửi email cho ${b.customerEmail}`}
                                >
                                  ✉️ Email
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-ivory font-serif">Phòng {b.roomName}</td>
                          <td className="py-3.5 px-4">
                            <span className="text-ivory font-medium block">{b.date}</span>
                            <span className="text-[11px] text-brass">
                              {b.startTime} – {b.endTime} ({b.durationHours}h)
                            </span>
                          </td>
                          <td className="py-3.5 px-4">{b.guestCount} khách</td>
                          <td className="py-3.5 px-4">{renderStatusBadge(b.status)}</td>
                          <td className="py-3.5 px-4 text-xs">
                            <div className="text-stone-700 font-medium text-[11px]">
                              Tạo: {new Date(b.createdAt).toLocaleString('vi-VN')}
                            </div>
                            {b.status === 'pending' && b.expiresAt && (
                              <div className="mt-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#FAF6EE] text-[#695328] border border-[#E7DECA] font-medium text-[10.5px]">
                                <span>⏰ Hết hạn:</span>
                                <span className="font-mono">{new Date(b.expiresAt).toLocaleString('vi-VN')}</span>
                              </div>
                            )}
                            {b.reviewedAt && (
                              <div className="mt-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#EDF5F0] text-[#1D4A38] border border-[#C5DFD0] font-medium text-[10.5px]">
                                <span>✓ Xử lý:</span>
                                <span className="font-mono">{new Date(b.reviewedAt).toLocaleString('vi-VN')}</span>
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isPending && (
                                <button
                                  onClick={() => handleQuickApprove(b.id, b.bookingReference)}
                                  disabled={quickApprovingId === b.id}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xs text-xs font-bold bg-[#1D4A38] hover:bg-[#28604A] text-white border border-[#28604A] shadow-sm transition-all cursor-pointer"
                                  title="Duyệt đơn và tự động gửi email cho khách hàng"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#A7F3D0]" />
                                  <span>{quickApprovingId === b.id ? 'Đang gửi...' : 'Duyệt'}</span>
                                </button>
                              )}
                              <button
                                onClick={() => openBookingDetail(b.id)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xs text-xs font-medium transition-all cursor-pointer ${
                                  isPending
                                    ? 'bg-[#EAE2D3] hover:bg-[#DFD5C4] text-[#28221D] font-bold border border-[#D5CBB9]'
                                    : 'bg-charcoal hover:bg-brass hover:text-white border border-stone/30 text-ivory'
                                }`}
                              >
                                <Sliders className="w-3.5 h-3.5" />
                                <span>{isPending ? 'Từ chối' : 'Chi tiết'}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 2: DAILY SLOT CALENDAR ================= */}
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            <div className="p-5 bg-walnut/60 border border-stone/20 rounded-sm flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-light mb-1">
                    Chọn ngày xem lịch
                  </label>
                  <input
                    type="date"
                    value={calendarDate}
                    onChange={(e) => setCalendarDate(e.target.value)}
                    className="bg-charcoal border border-stone/30 focus:border-brass text-xs px-3 py-2 rounded-xs text-ivory outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-light mb-1">
                    Chọn phòng trà
                  </label>
                  <select
                    value={calendarRoomId}
                    onChange={(e) => setCalendarRoomId(e.target.value)}
                    className="bg-charcoal border border-stone/30 focus:border-brass text-xs px-3 py-2 rounded-xs text-ivory outline-none"
                  >
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        Phòng {r.name} (Tối đa {r.capacityMax} khách)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-light mb-1">
                    Thời lượng kiểm tra
                  </label>
                  <select
                    value={calendarDuration}
                    onChange={(e) => setCalendarDuration(Number(e.target.value))}
                    className="bg-charcoal border border-stone/30 focus:border-brass text-xs px-3 py-2 rounded-xs text-ivory outline-none"
                  >
                    <option value={1}>1.0 giờ</option>
                    <option value={1.5}>1.5 giờ (90p — Khuyên dùng)</option>
                    <option value={2}>2.0 giờ (Chuẩn trà lễ)</option>
                    <option value={3}>3.0 giờ</option>
                    <option value={4}>4.0 giờ</option>
                  </select>
                </div>
              </div>

              <button
                onClick={loadCalendarSlots}
                className="inline-flex items-center gap-1.5 text-xs text-stone-light hover:text-ivory px-3 py-2 bg-charcoal rounded-xs border border-stone/20 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tải lại lưới giờ</span>
              </button>
            </div>

            {/* 4-State Slot Grid in Deep Moss-Green Luxury Theme */}
            <div className="p-6 rounded-sm bg-[#16261d] border border-[#c29b38]/35 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
                <div>
                  <h3 className="font-serif text-lg text-[#faf7f2] font-semibold">
                    Sơ đồ Khung Giờ Thực Tế (Mốc 15 phút) — Ngày {calendarDate}
                  </h3>
                  <p className="text-xs text-[#b5c4ba]">
                    Nhấn vào ô <strong className="text-amber-300">Đang chờ duyệt</strong> hoặc{' '}
                    <strong className="text-emerald-300">Đã đặt</strong> để mở ngay đơn đặt lịch tương ứng.
                  </p>
                </div>
              </div>

              {loadingCalendar ? (
                <div className="py-12 text-center text-stone-light text-xs">
                  Đang tải trạng thái các khung giờ...
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
                  {calendarSlots.map((slot) => {
                    let cardStyle = '';
                    let badgeText = '';
                    if (slot.status === 'AVAILABLE') {
                      cardStyle =
                        'bg-white text-[#1a2e22] border-white hover:border-[#c29b38] shadow-sm';
                      badgeText = 'Còn trống';
                    } else if (slot.status === 'PENDING') {
                      cardStyle =
                        'bg-[#fffbeb] text-[#92400e] border-[#f59e0b] hover:bg-amber-100 cursor-pointer ring-2 ring-amber-400/50';
                      badgeText = 'Chờ duyệt';
                    } else if (slot.status === 'CONFIRMED') {
                      cardStyle =
                        'bg-[#dcfce7] text-[#166534] border-[#22c55e] hover:bg-emerald-200 cursor-pointer';
                      badgeText = 'Đã đặt';
                    } else {
                      cardStyle = 'bg-[#e5e7eb]/85 text-[#4b5563] border-[#9ca3af] opacity-80';
                      badgeText = 'Khóa / Kín';
                    }

                    return (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => {
                          if (slot.bookingId) {
                            openBookingDetail(slot.bookingId);
                          } else if (slot.status === 'AVAILABLE') {
                            setNewBlockRoomId(calendarRoomId);
                            setNewBlockDate(calendarDate);
                            setNewBlockStart(slot.time);
                            setNewBlockEnd(slot.endTime);
                            setActiveTab('config');
                            showToast(
                              `Đã điền sẵn khung giờ ${slot.time} - ${slot.endTime} vào biểu mẫu Khóa giờ.`
                            );
                          }
                        }}
                        className={`p-2.5 rounded-sm border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${cardStyle}`}
                      >
                        <span className="font-mono text-sm font-bold">{slot.time}</span>
                        <span className="text-[10px] font-semibold uppercase">{badgeText}</span>
                        {slot.bookingReference && (
                          <span className="text-[9px] font-mono underline mt-0.5 truncate max-w-full inline-block">
                            {slot.bookingReference}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Legend */}
              <div className="pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-[#e2ebe5]">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-xs bg-white border border-stone-300 inline-block" />
                  <span>
                    <strong>Còn trống</strong> (Nhấn để khóa nhanh)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-xs bg-[#fffbeb] border border-[#f59e0b] inline-block" />
                  <span>
                    <strong>Đang chờ duyệt</strong> (Nhấn để duyệt)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-xs bg-[#dcfce7] border border-[#22c55e] inline-block" />
                  <span>
                    <strong>Đã xác nhận</strong> (Nhấn xem đơn)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-xs bg-[#e5e7eb] border border-[#9ca3af] inline-block" />
                  <span>
                    <strong>Không khả dụng</strong> (Đã khóa / Quá giờ)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: CONFIG & SLOT BLOCKS ================= */}
        {activeTab === 'config' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Operating Hours & Hold Duration */}
            <div className="lg:col-span-6 bg-walnut/70 border border-stone/20 rounded-sm p-6 space-y-5">
              <div className="border-b border-stone/20 pb-3">
                <h3 className="font-serif text-xl text-ivory">
                  Cấu Hình Tham Số Vận Hành Đặt Lịch
                </h3>
                <p className="text-xs text-stone-light mt-1">
                  Điều chỉnh giờ mở cửa, khoảng cách khung giờ 15 phút, thời gian giữ chỗ tạm thời (PENDING) và ngày nghỉ lễ.
                </p>
              </div>

              {settings && (
                <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-stone-light mb-1 font-medium">
                        Giờ mở cửa nhận khách (HH:mm)
                      </label>
                      <input
                        type="text"
                        value={settings.openTime}
                        onChange={(e) => setSettings({ ...settings, openTime: e.target.value })}
                        className="w-full bg-charcoal border border-stone/30 p-2.5 text-ivory rounded-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-light mb-1 font-medium">
                        Giờ đóng cửa (HH:mm)
                      </label>
                      <input
                        type="text"
                        value={settings.closeTime}
                        onChange={(e) => setSettings({ ...settings, closeTime: e.target.value })}
                        className="w-full bg-charcoal border border-stone/30 p-2.5 text-ivory rounded-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-stone-light mb-1 font-medium">
                        Bước chia slot (phút)
                      </label>
                      <select
                        value={settings.slotIntervalMinutes}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            slotIntervalMinutes: Number(e.target.value),
                          })
                        }
                        className="w-full bg-charcoal border border-stone/30 p-2.5 text-ivory rounded-xs"
                      >
                        <option value={15}>15 phút (Chuẩn)</option>
                        <option value={30}>30 phút</option>
                        <option value={60}>60 phút</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-stone-light mb-1 font-medium">
                        Thời lượng mặc định (giờ)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={8}
                        value={settings.defaultDurationHours}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            defaultDurationHours: e.target.value === '' ? ('' as unknown as number) : Number(e.target.value),
                          })
                        }
                        onBlur={() => {
                          if (!settings.defaultDurationHours || Number(settings.defaultDurationHours) < 1) {
                            setSettings({ ...settings, defaultDurationHours: 1.5 });
                          }
                        }}
                        className="w-full bg-charcoal border border-stone/30 p-2.5 text-ivory rounded-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-light mb-1 font-medium">
                        Hết hạn giữ chỗ PENDING (giờ)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={168}
                        value={settings.holdDurationHours}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            holdDurationHours: e.target.value === '' ? ('' as unknown as number) : Number(e.target.value),
                          })
                        }
                        onBlur={() => {
                          if (!settings.holdDurationHours || Number(settings.holdDurationHours) < 1) {
                            setSettings({ ...settings, holdDurationHours: 24 });
                          }
                        }}
                        className="w-full bg-charcoal border border-stone/30 p-2.5 text-ivory rounded-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-stone-light mb-1 font-medium">
                      Danh sách ngày nghỉ lễ (YYYY-MM-DD, cách nhau bởi dấu phẩy)
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: 2026-12-31, 2027-01-01"
                      value={closedDatesInput}
                      onChange={(e) => setClosedDatesInput(e.target.value)}
                      className="w-full bg-charcoal border border-stone/30 p-2.5 text-ivory rounded-xs font-mono"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-vermilion hover:bg-vermilion-light text-white text-xs uppercase tracking-wider font-semibold rounded-xs flex items-center gap-2 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Lưu Cấu Hình Hệ Thống</span>
                    </button>
                    {process.env.NODE_ENV !== 'production' && (
                    <button
                      type="button"
                      onClick={handleResetData}
                      className="px-4 py-2.5 border border-stone/30 hover:border-red-400 text-stone-light hover:text-red-700 text-xs rounded-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Nạp lại Dữ liệu Mẫu (Reset Demo)</span>
                    </button>
                    )}
                  </div>

                  {zaloStatus && (
                    <div className="pt-3 border-t border-stone/20 space-y-2 text-xs">
                      <span className="text-[11px] uppercase tracking-wider text-stone-light font-semibold block">
                        Trạng thái Tích hợp Zalo / ZNS
                      </span>
                      <div className="flex flex-wrap gap-2 text-[11px]">
                        <span
                          className={`px-2 py-0.5 rounded ${
                            zaloStatus.zaloOaConfigured
                              ? 'bg-emerald-100 text-emerald-950 border border-emerald-400'
                              : 'bg-stone/20 text-stone-light'
                          }`}
                        >
                          Zalo OA: {zaloStatus.zaloOaConfigured ? 'Đã cấu hình' : 'Chưa kích hoạt'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded ${
                            zaloStatus.znsConfigured
                              ? 'bg-emerald-100 text-emerald-950 border border-emerald-400'
                              : 'bg-stone/20 text-stone-light'
                          }`}
                        >
                          ZNS: {zaloStatus.znsConfigured ? 'Sẵn sàng' : 'Chưa cấu hình'}
                        </span>
                      </div>
                    </div>
                  )}
                </form>
              )}
            </div>

            {/* Right Column: Manual Slot Blocks */}
            <div className="lg:col-span-6 bg-walnut/70 border border-stone/20 rounded-sm p-6 space-y-5">
              <div className="border-b border-stone/20 pb-3">
                <h3 className="font-serif text-xl text-ivory">
                  Khóa Khung Giờ Không Phục Vụ (Slot Blocks)
                </h3>
                <p className="text-xs text-stone-light mt-1">
                  Chủ động khóa một khoảng thời gian để bảo trì hoặc tổ chức sự kiện riêng. Các mốc 15 phút trùng sẽ chuyển sang trạng thái <strong>Không khả dụng</strong>.
                </p>
              </div>

              <form onSubmit={handleCreateSlotBlock} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-light mb-1">Phạm vi phòng khóa</label>
                    <select
                      value={newBlockRoomId}
                      onChange={(e) => setNewBlockRoomId(e.target.value)}
                      className="w-full bg-charcoal border border-stone/30 p-2 text-ivory rounded-xs"
                    >
                      <option value="ALL">Toàn bộ phòng trà (ALL)</option>
                      {rooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          Phòng {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-stone-light mb-1">Ngày khóa</label>
                    <input
                      type="date"
                      required
                      value={newBlockDate}
                      onChange={(e) => setNewBlockDate(e.target.value)}
                      className="w-full bg-charcoal border border-stone/30 p-2 text-ivory rounded-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-light mb-1">Từ giờ (HH:mm)</label>
                    <input
                      type="text"
                      required
                      value={newBlockStart}
                      onChange={(e) => setNewBlockStart(e.target.value)}
                      className="w-full bg-charcoal border border-stone/30 p-2 text-ivory rounded-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-light mb-1">Đến giờ (HH:mm)</label>
                    <input
                      type="text"
                      required
                      value={newBlockEnd}
                      onChange={(e) => setNewBlockEnd(e.target.value)}
                      className="w-full bg-charcoal border border-stone/30 p-2 text-ivory rounded-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-stone-light mb-1">Lý do khóa khung giờ</label>
                  <input
                    type="text"
                    required
                    value={newBlockReason}
                    onChange={(e) => setNewBlockReason(e.target.value)}
                    className="w-full bg-charcoal border border-stone/30 p-2 text-ivory rounded-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-brass hover:bg-brass-light text-charcoal-dark font-bold text-xs uppercase tracking-wider rounded-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Lịch Khóa Giờ</span>
                </button>
              </form>

              {/* Existing Slot Blocks List */}
              <div className="pt-3 border-t border-stone/20 space-y-2 max-h-64 overflow-y-auto">
                <span className="text-[11px] uppercase tracking-wider text-stone-light font-semibold block">
                  Danh sách khung giờ đang khóa ({slotBlocks.length})
                </span>
                {slotBlocks.length === 0 ? (
                  <p className="text-xs text-stone italic">Chưa có khung giờ nào bị khóa thủ công.</p>
                ) : (
                  slotBlocks.map((blk) => (
                    <div
                      key={blk.id}
                      className="p-2.5 bg-charcoal/70 border border-stone/20 rounded-xs flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="text-brass font-mono font-semibold">
                          {blk.date} | {blk.startTime} – {blk.endTime}
                        </span>
                        <span className="text-ivory ml-2">
                          ({blk.roomId === 'ALL' ? 'Toàn bộ phòng' : blk.roomId})
                        </span>
                        <p className="text-[11px] text-stone-light">{blk.reason}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteSlotBlock(blk.id)}
                        className="p-1.5 text-red-400 hover:text-red-300 cursor-pointer"
                        title="Mở khóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: NOTIFICATION OUTBOX (EMAIL) ================= */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            {/* Email Configuration Status Banner */}
            <div className="p-5 bg-walnut/70 border border-brass/30 rounded-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-brass" />
                  <h3 className="font-serif text-lg text-ivory">
                    Hệ Thống Gửi Email Thông Báo & Hộp Thư Outbox
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <span className="px-2.5 py-1 rounded font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
                    Email Quản trị (Admin): {process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'lenam287202@gmail.com'}
                  </span>
                  <span className="px-2.5 py-1 rounded font-semibold bg-sky-100 text-sky-900 border border-sky-300">
                    Kênh: Gmail SMTP / Ethereal Test
                  </span>
                  <span className="px-2.5 py-1 rounded font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
                    Trạng thái: Sẵn sàng gửi tức thì
                  </span>
                </div>
              </div>
              <p className="text-xs text-stone-light leading-relaxed">
                Mọi sự kiện đặt lịch (<code className="text-brass font-semibold">BOOKING_REQUESTED</code>,{' '}
                <code className="text-brass font-semibold">BOOKING_CONFIRMED</code>,{' '}
                <code className="text-brass font-semibold">BOOKING_REJECTED</code>,{' '}
                <code className="text-brass font-semibold">BOOKING_CANCELLED</code>) đều được gửi thư giao diện đẹp chuẩn nhận diện Trúc Mai Trà Quán tới Quản trị viên và Khách hàng. Hộp thư Outbox đảm bảo không bao giờ thất lạc thông báo và hỗ trợ gửi lại bất cứ lúc nào.
              </p>
            </div>

            {/* Filter & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {['ALL', 'SENT', 'PENDING', 'FAILED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setNotifFilterStatus(st)}
                    className={`px-3 py-1.5 rounded-xs text-xs font-medium cursor-pointer ${
                      notifFilterStatus === st
                        ? 'bg-brass text-charcoal-dark font-bold'
                        : 'bg-charcoal text-stone-light border border-stone/20'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunWorker}
                  className="px-3.5 py-2 bg-vermilion hover:bg-vermilion-light text-white text-xs font-medium rounded-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Thử gửi lại toàn bộ hàng đợi Outbox</span>
                </button>
                <button
                  onClick={loadNotifications}
                  className="px-3 py-2 bg-charcoal border border-stone/20 text-xs text-stone-light hover:text-ivory rounded-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Làm mới</span>
                </button>
              </div>
            </div>

            {/* Notification Logs List */}
            <div className="space-y-3">
              {loadingNotifications ? (
                <div className="py-8 text-center text-stone-light text-xs">
                  Đang tải nhật ký thông báo...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 bg-walnut/50 border border-stone/20 rounded-sm text-center text-xs text-stone-light">
                  Chưa có bản ghi thông báo nào.
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-4 bg-walnut/70 border border-stone/20 rounded-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            n.status === 'SENT'
                              ? 'bg-emerald-100 text-emerald-950 border border-emerald-400'
                              : n.status === 'FAILED'
                              ? 'bg-red-100 text-red-950 border border-red-400'
                              : 'bg-amber-100 text-amber-950 border border-amber-400'
                          }`}
                        >
                          {n.status}
                        </span>
                        <span className="font-mono font-semibold text-brass">
                          {n.notificationType}
                        </span>
                        <span className="text-stone-light">
                          → {n.recipientType} ({n.channel}: {n.recipientAddress || 'N/A'})
                        </span>
                        <span className="text-stone text-[11px]">
                          • Thử: {n.attemptCount}/{n.maxAttempts} •{' '}
                          {new Date(n.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>

                      <pre className="p-2.5 bg-charcoal/80 border border-stone/20 rounded-xs text-[11px] text-ivory-muted whitespace-pre-wrap font-sans">
                        {n.content}
                      </pre>

                      {n.lastError && (
                        <p className="text-[11px] text-red-800 bg-red-50 p-2.5 rounded-xs border border-red-200">
                          <strong className="text-red-900">Chi tiết lỗi / Trạng thái kênh:</strong> {n.lastError}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      <button
                        onClick={() => openBookingDetail(n.bookingId)}
                        className="px-3 py-1.5 bg-charcoal border border-stone/30 hover:border-brass text-ivory rounded-xs cursor-pointer"
                      >
                        Mở đơn
                      </button>
                      {n.status !== 'SENT' && (
                        <button
                          onClick={() => handleRetryNotification(n.id)}
                          className="px-3 py-1.5 bg-brass hover:bg-brass-light text-charcoal-dark font-bold rounded-xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>Gửi lại</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 5: ROOM PRICING & CAPACITY CONFIG ================= */}
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
                      <span className="seal-stamp text-[10px] px-1.5 mr-2 font-sans font-bold">
                        PHÒNG
                      </span>
                      <span className="font-serif text-xl text-ivory font-normal">
                        Phòng {r.name}
                      </span>
                    </div>
                    <span className="text-xs text-stone-light">
                      {r.floor} • {r.areaSqm}m²
                    </span>
                  </div>

                  {isEditing ? (
                    <div className="space-y-3 pt-2 text-xs">
                      <div>
                        <label className="block text-stone-light mb-1">
                          Giá theo giờ (VNĐ/giờ):
                        </label>
                        <input
                          type="number"
                          value={editPricePerHour}
                          onChange={(e) => setEditPricePerHour(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                          className="w-full bg-charcoal border border-stone/30 p-2 text-ivory rounded-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-stone-light mb-1">
                          Gói tiêu chuẩn 2 giờ (VNĐ):
                        </label>
                        <input
                          type="number"
                          value={editPricePackage2h}
                          onChange={(e) => setEditPricePackage2h(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                          className="w-full bg-charcoal border border-stone/30 p-2 text-ivory rounded-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-stone-light mb-1">
                          Sức chứa tối đa (khách):
                        </label>
                        <input
                          type="number"
                          value={editCapacityMax}
                          onChange={(e) => setEditCapacityMax(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                          className="w-full bg-charcoal border border-stone/30 p-2 text-ivory rounded-xs"
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleSaveRoom(r)}
                          className="px-4 py-2 bg-vermilion text-white text-xs font-medium rounded-xs flex items-center gap-1 shadow-sm cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Lưu thay đổi</span>
                        </button>
                        <button
                          onClick={() => setEditingRoomId(null)}
                          className="px-3 py-2 bg-charcoal text-stone-light text-xs rounded-xs cursor-pointer"
                        >
                          Huỷ
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs text-stone-light pt-2 border-t border-stone/15">
                      <div className="flex justify-between">
                        <span>Giá gói 2 giờ:</span>
                        <strong className="text-brass font-medium">
                          {r.pricePackage2h.toLocaleString('vi-VN')} đ
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Giá theo giờ:</span>
                        <span className="text-ivory">
                          {r.pricePerHour.toLocaleString('vi-VN')} đ/h
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sức chứa:</span>
                        <span className="text-ivory">
                          {r.capacityMin} – {r.capacityMax} người
                        </span>
                      </div>

                      <div className="pt-3 flex justify-end">
                        <button
                          onClick={() => {
                            setEditingRoomId(r.id);
                            setEditPricePerHour(r.pricePerHour);
                            setEditPricePackage2h(r.pricePackage2h);
                            setEditCapacityMax(r.capacityMax);
                          }}
                          className="inline-flex items-center gap-1 text-xs text-brass hover:text-ivory py-1 cursor-pointer"
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

      {/* ================= BOOKING DETAIL & APPROVAL MODAL (Section 10.3 & 10.4) ================= */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-charcoal-dark/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-2xl w-full bg-walnut border border-brass/50 rounded-sm p-6 shadow-2xl space-y-5 my-8 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-stone/20 pb-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-stone-light block">
                  CHI TIẾT & PHÊ DUYỆT YÊU CẦU ĐẶT LỊCH
                </span>
                <div className="flex items-center gap-3 mt-1">
                  <span className="font-mono text-xl text-brass font-bold">
                    {selectedBooking.bookingReference}
                  </span>
                  {renderStatusBadge(selectedBooking.status)}
                </div>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-stone hover:text-ivory text-lg px-2 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {loadingDetail && (
              <div className="text-xs text-stone-light">Đang đồng bộ dữ liệu mới nhất...</div>
            )}

            {actionError && (
              <div className="p-3 bg-vermilion/20 border border-vermilion/50 rounded-xs text-xs text-ivory flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-vermilion flex-shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Complete Customer & Slot Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-charcoal/80 rounded-xs border border-stone/25 text-xs">
              <div className="space-y-1.5">
                <div>
                  <span className="text-stone-light">Khách hàng: </span>
                  <strong className="text-ivory">{selectedBooking.customerName}</strong>
                </div>
                <div>
                  <span className="text-stone-light">Số điện thoại: </span>
                  <a
                    href={`tel:${selectedBooking.customerPhone}`}
                    className="text-brass font-mono underline"
                  >
                    {selectedBooking.customerPhone}
                  </a>
                  {selectedBooking.customerEmail && (
                    <a
                      href={`mailto:${selectedBooking.customerEmail}`}
                      className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[10px] font-semibold transition-colors"
                      title={`Gửi email cho ${selectedBooking.customerEmail}`}
                    >
                      <Send className="w-3 h-3" />
                      <span>Gửi Email</span>
                    </a>
                  )}
                </div>
                <div>
                  <span className="text-stone-light">Số lượng khách: </span>
                  <span className="text-ivory">{selectedBooking.guestCount} người</span>
                </div>
                {selectedBooking.teaPackageName && (
                  <div>
                    <span className="text-stone-light">Danh trà: </span>
                    <span className="text-ivory">{selectedBooking.teaPackageName}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <div>
                  <span className="text-stone-light">Không gian: </span>
                  <strong className="text-ivory">Phòng {selectedBooking.roomName}</strong>
                </div>
                <div>
                  <span className="text-stone-light">Ngày đặt: </span>
                  <strong className="text-ivory">{selectedBooking.date}</strong>
                </div>
                <div>
                  <span className="text-stone-light">Khung giờ: </span>
                  <strong className="text-brass font-mono">
                    {selectedBooking.startTime} – {selectedBooking.endTime} (
                    {selectedBooking.durationHours}h)
                  </strong>
                </div>
                <div>
                  <span className="text-stone-light">Chi phí / Cọc: </span>
                  <span className="text-ivory">
                    {selectedBooking.totalPrice.toLocaleString('vi-VN')} đ (Cọc:{' '}
                    {selectedBooking.depositAmount.toLocaleString('vi-VN')} đ)
                  </span>
                </div>
              </div>

              {selectedBooking.specialRequests && (
                <div className="sm:col-span-2 pt-2 border-t border-stone/20 text-ivory-muted">
                  <span className="text-stone-light">Ghi chú của khách: </span>
                  <span className="italic">&ldquo;{selectedBooking.specialRequests}&rdquo;</span>
                </div>
              )}

              <div className="sm:col-span-2 pt-2 border-t border-stone/20 grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-stone-light">
                <div>
                  Thời gian gửi: {new Date(selectedBooking.createdAt).toLocaleString('vi-VN')}
                </div>
                {selectedBooking.expiresAt && (
                  <div>
                    Hạn giữ chỗ PENDING:{' '}
                    {new Date(selectedBooking.expiresAt).toLocaleString('vi-VN')}
                  </div>
                )}
                {selectedBooking.reviewedAt && (
                  <div className="text-emerald-800 font-semibold">
                    Thời gian xử lý: {new Date(selectedBooking.reviewedAt).toLocaleString('vi-VN')}{' '}
                    ({selectedBooking.reviewedBy || 'Admin'})
                  </div>
                )}
              </div>
            </div>

            {/* Internal Admin Notes */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-stone-light mb-1 font-medium">
                Ghi chú của Quản trị viên (Hiển thị trên phiếu tra cứu của khách):
              </label>
              <textarea
                rows={2}
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Ví dụ: Phòng trà đã chuẩn bị sẵn trà cụ Ô Long Nướng Than và bàn hướng hiên..."
                className="w-full bg-charcoal border border-stone/30 focus:border-brass text-ivory p-2.5 rounded-xs text-xs outline-none"
              />
            </div>

            {/* ================= ACTIONS FOR PENDING BOOKING ================= */}
            {selectedBooking.status === 'pending' && (
              <div className="p-4 bg-charcoal/90 border border-amber-500/40 rounded-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                    Quyết định Phê duyệt Yêu cầu (Đang ở trạng thái PENDING)
                  </span>
                </div>

                {/* Primary Action: Approve */}
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleApproveBooking}
                  className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-600 text-white text-xs uppercase tracking-[0.15em] font-bold rounded-xs shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {actionLoading
                      ? 'Đang xử lý...'
                      : 'Xác nhận đặt lịch (Chuyển sang CONFIRMED & Báo khách)'}
                  </span>
                </button>

                {/* Secondary Action: Reject with reason */}
                <div className="pt-3 border-t border-stone/20 space-y-2">
                  <label className="block text-xs text-stone-light">
                    Hoặc nhập lý do nếu <strong className="text-red-700 font-bold">Từ chối yêu cầu</strong>{' '}
                    này:
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Nhập lý do từ chối (gửi kèm trong thông báo cho khách)..."
                      className="flex-1 bg-charcoal border border-stone/30 focus:border-red-400 text-ivory px-3 py-2 rounded-xs text-xs outline-none"
                    />
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleRejectBooking}
                      className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white text-xs font-semibold rounded-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Từ chối (REJECT)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= ACTIONS FOR CONFIRMED BOOKING ================= */}
            {selectedBooking.status === 'confirmed' && (
              <div className="p-4 bg-charcoal/90 border border-emerald-600/40 rounded-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Quản lý Lịch Hẹn Đã Xác Nhận (CONFIRMED)
                  </span>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleMarkCompleted}
                    className="px-3 py-1.5 bg-sky-800 hover:bg-sky-700 text-white text-xs font-medium rounded-xs cursor-pointer"
                  >
                    ★ Đánh dấu Đã hoàn thành buổi thưởng trà
                  </button>
                </div>

                {/* Cancel confirmed booking */}
                <div className="pt-2 border-t border-stone/20 space-y-2">
                  <label className="block text-xs text-stone-light">
                    Hủy lịch đã xác nhận (Sẽ giải phóng khung giờ về Còn trống và gửi thông báo hủy cho khách):
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={cancellationReason}
                      onChange={(e) => setCancellationReason(e.target.value)}
                      placeholder="Bắt buộc nhập lý do hủy lịch..."
                      className="flex-1 bg-charcoal border border-stone/30 focus:border-red-400 text-ivory px-3 py-2 rounded-xs text-xs outline-none"
                    />
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleCancelBooking}
                      className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white text-xs font-semibold rounded-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Hủy lịch đã xác nhận</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= NOTIFICATION LOGS FOR THIS BOOKING ================= */}
            <div className="space-y-2 pt-2 border-t border-stone/20">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-stone-light font-semibold flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-brass" />
                  <span>Lịch Sử Gửi Email Đến Khách Hàng & Quản Trị ({bookingNotifications.length})</span>
                </span>
              </div>

              {bookingNotifications.length === 0 ? (
                <p className="text-xs text-stone italic">Chưa có thông báo nào.</p>
              ) : (
                <div className="space-y-2">
                  {bookingNotifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-3 bg-charcoal/70 border border-stone/20 rounded-xs text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              n.status === 'SENT'
                                ? 'bg-emerald-100 text-emerald-950 border border-emerald-400'
                                : n.status === 'FAILED'
                                ? 'bg-red-100 text-red-950 border border-red-400'
                                : 'bg-amber-100 text-amber-950 border border-amber-400'
                            }`}
                          >
                            {n.status}
                          </span>
                          <strong className="text-brass font-mono">{n.notificationType}</strong>
                          <span className="text-stone-light">→ {n.recipientType}</span>
                        </div>
                        {n.status !== 'SENT' && (
                          <button
                            type="button"
                            onClick={() => handleRetryNotification(n.id)}
                            className="px-2.5 py-1 bg-brass text-charcoal-dark font-bold rounded-xs text-[11px] inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Send className="w-3 h-3" />
                            <span>Gửi lại</span>
                          </button>
                        )}
                      </div>
                      {n.lastError && (
                        <p className="text-[11px] text-red-800 font-medium bg-red-50 p-2 rounded-xs border border-red-200">
                          Trạng thái: {n.lastError}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ================= AUDIT LOGS TIMELINE ================= */}
            <div className="space-y-2 pt-2 border-t border-stone/20">
              <span className="text-xs uppercase tracking-wider text-stone-light font-semibold flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-brass" />
                <span>Lịch Sử Chuyển Trạng Thái (Audit Trail)</span>
              </span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {bookingAuditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2 bg-charcoal/50 border border-stone/15 rounded-xs text-[11px] flex flex-wrap items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-mono text-brass font-semibold">{log.action}</span>:{' '}
                      <span className="text-stone-light">
                        {log.fromStatus || 'NONE'} →{' '}
                        <strong className="text-ivory">{log.toStatus}</strong>
                      </span>
                      {log.reason && <span className="text-ivory-muted"> ({log.reason})</span>}
                    </div>
                    <span className="text-stone">
                      {log.actor} • {new Date(log.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PWA Install Guide Modal for Mobile Admin */}
      {showPwaInstallModal && (
        <div className="fixed inset-0 z-50 bg-charcoal-dark/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-walnut border border-brass/50 rounded-sm p-6 shadow-2xl space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-stone/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📱</span>
                <h3 className="font-serif text-lg text-ivory">Cài Đặt App Quản Trị Lùng Vài Tea</h3>
              </div>
              <button
                onClick={() => setShowPwaInstallModal(false)}
                className="text-stone hover:text-ivory text-lg px-2 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-light leading-relaxed">
              Cài đặt trang Quản trị thành ứng dụng trên điện thoại giúp bạn nhận chuông báo tức thì khi có khách đặt phòng, duyệt lịch 1 chạm và sử dụng toàn màn hình mượt mà không cần mở trình duyệt.
            </p>

            {isIos ? (
              <div className="p-4 bg-charcoal/80 border border-brass/30 rounded-xs space-y-3 text-xs">
                <span className="text-brass font-bold uppercase tracking-wider block">
                  Hướng Dẫn Cho iPhone (Safari)
                </span>
                <ol className="list-decimal list-inside space-y-2 text-ivory-muted leading-relaxed">
                  <li>
                    Nhấn vào biểu tượng <strong className="text-brass">Chia sẻ (Share) 📤</strong> ở thanh công cụ phía dưới cùng của Safari.
                  </li>
                  <li>
                    Cuộn xuống danh sách tùy chọn và chọn <strong className="text-ivory">&ldquo;Thêm vào Màn hình chính&rdquo; (Add to Home Screen) ➕</strong>.
                  </li>
                  <li>
                    Nhấn nút <strong className="text-emerald-400">&ldquo;Thêm&rdquo; (Add)</strong> ở góc trên bên phải màn hình.
                  </li>
                </ol>
                <div className="pt-2 border-t border-stone/20 text-[11px] text-stone-light">
                  Icon <strong className="text-brass">Lùng Vài Admin</strong> sẽ xuất hiện trên màn hình điện thoại như một App độc lập!
                </div>
              </div>
            ) : (
              <div className="p-4 bg-charcoal/80 border border-brass/30 rounded-xs space-y-3 text-xs">
                <span className="text-brass font-bold uppercase tracking-wider block">
                  Hướng Dẫn Cho Android (Google Chrome)
                </span>
                <ol className="list-decimal list-inside space-y-2 text-ivory-muted leading-relaxed">
                  <li>
                    Nhấn vào nút menu <strong className="text-brass">3 chấm (⋮)</strong> ở góc trên bên phải trình duyệt Chrome.
                  </li>
                  <li>
                    Chọn <strong className="text-ivory">&ldquo;Cài đặt ứng dụng&rdquo;</strong> hoặc <strong className="text-ivory">&ldquo;Thêm vào Màn hình chính&rdquo;</strong>.
                  </li>
                  <li>
                    Xác nhận <strong className="text-emerald-400">&ldquo;Cài đặt&rdquo;</strong> để hoàn tất.
                  </li>
                </ol>
                {deferredPrompt && (
                  <button
                    onClick={handleInstallPwa}
                    className="w-full mt-2 py-2.5 bg-vermilion hover:bg-vermilion-light text-white font-bold rounded-xs text-center cursor-pointer uppercase tracking-wider text-xs"
                  >
                    Bấm vào đây để cài đặt tự động
                  </button>
                )}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowPwaInstallModal(false)}
                className="px-4 py-2 bg-charcoal border border-stone/30 text-xs text-stone-light hover:text-ivory rounded-xs cursor-pointer"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-charcoal flex items-center justify-center text-stone-light text-sm">
          Đang tải trang quản trị...
        </div>
      }
    >
      <AdminDashboardContent />
    </Suspense>
  );
}
