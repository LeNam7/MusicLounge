import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

// Read source transparent vermilion logo
const srcPath = path.resolve('public/images/logo-lung-vai-transparent.png');
const srcBuf = fs.readFileSync(srcPath);
const srcPng = PNG.sync.read(srcBuf);

/**
 * High quality downsampling using area averaging
 */
function createSquareIcon(targetSize: number, boostAlpha: boolean = false): PNG {
  const dest = new PNG({ width: targetSize, height: targetSize });
  
  // Clear dest buffer to 0 (fully transparent)
  dest.data.fill(0);

  // Target seal dimensions inside the square (fill 92% of height)
  const padPercent = targetSize <= 32 ? 0.04 : 0.06;
  const sealH = Math.round(targetSize * (1 - padPercent * 2));
  const sealW = Math.round(sealH * (srcPng.width / srcPng.height));
  const offsetX = Math.floor((targetSize - sealW) / 2);
  const offsetY = Math.floor((targetSize - sealH) / 2);

  // Mapping ratios from target seal to source image
  const scaleX = srcPng.width / sealW;
  const scaleY = srcPng.height / sealH;

  for (let dy = 0; dy < sealH; dy++) {
    for (let dx = 0; dx < sealW; dx++) {
      const destX = offsetX + dx;
      const destY = offsetY + dy;

      if (destX < 0 || destX >= targetSize || destY < 0 || destY >= targetSize) continue;

      // Area in source coordinates
      const srcXStart = dx * scaleX;
      const srcXEnd = (dx + 1) * scaleX;
      const srcYStart = dy * scaleY;
      const srcYEnd = (dy + 1) * scaleY;

      let totalWeight = 0;
      let accR = 0;
      let accG = 0;
      let accB = 0;
      let accA = 0;

      const y0 = Math.floor(srcYStart);
      const y1 = Math.min(srcPng.height - 1, Math.floor(srcYEnd));
      const x0 = Math.floor(srcXStart);
      const x1 = Math.min(srcPng.width - 1, Math.floor(srcXEnd));

      for (let sy = y0; sy <= y1; sy++) {
        const yWeight = Math.min(sy + 1, srcYEnd) - Math.max(sy, srcYStart);
        if (yWeight <= 0) continue;

        for (let sx = x0; sx <= x1; sx++) {
          const xWeight = Math.min(sx + 1, srcXEnd) - Math.max(sx, srcXStart);
          if (xWeight <= 0) continue;

          const weight = xWeight * yWeight;
          const srcIdx = (srcPng.width * sy + sx) << 2;

          const r = srcPng.data[srcIdx];
          const g = srcPng.data[srcIdx + 1];
          const b = srcPng.data[srcIdx + 2];
          const a = srcPng.data[srcIdx + 3];

          accR += r * weight;
          accG += g * weight;
          accB += b * weight;
          accA += a * weight;
          totalWeight += weight;
        }
      }

      if (totalWeight > 0) {
        let finalA = accA / totalWeight;
        if (boostAlpha && finalA > 15) {
          // Boost alpha for small icons so the seal is crisp and solid on browser tabs
          finalA = Math.min(255, Math.pow(finalA / 255, 0.7) * 255 * 1.15);
        }

        const destIdx = (targetSize * destY + destX) << 2;
        dest.data[destIdx] = Math.min(255, Math.round(accR / totalWeight * 1.08));     // rich vermilion
        dest.data[destIdx + 1] = Math.max(0, Math.round(accG / totalWeight * 0.95));
        dest.data[destIdx + 2] = Math.max(0, Math.round(accB / totalWeight * 0.95));
        dest.data[destIdx + 3] = Math.min(255, Math.round(finalA));
      }
    }
  }

  return dest;
}

/**
 * Pack multiple PNG buffers into a single ICO container
 */
function packIco(pngBuffers: { size: number; buffer: Buffer }[]): Buffer {
  const numImages = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = headerSize + numImages * dirEntrySize;

  let totalSize = dirSize;
  for (const item of pngBuffers) {
    totalSize += item.buffer.length;
  }

  const ico = Buffer.alloc(totalSize);

  // ICONDIR Header
  ico.writeUInt16LE(0, 0);          // Reserved
  ico.writeUInt16LE(1, 2);          // Type 1 = Icon
  ico.writeUInt16LE(numImages, 4);  // Image count

  let currentOffset = dirSize;

  // ICONDIRENTRY for each image
  for (let i = 0; i < numImages; i++) {
    const item = pngBuffers[i];
    const entryOffset = headerSize + i * dirEntrySize;

    ico.writeUInt8(item.size >= 256 ? 0 : item.size, entryOffset);     // Width
    ico.writeUInt8(item.size >= 256 ? 0 : item.size, entryOffset + 1); // Height
    ico.writeUInt8(0, entryOffset + 2);                                 // Color count (0 = >=8bpp)
    ico.writeUInt8(0, entryOffset + 3);                                 // Reserved
    ico.writeUInt16LE(1, entryOffset + 4);                              // Color planes
    ico.writeUInt16LE(32, entryOffset + 6);                             // Bits per pixel
    ico.writeUInt32LE(item.buffer.length, entryOffset + 8);             // Size of image data
    ico.writeUInt32LE(currentOffset, entryOffset + 12);                 // Offset to image data

    item.buffer.copy(ico, currentOffset);
    currentOffset += item.buffer.length;
  }

  return ico;
}

// Generate the sizes needed
console.log('Generating high-resolution and multi-size icons...');

const sizes = [16, 32, 48, 64, 180, 192, 512];
const generatedBuffers = new Map<number, Buffer>();

for (const size of sizes) {
  const isSmall = size <= 64;
  const png = createSquareIcon(size, isSmall);
  const buf = PNG.sync.write(png);
  generatedBuffers.set(size, buf);
  console.log(`✓ Generated ${size}x${size} PNG (${buf.length} bytes)`);
}

// Write PNG files to src/app and public
fs.writeFileSync('src/app/icon.png', generatedBuffers.get(512)!);
fs.writeFileSync('src/app/apple-icon.png', generatedBuffers.get(180)!);
fs.writeFileSync('public/icon.png', generatedBuffers.get(512)!);
fs.writeFileSync('public/icon-32x32.png', generatedBuffers.get(32)!);
fs.writeFileSync('public/icon-192x192.png', generatedBuffers.get(192)!);
fs.writeFileSync('public/icon-512x512.png', generatedBuffers.get(512)!);
fs.writeFileSync('public/apple-icon.png', generatedBuffers.get(180)!);

// Generate multi-size ICO with 16, 32, 48, 64
const icoBuffers = [
  { size: 16, buffer: generatedBuffers.get(16)! },
  { size: 32, buffer: generatedBuffers.get(32)! },
  { size: 48, buffer: generatedBuffers.get(48)! },
  { size: 64, buffer: generatedBuffers.get(64)! },
];

const icoData = packIco(icoBuffers);
fs.writeFileSync('src/app/favicon.ico', icoData);
fs.writeFileSync('public/favicon.ico', icoData);

console.log(`✓ Successfully created src/app/favicon.ico and public/favicon.ico (${icoData.length} bytes, 4 sizes)`);
console.log('✓ Successfully created app icons (icon.png, apple-icon.png)');
