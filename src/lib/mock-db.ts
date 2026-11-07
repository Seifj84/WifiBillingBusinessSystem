import { PaymentTransaction, Voucher, HotspotSession } from './types';
import { WIFI_PACKAGES } from './packages';

// In-memory global store (persists across hot-reloads in Node runtime)
declare global {
  var __wifiDb: {
    transactions: Map<string, PaymentTransaction>;
    vouchers: Map<string, Voucher>;
    sessions: Map<string, HotspotSession>;
  } | undefined;
}

if (!global.__wifiDb) {
  global.__wifiDb = {
    transactions: new Map<string, PaymentTransaction>(),
    vouchers: new Map<string, Voucher>(),
    sessions: new Map<string, HotspotSession>(),
  };

  // Seed with sample vouchers for quick testing
  const sampleVouchers: Voucher[] = [
    {
      code: 'TZ-500-DEMO',
      packageId: 'tz-1hr',
      status: 'UNUSED',
      createdAt: new Date().toISOString(),
    },
    {
      code: 'TZ-1000-DEMO',
      packageId: 'tz-3hr',
      status: 'UNUSED',
      createdAt: new Date().toISOString(),
    },
    {
      code: 'TZ-2000-DEMO',
      packageId: 'tz-24hr',
      status: 'UNUSED',
      createdAt: new Date().toISOString(),
    },
  ];

  sampleVouchers.forEach(v => global.__wifiDb!.vouchers.set(v.code, v));
}

export const db = global.__wifiDb;

export function createPayment(params: {
  packageId: string;
  phone: string;
  telco: any;
  amountTzs: number;
  macAddress?: string;
  clientIp?: string;
}): PaymentTransaction {
  const id = 'TXN_' + Math.random().toString(36).substring(2, 10).toUpperCase();
  const reference = 'REF_' + Date.now().toString(36).toUpperCase();
  const tx: PaymentTransaction = {
    id,
    reference,
    packageId: params.packageId,
    phone: params.phone,
    telco: params.telco,
    amountTzs: params.amountTzs,
    status: 'PENDING',
    macAddress: params.macAddress,
    clientIp: params.clientIp,
    createdAt: new Date().toISOString(),
  };
  db.transactions.set(id, tx);
  return tx;
}

export function activateSession(params: {
  userIdentifier: string;
  packageId: string;
  macAddress: string;
  ipAddress: string;
}): HotspotSession {
  const pkg = WIFI_PACKAGES.find(p => p.id === params.packageId) || WIFI_PACKAGES[0];
  const now = new Date();
  const expiresAt = new Date(now.getTime() + pkg.durationMinutes * 60 * 1000);

  const session: HotspotSession = {
    id: 'SES_' + Math.random().toString(36).substring(2, 9).toUpperCase(),
    userIdentifier: params.userIdentifier,
    macAddress: params.macAddress,
    ipAddress: params.ipAddress,
    packageId: pkg.id,
    packageName: pkg.nameSw,
    startedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    bytesIn: 0,
    bytesOut: 0,
    isActive: true,
  };

  db.sessions.set(params.userIdentifier, session);
  if (params.macAddress) {
    db.sessions.set(params.macAddress, session);
  }

  return session;
}
