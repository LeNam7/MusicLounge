#!/usr/bin/env bash
set -e

echo "🍵 [LÙNG VÀI TEA] Bắt đầu quy trình triển khai máy chủ chuẩn hoá..."

# 1. Kéo code mới nhất
echo "📦 1. Kéo mã nguồn mới nhất từ GitHub..."
git pull origin main

# 2. Cài đặt dependencies
echo "📦 2. Cài đặt dependencies..."
pnpm install

# 3. Dọn sạch cache cũ tránh xung đột hash CSS/JS
echo "🧹 3. Dọn sạch thư mục .next cũ..."
rm -rf .next

# 4. Build sản phẩm
echo "🚀 4. Biên dịch Next.js Production Build..."
pnpm build

# 5. Phân quyền chuẩn tránh lỗi 500 Nginx/Node
echo "🔒 5. Thiết lập quyền truy cập tệp 755..."
chmod -R 755 .next

# 6. Khởi động lại dịch vụ
echo "🔄 6. Khởi động lại dịch vụ PM2..."
pm2 restart all || echo "Vui lòng restart dịch vụ node"

echo "✨ [HOÀN TẤT] Triển khai thành công! Hãy kiểm tra website tại https://tea.anf-technology.com"
