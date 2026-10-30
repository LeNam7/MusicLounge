import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'teaanf2026';
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || `lvt-secret-${ADMIN_PASSCODE}-2026`;
export const ADMIN_COOKIE_NAME = 'lvt_admin_session';

export function getAdminPasscode(): string {
  return process.env.ADMIN_PASSCODE || 'teaanf2026';
}

export function createAdminSessionToken(actor: string = 'admin', ttlHours: number = 24): string {
  const exp = Date.now() + ttlHours * 3600 * 1000;
  const payload = JSON.stringify({ actor, exp });
  const payloadB64 = Buffer.from(payload, 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');
  return `${payloadB64}.${sig}`;
}

export function verifyAdminSessionToken(token: string): { valid: boolean; actor?: string } {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return { valid: false };
    const [payloadB64, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');

    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return { valid: false };
    }

    const decoded = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!decoded.exp || Date.now() > decoded.exp) {
      return { valid: false };
    }

    return { valid: true, actor: decoded.actor || 'admin' };
  } catch {
    return { valid: false };
  }
}

export function verifyAdminRequest(
  request: NextRequest,
  options?: { allowQueryPasscode?: boolean }
): { authorized: boolean; actor: string; error?: string } {
  // 1. Check HttpOnly signed session cookie
  const cookieToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (cookieToken) {
    const verified = verifyAdminSessionToken(cookieToken);
    if (verified.valid) {
      return { authorized: true, actor: verified.actor || 'admin' };
    }
  }

  // 2. Check x-admin-passcode header or Bearer token
  const headerPasscode = request.headers.get('x-admin-passcode');
  const authHeader = request.headers.get('authorization');
  const bearerPasscode = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const expectedPasscode = getAdminPasscode();

  if (headerPasscode && headerPasscode === expectedPasscode) {
    return { authorized: true, actor: request.headers.get('x-admin-actor') || 'admin' };
  }
  if (bearerPasscode && bearerPasscode === expectedPasscode) {
    return { authorized: true, actor: 'admin' };
  }

  // 3. Only allow query param passcode on read-only GET requests if explicitly permitted
  const isGet = request.method === 'GET';
  if (isGet && options?.allowQueryPasscode !== false) {
    const queryPasscode = request.nextUrl.searchParams.get('passcode');
    if (queryPasscode && queryPasscode === expectedPasscode) {
      return { authorized: true, actor: 'admin' };
    }
  }

  return {
    authorized: false,
    actor: 'anonymous',
    error: 'Truy cập quản trị bị từ chối. Vui lòng đăng nhập với quyền quản trị viên.',
  };
}

export function unauthorizedAdminResponse(message?: string) {
  return NextResponse.json(
    {
      success: false,
      code: 'UNAUTHORIZED',
      error: message || 'Truy cập quản trị bị từ chối. Vui lòng đăng nhập lại.',
    },
    { status: 401 }
  );
}

// ============================================================================
// IN-MEMORY RATE LIMITER
// ============================================================================

interface RateBucket {
  count: number;
  resetAt: number;
}

const rateBuckets = new Map<string, RateBucket>();

export function checkRateLimit(
  key: string,
  maxRequests: number = 30,
  windowMs: number = 60_000
): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const bucket = rateBuckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (bucket.count >= maxRequests) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { allowed: true };
}

export function resetRateLimitsForTesting() {
  rateBuckets.clear();
}
