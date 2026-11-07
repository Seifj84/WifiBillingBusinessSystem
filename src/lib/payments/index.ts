import { IPaymentGateway, PaymentGatewayType } from './types';
import { AzamPayGateway } from './azampay';
import { SelcomGateway } from './selcom';
import { MockGateway } from './mock';

export * from './types';

export function getPaymentGateway(preferredProvider?: PaymentGatewayType): IPaymentGateway {
  const provider = (preferredProvider || process.env.PAYMENT_GATEWAY_PROVIDER || 'mock').toLowerCase();

  switch (provider) {
    case 'azampay': {
      // If no client credentials provided, fallback gracefully with a warning
      if (!process.env.AZAMPAY_CLIENT_ID || !process.env.AZAMPAY_API_KEY) {
        console.warn('[Payments] AzamPay selected but credentials missing in .env. Falling back to MockGateway.');
        return new MockGateway();
      }
      return new AzamPayGateway();
    }

    case 'selcom': {
      if (!process.env.SELCOM_API_KEY || !process.env.SELCOM_API_SECRET) {
        console.warn('[Payments] Selcom selected but credentials missing in .env. Falling back to MockGateway.');
        return new MockGateway();
      }
      return new SelcomGateway();
    }

    case 'mock':
    default:
      return new MockGateway();
  }
}
