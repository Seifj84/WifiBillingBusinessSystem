import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';
import { generateVoucherBatch } from '@/lib/voucher-generator';
import { WIFI_PACKAGES } from '@/lib/packages';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const packageId = searchParams.get('packageId');

    let vouchers = Array.from(db.vouchers.values());

    if (status) {
      vouchers = vouchers.filter((v) => v.status === status);
    }
    if (packageId) {
      vouchers = vouchers.filter((v) => v.packageId === packageId);
    }

    const enhancedVouchers = vouchers.map((v) => {
      const pkg = WIFI_PACKAGES.find((p) => p.id === v.packageId);
      return {
        ...v,
        packageName: pkg?.nameSw || 'Kifurushi',
        priceTzs: pkg?.priceTzs || 0,
        duration: pkg?.durationLabelSw || '',
      };
    });

    return NextResponse.json({
      success: true,
      count: enhancedVouchers.length,
      vouchers: enhancedVouchers.reverse(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to list vouchers' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { packageId, quantity, agentName, agentCommissionPercent, prefix } = body;

    if (!packageId || !quantity) {
      return NextResponse.json(
        { success: false, message: 'Package ID and quantity are required.' },
        { status: 400 }
      );
    }

    const pkg = WIFI_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) {
      return NextResponse.json(
        { success: false, message: 'Invalid package ID.' },
        { status: 404 }
      );
    }

    const count = Math.min(Math.max(Number(quantity) || 10, 1), 500); // Between 1 and 500

    const batch = generateVoucherBatch({
      packageId,
      quantity: count,
      agentName: agentName || 'General Sales Kiosk',
      agentCommissionPercent: Number(agentCommissionPercent) || 10,
      prefix: prefix || 'TZ',
    });

    return NextResponse.json({
      success: true,
      message: `Imetengeneza vocha ${count} za ${pkg.nameSw} kwa mafanikio.`,
      batch,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to generate vouchers' },
      { status: 500 }
    );
  }
}
