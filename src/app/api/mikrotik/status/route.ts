import { NextResponse } from 'next/server';
import { getMikrotikDriver } from '@/lib/mikrotik';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const driver = getMikrotikDriver();
    const conn = await driver.testConnection();
    const activeSessions = await driver.getActiveSessions();

    return NextResponse.json({
      success: true,
      driver: driver.name,
      connection: conn,
      activeSessionsCount: activeSessions.length,
      activeSessions,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to query MikroTik status' },
      { status: 500 }
    );
  }
}
