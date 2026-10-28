import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BRAND_CONFIG } from '@/lib/config';
import { MapPin, Phone, Mail, Clock, Shield, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-charcoal-dark border-t border-brass/20 text-stone-light">
      {/* Upper Main Footer Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12">
          
          {/* Brand Info */}
          <div className="lg:col-span-4 space-y-5">
            <Link href="/" className="inline-flex items-center gap-3.5 group">
              <div className="relative w-12 h-15 flex-shrink-0 group-hover:scale-105 transition-transform">
                <Image
                  src="/images/logo-lung-vai-transparent.png"
                  alt="Lùng Vài Tea Logo"
                  fill
                  sizes="48px"
                  className="object-contain filter drop-shadow-[0_2px_10px_rgba(141,52,45,0.5)]"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-xl tracking-[0.18em] uppercase text-ivory group-hover:text-brass transition-colors font-medium">
                  {BRAND_CONFIG.brandName}
                </span>
                <span className="text-xs tracking-[0.25em] text-brass uppercase font-sans font-medium mt-0.5">
                  {BRAND_CONFIG.brandSubtitle}
                </span>
              </div>
            </Link>

            <p className="text-xs sm:text-sm text-stone-light font-light leading-relaxed">
              {BRAND_CONFIG.brandSubtagline}
            </p>

            <div className="pt-2 text-xs text-brass-dark flex items-center gap-2 font-serif italic font-medium">
              <span>Một chén trà thanh, một khoảng trời tĩnh lặng</span>
              <span className="text-stone-light">•</span>
              <span>An yên giữa phố thị</span>
            </div>
          </div>

          {/* Contact & Hours */}
          <div className="lg:col-span-3 space-y-4">
            <span className="text-xs uppercase tracking-[0.2em] text-ivory font-medium block">
              LIÊN HỆ & ĐỊA ĐIỂM
            </span>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-brass mt-0.5 flex-shrink-0" />
                <span className="text-ivory-muted">{BRAND_CONFIG.address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-brass flex-shrink-0" />
                <a href={`tel:${BRAND_CONFIG.hotline.replace(/[^+\d]/g, '')}`} className="text-ivory-muted hover:text-brass transition-colors">
                  {BRAND_CONFIG.hotline}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-brass flex-shrink-0" />
                <a href={`mailto:${BRAND_CONFIG.email}`} className="text-ivory-muted hover:text-brass transition-colors">
                  {BRAND_CONFIG.email}
                </a>
              </li>
              <li className="flex items-start gap-2.5 pt-1">
                <Clock className="w-4 h-4 text-brass mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-ivory-muted block">Giờ mở cửa: {BRAND_CONFIG.openTime} – {BRAND_CONFIG.closeTime}</span>
                  <span className="text-[11px] text-stone-light">Phục vụ tất cả các ngày trong tuần</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2 space-y-4">
            <span className="text-xs uppercase tracking-[0.2em] text-ivory font-medium block">
              ĐIỀU HƯỚNG
            </span>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/#rooms" className="hover:text-brass transition-colors">
                  Các phòng trà riêng
                </Link>
              </li>
              <li>
                <Link href="/#art-of-tea" className="hover:text-brass transition-colors">
                  Nghệ thuật trà đạo
                </Link>
              </li>
              <li>
                <Link href="/#experiences" className="hover:text-brass transition-colors">
                  Các gói trải nghiệm
                </Link>
              </li>
              <li>
                <Link href="/#gallery" className="hover:text-brass transition-colors">
                  Bộ sưu tập không gian
                </Link>
              </li>
              <li>
                <Link href="/booking" className="text-brass hover:text-ivory transition-colors font-medium">
                  Đặt phòng trực tuyến
                </Link>
              </li>
              <li>
                <Link href="/lookup" className="hover:text-brass transition-colors">
                  Tra cứu lịch đặt
                </Link>
              </li>
            </ul>
          </div>

          {/* Policies & Integrity Statement */}
          <div className="lg:col-span-3 space-y-4">
            <span className="text-xs uppercase tracking-[0.2em] text-ivory font-medium block">
              CHÍNH SÁCH ĐẶT PHÒNG
            </span>
            <ul className="space-y-2 text-xs text-stone-light font-light leading-relaxed">
              <li>• Giữ chỗ cọc trước 30% tổng chi phí tạm tính.</li>
              <li>• Hỗ trợ đổi giờ hoặc huỷ phòng miễn phí trước 4 tiếng.</li>
              <li>• Mỗi phòng có 15 phút đệm để khử khuẩn & chuẩn bị trà cụ mới.</li>
              <li>• Nghiêm cấm hút thuốc và các hành vi gây ồn ào ảnh hưởng không gian tĩnh tại.</li>
            </ul>

            <div className="pt-2">
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-stone hover:text-brass transition-colors"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Khu vực Quản trị viên (Admin)</span>
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <div className="border-t border-stone-dark/30 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-stone">
          <span>
            © 2026 {BRAND_CONFIG.brandName}. Mọi quyền được bảo lưu.
          </span>
          <div className="flex items-center gap-6">
            <span>Bảo mật thông tin</span>
            <span>Điều khoản sử dụng</span>
            <span>Quy định thưởng trà</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
