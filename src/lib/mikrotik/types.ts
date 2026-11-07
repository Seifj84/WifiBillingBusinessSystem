export interface MikrotikConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  useSsl?: boolean;
  timeoutMs?: number;
}

export interface MikrotikHotspotUser {
  '.id'?: string;
  name: string;
  password?: string;
  profile?: string;
  'mac-address'?: string;
  'limit-uptime'?: string; // e.g., "1h", "3h", "1d"
  'limit-bytes-total'?: number;
  comment?: string;
  disabled?: boolean;
}

export interface MikrotikActiveSession {
  '.id': string;
  server: string;
  user: string;
  address: string;
  'mac-address': string;
  uptime: string;
  'bytes-in': number;
  'bytes-out': number;
  'idle-time'?: string;
}

export interface MikrotikUserProfile {
  '.id'?: string;
  name: string;
  'rate-limit'?: string; // e.g. "1M/3M" (upload/download)
  'shared-users'?: number;
  'status-autorefresh'?: string;
  transparent_proxy?: boolean;
}

export interface MikrotikWalledGardenRule {
  '.id'?: string;
  'dst-host'?: string;
  action: 'allow' | 'bypass';
  comment?: string;
}

export interface IMikrotikDriver {
  name: string;
  testConnection(): Promise<{ connected: boolean; version?: string; identity?: string; message: string }>;
  createHotspotUser(user: MikrotikHotspotUser): Promise<{ success: boolean; id?: string; message: string }>;
  removeHotspotUser(username: string): Promise<{ success: boolean; message: string }>;
  getActiveSessions(): Promise<MikrotikActiveSession[]>;
  kickActiveSession(identifier: string): Promise<{ success: boolean; message: string }>;
  syncBandwidthProfiles(): Promise<{ success: boolean; syncedCount: number; message: string }>;
  syncWalledGardenRules(): Promise<{ success: boolean; count: number; message: string }>;
}
