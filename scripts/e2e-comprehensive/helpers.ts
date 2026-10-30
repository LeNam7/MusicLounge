import { HttpResponse } from './types';

export const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

let ipCounter = 1;
export function generateTestIp(): string {
  const ip = `10.42.${Math.floor(ipCounter / 250) % 250}.${(ipCounter % 250) + 1}`;
  ipCounter++;
  return ip;
}

export async function fetchHttp<T = any>(
  url: string,
  init?: RequestInit
): Promise<HttpResponse<T>> {
  const start = Date.now();
  const testIp = generateTestIp();
  const mergedHeaders = new Headers(init?.headers || {});
  if (!mergedHeaders.has('x-forwarded-for')) {
    mergedHeaders.set('x-forwarded-for', testIp);
  }

  const res = await fetch(url, {
    ...init,
    headers: mergedHeaders,
  });

  const durationMs = Date.now() - start;
  const rawText = await res.text();
  let data: any = null;
  try {
    data = JSON.parse(rawText);
  } catch {
    data = null;
  }

  return {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
    data: data as T,
    rawText,
    durationMs,
  };
}

export function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message} — Expected [${expected}], got [${actual}]`);
  }
}

export function assertIncludes(actual: string, expectedSub: string, message: string): void {
  if (!actual.includes(expectedSub)) {
    throw new Error(`${message} — String does not contain expected substring [${expectedSub}]`);
  }
}

export function getFutureDate(daysAhead: number = 30): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function generateRandomPhone(): string {
  const prefix = '098';
  const suffix = Math.floor(1000000 + Math.random() * 9000000).toString().slice(0, 7);
  return `${prefix}${suffix}`;
}

export async function resetDatabase(
  baseUrl: string,
  passcode: string = 'teaanf2026'
): Promise<boolean> {
  const res = await fetchHttp(`${baseUrl}/api/admin/reset`, {
    method: 'POST',
    headers: {
      'x-admin-passcode': passcode,
    },
  });
  return res.status === 200 && res.data?.success === true;
}

export async function getAdminSessionCookie(
  baseUrl: string,
  passcode: string = 'teaanf2026'
): Promise<string> {
  const res = await fetchHttp(`${baseUrl}/api/admin/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passcode }),
  });

  if (res.status !== 200) {
    throw new Error(`Failed to authenticate admin: HTTP ${res.status} (${res.rawText})`);
  }

  const setCookie = res.headers.get('set-cookie');
  if (!setCookie || !setCookie.includes('lvt_admin_session=')) {
    throw new Error('Admin session cookie (lvt_admin_session) was not returned by /api/admin/auth');
  }

  return setCookie.split(';')[0];
}

export async function createTestBooking(
  baseUrl: string,
  overrides?: Partial<any>
): Promise<{ status: number; data: any; bookingReference: string; id: string }> {
  const date = overrides?.date || getFutureDate(15);
  const payload = {
    roomId: overrides?.roomId || 'room-1',
    customerName: overrides?.customerName || 'Khách Thử Nghiệm',
    customerPhone: overrides?.customerPhone || generateRandomPhone(),
    customerEmail: overrides?.customerEmail || 'tester@lungvai.vn',
    date,
    startTime: overrides?.startTime || '10:00',
    durationHours: overrides?.durationHours || 2,
    guestCount: overrides?.guestCount || 4,
    teaPackageId: overrides?.teaPackageId || 'tea-lung-vai',
    specialRequests: overrides?.specialRequests || 'Yêu cầu kiểm thử tự động',
    idempotencyKey: overrides?.idempotencyKey || `idem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ...overrides,
  };

  const res = await fetchHttp(`${baseUrl}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return {
    status: res.status,
    data: res.data,
    bookingReference: res.data?.data?.bookingReference || '',
    id: res.data?.data?.id || '',
  };
}
