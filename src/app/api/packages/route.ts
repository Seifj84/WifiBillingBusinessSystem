import { NextResponse } from 'next/server';
import { WIFI_PACKAGES } from '@/lib/packages';

export async function GET() {
  return NextResponse.json({
    success: true,
    packages: WIFI_PACKAGES,
  });
}
