import fs from 'node:fs';
import { PNG } from 'pngjs';

const inputPath = 'public/images/logo-lung-vai.png';
const buffer = fs.readFileSync(inputPath);
const srcPng = PNG.sync.read(buffer);

// 1. Find tight bounding box of ink
let minX = srcPng.width;
let minY = srcPng.height;
let maxX = 0;
let maxY = 0;

for (let y = 0; y < srcPng.height; y++) {
  for (let x = 0; x < srcPng.width; x++) {
    const idx = (srcPng.width * y + x) << 2;
    const r = srcPng.data[idx];
    const g = srcPng.data[idx + 1];
    const b = srcPng.data[idx + 2];
    const brightness = (r + g + b) / 3;

    if (brightness < 240) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}

// Add 16px aesthetic padding around the ink
const padding = 16;
const cropX = Math.max(0, minX - padding);
const cropY = Math.max(0, minY - padding);
const cropW = Math.min(srcPng.width - cropX, (maxX - minX) + padding * 2);
const cropH = Math.min(srcPng.height - cropY, (maxY - minY) + padding * 2);

console.log(`Cropping ink from (${cropX}, ${cropY}) with size ${cropW} x ${cropH}`);

// 2. Generate tight transparent vermilion logo
const vermilionPng = new PNG({ width: cropW, height: cropH });

for (let y = 0; y < cropH; y++) {
  for (let x = 0; x < cropW; x++) {
    const srcX = cropX + x;
    const srcY = cropY + y;
    const srcIdx = (srcPng.width * srcY + srcX) << 2;
    const destIdx = (cropW * y + x) << 2;

    const r = srcPng.data[srcIdx];
    const g = srcPng.data[srcIdx + 1];
    const b = srcPng.data[srcIdx + 2];
    const brightness = (r + g + b) / 3;

    // Smooth transparency curve: background white (>245) becomes 0 alpha
    let alpha = 0;
    if (brightness < 245) {
      alpha = Math.min(255, Math.max(0, Math.round((255 - brightness) * 1.6)));
    }

    // Enhance vermilion richness slightly for high-end dark mode contrast
    vermilionPng.data[destIdx] = Math.min(255, Math.round(r * 1.05));
    vermilionPng.data[destIdx + 1] = Math.max(0, Math.round(g * 0.9));
    vermilionPng.data[destIdx + 2] = Math.max(0, Math.round(b * 0.9));
    vermilionPng.data[destIdx + 3] = alpha;
  }
}

fs.writeFileSync('public/images/logo-lung-vai-transparent.png', PNG.sync.write(vermilionPng));
console.log('✓ Đã tạo public/images/logo-lung-vai-transparent.png (cắt sát viền, không thừa lề trắng)');

// 3. Generate tight gold / brass version
const goldPng = new PNG({ width: cropW, height: cropH });
for (let y = 0; y < cropH; y++) {
  for (let x = 0; x < cropW; x++) {
    const srcX = cropX + x;
    const srcY = cropY + y;
    const srcIdx = (srcPng.width * srcY + srcX) << 2;
    const destIdx = (cropW * y + x) << 2;

    const r = srcPng.data[srcIdx];
    const g = srcPng.data[srcIdx + 1];
    const b = srcPng.data[srcIdx + 2];
    const brightness = (r + g + b) / 3;

    let alpha = 0;
    if (brightness < 245) {
      alpha = Math.min(255, Math.max(0, Math.round((255 - brightness) * 1.6)));
    }

    goldPng.data[destIdx] = 198;     // Rich Brass/Gold
    goldPng.data[destIdx + 1] = 168; //
    goldPng.data[destIdx + 2] = 115; //
    goldPng.data[destIdx + 3] = alpha;
  }
}

fs.writeFileSync('public/images/logo-lung-vai-gold.png', PNG.sync.write(goldPng));
console.log('✓ Đã tạo public/images/logo-lung-vai-gold.png thành công');
