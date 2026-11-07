import { NextRequest, NextResponse } from 'next/server';
import { WIFI_PACKAGES } from '@/lib/packages';
import { detectTzCarrier, normalizeTzPhone } from '@/lib/telco';
import { createPayment, db, activateSession } from '@/lib/mock-db';
import { getPaymentGateway } from '@/lib/payments';

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

    const pkg = WIFI_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) {
      return NextResponse.json(
        { success: false, message: 'Kifurushi hakipatikani.' },
        { status: 404 }
      );
    }

    const normalizedPhone = normalizeTzPhone(phone);
    const carrierInfo = detectTzCarrier(normalizedPhone);

    // Create internal payment record
    const payment = createPayment({
      packageId: pkg.id,
      phone: normalizedPhone,
      telco: carrierInfo.provider,
      amountTzs: pkg.priceTzs,
      macAddress: macAddress || '00:11:22:33:44:55',
      clientIp: clientIp || '192.168.88.254',
    });

    // Obtain active payment gateway (AzamPay, Selcom, or Mock)
    const gateway = getPaymentGateway();

    const gatewayResult = await gateway.initiateUssdPush({
      packageId: pkg.id,
      packageName: pkg.nameSw,
      amountTzs: pkg.priceTzs,
      phone: normalizedPhone,
      telco: carrierInfo.provider,
      reference: payment.reference,
      macAddress: payment.macAddress,
      clientIp: payment.clientIp,
    });

    if (!gatewayResult.success) {
      payment.status = 'FAILED';
      return NextResponse.json(
        {
          success: false,
          transactionId: payment.id,
          reference: payment.reference,
          message: gatewayResult.message || 'Ombi la malipo limeshindikana kuanzishwa.',
        },
        { status: 400 }
      );
    }

    // In Mock mode, simulate customer entering their PIN on the phone after 4 seconds
    if (gateway.name === 'MockGateway') {
      setTimeout(() => {
        const tx = db.transactions.get(payment.id);
        if (tx && tx.status === 'PENDING') {
          tx.status = 'SUCCESS';
          tx.completedAt = new Date().toISOString();
          activateSession({
            userIdentifier: tx.phone,
            packageId: tx.packageId,
            macAddress: tx.macAddress || '00:11:22:33:44:55',
            ipAddress: tx.clientIp || '192.168.88.254',
          });
        }
      }, 4000);
    }

    return NextResponse.json({
      success: true,
      transactionId: payment.id,
      reference: payment.reference,
      gateway: gateway.name,
      amountTzs: payment.amountTzs,
      phone: normalizedPhone,
      carrier: carrierInfo,
      message: gatewayResult.message,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Hitilafu ya seva' },
      { status: 500 }
    );
  }
}
