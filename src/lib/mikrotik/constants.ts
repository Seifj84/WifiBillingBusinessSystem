export const TANZANIA_WALLED_GARDEN_DOMAINS = [
  // AzamPay Endpoints
  '*.azampay.co.tz',
  'authenticator.azampay.co.tz',
  'authenticator-sandbox.azampay.co.tz',
  'checkout.azampay.co.tz',
  'sandbox.azampay.co.tz',

  // Selcom APIGW Endpoints
  '*.selcommobile.com',
  'apigw.selcommobile.com',
  'apigwtest.selcommobile.com',

  // Operating Portal / Local Services
  '*.mtaawifi.tz',
  'mtaawifi.tz',

  // Device Captive Network Assistant (CNA) probes
  'connectivitycheck.gstatic.com',
  'clients3.google.com',
  'captive.apple.com',
  'msftconnecttest.com',
];

/**
 * Standard MikroTik rate-limits (Upload/Download) for each package tier
 */
export const PACKAGE_RATE_LIMITS: Record<string, string> = {
  'tz-1hr': '1M/3M',    // 1 Mbps Upload / 3 Mbps Download
  'tz-3hr': '1M/3M',    // 1 Mbps Upload / 3 Mbps Download
  'tz-24hr': '2M/4M',   // 2 Mbps Upload / 4 Mbps Download
  'tz-7day': '2M/5M',   // 2 Mbps Upload / 5 Mbps Download
  'tz-30day': '2M/5M',  // 2 Mbps Upload / 5 Mbps Download
};
