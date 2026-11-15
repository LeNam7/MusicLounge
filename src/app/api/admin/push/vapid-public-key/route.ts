import { NextResponse } from 'next/server';

export async function GET() {
  const publicKey =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    'BCxnwDq1dImMnFHUhpJhdvKH1vhkzKdV8cSu8zE8zeceBufZI0KBKvUStjIYORiHQXlkDArgIZ2i5cELWr-KFVI';

  return NextResponse.json({
    success: true,
    publicKey,
  });
}
