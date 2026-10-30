import fs from 'node:fs';
import path from 'node:path';

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function assert(name: string, condition: boolean, details: string) {
  results.push({
    name,
    passed: condition,
    details,
  });
  console.log(`${condition ? '✓ [PASS]' : '✗ [FAIL]'} ${name}: ${details}`);
}

// 1. Tailwind CSS v4 Theme Tokens in src/app/globals.css
const globalsCssPath = path.resolve('src/app/globals.css');
const globalsCss = fs.readFileSync(globalsCssPath, 'utf-8');

const requiredTokens = [
  { token: '--color-sand', expected: '#F8F5EE' },
  { token: '--color-sand-light', expected: '#FAF7F2' },
  { token: '--color-tea-green', expected: '#2E5A44' },
  { token: '--color-tea-dark', expected: '#1D4A38' },
  { token: '--color-tea-sage', expected: '#8A9E90' },
];

for (const { token, expected } of requiredTokens) {
  const pattern = new RegExp(`${token}:\\s*${expected}`, 'i');
  assert(
    `Tailwind Token ${token}`,
    pattern.test(globalsCss),
    `Found token ${token}: ${expected} inside globals.css @theme block`
  );
}

// 2. WCAG Contrast Calculation for Selection Color
function sRgbToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return 0.2126 * sRgbToLinear(r) + 0.7152 * sRgbToLinear(g) + 0.0722 * sRgbToLinear(b);
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const whiteLuminance = relativeLuminance('#FFFFFF');
const vermilionLuminance = relativeLuminance('#1D4A38');
const ratio = contrastRatio('#FFFFFF', '#1D4A38');

assert(
  'Selection Contrast WCAG AA (>= 4.5:1)',
  ratio >= 4.5,
  `White on #1D4A38 contrast ratio is ${ratio.toFixed(2)}:1 (threshold 4.5:1)`
);

assert(
  'Selection Contrast WCAG AAA (>= 7.0:1)',
  ratio >= 7.0,
  `White on #1D4A38 contrast ratio is ${ratio.toFixed(2)}:1 (threshold 7.0:1)`
);

// 3. Viewport and Selection in src/app/layout.tsx
const layoutPath = path.resolve('src/app/layout.tsx');
const layoutContent = fs.readFileSync(layoutPath, 'utf-8');

assert(
  'Layout Viewport userScalable',
  /userScalable:\s*true/.test(layoutContent),
  'userScalable is set to true'
);

assert(
  'Layout Viewport maximumScale',
  /maximumScale:\s*5/.test(layoutContent),
  'maximumScale is set to 5'
);

assert(
  'Layout Selection Classnames',
  /selection:bg-vermilion\s+selection:text-white/.test(layoutContent),
  'selection:bg-vermilion and selection:text-white classes applied to body'
);

// 4. Route Boundaries
const notFoundPath = path.resolve('src/app/not-found.tsx');
assert('NotFound boundary exists', fs.existsSync(notFoundPath), notFoundPath);
const notFoundContent = fs.readFileSync(notFoundPath, 'utf-8');
assert(
  'NotFound has brand layout and navigation',
  notFoundContent.includes('Navbar') &&
    notFoundContent.includes('Footer') &&
    notFoundContent.includes('href="/"') &&
    notFoundContent.includes('href="/booking"'),
  'NotFound includes Navbar, Footer, and links to / and /booking'
);

const errorPath = path.resolve('src/app/error.tsx');
assert('Error boundary exists', fs.existsSync(errorPath), errorPath);
const errorContent = fs.readFileSync(errorPath, 'utf-8');
assert(
  'Error boundary has client directive',
  errorContent.includes("'use client'"),
  "error.tsx starts with 'use client'"
);
assert(
  'Error boundary exposes reset handler and home link',
  errorContent.includes('reset: () => void') &&
    errorContent.includes('reset()') &&
    errorContent.includes('href="/"'),
  'error.tsx accepts reset handler and provides retry button and home link'
);

// 5. Mobile Responsive Layout in lookup and admin
const lookupPath = path.resolve('src/app/lookup/page.tsx');
const lookupContent = fs.readFileSync(lookupPath, 'utf-8');
assert(
  'Lookup action bar responsive flex',
  lookupContent.includes('flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2'),
  'lookup page action bar wraps gracefully into flex-col on mobile screens (< 390px)'
);

const adminPath = path.resolve('src/app/admin/page.tsx');
const adminContent = fs.readFileSync(adminPath, 'utf-8');
assert(
  'Admin calendar booking reference truncation',
  adminContent.includes('truncate max-w-full inline-block'),
  'admin calendar slot applies truncate max-w-full inline-block to bookingReference'
);

assert(
  'Admin JSX unescaped quote fix',
  adminContent.includes('&ldquo;{b.specialRequests}&rdquo;'),
  'admin specialRequests uses HTML entities &ldquo; and &rdquo;'
);

assert(
  'Admin contract alignment: zaloStatus fallback',
  adminContent.includes('setZaloStatus(cfgData.data.zaloStatus || cfgData.data.zaloConfig || null)'),
  'admin page aligns with backend zaloStatus field'
);

assert(
  'Admin contract alignment: expiredCount fallback',
  adminContent.includes('data.data.expiredCount ?? data.data.expiredBookingsCount ?? 0'),
  'admin page aligns with backend expiredCount field'
);

// 6. BookingWizard Defensive Guard
const wizardPath = path.resolve('src/components/BookingWizard.tsx');
const wizardContent = fs.readFileSync(wizardPath, 'utf-8');
assert(
  'BookingWizard safeRooms array guard',
  wizardContent.includes('const safeRooms = Array.isArray(initialRooms) ? initialRooms : [];'),
  'safeRooms normalizes initialRooms input'
);
assert(
  'BookingWizard empty rooms defensive return',
  wizardContent.includes('if (safeRooms.length === 0)'),
  'BookingWizard checks safeRooms.length === 0 and returns maintenance card instead of crashing'
);

// Summary
const total = results.length;
const passed = results.filter((r) => r.passed).length;
const failed = total - passed;

console.log('\n========================================');
console.log(`Milestone 3 Challenger Verification: ${passed}/${total} checks passed (${failed} failed)`);
console.log('========================================');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
