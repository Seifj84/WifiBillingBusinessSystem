import { NextRequest, NextResponse } from 'next/server';
import { db, activateSession } from '@/lib/mock-db';

export async function POST(req: NextRequest) {
  try {
    const { reference, phone } = await req.json();

    if (!reference && !phone) {
      return NextResponse.json(
        { success: false, message: 'Reference au namba ya simu inahitajika.' },
        { status: 400 }
      );
    }

    let tx = Array.from(db.transactions.values()).find(
      (t) => t.reference === reference || t.id === reference || t.phone === phone
    );

    if (!tx) {
      return NextResponse.json(
        { success: false, message: 'Muamala haukukutwa kwenye mfumo.' },
        { status: 404 }
      );
    }

    // Check if session is already active
    const existingSession = db.sessions.get(tx.phone);

    return NextResponse.json({
      success: true,
      status: tx.status,
      transaction: tx,
      session: existingSession || null,
      message:
        tx.status === 'SUCCESS'
          ? 'Malipo yamethibitishwa na intaneti ipo hewani!'
          : 'Malipo bado yanasubiri uthibitisho wa PIN kwenye simu yako.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Hitilafu ya seva' },
      { status: 500 }
    );
  }
}
