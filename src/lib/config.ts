import { BrandConfig, Room, TeaPackage } from './types';

export const BRAND_CONFIG: BrandConfig = {
  brandName: 'ORIENTAL SERENITY',
  brandChineseName: '东方雅境',
  brandTagline: 'Nơi thời gian chậm lại, và lòng người an yên',
  brandSubtagline: 'Một không gian trà riêng tư, nơi nghệ thuật thưởng trà phương Đông gặp gỡ phong cách sống đương đại.',
  address: 'Số 18 Phố Tràng Tiền, Quận Hoàn Kiếm, Hà Nội',
  hotline: '0988 288 368',
  email: 'reservations@orientalserenity.vn',
  openTime: '08:30',
  closeTime: '22:30',
  slotIntervalMinutes: 30,
  bufferMinutes: 15,
  depositPercentage: 30, // 30% cọc giữ chỗ
};

export const INITIAL_ROOMS: Room[] = [
  {
    id: 'room-1',
    slug: 'truc-anh',
    name: 'Trúc Ảnh',
    chineseName: '竹影',
    tagline: 'Bóng trúc tao nhã bên bàn trà gỗ óc chó nguyên khối',
    description: 'Không gian trà đạo mộc mạc và tĩnh lặng, lấy cảm hứng từ tiết thấu thanh thoát của rặng trúc phương Đông và sắc nâu trầm của gỗ tự nhiên.',
    fullDescription: 'Phòng trà Trúc Ảnh được bài trí theo phong cách Tống đại tối giản kết hợp thẩm mỹ đương đại. Nổi bật tại trung tâm là chiếc bàn trà gỗ óc chó nguyên khối dài 3.2m cùng tiểu cảnh tùng bách bonsai cổ thụ. Hệ vách song gỗ điêu khắc tinh xảo lọc ánh sáng tự nhiên dịu nhẹ, tạo nên bức rèm thị giác riêng tư hoàn hảo cho những cuộc đàm đạo thân tình hay đàm phán trang trọng.',
    capacityMin: 2,
    capacityMax: 8,
    pricePerHour: 450000,
    pricePackage2h: 800000,
    areaSqm: 38,
    floor: 'Tầng 1 - Khu Đông',
    amenities: [
      'Bàn trà óc chó nguyên khối & khay đá sa thạch',
      'Bộ ấm chén tử sa Nghi Hưng cao cấp',
      'Hệ thống điều hoà lọc không khí 2 chiều ion âm',
      'Không gian cách âm tiêu chuẩn boutique hospitality',
      'Trợ lý trà đạo (Tea Master) hỗ trợ nghi thức pha trà',
      'Ánh sáng ấm 2700K điều chỉnh độ mờ linh hoạt',
      'Wifi tốc độ cao & cổng sạc ẩn thẩm mỹ'
    ],
    images: [
      '/images/room-truc-anh.jpg',
      '/images/media_1792674900258_82cc6ea4.jpg',
      '/images/hero-tea-ceremony.png',
      '/images/room-nguyet-cac.jpg'
    ],
    teaMasterIncluded: true,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'room-2',
    slug: 'nguyet-cac',
    name: 'Nguyệt Các',
    chineseName: '月阁',
    tagline: 'Vòm cửa nguyệt môn và kệ gốm cổ bên ánh trăng dịu',
    description: 'Căn phòng thi vị với ô cửa nguyệt môn truyền thống, kệ gốm thủ công sưu tầm và không gian ấm cúng dành cho những tâm hồn đồng điệu.',
    fullDescription: 'Nguyệt Các mang vẻ đẹp trữ tình và huyền ảo của đêm trăng thanh mát. Không gian gây ấn tượng với khung cửa vòm Nguyệt Môn dẫn ra góc tiểu cảnh vườn thiền, bên cạnh hệ giá gỗ trưng bày các hộp trà cổ và gốm sứ hoa lam men ngọc. Ghế tựa bọc đệm gấm màu ngà mang lại cảm giác nâng niu, thích hợp cho buổi trò chuyện sâu lắng, đọc sách hay thưởng ngoạn trà chiều cùng tri kỷ.',
    capacityMin: 2,
    capacityMax: 6,
    pricePerHour: 420000,
    pricePackage2h: 750000,
    areaSqm: 32,
    floor: 'Tầng 2 - Khu Thưởng Nguyệt',
    amenities: [
      'Vòm cửa nguyệt môn & view tiểu cảnh vườn đá',
      'Bộ trà cụ men thanh từ tráng lệ',
      'Kệ trưng bày trà Shan Tuyết & Oolong thượng hạng',
      'Hương trầm tự nhiên nguyên chất dịu êm',
      'Ghế bọc nệm lụa tơ tằm êm ái',
      'Bình đun nước đồng nguyên chất kiểm soát nhiệt độ',
      'Không gian kín đáo, riêng tư tuyệt đối'
    ],
    images: [
      '/images/room-nguyet-cac.jpg',
      '/images/media_1792674922309_f968b846.jpg',
      '/images/room-truc-anh.jpg',
      '/images/hero-tea-ceremony.png'
    ],
    teaMasterIncluded: true,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'room-3',
    slug: 'van-son',
    name: 'Vân Sơn',
    chineseName: '云山',
    tagline: 'Đại sảnh thưởng trà uy nghi giữa mây ngàn và tranh thủy mặc',
    description: 'Không gian rộng rãi, trang trọng dành cho các buổi họp mặt quý khách, gặp gỡ gia đình, đối tác kinh doanh hoặc tiệc trà văn hoá.',
    fullDescription: 'Vân Sơn là căn phòng lớn nhất tại Oriental Serenity, được thiết kế với cảm hứng mây núi điệp trùng và sự rộng mở của tự nhiên. Bức bình phong tranh sơn thuỷ thủy mặc khổ lớn trải dài cùng hai bàn trà song hành cho phép phục vụ tới 16 khách cùng lúc. Ánh sáng vàng dịu từ trần thả lượn sóng tạo nên bầu không khí vừa tôn nghiêm, quyền quý lại chan hoà tình cảm.',
    capacityMin: 6,
    capacityMax: 16,
    pricePerHour: 850000,
    pricePackage2h: 1500000,
    areaSqm: 65,
    floor: 'Tầng 2 - Đại Sảnh',
    amenities: [
      'Song bàn trà gỗ óc chó cao cấp phục vụ đoàn đông',
      'Bình phong tranh thủy mặc Tống đại thủ công',
      'Bộ trà cụ chuyên biệt cho trà lễ nghi thức lớn',
      '2 Chuyên gia trà đạo túc trực phục vụ',
      'Màn chiếu & thiết bị âm thanh hội nghị ẩn tường',
      'Phòng vệ sinh riêng biệt nội bộ',
      'Khu vực đệm chờ thư giãn riêng'
    ],
    images: [
      '/images/room-van-son.jpg',
      '/images/room-truc-anh.jpg',
      '/images/room-nguyet-cac.jpg',
      '/images/lounge-minh-duong.jpg'
    ],
    teaMasterIncluded: true,
    isActive: true,
    sortOrder: 3,
  },
  {
    id: 'room-4',
    slug: 'minh-duong',
    name: 'Minh Đường',
    chineseName: '明堂',
    tagline: 'Góc phòng trà thiền hiện đại ngắm phố qua vòm kính cong',
    description: 'Không gian kết hợp phòng khách trà đương đại và quầy trà nghệ thuật, đón trọn ánh sáng tự nhiên và nhịp sống nhẹ nhàng.',
    fullDescription: 'Minh Đường mang phong cách giao thoa giữa salon trà quý phái và phòng thưởng trà tối giản. Những chiếc ghế bọc nỉ tông màu cát ấm đặt cạnh bàn tròn sa thạch đen cùng vòm kính panorama uốn lượn nhìn ra hàng cây xanh mát. Đây là lựa chọn lý tưởng cho các buổi gặp mặt 3-5 người, nhâm nhi tách bạch trà mát lành và bánh ngọt truyền thống.',
    capacityMin: 2,
    capacityMax: 5,
    pricePerHour: 380000,
    pricePackage2h: 680000,
    areaSqm: 28,
    floor: 'Tầng 1 - Đại Sảnh Đón Tiếp',
    amenities: [
      'Cửa vòm kính panorama đón ánh sáng tự nhiên',
      'Bộ bàn ghế bọc vải linen phong cách Modern Oriental',
      'Gần quầy pha chế chính & tủ trưng bày ấm chén độc bản',
      'Bộ ấm chén sứ trắng Cảnh Đức Trấn tinh xảo',
      'Phù hợp làm việc sáng tạo & trò chuyện nhẹ nhàng',
      'Thực đơn bánh trà tươi làm thủ công hàng ngày'
    ],
    images: [
      '/images/lounge-minh-duong.jpg',
      '/images/media_1792674930271_e8af1bcd.jpg',
      '/images/hero-tea-ceremony.png',
      '/images/tea-culture-lungvai.png'
    ],
    teaMasterIncluded: false,
    isActive: true,
    sortOrder: 4,
  },
];

