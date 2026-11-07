import { IPaymentGateway, InitiatePaymentParams, GatewayInitiateResult, GatewayWebhookResult } from './types';

export class MockGateway implements IPaymentGateway {
  name = 'MockGateway';

  async initiateUssdPush(params: InitiatePaymentParams): Promise<GatewayInitiateResult> {
    // If phone ends in 99999, simulate failure/declined PIN
    if (params.phone.endsWith('99999')) {
      return {
        success: false,
        reference: params.reference,
        message: 'Mteja alikataa ombi la malipo (Declined USSD prompt).',
      };
    }

    // Otherwise simulate successful USSD push dispatch
    return {
      success: true,
      reference: params.reference,
      gatewayTransactionId: 'SIM_' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      message: `[Majaribio] Ombi la USSD Push limetumwa kwa ${params.phone}. Kiasi: TZS ${params.amountTzs.toLocaleString()}.`,
    };
  }

  async verifyWebhook(headers: Headers, rawBody: string): Promise<GatewayWebhookResult> {
    try {
      const payload = JSON.parse(rawBody);
      return {
        isValid: true,
        reference: payload.reference,
        amountTzs: Number(payload.amountTzs || 0),
        status: payload.status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
        operatorReference: 'MOCK_OP_' + Date.now(),
        rawPayload: payload,
      };
    } catch {
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
