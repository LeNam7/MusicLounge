import { spawnSync } from 'child_process';

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const base = 'C:\\Users\\PC\\.gemini\\antigravity\\brain\\4da2d9b8-2125-460b-a234-43a530cc0193';

function capture(name: string, url: string, width: number, height: number, outPath: string) {
  console.log(`Capturing ${name}...`);
  const res = spawnSync(
    chrome,
    [
      '--headless',
      '--disable-gpu',
      '--virtual-time-budget=4000',
      `--screenshot=${outPath}`,
      `--window-size=${width},${height}`,
      url,
    ],
    { encoding: 'utf-8' }
  );
  if (res.error) console.error('Error capturing', name, res.error);
}

// 1. Homepage Hero with Vietnamese Tea Lounge image & soothing green buttons
capture(
  'Homepage Hero Vietnamese',
  'http://localhost:3000/',
  1440,
  900,
  `${base}\\hero-vietnamese-preview.png`
);

// 2. Mobile pending tab with soothing palette
capture(
  'Mobile Pending (Chờ duyệt - Soothing)',
  'http://localhost:3000/admin?passcode=serenity2026&subtab=pending',
  390,
  1400,
  `${base}\\admin-mobile-cards.png`
);

// 3. Desktop pending tab with soothing palette
capture(
  'Desktop Pending (Soothing)',
  'http://localhost:3000/admin?passcode=serenity2026&subtab=pending',
  1440,
  1100,
  `${base}\\admin-desktop-tabs.png`
);

console.log('All views captured successfully!');