export const INITIAL_TEA_PACKAGES: TeaPackage[] = [
  {
    id: 'tea-lung-vai',
    name: 'Thanh Sơn Trà - Lùng Vài',
    vietnameseName: 'Lục Trà Shan Tuyết Cổ Thụ 1 Tôm 1 Lá',
    description: 'Hái từ cây chè Shan Tuyết cổ thụ trên đỉnh núi Lùng Vài mù sương ở độ cao trên 1.500m. Nước trà trong xanh ánh vàng, hương thơm ngát mùi cỏ ngọt và hạt dẻ nướng, vị chát thanh thoát ngọt hậu kéo dài.',
    price: 280000,
    servings: '1 ấm thưởng thức (cho 2 - 4 người, hãm được 6-8 nước)',
    origin: 'Vùng cao Lùng Vài, Hà Giang',
    imageUrl: '/images/tea-culture-lungvai.png',
    tags: ['Đặc sản', 'Shan Tuyết Cổ Thụ', 'Hương cốm non', 'Ngọt sâu']
  },
  {
    id: 'tea-dai-hong-bao',
    name: 'Đại Hồng Bào Vũ Di',
    vietnameseName: 'Nham Trà Đại Hồng Bào Thượng Hạng',
    description: 'Vua của các loài Nham Trà vùng núi đá Vũ Di. Lá trà sao lửa kỹ lưỡng, hương thơm khói gỗ đàn hương và hoa phong lan, thể trà dày dặn ấm áp ngập tràn sinh khí.',
    price: 360000,
    servings: '1 ấm quý (cho 2 - 4 người, hãm được 8-10 nước)',
    origin: 'Vũ Di Sơn, Phúc Kiến',
    imageUrl: '/images/hero-tea-ceremony.png',
    tags: ['Nham Trà', 'Lên men vừa', 'Hương hoa lan', 'Gỗ đàn hương']
  },
  {
    id: 'tea-bach-mau-don',
    name: 'Bạch Mẫu Đơn Cổ Thụ',
    vietnameseName: 'Bạch Trà Tự Nhiên Ủ Lâu Năm',
    description: 'Bạch trà thu hái vào đầu xuân khi búp còn phủ lớp lông tơ bạc óng ánh. Nước trà màu vàng mơ sóng sánh, vị thanh nhã ngọt ngào tựa mật hoa dại, rất giàu chất chống oxy hoá.',
    price: 260000,
    servings: '1 ấm tinh tế (cho 2 - 4 người, hãm được 6-8 nước)',
    origin: 'Phúc Đỉnh, Phúc Kiến',
    imageUrl: '/images/room-nguyet-cac.jpg',
    tags: ['Bạch trà', 'Hương mật hoa', 'Thanh lọc', 'Nhẹ dịu']
  },
  {
    id: 'tea-thiet-quan-am',
    name: 'Thiết Quan Âm Hoàng Kim',
    vietnameseName: 'Trà Oolong Thiết Quan Âm Truyền Thống',
    description: 'Lá trà cuộn chặt hình viên ngọc tròn xanh biếc, nước vàng hổ phách sáng trong. Hương hoa lan tự nhiên bung toả ngào ngạt sau 7 lần nước, dư vị thanh tao sảng khoái.',
    price: 250000,
    servings: '1 ấm tiêu chuẩn (cho 2 - 4 người, hãm được 7 nước)',
    origin: 'An Khê, Phúc Kiến',
    imageUrl: '/images/room-truc-anh.jpg',
    tags: ['Oolong', 'Bảy tuần hương', 'Hương lan', 'Tươi mát']
  },
  {
    id: 'combo-teatime-banh',
    name: 'Set Điểm Tâm Thưởng Trà Hoàng Gia',
    vietnameseName: 'Khay Bánh Trà Thủ Công 4 Vị',
    description: 'Bao gồm bánh đậu xanh hạt sen ướp hoa bưởi, bánh phù dung táo đỏ, kẹo mè đen nướng giòn và mứt gừng non sấy lạnh. Sự kết hợp hoàn mỹ cân bằng vị chát của trà.',
    price: 180000,
    servings: 'Khay 4 món bánh điểm tâm thủ công',
    origin: 'Bếp Bánh Oriental Serenity',
    imageUrl: '/images/lounge-minh-duong.jpg',
    tags: ['Điểm tâm', 'Bánh thủ công', 'Thuần khiết', 'Ít ngọt']
  }
];

