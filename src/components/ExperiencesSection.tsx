import React from 'react';
import Link from 'next/link';
import { ArrowRight, Coffee, Heart, Briefcase, Feather, Sparkles } from 'lucide-react';

export default function ExperiencesSection() {
  const experiences = [
    {
      title: 'Đàm Đạo & Gặp Gỡ Tri Kỷ',
      subtitle: 'Dành cho 2 - 4 người',
      desc: 'Một buổi chiều thảnh thơi bên ấm trà ấm, nhâm nhi chút bánh điểm tâm thủ công, trao nhau những tâm tình sâu lắng mà không bị quấy rầy bởi sự hối hả bên ngoài.',
      suggestedRoom: 'Phòng Trúc Ảnh hoặc Nguyệt Các',
      slug: 'truc-anh',
      icon: Heart,
    },
    {
      title: 'Họp Mặt Doanh Nhân & Ký Kết',
      subtitle: 'Dành cho 4 - 12 người',
      desc: 'Không gian riêng tư, kín đáo, mang phong thái tao nhã và tôn trọng đối tác. Trà sư hỗ trợ nghi lễ trà tiếp khách, tạo bầu không khí đàm phán hài hoà, hanh thông.',
      suggestedRoom: 'Phòng Vân Sơn',
      slug: 'van-son',
      icon: Briefcase,
    },
    {
      title: 'Tĩnh Lặng, Đọc Sách & Thiền Trà',
      subtitle: 'Dành cho cá nhân hoặc đôi bạn',
      desc: 'Khoảng lặng quý giá để bạn tách mình khỏi thiết bị điện tử, lắng nghe hơi thở, đọc một cuốn sách hay hoặc đơn giản là ngắm ánh sáng tự nhiên nhảy múa trên chén trà.',
      suggestedRoom: 'Phòng Minh Đường',
      slug: 'minh-duong',
      icon: Feather,
    },
    {
      title: 'Khoá Trải Nghiệm Văn Hoá Trà Đạo',
      subtitle: 'Dành cho nhóm yêu trà',
      desc: 'Trải nghiệm tìm hiểu các dòng trà cổ thụ, cách nhận biết phẩm chất lá trà, kỹ thuật đánh thức hương trà và thực hành nghi thức Gongfu truyền thống.',
      suggestedRoom: 'Phòng Trúc Ảnh hoặc Vân Sơn',
      slug: 'truc-anh',
      icon: Coffee,
    },
  ];

  return (
    <section id="experiences" className="relative py-28 lg:py-36 bg-charcoal-light border-b border-stone-dark/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 text-brass tracking-[0.3em] uppercase text-xs font-medium">
            <span className="seal-stamp text-[10px] px-1.5 font-sans font-bold">DỊCH VỤ</span>
            <span>MỤC ĐÍCH TRẢI NGHIỆM</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-ivory font-normal">
            Không gian may đo cho từng khoảnh khắc
          </h2>
          <p className="text-sm sm:text-base text-stone-light font-light">
            Dù là buổi đàm phán kinh doanh trọng đại hay chỉ là một buổi chiều thảnh thơi trò chuyện, bạn sẽ luôn tìm thấy sự thoải mái và trang trọng tuyệt đối.
          </p>
        </div>

        {/* 4 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {experiences.map((exp, idx) => {
            const Icon = exp.icon;
            return (
              <div
                key={idx}
                className="bg-white border border-stone-dark/50 hover:border-brass p-8 sm:p-10 rounded-sm transition-all duration-300 flex flex-col justify-between group shadow-sm hover:shadow-lg hover:shadow-stone/15"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xs uppercase tracking-[0.2em] text-brass font-medium">
                      {exp.subtitle}
                    </span>
                    <div className="w-10 h-10 rounded-full bg-charcoal/80 border border-stone/20 flex items-center justify-center text-brass group-hover:scale-110 transition-transform">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="font-serif text-xl sm:text-2xl text-ivory mb-3 font-normal group-hover:text-brass-light transition-colors">
                    {exp.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-stone-light leading-relaxed font-light mb-6">
                    {exp.desc}
                  </p>
                </div>

                <div className="pt-6 border-t border-stone/15 flex items-center justify-between text-xs">
                  <span className="text-stone-light">
                    Phù hợp nhất: <strong className="text-ivory font-medium">{exp.suggestedRoom}</strong>
                  </span>
                  <Link
                    href={`/booking?room=${exp.slug}`}
                    className="inline-flex items-center gap-1.5 text-brass hover:text-ivory font-medium tracking-wider transition-colors"
                  >
                    <span>Đặt phòng</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
