import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const files = [
  'tea-lounge-hero-bright.jpg',
  'hero-tea-ceremony.png',
  'room-van-son.jpg',
  'courtyard-twilight.jpg',
  'actual-tea-lounge-composite.jpg',
  'tea-ceremony-closeup.jpg'
];

let html = `<!DOCTYPE html><html><body style="background:#111;color:#fff;font-family:sans-serif;padding:20px;"><h1>Existing Images Gallery</h1><div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">`;

files.forEach(f => {
  const p = path.join(process.cwd(), 'public', 'images', f);
  if (fs.existsSync(p)) {
    const b64 = fs.readFileSync(p).toString('base64');
    const ext = f.endsWith('.png') ? 'png' : 'jpeg';
    html += `<div><h3>${f}</h3><img src="data:image/${ext};base64,${b64}" style="width:100%;height:300px;object-fit:cover;border-radius:8px;"/></div>`;
  }
});

html += `</div></body></html>`;

const tmp = path.join(process.cwd(), '.tmp-gallery.html');
fs.writeFileSync(tmp, html);
const out = 'C:\\Users\\PC\\.gemini\\antigravity\\brain\\4da2d9b8-2125-460b-a234-43a530cc0193\\gallery-check.png';
execSync(`"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --headless --screenshot="${out}" --window-size=1200,1000 "${tmp}"`);
fs.unlinkSync(tmp);
console.log('Gallery rendered to:', out);