export const GALLERY_ITEMS = [
  {
    id: 'gal-1',
    title: 'Nghi thức pha trà Gongfu thủ công',
    subtitle: 'Nước sôi đầu nguồn, ấm tử sa nguyên khoáng',
    category: 'Trà Cụ & Nghi Thức',
    imageUrl: '/images/hero-tea-ceremony.png',
  },
  {
    id: 'gal-2',
    title: 'Phòng trà Trúc Ảnh nhìn từ chính diện',
    subtitle: 'Bàn gỗ óc chó 3.2m và song cửa điêu khắc',
    category: 'Không Gian Phòng Riêng',
    imageUrl: '/images/room-truc-anh.jpg',
  },
  {
    id: 'gal-3',
    title: 'Góc Nguyệt Các bên vòm cửa tròn',
    subtitle: 'Kệ gốm cổ hoa lam và các hộp trà quý',
    category: 'Nội Thất & Chi Tiết',
    imageUrl: '/images/room-nguyet-cac.jpg',
  },
  {
    id: 'gal-4',
    title: 'Salon trà Minh Đường đón ánh ban mai',
    subtitle: 'Vòm kính cong và sofa bọc nỉ ấm cúng',
    category: 'Không Gian Phòng Riêng',
    imageUrl: '/images/lounge-minh-duong.jpg',
  },
  {
    id: 'gal-5',
    title: 'Trà Shan Tuyết Cổ Thụ Lùng Vài',
    subtitle: 'Búp chè ngậm sương từ đỉnh núi cao 1.500m',
    category: 'Trà Cụ & Nghi Thức',
    imageUrl: '/images/tea-culture-lungvai.png',
  },
  {
    id: 'gal-6',
    title: 'Chi tiết điêu khắc song gỗ cổ điển',
    subtitle: 'Sự tương phản giữa hoa văn và nền gạch hoa cổ',
    category: 'Kiến Trúc & Vật Liệu',
    imageUrl: '/images/media_1792674900258_82cc6ea4.jpg',
  },
  {
    id: 'gal-7',
    title: 'Góc trưng bày trà cụ gốm thủ công',
    subtitle: 'Từng hũ trà mang câu chuyện ngàn năm',
    category: 'Nội Thất & Chi Tiết',
    imageUrl: '/images/media_1792674922309_f968b846.jpg',
  },
  {
    id: 'gal-8',
    title: 'Đại sảnh Vân Sơn bên bức họa sơn thủy',
    subtitle: 'Ánh đèn 2700K tạo chiều sâu tĩnh tại',
    category: 'Không Gian Phòng Riêng',
    imageUrl: '/images/room-van-son.jpg',
  }
];

