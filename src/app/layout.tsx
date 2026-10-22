import type { Metadata } from 'next';
import { Cormorant_Garamond, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { BRAND_CONFIG } from '@/lib/config';

const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://oriental-serenity.vn'),
  title: `${BRAND_CONFIG.brandName} — ${BRAND_CONFIG.brandChineseName} | Không Gian Trà Đạo Riêng Tư Đương Đại`,
  description: `${BRAND_CONFIG.brandTagline}. Khám phá không gian phòng trà riêng tư, bộ sưu tập trà Shan Tuyết cổ thụ, Oolong thượng hạng và đặt phòng trực tuyến.`,
  keywords: [
    'phòng trà hà nội',
    'quán trà đạo sang trọng',
    'phòng trà riêng tư',
    'oriental serenity',
    'thưởng trà đàm đạo',
    'đặt phòng trà',
    'trà shan tuyết cổ thụ',
    'ấm tử sa'
  ],
  openGraph: {
    title: `${BRAND_CONFIG.brandName} — ${BRAND_CONFIG.brandChineseName}`,
    description: BRAND_CONFIG.brandSubtagline,
    images: ['/images/hero-tea-ceremony.png'],
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${cormorant.variable} ${jakarta.variable} scroll-smooth`}>
      <body className="min-h-screen bg-charcoal text-ivory antialiased selection:bg-vermilion selection:text-ivory-light">
        {children}
      </body>
    </html>
  );
}
