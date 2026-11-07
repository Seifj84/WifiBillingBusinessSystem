import crypto from 'crypto';
import { db } from './mock-db';
import { Voucher } from './types';

export interface BatchGenerateParams {
  packageId: string;
  quantity: number;
  agentName?: string;
  agentCommissionPercent?: number; // e.g. 10%
  prefix?: string;
}

export interface GeneratedVoucherBatch {
  batchId: string;
  packageId: string;
  quantity: number;
  agentName?: string;
  commissionRate: number;
  createdAt: string;
  vouchers: Voucher[];
}

/**
 * Generates cryptographically secure, readable voucher codes
 * Format: [PREFIX]-[4-DIGITS]-[2-CHARS] e.g. TZ-8491-KC
 */
export function generateVoucherCode(prefix: string = 'TZ'): string {
  const num = crypto.randomInt(1000, 9999);
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Excludes ambiguous I, O
  const char1 = chars[crypto.randomInt(0, chars.length)];
  const char2 = chars[crypto.randomInt(0, chars.length)];
  return `${prefix}-${num}-${char1}${char2}`;
}

/**
 * Creates a batch of vouchers in the system
 */
export function generateVoucherBatch(params: BatchGenerateParams): GeneratedVoucherBatch {
  const batchId = 'BATCH_' + Date.now().toString(36).toUpperCase();
  const vouchers: Voucher[] = [];
  const prefix = params.prefix || 'TZ';

  for (let i = 0; i < params.quantity; i++) {
    let code = generateVoucherCode(prefix);
    // Ensure uniqueness
    while (db.vouchers.has(code)) {
      code = generateVoucherCode(prefix);
    }

    const voucher: Voucher = {
      code,
      packageId: params.packageId,
      status: 'UNUSED',
      createdAt: new Date().toISOString(),
    };

    db.vouchers.set(code, voucher);
    vouchers.push(voucher);
  }

  return {
    batchId,
    packageId: params.packageId,
    quantity: params.quantity,
    agentName: params.agentName || 'General Sale',
    commissionRate: params.agentCommissionPercent || 10,
    createdAt: new Date().toISOString(),
    vouchers,
  };
}
