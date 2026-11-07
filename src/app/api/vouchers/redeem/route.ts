import { NextRequest, NextResponse } from 'next/server';
import { db, activateSession } from '@/lib/mock-db';
import { WIFI_PACKAGES } from '@/lib/packages';
import { provisionHotspotAccess } from '@/lib/mikrotik/provisioner';

export async function POST(req: NextRequest) {
  try {
    const { code, macAddress, clientIp } = await req.json();

    if (!code) {
      return NextResponse.json(
        { success: false, message: 'Tafadhali ingiza namba ya vocha.' },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();
    const voucher = db.vouchers.get(cleanCode);

    if (!voucher) {
      return NextResponse.json(
        { success: false, message: 'Namba ya vocha sio sahihi. Tafadhali kagua tena.' },
        { status: 404 }
      );
    }

    if (voucher.status === 'ACTIVE' || voucher.status === 'EXPIRED') {
      return NextResponse.json(
        { success: false, message: 'Vocha hii imekwisha tumika tayari.' },
        { status: 400 }
      );
    }

    // Mark voucher redeemed
    voucher.status = 'ACTIVE';
    voucher.redeemedAt = new Date().toISOString();
    voucher.redeemedByMac = macAddress || '00:11:22:33:44:55';

    // Activate local session
    const session = activateSession({
      userIdentifier: cleanCode,
      packageId: voucher.packageId,
      macAddress: macAddress || '00:11:22:33:44:55',
      ipAddress: clientIp || '192.168.88.254',
    });

    const pkg = WIFI_PACKAGES.find((p) => p.id === voucher.packageId);

    // Provision onto MikroTik Router
    await provisionHotspotAccess({
      username: cleanCode,
      packageId: voucher.packageId,
      macAddress: macAddress || '00:11:22:33:44:55',
      clientIp: clientIp || '192.168.88.254',
      comment: `Redeemed voucher ${cleanCode}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Vocha imethibitishwa! Intaneti imewashwa kikamilifu kwenye MikroTik.',
      package: pkg,
      session,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Hitilafu ya seva' },
      { status: 500 }
    );
  }
}
