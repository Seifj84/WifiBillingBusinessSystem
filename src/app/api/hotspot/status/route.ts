import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';
import { normalizeTzPhone } from '@/lib/telco';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');
  const mac = searchParams.get('mac');

  let session = null;

  if (query) {
    const clean = query.trim();
    // Try phone
    const normalizedPhone = normalizeTzPhone(clean);
    session = db.sessions.get(normalizedPhone) || db.sessions.get(clean.toUpperCase());
  }

  if (!session && mac) {
    session = db.sessions.get(mac);
  }

  if (!session) {
    return NextResponse.json({
      success: false,
      message: 'Hakuna kifurushi kinachotumika kwa sasa.',
    });
  }

  const now = new Date().getTime();
  const expiresAt = new Date(session.expiresAt).getTime();
  const msRemaining = Math.max(0, expiresAt - now);
  const minutesRemaining = Math.floor(msRemaining / (1000 * 60));

  const isExpired = msRemaining <= 0;

  return NextResponse.json({
    success: true,
    session: {
      ...session,
      isActive: !isExpired,
      minutesRemaining,
      formattedTimeRemaining: isExpired
        ? 'Imekwisha Muda'
        : `${Math.floor(minutesRemaining / 60)}h ${minutesRemaining % 60}m`,
    },
  });
}
