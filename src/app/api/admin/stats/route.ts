import { NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';
import { WIFI_PACKAGES } from '@/lib/packages';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const transactions = Array.from(db.transactions.values());
    const vouchers = Array.from(db.vouchers.values());
    const sessions = Array.from(db.sessions.values());

    const successfulTx = transactions.filter((t) => t.status === 'SUCCESS');
    const redeemedVouchers = vouchers.filter((v) => v.status === 'ACTIVE');

    // Calculate revenue from mobile money
    const mobileMoneyRevenueTzs = successfulTx.reduce((acc, t) => acc + t.amountTzs, 0);

    // Calculate estimated revenue from physical vouchers sold/redeemed
    const voucherRevenueTzs = redeemedVouchers.reduce((acc, v) => {
      const pkg = WIFI_PACKAGES.find((p) => p.id === v.packageId);
      return acc + (pkg?.priceTzs || 0);
    }, 0);

    const totalRevenueTzs = mobileMoneyRevenueTzs + voucherRevenueTzs;

    // Telco breakdown
    const telcoBreakdown: Record<string, { count: number; volumeTzs: number }> = {
      VODACOM: { count: 0, volumeTzs: 0 },
      TIGO: { count: 0, volumeTzs: 0 },
      AIRTEL: { count: 0, volumeTzs: 0 },
      HALOTEL: { count: 0, volumeTzs: 0 },
    };

    successfulTx.forEach((tx) => {
      const telcoKey = tx.telco in telcoBreakdown ? tx.telco : 'VODACOM';
      telcoBreakdown[telcoKey].count++;
      telcoBreakdown[telcoKey].volumeTzs += tx.amountTzs;
    });

    // Recent 10 transactions
    const recentTransactions = transactions
      .slice(-10)
      .reverse()
      .map((t) => {
        const pkg = WIFI_PACKAGES.find((p) => p.id === t.packageId);
        return {
          ...t,
          packageName: pkg?.nameSw || 'Kifurushi',
        };
      });

    return NextResponse.json({
      success: true,
      stats: {
        totalRevenueTzs,
        mobileMoneyRevenueTzs,
        voucherRevenueTzs,
        successfulTxCount: successfulTx.length,
        totalTxCount: transactions.length,
        totalVouchers: vouchers.length,
        unusedVouchersCount: vouchers.filter((v) => v.status === 'UNUSED').length,
        redeemedVouchersCount: redeemedVouchers.length,
        activeSessionsCount: sessions.filter((s) => s.isActive).length,
        telcoBreakdown,
        recentTransactions,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to calculate stats' },
      { status: 500 }
    );
  }
}
