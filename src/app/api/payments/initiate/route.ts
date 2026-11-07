import { NextRequest, NextResponse } from 'next/server';
import { WIFI_PACKAGES } from '@/lib/packages';
import { detectTzCarrier, normalizeTzPhone } from '@/lib/telco';
import { createPayment, db, activateSession } from '@/lib/mock-db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, packageId, macAddress, clientIp } = body;

    if (!phone || !packageId) {
      return NextResponse.json(
        { success: false, message: 'Namba ya simu na kifurushi vinahitajika.' },
        { status: 400 }
      );
    }

    const pkg = WIFI_PACKAGES.find(p => p.id === packageId);
    if (!pkg) {
      return NextResponse.json(
        { success: false, message: 'Kifurushi hakipatikani.' },
        { status: 404 }
      );
    }

    const normalizedPhone = normalizeTzPhone(phone);
    const carrierInfo = detectTzCarrier(normalizedPhone);

    // Create payment record
    const payment = createPayment({
      packageId: pkg.id,
      phone: normalizedPhone,
      telco: carrierInfo.provider,
      amountTzs: pkg.priceTzs,
      macAddress: macAddress || '00:11:22:33:44:55',
      clientIp: clientIp || '192.168.88.254',
    });

    // In a live environment with AzamPay/Selcom:
    // We would make an HTTP POST to AzamPay / Selcom Checkout API to trigger USSD Push.
    // For local dev / testing, simulate USSD prompt auto-resolution in 4 seconds:
    setTimeout(() => {
      const tx = db.transactions.get(payment.id);
      if (tx && tx.status === 'PENDING') {
        tx.status = 'SUCCESS';
        tx.completedAt = new Date().toISOString();
        // Activate hotspot session automatically
        activateSession({
          userIdentifier: tx.phone,
          packageId: tx.packageId,
          macAddress: tx.macAddress || '',
          ipAddress: tx.clientIp || '',
        });
      }
    }, 4000);

    return NextResponse.json({
      success: true,
      transactionId: payment.id,
      reference: payment.reference,
      amountTzs: payment.amountTzs,
      phone: normalizedPhone,
      carrier: carrierInfo,
      message: `Ombi la malipo la TZS ${pkg.priceTzs.toLocaleString()} limetumwa kwenda ${carrierInfo.name}.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Hitilafu ya seva' },
      { status: 500 }
    );
  }
}
