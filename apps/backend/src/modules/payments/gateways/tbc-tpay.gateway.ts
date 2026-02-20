import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import {
  IPaymentGateway,
  PaymentGatewayResult,
  RefundResult,
} from './payment-gateway.interface';

@Injectable()
export class TbcTpayGateway implements IPaymentGateway {
  private readonly logger = new Logger(TbcTpayGateway.name);
  private readonly clientId: string | undefined;
  private readonly secret: string | undefined;
  private readonly baseUrl: string | undefined;
  private readonly useMock: boolean;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('TBC_TPAY_CLIENT_ID');
    this.secret = this.configService.get<string>('TBC_TPAY_SECRET');
    this.baseUrl = this.configService.get<string>('TBC_TPAY_BASE_URL');

    this.useMock = !this.clientId || !this.secret;

    if (this.useMock) {
      this.logger.warn(
        'TBC TPay credentials not configured — falling back to mock behavior. ' +
          'Set TBC_TPAY_CLIENT_ID and TBC_TPAY_SECRET to enable real payments.',
      );
    } else {
      this.logger.log(
        `TBC TPay gateway initialized (baseUrl: ${this.baseUrl})`,
      );
    }
  }

  private async getAccessToken(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.secret}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
      signal: AbortSignal.timeout(30000),
    });

    const data = await response.json();

    if (!response.ok || !data.access_token) {
      throw new Error(
        `Failed to obtain TBC TPay access token: ${JSON.stringify(data)}`,
      );
    }

    return data.access_token;
  }

  async initializePayment(params: {
    amount: number;
    currency: string;
    orderId: string;
    description: string;
    returnUrl?: string;
    customerEmail?: string;
  }): Promise<PaymentGatewayResult> {
    if (this.useMock) {
      return this.mockInitializePayment(params);
    }

    try {
      const token = await this.getAccessToken();

      const response = await fetch(`${this.baseUrl}/v1/tpay/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: {
            value: params.amount,
            currency: params.currency,
          },
          externalOrderId: params.orderId,
          description: params.description,
          returnUrl: params.returnUrl,
          extra: params.customerEmail
            ? { customerEmail: params.customerEmail }
            : undefined,
        }),
        signal: AbortSignal.timeout(30000),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        this.logger.error(
          `TBC TPay initializePayment failed: ${JSON.stringify(data)}`,
        );
        return {
          success: false,
          transactionId: data.paymentId || params.orderId,
          status: 'failed',
          gatewayResponse: data,
        };
      }

      return {
        success: true,
        transactionId: data.paymentId,
        status: 'pending',
        gatewayResponse: data,
        redirectUrl: data.links?.redirect,
      };
    } catch (error) {
      this.logger.error(
        `TBC TPay initializePayment error: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        success: false,
        transactionId: params.orderId,
        status: 'failed',
        gatewayResponse: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  async confirmPayment(transactionId: string): Promise<PaymentGatewayResult> {
    if (this.useMock) {
      return this.mockConfirmPayment(transactionId);
    }

    try {
      const token = await this.getAccessToken();

      const response = await fetch(
        `${this.baseUrl}/v1/tpay/payments/${transactionId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: AbortSignal.timeout(30000),
        },
      );

      const data = await response.json();

      if (!response.ok || data.error) {
        this.logger.error(
          `TBC TPay confirmPayment failed: ${JSON.stringify(data)}`,
        );
        return {
          success: false,
          transactionId,
          status: 'failed',
          gatewayResponse: data,
        };
      }

      const statusMap: Record<string, 'completed' | 'pending' | 'failed'> = {
        Succeeded: 'completed',
        Created: 'pending',
        Processing: 'pending',
        Failed: 'failed',
        Expired: 'failed',
      };

      return {
        success: data.status === 'Succeeded',
        transactionId,
        status: statusMap[data.status] || 'failed',
        gatewayResponse: data,
      };
    } catch (error) {
      this.logger.error(
        `TBC TPay confirmPayment error: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        success: false,
        transactionId,
        status: 'failed',
        gatewayResponse: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  async processRefund(params: {
    transactionId: string;
    amount: number;
    reason?: string;
  }): Promise<RefundResult> {
    if (this.useMock) {
      return this.mockProcessRefund(params);
    }

    try {
      const token = await this.getAccessToken();

      const response = await fetch(
        `${this.baseUrl}/v1/tpay/payments/${params.transactionId}/refund`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount: params.amount,
            reason: params.reason,
          }),
          signal: AbortSignal.timeout(30000),
        },
      );

      const data = await response.json();

      if (!response.ok || data.error) {
        this.logger.error(
          `TBC TPay processRefund failed: ${JSON.stringify(data)}`,
        );
        return {
          success: false,
          transactionId: params.transactionId,
          refundedAmount: 0,
          gatewayResponse: data,
        };
      }

      return {
        success: true,
        transactionId: params.transactionId,
        refundedAmount: params.amount,
        gatewayResponse: data,
      };
    } catch (error) {
      this.logger.error(
        `TBC TPay processRefund error: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        success: false,
        transactionId: params.transactionId,
        refundedAmount: 0,
        gatewayResponse: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  async getTransactionStatus(
    transactionId: string,
  ): Promise<PaymentGatewayResult> {
    if (this.useMock) {
      return this.mockGetTransactionStatus(transactionId);
    }

    try {
      const token = await this.getAccessToken();

      const response = await fetch(
        `${this.baseUrl}/v1/tpay/payments/${transactionId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: AbortSignal.timeout(30000),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          transactionId,
          status: 'failed',
          gatewayResponse: data,
        };
      }

      const statusMap: Record<string, 'completed' | 'pending' | 'failed'> = {
        Succeeded: 'completed',
        Created: 'pending',
        Processing: 'pending',
        Failed: 'failed',
        Expired: 'failed',
      };

      return {
        success: true,
        transactionId,
        status: statusMap[data.status] || 'failed',
        gatewayResponse: data,
      };
    } catch (error) {
      this.logger.error(
        `TBC TPay getTransactionStatus error: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        success: false,
        transactionId,
        status: 'failed',
        gatewayResponse: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  // ─── Mock Fallbacks ────────────────────────────────────────────

  private async mockInitializePayment(params: {
    amount: number;
    currency: string;
    orderId: string;
    description: string;
  }): Promise<PaymentGatewayResult> {
    const transactionId = `tbc_mock_${uuidv4()}`;
    this.logger.log(
      `[TBC MOCK] Initializing payment: orderId=${params.orderId}, amount=${params.amount} ${params.currency}`,
    );
    return {
      success: true,
      transactionId,
      status: 'completed',
      gatewayResponse: {
        message: 'TBC TPay mock payment processed',
        timestamp: new Date().toISOString(),
      },
    };
  }

  private async mockConfirmPayment(
    transactionId: string,
  ): Promise<PaymentGatewayResult> {
    this.logger.log(`[TBC MOCK] Confirming payment: ${transactionId}`);
    return {
      success: true,
      transactionId,
      status: 'completed',
      gatewayResponse: {
        message: 'TBC TPay mock payment confirmed',
        confirmedAt: new Date().toISOString(),
      },
    };
  }

  private async mockProcessRefund(params: {
    transactionId: string;
    amount: number;
    reason?: string;
  }): Promise<RefundResult> {
    this.logger.log(
      `[TBC MOCK] Processing refund: transactionId=${params.transactionId}, amount=${params.amount}`,
    );
    return {
      success: true,
      transactionId: params.transactionId,
      refundedAmount: params.amount,
      gatewayResponse: {
        message: 'TBC TPay mock refund processed',
        timestamp: new Date().toISOString(),
      },
    };
  }

  private async mockGetTransactionStatus(
    transactionId: string,
  ): Promise<PaymentGatewayResult> {
    this.logger.log(`[TBC MOCK] Getting status: ${transactionId}`);
    return {
      success: true,
      transactionId,
      status: 'completed',
      gatewayResponse: {
        message: 'TBC TPay mock transaction status',
        checkedAt: new Date().toISOString(),
      },
    };
  }
}
