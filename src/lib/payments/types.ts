import { TelcoProvider } from '../types';

export type PaymentGatewayType = 'azampay' | 'selcom' | 'mock';

export interface InitiatePaymentParams {
  packageId: string;
  packageName: string;
  amountTzs: number;
  phone: string;
  telco: TelcoProvider;
  reference: string;
  macAddress?: string;
  clientIp?: string;
  callbackUrl?: string;
}

export interface GatewayInitiateResult {
  success: boolean;
  reference: string;
  gatewayTransactionId?: string;
  message: string;
  rawResponse?: any;
}

export interface GatewayWebhookResult {
  isValid: boolean;
  reference: string;
  amountTzs: number;
  status: 'SUCCESS' | 'FAILED';
  operatorReference?: string;
  rawPayload: any;
}

export interface IPaymentGateway {
  name: string;
  initiateUssdPush(params: InitiatePaymentParams): Promise<GatewayInitiateResult>;
  verifyWebhook(headers: Headers, rawBody: string): Promise<GatewayWebhookResult>;
  queryTransactionStatus?(reference: string): Promise<{ status: 'PENDING' | 'SUCCESS' | 'FAILED'; raw: any }>;
}
