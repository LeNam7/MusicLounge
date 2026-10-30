# ORIENTAL SERENITY — 东方雅境
### Không Gian Trà Đạo Riêng Tư Đương Đại & Hệ Thống Đặt Phòng Trực Tuyến

> **"Nơi thời gian chậm lại, và lòng người an yên."**  
> *一盏清茶，一方静境 — Một chén trà thanh, một khoảng trời tĩnh lặng.*

---

## 1. Giới thiệu dự án

**ORIENTAL SERENITY — 东方雅境** là một ứng dụng web cao cấp, truyền tải trọn vẹn thẩm mỹ Á Đông đương đại (Modern Oriental Aesthetics), mang lại cho khách hàng trải nghiệm như đang bước vào một quán trà thất thanh nhã qua màn hình.

Dự án không dừng lại ở bản thiết kế khái niệm mà là một hệ thống hoàn chỉnh phục vụ thực tế:
- **Khám phá không gian trà thất:** Thưởng lãm 4 phòng trà độc bản với thiết kế gỗ óc chó, vách song gỗ, cửa nguyệt môn, tranh thủy mặc và ánh đèn 2700K.
- **Quy trình đặt phòng 5 bước:** Kiểm tra lịch trống thời gian thực, ngăn chặn trùng lặp đồng thời (concurrency-safe), lựa chọn danh trà Shan Tuyết cổ thụ, tính cọc 30% và xuất mã đặt phòng duy nhất.
- **Cổng tra cứu khách hàng:** Cho phép khách kiểm tra tiến độ tiếp nhận, duyệt cọc và in phiếu xác nhận.
- **Trang quản trị (Admin Portal):** Quản lý trạng thái đơn (pending, confirmed, completed, cancelled), điều chỉnh giá phòng và sức chứa tức thì, xem báo cáo doanh thu.
- **Âm sắc thiền (Ambient Audio):** Trình phát âm thanh thiền định tổng hợp (tiếng giọt nước pentatonic & âm hưởng cổ cầm) qua Web Audio API không tốn tài nguyên mạng, tắt/bật linh hoạt.

---

## 2. Bảng mã màu & Thẩm mỹ (Art Direction)

Hệ thống Design Token tuân thủ nghiêm ngặt nguyên tắc mỹ học Á Đông:

| Token | Mã màu | Ý nghĩa mỹ học |
| :--- | :--- | :--- |
| **Tea Charcoal** | `#171713` | Màu than củi hãm trà, tạo chiều sâu tĩnh tại cho nền |
| **Deep Walnut** | `#30251F` | Màu gỗ óc chó sẫm của bàn trà nguyên khối và vách ngăn |
| **Ivory** | `#E9E0D0` | Màu lụa ngà và giấy xuyến chỉ, mang lại độ tương phản êm dịu |
| **Vermilion** | `#8D342D` | Đỏ chu sa truyền thống của con dấu triện và điểm nhấn tương tác |
| **Antique Brass** | `#B69A6A` | Đồng thau cổ điển viền khung, toát lên nét sang trọng thầm lặng |
| **Muted Stone** | `#77736B` | Màu sa thạch của khay trà và vỉa đá sân vườn |

Typography:
- **Tiêu đề & Triện thư:** `Cormorant Garamond` kết hợp hệ phông chữ Hán thư pháp (`Noto Serif SC`, `Songti SC`).
- **Nội dung & Nút bấm:** `Plus Jakarta Sans` hỗ trợ tiếng Việt đầy đủ dấu, độ đọc cao trên mọi kích thước màn hình.

---

## 3. Danh sách phòng trà (Bộ sưu tập)

1. **Trúc Ảnh (竹影):** Bàn gỗ óc chó 3.2m, tiểu cảnh bonsai cổ thụ, song gỗ điêu khắc (2 - 8 khách).
2. **Nguyệt Các (月阁):** Vòm cửa nguyệt môn tròn, kệ gốm cổ hoa lam, ánh trăng dịu mát (2 - 6 khách).
3. **Vân Sơn (云山):** Đại sảnh uy nghi bên bức họa sơn thủy khổ lớn và ánh đèn hổ phách (6 - 16 khách).
4. **Minh Đường (明堂):** Salon trà hiện đại ngắm phố phường qua vòm kính cong nghệ thuật (2 - 5 khách).

