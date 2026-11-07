import { IMikrotikDriver } from './types';
import { MikrotikClient } from './client';
import { MockMikrotikDriver } from './mock';

export * from './types';
export * from './constants';

export function getMikrotikDriver(): IMikrotikDriver {
  const driverType = (process.env.MIKROTIK_DRIVER || '').toLowerCase();
  const host = process.env.MIKROTIK_HOST;

  // Use Mock if driver is explicitly 'mock' or if host is default local subnet without live hardware
  if (driverType === 'mock' || !host || host === '127.0.0.1' || host === 'mock' || !driverType && !process.env.MIKROTIK_PASSWORD) {
    return new MockMikrotikDriver();
  }

  return new MikrotikClient();
}
