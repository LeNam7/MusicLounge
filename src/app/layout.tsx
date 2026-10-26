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
  metadataBase: new URL('https://lungvaitea.vn'),
  title: `${BRAND_CONFIG.brandName} | ${BRAND_CONFIG.brandSubtitle}`,
  description: `${BRAND_CONFIG.brandTagline}. Khám phá không gian phòng trà riêng tư, bộ sưu tập trà Shan Tuyết cổ thụ Lùng Vài, Oolong thượng hạng và đặt phòng trực tuyến.`,
  keywords: [
    'lùng vài tea',
    'lung vai tea',
    'trà lùng vài',
    'thanh sơn trà',
    'trà shan tuyết cổ thụ',
    'phòng trà hà nội',
    'quán trà đạo sang trọng',
    'phòng trà riêng tư',
    'thưởng trà đàm đạo',
    'đặt phòng trà',
    'ấm tử sa'
  ],
  openGraph: {
    title: `${BRAND_CONFIG.brandName} — ${BRAND_CONFIG.brandSubtitle}`,
    description: BRAND_CONFIG.brandSubtagline,
    images: ['/images/hero-tea-ceremony.png'],
    type: 'website',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
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
