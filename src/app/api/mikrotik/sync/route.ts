import { NextResponse } from 'next/server';
import { getMikrotikDriver } from '@/lib/mikrotik';

export async function POST() {
  try {
    const driver = getMikrotikDriver();
    const profileResult = await driver.syncBandwidthProfiles();
    const walledGardenResult = await driver.syncWalledGardenRules();

    return NextResponse.json({
      success: profileResult.success && walledGardenResult.success,
      driver: driver.name,
      profiles: profileResult,
      walledGarden: walledGardenResult,
      message: `MikroTik synchronized: ${profileResult.message} ${walledGardenResult.message}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to sync MikroTik' },
      { status: 500 }
    );
  }
}
