'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { BRAND_CONFIG } from '@/lib/config';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console for auditing
    console.error('App Route Error Caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-charcoal text-ivory px-4 py-16">
      <div className="max-w-md w-full bg-walnut/90 border border-stone/20 rounded-sm p-8 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-700">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div>
            <span className="seal-stamp text-xs uppercase tracking-widest font-serif font-bold">
              GIÁN ĐOẠN KHÔNG GIAN TRÀ
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-ivory font-normal pt-2">
            Đã Xảy Ra Sự Cố Bất Ngờ
          </h1>
          <p className="text-xs text-stone-light leading-relaxed">
            Hệ thống gặp sự cố trong quá trình xử lý yêu cầu. Quý khách có thể thử tải lại hoặc liên hệ với ban quản lý trà phòng để được hỗ trợ.
          </p>
          {error?.message && (
            <div className="mt-3 p-2.5 bg-charcoal/80 border border-stone/20 rounded-xs text-[11px] text-stone font-mono break-words text-left">
              {error.message}
            </div>
          )}
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto px-5 py-2.5 bg-vermilion hover:bg-vermilion-light text-white text-xs uppercase tracking-wider font-semibold rounded-xs shadow transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử lại ngay</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 border border-stone/30 hover:border-brass text-ivory text-xs uppercase tracking-wider font-semibold rounded-xs transition-all inline-flex items-center justify-center gap-2"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Về trang chủ</span>
          </Link>
        </div>

        <p className="text-[11px] text-stone pt-2 border-t border-stone/15">
          Hotline hỗ trợ trực tiếp:{' '}
          <a
            href={`tel:${BRAND_CONFIG.hotline.replace(/[^+\d]/g, '')}`}
            className="text-brass hover:underline"
          >
            {BRAND_CONFIG.hotline}
          </a>
        </p>
      </div>
    </div>
  );
}
