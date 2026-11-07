import { TelcoProvider } from './types';

/**
 * Normalizes Tanzanian mobile numbers to 255XXXXXXXXX format
 */
export function normalizeTzPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('255') && digits.length === 12) {
    return digits;
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return '255' + digits.substring(1);
  }
  if (digits.length === 9) {
    return '255' + digits;
  }
  return digits;
}

/**
 * Detects Tanzanian telecom provider based on phone prefix
 */
export function detectTzCarrier(phone: string): { provider: TelcoProvider; name: string; color: string } {
  const normalized = normalizeTzPhone(phone);
  if (normalized.length !== 12 || !normalized.startsWith('255')) {
    return { provider: 'UNKNOWN', name: 'Unknown', color: 'bg-gray-400' };
  }

  const prefix = normalized.substring(3, 5); // 255[75]...

  // Vodacom Tanzania: 074, 075, 076
  if (['74', '75', '76'].includes(prefix)) {
    return { provider: 'VODACOM', name: 'Vodacom M-Pesa', color: 'bg-red-600' };
  }

  // Tigo Tanzania (Yas): 065, 067, 071
  if (['65', '67', '71'].includes(prefix)) {
    return { provider: 'TIGO', name: 'Tigo Pesa', color: 'bg-blue-600' };
  }

  // Airtel Tanzania: 068, 069, 078
  if (['68', '69', '78'].includes(prefix)) {
    return { provider: 'AIRTEL', name: 'Airtel Money', color: 'bg-red-500' };
  }

  // Halotel Tanzania: 062
  if (['62'].includes(prefix)) {
    return { provider: 'HALOTEL', name: 'Halopesa', color: 'bg-orange-500' };
  }

  return { provider: 'UNKNOWN', name: 'Unknown Network', color: 'bg-gray-400' };
}
