import { getMikrotikDriver } from './index';
import { WIFI_PACKAGES } from '../packages';

/**
 * Converts minutes to MikroTik limit-uptime string format (e.g., 60m -> "1h", 1440m -> "1d")
 */
export function formatMikrotikUptime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  if (minutes % 1440 === 0) return `${minutes / 1440}d`;
  if (minutes % 60 === 0) return `${minutes / 60}h`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${m}m`;
}

/**
 * Automatically provisions a paid subscriber or redeemed voucher onto the MikroTik Hotspot
 */
export async function provisionHotspotAccess(params: {
  username: string; // phone number or voucher code
  packageId: string;
  macAddress?: string;
  clientIp?: string;
  comment?: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const driver = getMikrotikDriver();
    const pkg = WIFI_PACKAGES.find((p) => p.id === params.packageId) || WIFI_PACKAGES[0];
    const uptimeLimit = formatMikrotikUptime(pkg.durationMinutes);

    const result = await driver.createHotspotUser({
      name: params.username,
      password: params.username,
      profile: `pkg-${pkg.id}`,
      'mac-address': params.macAddress,
      'limit-uptime': uptimeLimit,
      comment: params.comment || `Paid ${pkg.priceTzs} TZS for ${pkg.nameSw}`,
    });

    return result;
  } catch (error: any) {
    console.error('[MikroTik Provisioner Error]:', error.message);
    return {
      success: false,
      message: `Failed to provision on MikroTik: ${error.message}`,
    };
  }
}
