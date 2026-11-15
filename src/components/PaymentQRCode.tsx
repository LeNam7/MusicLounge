'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Check,
  Copy,
  Download,
  QrCode,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { BANK_CONFIG } from '@/lib/config';

interface PaymentQRCodeProps {
  bookingReference: string;
  totalPrice: number;
  depositAmount: number;
  customerName?: string;
  className?: string;
}

export default function PaymentQRCode({
  bookingReference,
  totalPrice,
  depositAmount,
  customerName,
  className = '',
}: PaymentQRCodeProps) {
  // Option: 'deposit' (30%) or 'full' (100%)
  const [paymentOption, setPaymentOption] = useState<'deposit' | 'full'>('deposit');
  // QR Mode: 'dynamic' (auto amount & memo) or 'static' (original image)
  const [qrMode, setQrMode] = useState<'dynamic' | 'static'>('dynamic');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [hasNotifiedPaid, setHasNotifiedPaid] = useState<boolean>(false);
  const [qrImgError, setQrImgError] = useState<boolean>(false);

  const activeAmount = paymentOption === 'deposit' ? depositAmount : totalPrice;

  // VietQR Dynamic URL (Auto fills Account, Bank, Amount & Booking Reference in banking apps)
  const dynamicQrUrl = `https://img.vietqr.io/image/${BANK_CONFIG.bankBin}-${BANK_CONFIG.accountNumber}-compact2.png?amount=${activeAmount}&addInfo=${encodeURIComponent(
    bookingReference
  )}&accountName=${encodeURIComponent(BANK_CONFIG.accountHolder)}`;

  const currentQrSrc = qrMode === 'dynamic' && !qrImgError ? dynamicQrUrl : BANK_CONFIG.qrStaticImage;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => {
      setCopiedField(null);
    }, 2500);
  };

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(currentQrSrc);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `VietQR-LungVaiTea-${bookingReference}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      window.open(currentQrSrc, '_blank');
    }
  };

  return (
    <div
      className={`bg-walnut border-2 border-brass/40 rounded-sm shadow-xl overflow-hidden transition-all text-left ${className}`}
    >
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-vermilion-dark via-vermilion to-tea-green px-5 py-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white/15 border border-white/30 flex items-center justify-center flex-shrink-0">
            <QrCode className="w-4 h-4 text-[#E5C384]" />
          </div>
          <div>
            <h3 className="font-serif text-base sm:text-lg font-medium text-white flex items-center gap-2">
              Thanh Toán Đặt Chỗ Qua Mã QR
              <span className="text-[10px] uppercase font-sans tracking-widest px-2 py-0.5 rounded-full bg-[#E5C384]/25 text-[#E5C384] border border-[#E5C384]/40 font-semibold">
                VietQR Napas 24/7
              </span>
            </h3>
            <p className="text-[11px] text-white/80">
              Quét mã ngân hàng để chuyển cọc giữ chỗ tự động và nhận phòng đúng lịch hẹn
            </p>
          </div>
        </div>

        {/* Amount Option Segmented Control */}
        <div className="inline-flex items-center bg-black/25 p-0.5 rounded-sm border border-white/20 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setPaymentOption('deposit')}
            className={`px-3 py-1.5 text-xs rounded-xs font-medium transition-all cursor-pointer ${
              paymentOption === 'deposit'
                ? 'bg-white text-vermilion shadow-sm font-semibold'
                : 'text-white/85 hover:text-white'
            }`}
          >
            Cọc 30% ({depositAmount.toLocaleString('vi-VN')} đ)
          </button>
          <button
            type="button"
            onClick={() => setPaymentOption('full')}
            className={`px-3 py-1.5 text-xs rounded-xs font-medium transition-all cursor-pointer ${
              paymentOption === 'full'
                ? 'bg-white text-vermilion shadow-sm font-semibold'
                : 'text-white/85 hover:text-white'
            }`}
          >
            Toàn bộ 100% ({totalPrice.toLocaleString('vi-VN')} đ)
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-7 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* LEFT: QR Code Display Frame */}
          <div className="md:col-span-5 flex flex-col items-center">
            <div className="relative p-3.5 bg-white rounded-sm border border-stone/20 shadow-md flex flex-col items-center max-w-[280px] w-full group">
              {/* Corner Traditional Accents */}
              <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-brass pointer-events-none" />
              <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-brass pointer-events-none" />
              <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-brass pointer-events-none" />
              <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-brass pointer-events-none" />

              {/* QR Image */}
              <div className="relative w-56 h-56 sm:w-60 sm:h-60 bg-white">
                <Image
                  src={currentQrSrc}
                  alt={`Mã QR thanh toán Lùng Vài Tea - ${bookingReference}`}
                  fill
                  sizes="240px"
                  priority
                  className="object-contain"
                  onError={() => setQrImgError(true)}
                  unoptimized={currentQrSrc.startsWith('http')}
                />
              </div>

              {/* QR Mode Switcher & Indicator */}
              <div className="w-full mt-2.5 pt-2 border-t border-stone/15 flex items-center justify-between text-[11px] text-stone-light">
                <span className="inline-flex items-center gap-1 font-medium text-vermilion">
                  <Sparkles className="w-3 h-3 text-brass" />
                  {qrMode === 'dynamic' ? 'Tự điền số tiền & mã' : 'Mã QR gốc trà quán'}
                </span>
                <button
                  type="button"
                  onClick={() => setQrMode(qrMode === 'dynamic' ? 'static' : 'dynamic')}
                  className="text-brass hover:text-ivory underline underline-offset-2 transition-colors cursor-pointer text-[10px]"
                >
                  {qrMode === 'dynamic' ? 'Xem mã QR gốc' : 'Bật QR tự động'}
                </button>
              </div>
            </div>

            {/* Download QR Button */}
            <button
              type="button"
              onClick={handleDownloadQR}
              className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-charcoal hover:bg-charcoal-dark border border-stone/30 text-stone-light hover:text-ivory rounded-xs text-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-brass" />
              <span>Tải ảnh mã QR về điện thoại</span>
            </button>
          </div>

          {/* RIGHT: Bank Transfer Details with 1-Click Copy */}
          <div className="md:col-span-7 space-y-3.5">
            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-stone-light font-semibold block">
                Thông tin chuyển khoản ngân hàng
              </span>
              <p className="text-xs text-stone-light leading-relaxed">
                Quý khách vui lòng quét mã QR hoặc chuyển khoản theo thông tin dưới đây để xác thực lịch hẹn.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              {/* Ngân hàng */}
              <div className="p-2.5 bg-charcoal/70 rounded-xs border border-stone/15 flex items-center justify-between">
                <div>
                  <span className="text-stone-light block text-[11px]">Ngân hàng:</span>
                  <strong className="text-ivory font-medium text-xs sm:text-sm">
                    {BANK_CONFIG.bankName}
                  </strong>
                </div>
                <span className="px-2 py-0.5 rounded bg-tea-green/15 text-tea-dark text-[11px] font-semibold">
                  MB
                </span>
              </div>

              {/* Tên chủ tài khoản */}
              <div className="p-2.5 bg-charcoal/70 rounded-xs border border-stone/15 flex items-center justify-between">
                <div>
                  <span className="text-stone-light block text-[11px]">Chủ tài khoản:</span>
                  <strong className="text-ivory font-medium tracking-wide">
                    {BANK_CONFIG.accountHolder}
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(BANK_CONFIG.accountHolder, 'holder')}
                  className="p-1.5 text-stone-light hover:text-ivory transition-colors cursor-pointer"
                  title="Sao chép tên chủ tài khoản"
                >
                  {copiedField === 'holder' ? (
                    <span className="text-vermilion text-[11px] font-medium flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Đã chép
                    </span>
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Số tài khoản */}
              <div className="p-2.5 bg-charcoal/70 rounded-xs border border-brass/30 flex items-center justify-between">
                <div>
                  <span className="text-stone-light block text-[11px]">Số tài khoản:</span>
                  <strong className="font-mono text-base sm:text-lg text-brass font-bold tracking-wider">
                    {BANK_CONFIG.accountNumber}
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(BANK_CONFIG.accountNumber, 'acc')}
                  className="px-2.5 py-1 rounded bg-walnut border border-brass/40 text-brass hover:bg-brass hover:text-white transition-all cursor-pointer font-medium text-[11px] flex items-center gap-1"
                >
                  {copiedField === 'acc' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-vermilion" />
                      <span className="text-vermilion">Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép STK</span>
                    </>
                  )}
                </button>
              </div>

              {/* Số tiền cần thanh toán */}
              <div className="p-2.5 bg-amber-500/10 rounded-xs border border-amber-500/30 flex items-center justify-between">
                <div>
                  <span className="text-stone-light block text-[11px]">
                    Số tiền {paymentOption === 'deposit' ? 'cọc giữ chỗ (30%)' : 'toàn bộ (100%)'}:
                  </span>
                  <strong className="font-serif text-base sm:text-lg text-vermilion font-bold">
                    {activeAmount.toLocaleString('vi-VN')} đ
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(String(activeAmount), 'amount')}
                  className="px-2.5 py-1 rounded bg-walnut border border-stone/30 text-stone-light hover:text-ivory transition-colors cursor-pointer text-[11px] flex items-center gap-1"
                >
                  {copiedField === 'amount' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-vermilion" />
                      <span className="text-vermilion">Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Chép số tiền</span>
                    </>
                  )}
                </button>
              </div>

              {/* Nội dung chuyển khoản */}
              <div className="p-2.5 bg-vermilion/10 rounded-xs border-2 border-vermilion/40 flex items-center justify-between">
                <div>
                  <span className="text-vermilion font-semibold block text-[11px]">
                    Nội dung chuyển khoản (bắt buộc):
                  </span>
                  <strong className="font-mono text-base sm:text-lg text-vermilion-dark font-bold tracking-wider">
                    {bookingReference}
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(bookingReference, 'ref')}
                  className="px-3 py-1.5 rounded bg-vermilion text-white hover:bg-vermilion-light transition-all cursor-pointer font-medium text-xs flex items-center gap-1 shadow-sm"
                >
                  {copiedField === 'ref' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Chép mã đơn</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Important Transfer Note */}
            <div className="p-3 bg-amber-50 border border-amber-300/80 rounded-xs text-[11px] text-amber-950 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Lưu ý quan trọng:</strong> Quý khách vui lòng giữ nguyên nội dung chuyển khoản là mã{' '}
                <span className="font-mono font-bold text-amber-900">{bookingReference}</span> để hệ thống đối soát tự động và duyệt lịch sớm nhất.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Section: Customer Action & Step-by-Step Instruction */}
        <div className="pt-4 border-t border-stone/15 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-stone-light">
            <Smartphone className="w-4 h-4 text-brass flex-shrink-0" />
            <span>Mở app ngân hàng bất kỳ (MB, Vietcombank, Techcombank...) quét mã để thanh toán.</span>
          </div>

          <div>
            {!hasNotifiedPaid ? (
              <button
                type="button"
                onClick={() => setHasNotifiedPaid(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-tea-green hover:bg-tea-dark text-white text-xs uppercase tracking-wider font-semibold rounded-xs shadow-md transition-all cursor-pointer hover:scale-[1.02]"
              >
                <Check className="w-4 h-4" />
                <span>Tôi đã chuyển khoản</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-500 text-emerald-900 text-xs font-medium rounded-xs animate-fadeIn">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Đã ghi nhận thông báo chuyển khoản! Trà quán sẽ kiểm tra biến động số dư và duyệt lịch ngay.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
