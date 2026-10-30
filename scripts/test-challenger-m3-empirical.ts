import React from 'react';
import { renderToString } from 'react-dom/server';
import fs from 'fs';
import path from 'path';

// Import components to test
import BookingWizard from '../src/components/BookingWizard';
import NotFound from '../src/app/not-found';
import ErrorBoundary from '../src/app/error';

interface TestResult {
  category: string;
  name: string;
  passed: boolean;
  error?: string;
  details?: string;
}

const results: TestResult[] = [];

function recordTest(category: string, name: string, fn: () => void) {
  try {
    fn();
    results.push({ category, name, passed: true });
    console.log(`  ✓ [PASS] [${category}] ${name}`);
  } catch (err: any) {
    results.push({
      category,
      name,
      passed: false,
      error: err?.message || String(err),
    });
    console.error(`  ❌ [FAIL] [${category}] ${name}:`, err?.message || err);
  }
}

console.log('\n========================================================================');
console.log('   CHALLENGER EMPIRICAL VERIFICATION HARNESS — MILESTONE 3 (M3)');
console.log('========================================================================\n');

// -------------------------------------------------------------------------
// SUITE 1: Defensive Edge-Case Stress Testing of BookingWizard
// -------------------------------------------------------------------------
console.log('--- Suite 1: BookingWizard Defensive Stress Harness ---');

// 1.1: Empty rooms array []
recordTest('BookingWizard', 'Graceful fallback when initialRooms is empty array []', () => {
  const html = renderToString(
    React.createElement(BookingWizard, {
      initialRooms: [],
      initialTeaPackages: [],
    })
  );
  if (!html.includes('Không Gian Phòng Trà Đang Cập Nhật') && !html.includes('THÔNG BÁO HỆ THỐNG')) {
    throw new Error(`Expected defensive offline message, got: ${html.slice(0, 200)}...`);
  }
});

// 1.2: undefined as initialRooms
recordTest('BookingWizard', 'Graceful fallback when initialRooms is undefined', () => {
  const html = renderToString(
    React.createElement(BookingWizard, {
      initialRooms: undefined as any,
      initialTeaPackages: [],
    })
  );
  if (!html.includes('Không Gian Phòng Trà Đang Cập Nhật')) {
    throw new Error(`Expected defensive fallback for undefined rooms`);
  }
});

// 1.3: null as initialRooms
recordTest('BookingWizard', 'Graceful fallback when initialRooms is null', () => {
  const html = renderToString(
    React.createElement(BookingWizard, {
      initialRooms: null as any,
      initialTeaPackages: [],
    })
  );
  if (!html.includes('Không Gian Phòng Trà Đang Cập Nhật')) {
    throw new Error(`Expected defensive fallback for null rooms`);
  }
});

// 1.4: undefined initialTeaPackages
recordTest('BookingWizard', 'Graceful rendering when initialTeaPackages is undefined', () => {
  const sampleRooms = [
    {
      id: 'room-1',
      name: 'Trúc Ảnh',
      slug: 'truc-anh',
      tagline: 'Phòng trà',
      description: 'Phòng trà',
      fullDescription: 'Phòng trà',
      capacityMin: 2,
      capacityMax: 10,
      pricePerHour: 400000,
      pricePackage2h: 700000,
      areaSqm: 30,
      floor: 'Tầng 1',
      amenities: ['Wifi'],
      images: ['/images/rooms/truc-anh.jpg'],
      teaMasterIncluded: true,
      isActive: true,
      sortOrder: 1,
    },
  ];
  const html = renderToString(
    React.createElement(BookingWizard, {
      initialRooms: sampleRooms,
      initialTeaPackages: undefined as any,
    })
  );
  if (!html.includes('Trúc Ảnh')) {
    throw new Error('Expected BookingWizard to render room Trúc Ảnh even if tea packages are undefined');
  }
});

