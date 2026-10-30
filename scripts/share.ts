import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

async function waitForServer(port: number, timeoutMs = 20000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await new Promise<void>((resolve, reject) => {
        const req = http.get(`http://localhost:${port}/api/rooms`, (res) => {
          if (res.statusCode && res.statusCode < 500) resolve();
          else reject(new Error(`Status ${res.statusCode}`));
        });
        req.on('error', reject);
        req.setTimeout(1000, () => req.destroy());
      });
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 600));
    }
  }
  return false;
}

async function main() {
  console.log('🍵 [LÙNG VÀI TEA] Đang khởi động máy chủ và tạo đường link công khai...');

  // Start Next.js server if not running
  const isRunning = await waitForServer(3000, 1500);
  let nextProcess = null;

  if (!isRunning) {
    console.log('🚀 Khởi động Next.js Production Server trên port 3000...');
    nextProcess = spawn('cmd.exe', ['/c', 'pnpm', 'start'], {
      stdio: 'inherit',
      env: process.env,
    });

    const ready = await waitForServer(3000, 20000);
    if (!ready) {
      console.error('❌ Không thể khởi động Next.js server trên port 3000.');
      process.exit(1);
    }
  }

  console.log('⚡ Đang kết nối đường hầm bảo mật Cloudflare HTTPS...');

  const cfExe = path.join(process.cwd(), 'cloudflared.exe');
  const tunnelProcess = fs.existsSync(cfExe)
    ? spawn(cfExe, ['tunnel', '--url', 'http://localhost:3000'], {
        stdio: ['ignore', 'pipe', 'pipe'],
      })
    : spawn('cmd.exe', ['/c', 'pnpm', 'dlx', 'untun', 'tunnel', 'http://localhost:3000'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: process.env,
      });

  let tunnelUrl = '';

  const handleData = (data: Buffer) => {
    const text = data.toString();
    const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    if (match && !tunnelUrl) {
      tunnelUrl = match[0];
      const installUrl = `${tunnelUrl}/install`;
      const adminUrl = `${tunnelUrl}/admin`;
      const bookingUrl = `${tunnelUrl}/booking`;
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        installUrl
      )}`;

      console.log('\n============================================================');
      console.log('✨ ĐƯỜNG DẪN CÔNG KHAI ĐÃ SẴN SÀNG CHO ĐIỆN THOẠI & WEB! ✨');
      console.log('============================================================\n');
      console.log('📲 LINK CÀI ĐẶT APP CHO ĐIỆN THOẠI (1 Chạm là cài):');
      console.log(`   👉 ${installUrl}\n`);
      console.log('📱 LINK TRUY CẬP TRỰC TIẾP TRANG QUẢN TRỊ (/admin):');
      console.log(`   👉 ${adminUrl}\n`);
      console.log('🔑 MÃ PIN ĐĂNG NHẬP QUẢN TRỊ:');
      console.log('   👉 teaanf2026\n');
      console.log('🌐 LINK WEBSITE CHO KHÁCH ĐẶT LỊCH:');
      console.log(`   👉 ${bookingUrl}\n`);
      console.log('============================================================');
      console.log('Mở link trên bằng điện thoại và bấm "Cài đặt App" để thêm ra màn hình chính.');
      console.log('Nhấn Ctrl+C để dừng chia sẻ.\n');
    }
  };

  tunnelProcess.stdout?.on('data', handleData);
  tunnelProcess.stderr?.on('data', handleData);

  const cleanup = () => {
    console.log('\nĐang đóng các tiến trình...');
    tunnelProcess.kill();
    if (nextProcess) nextProcess.kill();
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

main().catch(console.error);
