import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import RoomBookingPanel from '@/components/RoomBookingPanel';
import { getRoomBySlug, getAllRooms } from '@/lib/db';
import { ArrowLeft, Users, Clock, Maximize2, ShieldCheck, Check, Sparkles, MapPin } from 'lucide-react';
import { Metadata } from 'next';
import { BRAND_CONFIG } from '@/lib/config';

interface RoomPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: RoomPageProps): Promise<Metadata> {
  const { slug } = await params;
  const room = getRoomBySlug(slug);
  if (!room) return { title: 'Không tìm thấy phòng' };

  return {
    title: `Phòng ${room.name} (${room.chineseName}) | ${BRAND_CONFIG.brandName}`,
    description: room.description,
    openGraph: {
      title: `Phòng ${room.name} (${room.chineseName}) — ${room.tagline}`,
      description: room.fullDescription,
      images: [room.images[0] || '/images/hero-tea-ceremony.png'],
    },
  };
}

export default async function RoomDetailPage({ params }: RoomPageProps) {
  const { slug } = await params;
  const room = getRoomBySlug(slug);

  if (!room) {
    notFound();
  }

  const allRooms = getAllRooms();
  const otherRooms = allRooms.filter((r) => r.id !== room.id);

  return (
    <div className="min-h-screen flex flex-col bg-charcoal text-ivory">
      <Navbar />

      <main className="flex-1 pt-24 pb-20">
        
        {/* Navigation Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 mb-4">
          <Link
            href="/#rooms"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-stone-light hover:text-brass transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại danh sách phòng trà</span>
          </Link>
        </div>

        {/* Room Editorial Hero Banner */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <div className="relative aspect-[21/9] sm:aspect-[21/8] rounded-sm overflow-hidden border border-brass/30 shadow-2xl">
            <Image
              src={room.images[0] || '/images/hero-tea-ceremony.png'}
              alt={`Không gian phòng trà ${room.name}`}
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/40 to-transparent" />
            
            <div className="absolute bottom-6 left-6 sm:bottom-10 sm:left-10 z-10 space-y-2">
              <div className="flex items-center gap-2">
                <span className="seal-stamp text-xs px-2 py-0.5">{room.chineseName}</span>
                <span className="text-xs uppercase tracking-[0.25em] text-brass font-medium">
                  {room.floor} • {room.areaSqm} m²
                </span>
              </div>
              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-ivory font-normal">
                Phòng {room.name}
              </h1>
              <p className="text-xs sm:text-base text-ivory-muted italic font-serif max-w-2xl">
                &ldquo;{room.tagline}&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* Main Content & Sticky Booking Layout */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Left 7-8 Columns: Interior Design Feature & Specs */}
            <div className="lg:col-span-8 space-y-12">
              
              {/* Architectural Narrative */}
              <div className="space-y-4">
                <span className="text-xs uppercase tracking-[0.25em] text-brass font-medium block">
                  KIẾN TRÚC & KHÔNG GIAN
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl text-ivory font-normal leading-snug">
                  Nơi ánh sáng hổ phách chạm vào thớ gỗ trầm tích
                </h2>
                <div className="text-sm sm:text-base text-stone-light font-light leading-relaxed space-y-4">
                  <p>{room.fullDescription}</p>
                  <p>
                    Từng đường nét kiến trúc trong phòng {room.name} đều tuân theo nguyên lý thẩm mỹ Á Đông đương đại: giảm thiểu chi tiết rườm rà, tôn vinh chất liệu tự nhiên của gỗ óc chó, đá sa thạch và vải dệt thô mộc. Hệ thống ánh sáng nhiệt độ màu 2700K được căn chỉnh chính xác, tạo nên các lớp bóng đổ huyền ảo như trong một bức tranh thủy mặc sống động.
                  </p>
                </div>
              </div>

              {/* Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-walnut/40 border border-stone/20 rounded-sm">
                <div className="space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-stone-light block">Sức chứa</span>
                  <span className="font-serif text-lg text-brass font-medium">{room.capacityMin} - {room.capacityMax} khách</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-stone-light block">Diện tích</span>
                  <span className="font-serif text-lg text-brass font-medium">{room.areaSqm} m²</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-stone-light block">Vị trí</span>
                  <span className="font-serif text-lg text-brass font-medium">{room.floor}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-stone-light block">Trà sư hỗ trợ</span>
                  <span className="font-serif text-lg text-brass font-medium">Bao gồm</span>
                </div>
              </div>

              {/* Gallery Grid */}
              <div className="space-y-4">
                <span className="text-xs uppercase tracking-[0.25em] text-brass font-medium block">
                  CÁC GÓC CHỤP CHI TIẾT
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {room.images.map((img, i) => (
                    <div key={i} className="relative aspect-[4/3] rounded-xs overflow-hidden border border-stone/20 shadow-md">
                      <Image
                        src={img}
                        alt={`Ảnh chi tiết phòng ${room.name} ${i + 1}`}
                        fill
                        sizes="(max-width: 640px) 100vw, 40vw"
                        className="object-cover hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Amenities List */}
              <div className="space-y-4">
                <span className="text-xs uppercase tracking-[0.25em] text-brass font-medium block">
                  TIỆN ÍCH & TRANG THIẾT BỊ ĐI KÈM
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {room.amenities.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xs bg-charcoal/60 border border-stone/20 text-xs text-ivory-muted">
                      <Check className="w-4 h-4 text-brass mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Policies & Ritual Guidelines */}
              <div className="p-6 bg-charcoal/80 border border-brass/20 rounded-sm space-y-3 text-xs text-stone-light">
                <span className="uppercase tracking-[0.2em] text-brass font-medium block">
                  QUY ĐỊNH PHÒNG TRÀ RIÊNG TƯ
                </span>
                <p>• Thời gian nhận phòng đúng giờ đã đăng ký. Nhân viên phục vụ sẵn sàng trước 10 phút.</p>
                <p>• Trà sư sẽ pha ấm nước đầu tiên để đánh thức hương vị và hướng dẫn quý khách nghi thức rót trà.</p>
                <p>• Không gian phòng trà được thiết kế để giữ trọn sự tĩnh lặng. Quý khách vui lòng chuyển điện thoại sang chế độ rung.</p>
              </div>

              {/* Other Rooms Navigation */}
              <div className="pt-8 border-t border-stone/20">
                <span className="text-xs uppercase tracking-[0.25em] text-stone-light font-medium block mb-6">
                  KHÁM PHÁ CÁC PHÒNG KHÁC
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {otherRooms.map((or) => (
                    <Link
                      key={or.id}
                      href={`/rooms/${or.slug}`}
                      className="p-4 bg-walnut/40 border border-stone/20 hover:border-brass/40 rounded-sm transition-all group"
                    >
                      <div className="relative aspect-[16/10] rounded-xs overflow-hidden mb-3">
                        <Image
                          src={or.images[0] || '/images/hero-tea-ceremony.png'}
                          alt={or.name}
                          fill
                          sizes="200px"
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <span className="font-serif text-base text-ivory group-hover:text-brass transition-colors block">
                        Phòng {or.name} ({or.chineseName})
                      </span>
                      <span className="text-[11px] text-stone-light">
                        {or.capacityMin} - {or.capacityMax} khách • {or.pricePackage2h.toLocaleString('vi-VN')} đ
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

            </div>

            {/* Right 4-5 Columns: Sticky Booking Panel */}
            <div className="lg:col-span-4">
              <RoomBookingPanel room={room} />
            </div>

          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