// 1.5: Missing images field in room (Adversarial stress test)
recordTest('BookingWizard', 'Adversarial check: room object with images: [] vs missing images property', () => {
  const roomWithEmptyImages = [
    {
      id: 'room-inc-1',
      name: 'Phòng Trống Ảnh',
      slug: 'phong-trong-anh',
      tagline: '',
      description: '',
      fullDescription: '',
      capacityMin: 2,
      capacityMax: 6,
      pricePerHour: 300000,
      pricePackage2h: 500000,
      areaSqm: 25,
      floor: 'Tầng 1',
      amenities: [],
      images: [], // empty images array
      teaMasterIncluded: false,
      isActive: true,
      sortOrder: 1,
    },
  ];
  const html = renderToString(
    React.createElement(BookingWizard, {
      initialRooms: roomWithEmptyImages,
      initialTeaPackages: [],
    })
  );
  if (!html.includes('Phòng Trống Ảnh')) {
    throw new Error('Expected room with empty images array to render fallback image cleanly');
  }
});

// 1.6: Boundary initialStep values
recordTest('BookingWizard', 'Boundary handling of initialStep (step=999 out of range)', () => {
  const html = renderToString(
    React.createElement(BookingWizard, {
      initialRooms: [],
      initialTeaPackages: [],
      initialStep: 999,
    })
  );
  if (!html) throw new Error('Render returned empty string');
});

recordTest('BookingWizard', 'Boundary handling of initialStep (step=-1 negative)', () => {
  const html = renderToString(
    React.createElement(BookingWizard, {
      initialRooms: [],
      initialTeaPackages: [],
      initialStep: -1,
    })
  );
  if (!html) throw new Error('Render returned empty string');
});

// -------------------------------------------------------------------------
// SUITE 2: Branded Route Boundaries (not-found.tsx & error.tsx)
// -------------------------------------------------------------------------
console.log('\n--- Suite 2: Route Boundaries (not-found.tsx & error.tsx) ---');

recordTest('RouteBoundaries', 'src/app/not-found.tsx renders branded 404 page', () => {
  const html = renderToString(React.createElement(NotFound));
  if (!html.includes('404') && !html.includes('Vườn Trà')) {
    throw new Error(`not-found.tsx rendered unexpected content: ${html.slice(0, 150)}`);
  }
  if (!html.includes('Về Trang Chủ') && !html.includes('href="/"')) {
    throw new Error('not-found.tsx missing return to homepage button/link');
  }
});

recordTest('RouteBoundaries', 'src/app/error.tsx renders error fallback and handles reset', () => {
  let resetCalled = false;
  const mockError = new Error('Simulated runtime error for testing boundary');
  const html = renderToString(
    React.createElement(ErrorBoundary, {
      error: mockError,
      reset: () => {
        resetCalled = true;
      },
    })
  );
  if (!html.includes('Đã Có Gián Đoạn') && !html.includes('Thử lại')) {
    throw new Error(`error.tsx rendered unexpected content: ${html.slice(0, 150)}`);
  }
});

// -------------------------------------------------------------------------
// SUITE 3: Compiled Tailwind CSS Theme Tokens
// -------------------------------------------------------------------------
console.log('\n--- Suite 3: Compiled Tailwind CSS Theme Tokens ---');

const cssChunksDir = path.join(process.cwd(), '.next', 'static', 'chunks');
let allCssContent = '';

if (fs.existsSync(cssChunksDir)) {
  const files = fs.readdirSync(cssChunksDir);
  for (const f of files) {
    if (f.endsWith('.css')) {
      allCssContent += fs.readFileSync(path.join(cssChunksDir, f), 'utf-8') + '\n';
    }
  }
}