export const TESTIMONIALS = [
  {
    id: 't-1',
    author: 'Trần Minh Hoàng',
    role: 'Nhà sáng lập & Kiến trúc sư',
    room: 'Phòng Trúc Ảnh',
    content: 'Một trải nghiệm không gian hiếm có tại Hà Nội. Mùi gỗ trầm, tiếng nước róc rách và vị Shan Tuyết cổ thụ giúp tôi tìm lại sự cân bằng sau những tuần lễ căng thẳng.',
    date: 'Tháng 10, 2026',
    badge: 'Khách hàng thân thiết'
  },
  {
    id: 't-2',
    author: 'Lê Thuỳ Dung',
    role: 'Nghệ nhân gốm thủ công',
    room: 'Phòng Nguyệt Các',
    content: 'Vòm cửa nguyệt môn và bộ ấm tử sa tại đây được chăm chút vô cùng tinh tế. Trà sư pha trà với tâm thế rất an, từng ngụm trà như mở ra cả không gian tĩnh lặng.',
    date: 'Tháng 9, 2026',
    badge: 'Trải nghiệm trà đạo'
  },
  {
    id: 't-3',
    author: 'Nguyễn Đăng Khoa',
    role: 'Giám đốc Điều hành Quỹ Đầu tư',
    room: 'Phòng Vân Sơn',
    content: 'Chúng tôi tiếp đối tác quốc tế tại phòng Vân Sơn. Khách rất ấn tượng với sự thanh nhã, kín đáo và phong thái đón tiếp đậm chất văn hoá Á Đông đương đại.',
    date: 'Tháng 10, 2026',
    badge: 'Họp mặt trang trọng'
  }
];
