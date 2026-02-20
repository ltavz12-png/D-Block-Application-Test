import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import {
  IPaymentGateway,
  PaymentGatewayResult,
  RefundResult,
} from './payment-gateway.interface';

@Injectable()
export class MockGateway implements IPaymentGateway {
  private readonly logger = new Logger(MockGateway.name);
  private readonly failRate: number;

  constructor(private readonly configService: ConfigService) {
    this.failRate = parseFloat(
      this.configService.get<string>('MOCK_PAYMENT_FAIL_RATE', '0.05'),
    );
    this.logger.log(
      `Mock payment gateway initialized (fail rate: ${this.failRate * 100}%)`,
    );
  }

  private shouldFail(): boolean {
    return Math.random() < this.failRate;
  }

  async initializePayment(params: {
    amount: number;
    currency: string;
    orderId: string;
    description: string;
    returnUrl?: string;
    customerEmail?: string;
  }): Promise<PaymentGatewayResult> {
    const transactionId = `mock_${uuidv4()}`;

    this.logger.log(
      `[MOCK PAYMENT] Initializing payment: ${JSON.stringify({
        transactionId,
        amount: params.amount,
        currency: params.currency,
        orderId: params.orderId,
        description: params.description,
      })}`,
    );

    if (this.shouldFail()) {
      this.logger.warn(
        `[MOCK PAYMENT] Simulated failure for order ${params.orderId}`,
      );
      return {
        success: false,
        transactionId,
        status: 'failed',
        gatewayResponse: {
          message: 'Simulated payment failure',
          errorCode: 'MOCK_FAILURE',
          timestamp: new Date().toISOString(),
        },
      };
    }

    return {
      success: true,
      transactionId,
      status: 'completed',
      gatewayResponse: {
        message: 'Payment processed successfully (mock)',
        amount: params.amount,
        currency: params.currency,
        timestamp: new Date().toISOString(),
      },
    };
  }

  async confirmPayment(transactionId: string): Promise<PaymentGatewayResult> {
    this.logger.log(
      `[MOCK PAYMENT] Confirming payment: ${transactionId}`,
    );

    return {
      success: true,
      transactionId,
      status: 'completed',
      gatewayResponse: {
        message: 'Payment confirmed (mock)',
        confirmedAt: new Date().toISOString(),
      },
    };
  }

  async processRefund(params: {
    transactionId: string;
    amount: number;
    reason?: string;
  }): Promise<RefundResult> {
    this.logger.log(
      `[MOCK PAYMENT] Processing refund: ${JSON.stringify({
        transactionId: params.transactionId,
        amount: params.amount,
        reason: params.reason,
      })}`,
    );

    return {
      success: true,
      transactionId: params.transactionId,
      refundedAmount: params.amount,
      gatewayResponse: {
        message: 'Refund processed successfully (mock)',
        refundId: `mock_refund_${uuidv4()}`,
        reason: params.reason || 'No reason provided',
        timestamp: new Date().toISOString(),
      },
    };
  }

  async getTransactionStatus(
    transactionId: string,
  ): Promise<PaymentGatewayResult> {
    this.logger.log(
      `[MOCK PAYMENT] Getting transaction status: ${transactionId}`,
    );

    return {
      success: true,
      transactionId,
      status: 'completed',
      gatewayResponse: {
        message: 'Transaction found (mock)',
        checkedAt: new Date().toISOString(),
      },
    };
  }
}
