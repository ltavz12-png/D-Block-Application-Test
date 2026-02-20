import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import {
  IPaymentGateway,
  PaymentGatewayResult,
  RefundResult,
} from './payment-gateway.interface';

@Injectable()
export class BogIpayGateway implements IPaymentGateway {
  private readonly logger = new Logger(BogIpayGateway.name);
  private readonly clientId: string | undefined;
  private readonly secret: string | undefined;
  private readonly merchantId: string | undefined;
  private readonly baseUrl: string | undefined;
  private readonly useMock: boolean;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('BOG_IPAY_CLIENT_ID');
    this.secret = this.configService.get<string>('BOG_IPAY_SECRET');
    this.merchantId = this.configService.get<string>('BOG_IPAY_MERCHANT_ID');
    this.baseUrl = this.configService.get<string>('BOG_IPAY_BASE_URL');

    this.useMock = !this.clientId || !this.secret || !this.merchantId;

    if (this.useMock) {
      this.logger.warn(
        'BOG iPay credentials not configured — falling back to mock behavior. ' +
          'Set BOG_IPAY_CLIENT_ID, BOG_IPAY_SECRET, and BOG_IPAY_MERCHANT_ID to enable real payments.',
      );
    } else {
      this.logger.log(
        `BOG iPay gateway initialized (baseUrl: ${this.baseUrl})`,
      );
    }
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
      const response = await fetch(
        `${this.baseUrl}/payment/rest/register.do`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.secret}`).toString('base64')}`,
          },
          body: JSON.stringify({
            merchantId: this.merchantId,
            amount: Math.round(params.amount * 100),
            currency: params.currency,
            orderNumber: params.orderId,
            description: params.description,
            returnUrl: params.returnUrl,
            clientEmail: params.customerEmail,
            language: 'ka',
          }),
          signal: AbortSignal.timeout(30000),
        },
      );

      const data = await response.json();

      if (!response.ok || data.errorCode) {
        this.logger.error(
          `BOG iPay initializePayment failed: ${JSON.stringify(data)}`,
        );
        return {
          success: false,
          transactionId: data.orderId || params.orderId,
          status: 'failed',
          gatewayResponse: data,
        };
      }

      return {
        success: true,
        transactionId: data.orderId,
        status: 'pending',
        gatewayResponse: data,
        redirectUrl: data.formUrl,
      };
    } catch (error) {
      this.logger.error(
        `BOG iPay initializePayment error: ${error instanceof Error ? error.message : String(error)}`,
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
      const response = await fetch(
        `${this.baseUrl}/payment/rest/getOrderStatusExtended.do`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.secret}`).toString('base64')}`,
          },
          body: JSON.stringify({
            merchantId: this.merchantId,
            orderId: transactionId,
          }),
          signal: AbortSignal.timeout(30000),
        },
      );

      const data = await response.json();

      if (!response.ok || data.errorCode) {
        this.logger.error(
          `BOG iPay confirmPayment failed: ${JSON.stringify(data)}`,
        );
        return {
          success: false,
          transactionId,
          status: 'failed',
          gatewayResponse: data,
        };
      }

      const statusMap: Record<number, 'completed' | 'pending' | 'failed'> = {
        2: 'completed',
        1: 'pending',
        0: 'pending',
      };

      return {
        success: data.orderStatus === 2,
        transactionId,
        status: statusMap[data.orderStatus] || 'failed',
        gatewayResponse: data,
      };
    } catch (error) {
      this.logger.error(
        `BOG iPay confirmPayment error: ${error instanceof Error ? error.message : String(error)}`,
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
      const response = await fetch(`${this.baseUrl}/payment/rest/refund.do`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.secret}`).toString('base64')}`,
        },
        body: JSON.stringify({
          merchantId: this.merchantId,
          orderId: params.transactionId,
          amount: Math.round(params.amount * 100),
        }),
        signal: AbortSignal.timeout(30000),
      });

      const data = await response.json();

      if (!response.ok || data.errorCode) {
        this.logger.error(
          `BOG iPay processRefund failed: ${JSON.stringify(data)}`,
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
        `BOG iPay processRefund error: ${error instanceof Error ? error.message : String(error)}`,
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
      const response = await fetch(
        `${this.baseUrl}/payment/rest/getOrderStatusExtended.do`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.secret}`).toString('base64')}`,
          },
          body: JSON.stringify({
            merchantId: this.merchantId,
            orderId: transactionId,
          }),
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

      const statusMap: Record<number, 'completed' | 'pending' | 'failed'> = {
        2: 'completed',
        1: 'pending',
        0: 'pending',
      };

      return {
        success: true,
        transactionId,
        status: statusMap[data.orderStatus] || 'failed',
        gatewayResponse: data,
      };
    } catch (error) {
      this.logger.error(
        `BOG iPay getTransactionStatus error: ${error instanceof Error ? error.message : String(error)}`,
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
    const transactionId = `bog_mock_${uuidv4()}`;
    this.logger.log(
      `[BOG MOCK] Initializing payment: orderId=${params.orderId}, amount=${params.amount} ${params.currency}`,
    );
    return {
      success: true,
      transactionId,
      status: 'completed',
      gatewayResponse: {
        message: 'BOG iPay mock payment processed',
        timestamp: new Date().toISOString(),
      },
    };
  }

  private async mockConfirmPayment(
    transactionId: string,
  ): Promise<PaymentGatewayResult> {
    this.logger.log(`[BOG MOCK] Confirming payment: ${transactionId}`);
    return {
      success: true,
      transactionId,
      status: 'completed',
      gatewayResponse: {
        message: 'BOG iPay mock payment confirmed',
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
      `[BOG MOCK] Processing refund: transactionId=${params.transactionId}, amount=${params.amount}`,
    );
    return {
      success: true,
      transactionId: params.transactionId,
      refundedAmount: params.amount,
      gatewayResponse: {
        message: 'BOG iPay mock refund processed',
        timestamp: new Date().toISOString(),
      },
    };
  }

  private async mockGetTransactionStatus(
    transactionId: string,
  ): Promise<PaymentGatewayResult> {
    this.logger.log(`[BOG MOCK] Getting status: ${transactionId}`);
    return {
      success: true,
      transactionId,
      status: 'completed',
      gatewayResponse: {
        message: 'BOG iPay mock transaction status',
        checkedAt: new Date().toISOString(),
      },
    };
  }
}
