import { IPaymentGateway, InitiatePaymentParams, GatewayInitiateResult, GatewayWebhookResult } from './types';
import { TelcoProvider } from '../types';

interface TokenCache {
  token: string;
  expiresAt: number;
}

let cachedToken: TokenCache | null = null;

export class AzamPayGateway implements IPaymentGateway {
  name = 'AzamPay';

  private appName = process.env.AZAMPAY_APP_NAME || 'MtaaWiFi';
  private clientId = process.env.AZAMPAY_CLIENT_ID || '';
  private clientSecret = process.env.AZAMPAY_CLIENT_SECRET || '';
  private apiKey = process.env.AZAMPAY_API_KEY || '';
  private isSandbox = (process.env.AZAMPAY_ENV || 'sandbox').toLowerCase() === 'sandbox';

  private authBaseUrl = this.isSandbox
    ? 'https://authenticator-sandbox.azampay.co.tz'
    : 'https://authenticator.azampay.co.tz';

  private checkoutBaseUrl = this.isSandbox
    ? 'https://sandbox.azampay.co.tz'
    : 'https://checkout.azampay.co.tz';

  /**
   * Fetches or returns cached bearer token from AzamPay Auth server
   */
  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (cachedToken && cachedToken.expiresAt > now + 60000) {
      return cachedToken.token;
    }

    try {
      const res = await fetch(`${this.authBaseUrl}/AppRegistration/GenerateToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appName: this.appName,
          clientId: this.clientId,
          clientSecret: this.clientSecret,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`AzamPay Auth failed (${res.status}): ${errorText}`);
      }

      const json = await res.json();
      const token = json.data?.accessToken;
      if (!token) {
        throw new Error('AzamPay returned empty access token.');
      }

      // Default cache duration: 1 hour minus safety buffer
      cachedToken = {
        token,
        expiresAt: now + 3500 * 1000,
      };

      return token;
    } catch (err: any) {
      console.error('[AzamPay Auth Error]:', err.message);
      throw err;
    }
  }

  /**
   * Map standard TelcoProvider to AzamPay provider names
   */
  private mapTelcoToAzamProvider(telco: TelcoProvider): string {
    switch (telco) {
      case 'VODACOM':
        return 'Mpesa';
      case 'TIGO':
        return 'Tigo';
      case 'AIRTEL':
        return 'Airtel';
      case 'HALOTEL':
        return 'Halopesa';
      default:
        return 'Mpesa';
    }
  }

  /**
   * Dispatches an automated USSD / STK Push to the user's phone via AzamPay MNO Checkout
   */
  async initiateUssdPush(params: InitiatePaymentParams): Promise<GatewayInitiateResult> {
    try {
      const token = await this.getAccessToken();
      const azamProvider = this.mapTelcoToAzamProvider(params.telco);

      const payload = {
        accountNumber: params.phone, // Format: 2557XXXXXXXX
        amount: params.amountTzs.toString(),
        currency: 'TZS',
        externalId: params.reference,
        provider: azamProvider,
        additionalProperties: {
          packageId: params.packageId,
          packageName: params.packageName,
          macAddress: params.macAddress || '',
          clientIp: params.clientIp || '',
        },
      };

      const res = await fetch(`${this.checkoutBaseUrl}/azampay/mno/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-API-KEY': this.apiKey,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await res.json();

      if (!res.ok || responseData.success === false) {
        return {
          success: false,
          reference: params.reference,
          message: responseData.message || 'AzamPay checkout request failed',
          rawResponse: responseData,
        };
      }

      return {
        success: true,
        reference: params.reference,
        gatewayTransactionId: responseData.transactionId || responseData.data?.transactionId,
        message: 'Ombi la malipo limetumwa kwenye simu yako. Tafadhali weka PIN.',
        rawResponse: responseData,
      };
    } catch (error: any) {
      return {
        success: false,
        reference: params.reference,
        message: error.message || 'Hitilafu ya kuunganisha na AzamPay',
      };
    }
  }

  /**
   * Verifies incoming webhook callback from AzamPay
   */
  async verifyWebhook(headers: Headers, rawBody: string): Promise<GatewayWebhookResult> {
    try {
      const payload = JSON.parse(rawBody);

      // Extract transaction details
      const reference = payload.reference || payload.externalId || '';
      const amount = Number(payload.amount || payload.transactionAmount || 0);
      const statusRaw = (payload.transactionStatus || payload.status || '').toLowerCase();
      const isSuccess = statusRaw === 'success' || statusRaw === 'completed';

      return {
        isValid: true,
        reference,
        amountTzs: amount,
        status: isSuccess ? 'SUCCESS' : 'FAILED',
        operatorReference: payload.transactionId || payload.operatorTxId,
        rawPayload: payload,
      };
    } catch (e: any) {
      return {
        isValid: false,
        reference: '',
        amountTzs: 0,
        status: 'FAILED',
        rawPayload: null,
      };
    }
  }
}
