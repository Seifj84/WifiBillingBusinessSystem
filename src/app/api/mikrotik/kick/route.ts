import { NextRequest, NextResponse } from 'next/server';
import { getMikrotikDriver } from '@/lib/mikrotik';

export async function POST(req: NextRequest) {
  try {
    const { identifier } = await req.json();

    if (!identifier) {
      return NextResponse.json(
        { success: false, message: 'Identifier (username or MAC address) is required.' },
        { status: 400 }
      );
    }

    const driver = getMikrotikDriver();
    const result = await driver.kickActiveSession(identifier);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to kick session' },
      { status: 500 }
    );
  }
}
