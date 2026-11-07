export type TelcoProvider = 'VODACOM' | 'TIGO' | 'AIRTEL' | 'HALOTEL' | 'UNKNOWN';

export interface WifiPackage {
  id: string;
  nameSw: string;
  nameEn: string;
  priceTzs: number;
  durationMinutes: number;
  durationLabelSw: string;
  durationLabelEn: string;
  speedLimit: string;
  dataLimitMb?: number; // undefined for unlimited
  isPopular?: boolean;
}

export interface PaymentTransaction {
  id: string;
  reference: string;
  packageId: string;
  phone: string;
  telco: TelcoProvider;
  amountTzs: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED';
  macAddress?: string;
  clientIp?: string;
  createdAt: string;
  completedAt?: string;
}

export interface Voucher {
  code: string;
  packageId: string;
  status: 'UNUSED' | 'ACTIVE' | 'EXPIRED';
  createdAt: string;
  redeemedAt?: string;
  redeemedByPhone?: string;
  redeemedByMac?: string;
  expiresAt?: string;
}

export interface HotspotSession {
  id: string;
  userIdentifier: string; // phone or voucher code
  macAddress: string;
  ipAddress: string;
  packageId: string;
  packageName: string;
  startedAt: string;
  expiresAt: string;
  bytesIn: number;
  bytesOut: number;
  isActive: boolean;
}
