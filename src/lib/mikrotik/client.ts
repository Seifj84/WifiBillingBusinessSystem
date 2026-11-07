import { 
  IMikrotikDriver, 
  MikrotikConfig, 
  MikrotikHotspotUser, 
  MikrotikActiveSession,
  MikrotikUserProfile
} from './types';
import { TANZANIA_WALLED_GARDEN_DOMAINS, PACKAGE_RATE_LIMITS } from './constants';
import { WIFI_PACKAGES } from '../packages';

export class MikrotikClient implements IMikrotikDriver {
  name = 'MikrotikRouterOSv7';
  private config: MikrotikConfig;
  private authHeader: string;
  private baseUrl: string;

  constructor(config?: Partial<MikrotikConfig>) {
    this.config = {
      host: config?.host || process.env.MIKROTIK_HOST || '192.168.88.1',
      port: config?.port || Number(process.env.MIKROTIK_PORT) || 80,
      username: config?.username || process.env.MIKROTIK_USER || 'admin',
      password: config?.password || process.env.MIKROTIK_PASSWORD || '',
      useSsl: config?.useSsl || process.env.MIKROTIK_USE_SSL === 'true',
      timeoutMs: config?.timeoutMs || 8000,
    };

    const protocol = this.config.useSsl ? 'https' : 'http';
    this.baseUrl = `${protocol}://${this.config.host}:${this.config.port}/rest`;
    this.authHeader = 'Basic ' + Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Authorization': this.authHeader,
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });

      clearTimeout(timer);

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`MikroTik HTTP ${res.status}: ${errorText || res.statusText}`);
      }

      return await res.json();
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        throw new Error(`MikroTik request timeout after ${this.config.timeoutMs}ms`);
      }
      throw err;
    }
  }

  /**
   * Health-check connectivity with RouterOS
   */
  async testConnection(): Promise<{ connected: boolean; version?: string; identity?: string; message: string }> {
    try {
      const resource = await this.request<{ version: string; 'board-name': string; uptime: string }>('/system/resource');
      const identity = await this.request<{ name: string }>('/system/identity');

      return {
        connected: true,
        version: resource.version,
        identity: identity.name,
        message: `Connected to MikroTik [${identity.name}] running RouterOS ${resource.version} (${resource['board-name']})`,
      };
    } catch (err: any) {
      return {
        connected: false,
        message: `Failed to connect to MikroTik at ${this.config.host}: ${err.message}`,
      };
    }
  }

  /**
   * Creates or updates a Hotspot user on the router
   */
  async createHotspotUser(user: MikrotikHotspotUser): Promise<{ success: boolean; id?: string; message: string }> {
    try {
      // Check if user already exists
      const existing = await this.request<any[]>(`/ip/hotspot/user?name=${encodeURIComponent(user.name)}`);
      
      const payload: any = {
        name: user.name,
        password: user.password || user.name,
        profile: user.profile || 'default',
        comment: user.comment || `Created via MtaaWiFi Billing (${new Date().toLocaleDateString()})`,
      };

      if (user['mac-address']) payload['mac-address'] = user['mac-address'];
      if (user['limit-uptime']) payload['limit-uptime'] = user['limit-uptime'];
      if (user['limit-bytes-total']) payload['limit-bytes-total'] = user['limit-bytes-total'];

      if (existing && existing.length > 0) {
        const userId = existing[0]['.id'];
        await this.request(`/ip/hotspot/user/${userId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        return {
          success: true,
          id: userId,
          message: `Hotspot user ${user.name} updated on MikroTik router.`,
        };
      }

      // Create new user
      const created = await this.request('/ip/hotspot/user', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      return {
        success: true,
        id: created['.id'],
        message: `Hotspot user ${user.name} created successfully on MikroTik router.`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Error creating Hotspot user on MikroTik: ${err.message}`,
      };
    }
  }

  /**
   * Removes a Hotspot user
   */
  async removeHotspotUser(username: string): Promise<{ success: boolean; message: string }> {
    try {
      const existing = await this.request<any[]>(`/ip/hotspot/user?name=${encodeURIComponent(username)}`);
      if (!existing || existing.length === 0) {
        return { success: true, message: `User ${username} not found on router.` };
      }

      const id = existing[0]['.id'];
      await this.request(`/ip/hotspot/user/${id}`, { method: 'DELETE' });
      return { success: true, message: `User ${username} removed from router.` };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  /**
   * Retrieves active live connected sessions
   */
  async getActiveSessions(): Promise<MikrotikActiveSession[]> {
    try {
      const list = await this.request<MikrotikActiveSession[]>('/ip/hotspot/active');
      return list || [];
    } catch (err: any) {
      console.error('[Mikrotik] Failed to get active sessions:', err.message);
      return [];
    }
  }

  /**
   * Kicks or disconnects an active user session
   */
  async kickActiveSession(identifier: string): Promise<{ success: boolean; message: string }> {
    try {
      const activeList = await this.getActiveSessions();
      const target = activeList.find(
        (s) => s.user === identifier || s['mac-address'] === identifier || s.address === identifier
      );

      if (!target) {
        return { success: false, message: `No active session found for identifier ${identifier}` };
      }

      await this.request(`/ip/hotspot/active/${target['.id']}`, { method: 'DELETE' });
      return { success: true, message: `Disconnected active session for ${target.user} (${target['mac-address']})` };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  /**
   * Synchronizes bandwidth rate-limit profiles (1M/3M, 2M/4M, etc.) for each package
   */
  async syncBandwidthProfiles(): Promise<{ success: boolean; syncedCount: number; message: string }> {
    try {
      const existingProfiles = await this.request<MikrotikUserProfile[]>('/ip/hotspot/user/profile');
      let syncedCount = 0;

      for (const pkg of WIFI_PACKAGES) {
        const rateLimit = PACKAGE_RATE_LIMITS[pkg.id] || '1M/3M';
        const profileName = `pkg-${pkg.id}`;

        const found = existingProfiles.find((p) => p.name === profileName);
        const profileData = {
          name: profileName,
          'rate-limit': rateLimit,
          'shared-users': 1,
          'status-autorefresh': '1m',
        };

        if (found) {
          await this.request(`/ip/hotspot/user/profile/${found['.id']}`, {
            method: 'PATCH',
            body: JSON.stringify(profileData),
          });
        } else {
          await this.request('/ip/hotspot/user/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData),
          });
        }
        syncedCount++;
      }

      return {
        success: true,
        syncedCount,
        message: `Successfully synchronized ${syncedCount} package bandwidth profiles to MikroTik.`,
      };
    } catch (err: any) {
      return {
        success: false,
        syncedCount: 0,
        message: `Failed to sync profiles: ${err.message}`,
      };
    }
  }

  /**
   * Synchronizes Tanzanian Walled Garden whitelist domains to the router
   */
  async syncWalledGardenRules(): Promise<{ success: boolean; count: number; message: string }> {
    try {
      const existingRules = await this.request<any[]>('/ip/hotspot/walled-garden');
      let addedCount = 0;

      for (const domain of TANZANIA_WALLED_GARDEN_DOMAINS) {
        const alreadyExists = existingRules.some((r) => r['dst-host'] === domain);
        if (!alreadyExists) {
          await this.request('/ip/hotspot/walled-garden', {
            method: 'PUT',
            body: JSON.stringify({
              'dst-host': domain,
              action: 'allow',
              comment: 'MtaaWiFi Walled Garden Whitelist',
            }),
          });
          addedCount++;
        }
      }

      return {
        success: true,
        count: addedCount,
        message: `Synchronized Walled Garden rules. (${addedCount} new domains added)`,
      };
    } catch (err: any) {
      return {
        success: false,
        count: 0,
        message: `Failed to sync Walled Garden: ${err.message}`,
      };
    }
  }
}
