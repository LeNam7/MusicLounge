import { execSync } from 'child_process';
import fs from 'fs';

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const out = 'C:\\Users\\PC\\.gemini\\antigravity\\brain\\4da2d9b8-2125-460b-a234-43a530cc0193\\new-hero-preview.png';

execSync(`"${chrome}" --headless --disable-gpu --virtual-time-budget=4000 --screenshot="${out}" --window-size=1440,900 http://localhost:3000`);
console.log('Result exists:', fs.existsSync(out), 'Size:', fs.existsSync(out) ? fs.statSync(out).size : 0);
