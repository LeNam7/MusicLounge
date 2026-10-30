'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Download,
  Smartphone,
  CheckCircle2,
  Share,
  PlusSquare,
  ShieldCheck,
  Zap,
  Bell,
  ArrowRight,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Link as LinkIcon,
} from 'lucide-react';

export default function InstallAppPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [showIosGuide, setShowIosGuide] = useState<boolean>(false);
  const [installSuccess, setInstallSuccess] = useState<boolean>(false);
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setCurrentUrl(`${window.location.origin}/admin`);

    // Detect standalone mode (already installed as PWA)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      Boolean((window.navigator as unknown as { standalone?: boolean }).standalone);
    setIsStandalone(standalone);

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(ua);
    setIsIos(isAppleDevice);

    // Listen for PWA install prompt on Android/Chromium
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      const promptEvent = deferredPrompt as unknown as {
        prompt: () => void;
        userChoice: Promise<{ outcome: string }>;
      };
      promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === 'accepted') {
        setInstallSuccess(true);
        setIsStandalone(true);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosGuide(true);
    } else {
      setShowIosGuide(true);
    }
  };

  const handleCopyLink = async () => {
    const linkToCopy = currentUrl || 'https://tea.anf-technology.com/admin';
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(linkToCopy);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = linkToCopy;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="min-h-screen bg-charcoal text-ivory flex flex-col justify-between p-4 sm:p-8">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-tea-green/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-vermilion/10 rounded-full blur-3xl" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 max-w-xl mx-auto w-full pt-4 pb-12">
        {/* Brand Header */}
        <div className="text-center space-y-3 mb-8">
          <div 
            className="relative w-20 h-24 mx-auto mb-2"
            style={{ position: 'relative', flexShrink: 0, width: '80px', height: '96px', maxWidth: '80px', maxHeight: '96px' }}
          >
            <Image
              src="/images/logo-lung-vai-transparent.png"
              alt="Lùng Vài Tea"
              fill
              sizes="96px"
              className="object-contain filter drop-shadow-[0_4px_20px_rgba(29,74,56,0.6)]"
              priority
            />
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-tea-green/20 border border-tea-green/40 text-tea-sage text-xs tracking-widest uppercase font-semibold rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            Ứng Dụng Quản Trị Di Động
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-ivory font-normal tracking-wide">
            Lùng Vài Admin
          </h1>
          <p className="text-xs sm:text-sm text-stone-light max-w-md mx-auto leading-relaxed">
            Cài đặt trực tiếp ứng dụng phê duyệt lịch đặt phòng trà về điện thoại của bạn — không cần qua App Store hay CH Play.
          </p>
        </div>

        {/* Status Card / Action Card */}
        <div className="bg-walnut/90 border border-brass/40 rounded-sm p-6 sm:p-8 shadow-2xl space-y-6 backdrop-blur-md">
          {isStandalone || installSuccess ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-tea-green/20 border border-tea-green/60 text-tea-sage flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-lg font-serif text-ivory">Ứng dụng đã sẵn sàng trên máy!</h3>
                <p className="text-xs text-stone-light mt-1">
                  Biểu tượng &quot;Lùng Vài Admin&quot; đã được thêm vào màn hình chính của bạn.
                </p>
              </div>
              <Link
                href="/admin"
                className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-tea-green hover:bg-tea-dark text-white font-medium text-xs uppercase tracking-widest rounded-xs shadow-lg transition-all"
              >
                Mở Bảng Điều Khiển Quản Trị
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Feature Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-charcoal/60 border border-stone/20 p-3 rounded-xs text-center space-y-1">
                  <Zap className="w-5 h-5 text-brass mx-auto" />
                  <p className="text-xs font-semibold text-ivory">1 Chạm Duyệt Lịch</p>
                  <p className="text-[11px] text-stone">Phê duyệt đơn đặt bàn tức thì</p>
                </div>
                <div className="bg-charcoal/60 border border-stone/20 p-3 rounded-xs text-center space-y-1">
                  <Bell className="w-5 h-5 text-tea-sage mx-auto" />
                  <p className="text-xs font-semibold text-ivory">Thông Báo Nhanh</p>
                  <p className="text-[11px] text-stone">Cập nhật đơn mới theo thời gian thực</p>
                </div>
                <div className="bg-charcoal/60 border border-stone/20 p-3 rounded-xs text-center space-y-1">
                  <ShieldCheck className="w-5 h-5 text-vermilion-light mx-auto" />
                  <p className="text-xs font-semibold text-ivory">An Toàn & Bảo Mật</p>
                  <p className="text-[11px] text-stone">Bảo vệ bằng mã PIN quản trị viên</p>
                </div>
              </div>

              {/* Install Button */}
              <div className="space-y-3">
                <button
                  onClick={handleInstallClick}
                  className="w-full py-4 bg-tea-green hover:bg-tea-dark active:scale-[0.99] text-white font-bold text-sm uppercase tracking-widest rounded-xs shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2.5 border border-tea-sage/30"
                >
                  <Download className="w-5 h-5" />
                  Cài Đặt App Về Điện Thoại Ngay
                </button>
                <p className="text-[11px] text-center text-stone">
                  Tương thích hoàn hảo với cả iPhone (iOS Safari) và Android (Chrome, Cốc Cốc, Samsung Internet)
                </p>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-stone/20" />
                <span className="text-[11px] text-stone uppercase tracking-widest font-medium">
                  ĐƯỜNG LINK TRUY CẬP VÀ CHIA SẺ
                </span>
                <div className="flex-1 h-px bg-stone/20" />
              </div>

              {/* Shareable Link Box */}
              <div className="bg-charcoal/80 border border-stone/20 rounded-xs p-5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-brass text-xs font-semibold">
                    <LinkIcon className="w-4 h-4" />
                    <span>Đường Link Ứng Dụng Quản Trị</span>
                  </div>
                  {copied && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-tea-sage bg-tea-green/20 border border-tea-green/40 px-2 py-0.5 rounded-full font-medium">
                      <Check className="w-3 h-3" />
                      Đã sao chép link!
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch gap-2">
                  <div className="flex-1 bg-charcoal border border-stone/30 px-3.5 py-2.5 rounded-xs text-xs font-mono text-ivory select-all truncate flex items-center">
                    {currentUrl || 'https://tea.anf-technology.com/admin'}
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-tea-green hover:bg-tea-dark active:scale-[0.98] text-white text-xs font-semibold rounded-xs shadow-md transition-all cursor-pointer whitespace-nowrap"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Sao chép link</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-stone/10 text-xs">
                  <p className="text-[11px] text-stone-light">
                    {process.env.NODE_ENV !== 'production' ? (
                      <>
                        Mã PIN đăng nhập (dev): <strong className="text-brass font-mono">serenity2026</strong>
                      </>
                    ) : (
                      <>Sử dụng mã PIN quản trị nội bộ của trà quán để đăng nhập</>
                    )}
                  </p>
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1 text-xs text-brass hover:text-ivory underline underline-offset-2 transition-colors"
                  >
                    Mở Bảng Quản Trị ngay
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link href="/" className="text-xs text-stone hover:text-ivory transition-colors">
            ← Quay lại trang chủ Lùng Vài Tea
          </Link>
        </div>
      </div>

      {/* Guide Modal (For iOS and Manual Fallback) */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-charcoal-dark/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-walnut border border-brass/50 rounded-sm p-6 shadow-2xl space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-stone/20 pb-3">
              <div className="flex items-center gap-2 text-brass">
                <Smartphone className="w-5 h-5" />
                <h3 className="font-serif text-lg text-ivory">Hướng Dẫn Cài Đặt Lên Màn Hình</h3>
              </div>
              <button
                onClick={() => setShowIosGuide(false)}
                className="text-stone hover:text-ivory text-xl px-2 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {isIos ? (
              <div className="space-y-4 text-xs text-stone-light">
                <p className="text-ivory font-medium">
                  Để cài ứng dụng lên iPhone hoặc iPad qua trình duyệt Safari:
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 bg-charcoal/60 p-3 rounded-xs border border-stone/20">
                    <span className="w-5 h-5 rounded-full bg-brass/20 text-brass flex items-center justify-center font-bold text-xs flex-shrink-0">
                      1
                    </span>
                    <div>
                      Nhấn vào biểu tượng <strong>Chia sẻ</strong>{' '}
                      <Share className="w-4 h-4 inline-block text-brass mx-1" /> ở thanh công cụ dưới cùng của trình duyệt Safari.
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-charcoal/60 p-3 rounded-xs border border-stone/20">
                    <span className="w-5 h-5 rounded-full bg-brass/20 text-brass flex items-center justify-center font-bold text-xs flex-shrink-0">
                      2
                    </span>
                    <div>
                      Cuộn xuống trong danh sách và chọn{' '}
                      <strong className="text-ivory">&quot;Thêm vào MH chính&quot;</strong>{' '}
                      <PlusSquare className="w-4 h-4 inline-block text-brass mx-1" /> (Add to Home Screen).
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-charcoal/60 p-3 rounded-xs border border-stone/20">
                    <span className="w-5 h-5 rounded-full bg-brass/20 text-brass flex items-center justify-center font-bold text-xs flex-shrink-0">
                      3
                    </span>
                    <div>
                      Nhấn nút <strong className="text-ivory">&quot;Thêm&quot; (Add)</strong> ở góc trên bên phải màn hình.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs text-stone-light">
                <p className="text-ivory font-medium">
                  Để cài đặt trên trình duyệt Android (Chrome / Cốc Cốc):
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 bg-charcoal/60 p-3 rounded-xs border border-stone/20">
                    <span className="w-5 h-5 rounded-full bg-tea-green/30 text-tea-sage flex items-center justify-center font-bold text-xs flex-shrink-0">
                      1
                    </span>
                    <div>
                      Nhấn vào biểu tượng <strong>dấu 3 chấm (⋮)</strong> ở góc trên bên phải trình duyệt.
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-charcoal/60 p-3 rounded-xs border border-stone/20">
                    <span className="w-5 h-5 rounded-full bg-tea-green/30 text-tea-sage flex items-center justify-center font-bold text-xs flex-shrink-0">
                      2
                    </span>
                    <div>
                      Chọn <strong className="text-ivory">&quot;Cài đặt ứng dụng&quot;</strong> hoặc{' '}
                      <strong className="text-ivory">&quot;Thêm vào màn hình chính&quot;</strong>.
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-charcoal/60 p-3 rounded-xs border border-stone/20">
                    <span className="w-5 h-5 rounded-full bg-tea-green/30 text-tea-sage flex items-center justify-center font-bold text-xs flex-shrink-0">
                      3
                    </span>
                    <div>
                      Xác nhận <strong>&quot;Cài đặt&quot;</strong> để tạo biểu tượng ứng dụng độc lập trên điện thoại.
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2 border-t border-stone/20">
              <button
                onClick={() => setShowIosGuide(false)}
                className="px-5 py-2.5 bg-tea-green hover:bg-tea-dark text-white text-xs font-semibold rounded-xs transition-colors cursor-pointer"
              >
                Đã Hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
