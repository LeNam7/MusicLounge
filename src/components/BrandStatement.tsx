import React from 'react';
import Image from 'next/image';
import { BRAND_CONFIG } from '@/lib/config';

export default function BrandStatement() {
  return (
    <section className="relative py-28 lg:py-36 bg-charcoal overflow-hidden border-b border-stone-dark/30">
      {/* Subtle lattice watermark */}
      <div className="absolute inset-0 bg-lattice-subtle opacity-25 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Asymmetrical Editorial Photography */}
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-[4/5] rounded-sm overflow-hidden border border-brass/30 shadow-2xl shadow-charcoal-dark">
              <Image
                src="/images/tea-ceremony-closeup.jpg"
                alt="Nghi thức pha trà Gongfu thủ công với ấm tử sa"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover object-center hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-transparent" />
            </div>

            {/* Overlapping small detail badge */}
            <div className="absolute -bottom-6 -right-6 hidden sm:block bg-walnut border border-brass/40 p-4 rounded-sm shadow-xl max-w-xs">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="seal-stamp text-[10px] px-1">茶</span>
                <span className="text-[11px] uppercase tracking-widest text-brass font-medium">
                  Cổ Pháp Thưởng Trà
                </span>
              </div>
              <p className="text-xs text-ivory-muted leading-relaxed font-light">
                Nước đầu sôi mắt cua, trà hãm trong ấm tử sa nguyên khoáng giữ trọn hương vị đất trời.
              </p>
            </div>
          </div>

          {/* Right Column: Editorial Typography & Philosophy */}
          <div className="lg:col-span-7 lg:pl-6 space-y-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 text-brass tracking-[0.3em] uppercase text-xs font-medium">
                <span className="w-8 h-[1px] bg-brass/60" />
                <span>TRIẾT LÝ KHÔNG GIAN</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-ivory leading-[1.25]">
                Tìm về khoảng lặng thuần khiết, <br />
                <span className="italic text-brass-light">giữa dòng chảy tất bật của phố thị.</span>
              </h2>
            </div>

            <div className="space-y-5 text-ivory-muted font-light leading-relaxed text-base sm:text-lg">
              <p>
                Tại <span className="text-ivory font-medium">{BRAND_CONFIG.brandName}</span>, chúng tôi tin rằng chén trà ngon nhất không chỉ nằm ở phẩm chất lá trà hay độ tinh khiết của nguồn nước, mà quan trọng hơn cả là <span className="text-ivory italic">tâm thế của người thưởng trà</span>.
              </p>
              <p>
                Từng phòng trà được kiến tạo như một ốc đảo riêng tư tách biệt với thế giới bên ngoài. Nơi đây, ánh sáng ấm áp phản chiếu trên chất gỗ óc chó trầm lắng, hương trầm thoang thoảng cùng bóng trúc lướt qua khung vòm nguyệt môn. Bạn có thể dành trọn thời gian để lắng nghe chính mình, sẻ chia những câu chuyện chân thành cùng tri kỷ, hoặc tĩnh tại ngắm nhìn từng giọt trà vàng óng rơi chầm chậm vào chén sứ thanh tao.
              </p>
            </div>

            {/* Quote Inscription */}
            <div className="pt-4 border-t border-brass/20 flex items-start gap-4">
              <span className="font-serif text-3xl sm:text-4xl text-vermilion opacity-70 leading-none select-none">
                “
              </span>
              <div>
                <p className="font-serif text-base sm:text-lg text-ivory italic leading-snug">
                  Thời gian trôi qua cửa sổ, bình trà ấm trên tay. Tâm an thì vạn sự an.
                </p>
                <span className="block mt-2 text-xs uppercase tracking-[0.2em] text-stone-light">
                  — Lời gửi từ chủ nhân {BRAND_CONFIG.brandName}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
