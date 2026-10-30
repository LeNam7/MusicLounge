import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Compass, Home, Calendar } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-charcoal text-ivory">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-24 sm:py-32">
        <div className="max-w-lg w-full text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-vermilion/10 border border-vermilion/30 text-vermilion mx-auto">
            <Compass className="w-10 h-10 animate-pulse" />
          </div>

          <div className="space-y-2">
            <div>
              <span className="seal-stamp text-xs uppercase tracking-widest font-serif font-bold">
                404 • KHÔNG TÌM THẤY TRANG
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-ivory font-normal pt-2">
              Lạc Bước Giữa Vườn Trà
            </h1>
            <p className="text-sm text-stone-light leading-relaxed max-w-md mx-auto">
              Không gian hoặc trang quý khách đang tìm kiếm có thể đã đổi tên, tạm thời đóng cửa hoặc chưa từng tồn tại trên cõi trà này.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-3 bg-vermilion hover:bg-vermilion-light text-white text-xs uppercase tracking-widest font-semibold rounded-xs shadow-md transition-all inline-flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Về Trang Chủ</span>
            </Link>
            <Link
              href="/booking"
              className="w-full sm:w-auto px-6 py-3 bg-walnut/80 hover:bg-walnut border border-brass/40 text-ivory text-xs uppercase tracking-widest font-semibold rounded-xs shadow-sm transition-all inline-flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4 text-brass" />
              <span>Đặt Phòng Trà</span>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