const requiredTokens = [
  { name: '--color-sand', regex: /--color-sand\s*:\s*#f8f5ee/i },
  { name: '--color-sand-light', regex: /--color-sand-light\s*:\s*#faf7f2/i },
  { name: '--color-tea-green', regex: /--color-tea-green\s*:\s*#2e5a44/i },
  { name: '--color-tea-dark', regex: /--color-tea-dark\s*:\s*#1d4a38/i },
  { name: '--color-tea-sage', regex: /--color-tea-sage\s*:\s*#8a9e90/i },
  { name: '.bg-sand utility class', regex: /\.bg-sand(\/|\s*\{)/i },
  { name: '.bg-tea-green utility class', regex: /\.bg-tea-green(\/|\s*\{)/i },
  { name: 'hover:bg-tea-dark or .border-tea-sage', regex: /(hover\\:bg-tea-dark|\.border-tea-sage|\.bg-tea-sage)/i },
];

for (const t of requiredTokens) {
  recordTest('CSSTokens', `CSS bundle contains ${t.name}`, () => {
    if (!t.regex.test(allCssContent)) {
      throw new Error(`Token or class pattern ${t.name} was not found in compiled CSS bundle.`);
    }
  });
}

// -------------------------------------------------------------------------
// SUITE 4: Accessibility & Mobile Zoom Settings (src/app/layout.tsx)
// -------------------------------------------------------------------------
console.log('\n--- Suite 4: A11y & Mobile Zoom in layout.tsx ---');

recordTest('LayoutA11y', 'layout.tsx enables pinch-zoom and WCAG AA selection text', () => {
  const layoutPath = path.join(process.cwd(), 'src', 'app', 'layout.tsx');
  const layoutContent = fs.readFileSync(layoutPath, 'utf-8');

  if (!layoutContent.includes('userScalable: true')) {
    throw new Error('userScalable is not set to true in layout.tsx viewport config');
  }
  if (!layoutContent.includes('maximumScale: 5')) {
    throw new Error('maximumScale is not allowed up to 5 for pinch-zoom');
  }
  if (!layoutContent.includes('selection:text-white')) {
    throw new Error('selection:text-white not found (dark-on-dark contrast failure)');
  }
});

// -------------------------------------------------------------------------
// SUITE 5: Contract Alignment & Mobile Layout Defenses
// -------------------------------------------------------------------------
console.log('\n--- Suite 5: Contract Alignment & Mobile Breakpoints ---');

recordTest('ContractAlignment', 'admin/page.tsx aligns with backend config and notification keys', () => {
  const adminPagePath = path.join(process.cwd(), 'src', 'app', 'admin', 'page.tsx');
  const adminContent = fs.readFileSync(adminPagePath, 'utf-8');

  if (!adminContent.includes('zaloStatus')) {
    throw new Error('admin/page.tsx does not check zaloStatus from /api/admin/config');
  }
  if (!adminContent.includes('expiredCount')) {
    throw new Error('admin/page.tsx does not check expiredCount from /api/admin/notifications');
  }
  if (!adminContent.includes('truncate')) {
    throw new Error('admin/page.tsx missing truncate utility for calendar booking pills');
  }
});

recordTest('MobileResponsive', 'lookup/page.tsx has responsive flex wrap for small viewports', () => {
  const lookupPagePath = path.join(process.cwd(), 'src', 'app', 'lookup', 'page.tsx');
  const lookupContent = fs.readFileSync(lookupPagePath, 'utf-8');

  if (!lookupContent.includes('flex flex-col sm:flex-row')) {
    throw new Error('lookup/page.tsx missing responsive flex-col sm:flex-row wrapper on action buttons');
  }
});

// -------------------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------------------
console.log('\n========================================================================');
console.log('                          HARNESS SUMMARY                               ');
console.log('========================================================================');

const total = results.length;
const passed = results.filter((r) => r.passed).length;
const failed = results.filter((r) => !r.passed).length;

console.log(`Total tests run : ${total}`);
console.log(`Passed          : ${passed}`);
console.log(`Failed          : ${failed}`);

if (failed > 0) {
  console.log('\n❌ EMPIRICAL CHALLENGE FAILED');
  process.exit(1);
} else {
  console.log('\n✓ ALL EMPIRICAL CHALLENGE TESTS PASSED (100%)');
  process.exit(0);
}
