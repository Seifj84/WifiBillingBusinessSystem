import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const transactionId = searchParams.get('id');

  if (!transactionId) {
    return NextResponse.json(
      { success: false, message: 'Transaction ID inahitajika.' },
      { status: 400 }
    );
  }

  const tx = db.transactions.get(transactionId);
  if (!tx) {
    return NextResponse.json(
      { success: false, message: 'Muamala haukukutwa.' },
      { status: 404 }
    );
  }

  // Check if session was activated
  const session = db.sessions.get(tx.phone);

  return NextResponse.json({
    success: true,
    status: tx.status,
    transaction: tx,
    session: session || null,
  });
}
