import fs from 'node:fs';
import { PNG } from 'pngjs';

const inputPath = 'public/images/logo-lung-vai.png';
const buffer = fs.readFileSync(inputPath);
const png = PNG.sync.read(buffer);

// 1. Create transparent vermilion logo (keep red ink, make white background transparent)
const vermilionPng = new PNG({ width: png.width, height: png.height });
for (let y = 0; y < png.height; y++) {
  for (let x = 0; x < png.width; x++) {
    const idx = (png.width * y + x) << 2;
    const r = png.data[idx];
    const g = png.data[idx + 1];
    const b = png.data[idx + 2];
    
    // Calculate how close to white (background) this pixel is
    // The ink is dark red (R~120-160, G~20-50, B~25-50)
    // The background is pure white (R~255, G~255, B~255)
    const brightness = (r + g + b) / 3;
    
    // Invert brightness to get opacity: dark ink -> high opacity, bright white -> transparent
    // Smooth thresholding
    let alpha = 0;
    if (brightness < 245) {
      alpha = Math.min(255, Math.max(0, Math.round((255 - brightness) * 1.5)));
    }

    vermilionPng.data[idx] = r;
    vermilionPng.data[idx + 1] = g;
    vermilionPng.data[idx + 2] = b;
    vermilionPng.data[idx + 3] = alpha;
  }
}

fs.writeFileSync('public/images/logo-lung-vai-transparent.png', PNG.sync.write(vermilionPng));
console.log('✓ Đã tạo public/images/logo-lung-vai-transparent.png thành công');

// 2. Also create an antique brass / gold version for dark luxury accent
const goldPng = new PNG({ width: png.width, height: png.height });
for (let y = 0; y < png.height; y++) {
  for (let x = 0; x < png.width; x++) {
    const idx = (png.width * y + x) << 2;
    const r = png.data[idx];
    const g = png.data[idx + 1];
    const b = png.data[idx + 2];
    const brightness = (r + g + b) / 3;

    let alpha = 0;
    if (brightness < 245) {
      alpha = Math.min(255, Math.max(0, Math.round((255 - brightness) * 1.5)));
    }

    // Antique Brass color #B69A6A (182, 154, 106)
    goldPng.data[idx] = 182;
    goldPng.data[idx + 1] = 154;
    goldPng.data[idx + 2] = 106;
    goldPng.data[idx + 3] = alpha;
  }
}

fs.writeFileSync('public/images/logo-lung-vai-gold.png', PNG.sync.write(goldPng));
console.log('✓ Đã tạo public/images/logo-lung-vai-gold.png thành công');
