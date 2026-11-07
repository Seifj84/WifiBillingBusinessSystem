import { NextRequest, NextResponse } from 'next/server';
import { getPaymentGateway } from '@/lib/payments';
import { db, activateSession } from '@/lib/mock-db';
import { provisionHotspotAccess } from '@/lib/mikrotik/provisioner';

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const gatewayParam = searchParams.get('gateway') as any;
    const gateway = getPaymentGateway(gatewayParam);

    const rawBody = await req.text();
    const result = await gateway.verifyWebhook(req.headers, rawBody);

    if (!result.isValid || !result.reference) {
      console.warn(`[Webhook] Invalid payload from gateway ${gateway.name}`);
      return NextResponse.json(
        { success: false, message: 'Invalid webhook payload or signature' },
        { status: 400 }
      );
    }

    // Lookup transaction by reference
    let matchedTx = Array.from(db.transactions.values()).find(
      (tx) => tx.reference === result.reference || tx.id === result.reference
    );

    if (!matchedTx) {
      console.warn(`[Webhook] Transaction with reference ${result.reference} not found`);
      return NextResponse.json(
        { success: false, message: 'Transaction reference not found' },
        { status: 404 }
      );
    }

    // IDEMPOTENCY CHECK:
    // If already marked SUCCESS, acknowledge immediately and do not duplicate
    if (matchedTx.status === 'SUCCESS') {
      console.log(`[Webhook Idempotency] Transaction ${matchedTx.id} already settled.`);
      return NextResponse.json({
        success: true,
        message: 'Transaction already acknowledged',
      });
    }

    // Update transaction state
    if (result.status === 'SUCCESS') {
      matchedTx.status = 'SUCCESS';
      matchedTx.completedAt = new Date().toISOString();

      // Activate user session
      const session = activateSession({
        userIdentifier: matchedTx.phone,
        packageId: matchedTx.packageId,
        macAddress: matchedTx.macAddress || '00:11:22:33:44:55',
        ipAddress: matchedTx.clientIp || '192.168.88.254',
      });

      // Provision onto MikroTik Hotspot Gateway
      await provisionHotspotAccess({
        username: matchedTx.phone,
        packageId: matchedTx.packageId,
        macAddress: matchedTx.macAddress || '00:11:22:33:44:55',
        clientIp: matchedTx.clientIp || '192.168.88.254',
        comment: `Mobile Money ${matchedTx.telco} Ref: ${matchedTx.reference}`,
      });

      console.log(
        `[Webhook SUCCESS] Activated session ${session.id} for phone ${matchedTx.phone} (Ref: ${matchedTx.reference})`
      );
    } else {
      matchedTx.status = 'FAILED';
      console.log(`[Webhook FAILED] Transaction ${matchedTx.id} marked FAILED.`);
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      transactionId: matchedTx.id,
      status: matchedTx.status,
    });
  } catch (error: any) {
    console.error('[Webhook Error]:', error.message);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal webhook error' },
      { status: 500 }
    );
  }
}
