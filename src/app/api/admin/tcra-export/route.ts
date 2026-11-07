import { NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sessions = Array.from(db.sessions.values());
    const transactions = Array.from(db.transactions.values());

    // CSV Header matching TCRA telecom session log standards
    const headers = [
      'Record_ID',
      'Timestamp_ISO',
      'User_Identifier',
      'IP_Address',
      'MAC_Address',
      'Package_Name',
      'Session_Status',
      'Session_Start',
      'Session_Expires',
      'Bytes_In',
      'Bytes_Out',
      'Telco_Source',
    ];

    const rows: string[] = [headers.join(',')];

    sessions.forEach((s) => {
      // Find matching payment if phone number
      const tx = transactions.find((t) => t.phone === s.userIdentifier);
      const telco = tx ? tx.telco : 'PHYSICAL_VOUCHER';

      const row = [
        `"${s.id}"`,
        `"${new Date().toISOString()}"`,
        `"${s.userIdentifier}"`,
        `"${s.ipAddress || '192.168.88.254'}"`,
        `"${s.macAddress || '00:11:22:33:44:55'}"`,
        `"${s.packageName}"`,
        `"${s.isActive ? 'ACTIVE' : 'EXPIRED'}"`,
        `"${s.startedAt}"`,
        `"${s.expiresAt}"`,
        s.bytesIn || 0,
        s.bytesOut || 0,
        `"${telco}"`,
      ];
      rows.push(row.join(','));
    });

    const csvContent = rows.join('\r\n');
    const filename = `TCRA_Hotspot_Audit_Log_${new Date().toISOString().substring(0, 10)}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to export TCRA logs' },
      { status: 500 }
    );
  }
}
