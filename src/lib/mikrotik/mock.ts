import { 
  IMikrotikDriver, 
  MikrotikHotspotUser, 
  MikrotikActiveSession,
  MikrotikUserProfile
} from './types';
import { TANZANIA_WALLED_GARDEN_DOMAINS, PACKAGE_RATE_LIMITS } from './constants';
import { WIFI_PACKAGES } from '../packages';

// Simulated in-memory MikroTik State
class MockMikrotikState {
  users = new Map<string, MikrotikHotspotUser>();
  profiles = new Map<string, MikrotikUserProfile>();
  activeSessions = new Map<string, MikrotikActiveSession>();
  walledGarden = new Set<string>();

  constructor() {
    // Seed default admin profile
    this.profiles.set('default', {
      name: 'default',
      'rate-limit': '2M/4M',
      'shared-users': 1,
    });

    // Seed a simulated active user
    this.activeSessions.set('sess-1', {
      '.id': '*1',
      server: 'hotspot1',
      user: '255754123456',
      address: '192.168.88.245',
      'mac-address': 'BC:D1:D3:55:6A:11',
      uptime: '28m14s',
      'bytes-in': 14250000,
      'bytes-out': 84210000,
    });
  }
}

const mockState = new MockMikrotikState();

export class MockMikrotikDriver implements IMikrotikDriver {
  name = 'MockMikrotikDriver';

  async testConnection(): Promise<{ connected: boolean; version?: string; identity?: string; message: string }> {
    return {
      connected: true,
      version: '7.16.2 (Mock RouterOS)',
      identity: 'MtaaWiFi-Core-RB5009',
      message: 'Connected to Simulated MikroTik RouterOS v7 [MtaaWiFi-Core-RB5009]',
    };
  }

  async createHotspotUser(user: MikrotikHotspotUser): Promise<{ success: boolean; id?: string; message: string }> {
    const id = '*u_' + Math.random().toString(36).substring(2, 7);
    mockState.users.set(user.name, { ...user, '.id': id });

    // Also simulate creating an active hotspot session immediately
    mockState.activeSessions.set(user.name, {
      '.id': '*act_' + Math.random().toString(36).substring(2, 7),
      server: 'hotspot1',
      user: user.name,
      address: '192.168.88.' + Math.floor(Math.random() * 200 + 20),
      'mac-address': user['mac-address'] || 'BC:D1:D3:55:6A:11',
      uptime: '0s',
      'bytes-in': 0,
      'bytes-out': 0,
    });

    return {
      success: true,
      id,
      message: `[Simulated] User ${user.name} created and active session granted on MikroTik.`,
    };
  }

  async removeHotspotUser(username: string): Promise<{ success: boolean; message: string }> {
    mockState.users.delete(username);
    mockState.activeSessions.delete(username);
    return { success: true, message: `[Simulated] User ${username} removed from router.` };
  }

  async getActiveSessions(): Promise<MikrotikActiveSession[]> {
    return Array.from(mockState.activeSessions.values());
  }

  async kickActiveSession(identifier: string): Promise<{ success: boolean; message: string }> {
    let kicked = false;
    for (const [key, session] of Array.from(mockState.activeSessions.entries())) {
      if (
        session.user === identifier || 
        session['mac-address'] === identifier || 
        session.address === identifier
      ) {
        mockState.activeSessions.delete(key);
        kicked = true;
      }
    }

    return {
      success: kicked,
      message: kicked
        ? `[Simulated] Session for ${identifier} disconnected.`
        : `[Simulated] Session for ${identifier} not found.`,
    };
  }

  async syncBandwidthProfiles(): Promise<{ success: boolean; syncedCount: number; message: string }> {
    let syncedCount = 0;
    for (const pkg of WIFI_PACKAGES) {
      const rate = PACKAGE_RATE_LIMITS[pkg.id] || '1M/3M';
      mockState.profiles.set(`pkg-${pkg.id}`, {
        name: `pkg-${pkg.id}`,
        'rate-limit': rate,
        'shared-users': 1,
      });
      syncedCount++;
    }

    return {
      success: true,
      syncedCount,
      message: `[Simulated] Synchronized ${syncedCount} rate-limit profiles.`,
    };
  }

  async syncWalledGardenRules(): Promise<{ success: boolean; count: number; message: string }> {
    let count = 0;
    for (const domain of TANZANIA_WALLED_GARDEN_DOMAINS) {
      mockState.walledGarden.add(domain);
      count++;
    }

    return {
      success: true,
      count,
      message: `[Simulated] ${count} Walled Garden whitelist domains registered.`,
    };
  }
}