---

## 4. Công nghệ sử dụng (Tech Stack)

- **Framework:** Next.js 16 (App Router)
- **Giao diện:** React 19, TypeScript 5, Tailwind CSS v4
- **Biểu tượng:** Lucide React
- **Cơ sở dữ liệu:** SQLite (sử dụng thư viện `node:sqlite` tích hợp sẵn trong Node.js, kích hoạt chế độ **WAL mode**)
- **An toàn tương tranh (Concurrency Safety):** Giao dịch `BEGIN IMMEDIATE` khóa ghi cấp độ hàng, kiểm tra khoảng đệm 15 phút giữa các ca đặt phòng, bảo đảm không bao giờ có 2 khách cùng đặt trùng một phòng tại một thời điểm.
- **Âm thanh:** Web Audio API Native Synthesizer (Ngũ cung C-D-E-G-A).

---

## 5. Hướng dẫn cài đặt & Khởi chạy

### Yêu cầu tiên quyết
- Node.js version 22 trở lên (khuyên dùng Node 22+ hoặc 24+)
- Trình quản lý gói `pnpm` (hoặc `npm`)

### Bước 1: Cài đặt thư viện
```bash
pnpm install
```

### Bước 2: Cấu hình biến môi trường
Sao chép tệp cấu hình:
```bash
cp .env.example .env.local
```
Biến môi trường mẫu:
```env
ADMIN_PASSCODE=teaanf2026
PORT=3000
```

### Bước 3: Chạy môi trường phát triển (Development)
```bash
pnpm dev
```
Truy cập tại: `http://localhost:3000`

### Bước 4: Kiểm thử tự động (Test Suite)
Dự án bao gồm 2 bộ kiểm thử tự động toàn diện:

1. **Kiểm thử logic đặt phòng & phòng ngừa xung đột tương tranh:**
```bash
pnpm test
```
2. **Kiểm thử tích hợp End-to-End toàn bộ luồng:**
```bash
pnpm test:e2e
```

### Bước 5: Đóng gói sản xuất (Production Build)
```bash
pnpm build
pnpm start -p 3000
```

---

## 6. Cổng Quản trị viên (Admin Portal)

- **Đường dẫn:** `/admin`
- **Mã PIN truy cập mặc định:** `teaanf2026`
- **Chức năng:**
  - Báo cáo thống kê: Lịch hẹn hôm nay, số đơn chờ duyệt, doanh thu ước tính.
  - Quản lý danh sách đặt phòng với bộ lọc theo ngày, trạng thái (`pending`, `confirmed`, `completed`, `cancelled`) và tìm kiếm từ khoá.
  - Phê duyệt cọc, lưu ghi chú phản hồi cho khách.
  - Điều chỉnh giá thuê phòng theo giờ, giá gói 2 tiếng và sức chứa phòng trực tiếp vào CSDL.
  - Nút nạp lại dữ liệu mẫu (`Reset Demo Data`) tiện lợi cho quá trình thử nghiệm.

---

## 7. Cấu trúc thư mục

```
├── public/
│   └── images/              # Hình ảnh phòng trà, trà cụ, bao bì Lùng Vài
├── data/
│   └── oriental_serenity.db # Cơ sở dữ liệu SQLite (WAL mode)
├── scripts/
│   ├── test-booking.ts      # Kiểm thử CSDL & chống trùng lặp tương tranh
│   └── test-e2e.ts          # Kiểm thử End-to-End qua HTTP
├── src/
│   ├── app/
│   │   ├── page.tsx         # Trang chủ gồm 9 phần mỹ học
│   │   ├── booking/page.tsx # Quy trình đặt phòng 5 bước
│   │   ├── lookup/page.tsx  # Cổng tra cứu trạng thái lịch hẹn
│   │   ├── rooms/[slug]/    # Trang chi tiết phòng & widget đặt phòng dính
│   │   ├── admin/page.tsx   # Bảng điều khiển Quản trị viên bảo mật
│   │   └── api/             # Các API Endpoints
│   ├── components/          # Các thành phần giao diện (Navbar, Hero, Gallery...)
│   └── lib/                 # Database, Cấu hình, Type definitions, Âm thanh
└── README.md
```
