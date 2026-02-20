export interface PaymentGatewayResult {
  success: boolean;
  transactionId: string;
  status: 'completed' | 'pending' | 'failed';
  gatewayResponse: Record<string, any>;
  redirectUrl?: string;
}

export interface RefundResult {
  success: boolean;
  transactionId: string;
  refundedAmount: number;
  gatewayResponse: Record<string, any>;
}

export interface IPaymentGateway {
  initializePayment(params: {
    amount: number;
    currency: string;
    orderId: string;
    description: string;
    returnUrl?: string;
    customerEmail?: string;
  }): Promise<PaymentGatewayResult>;

  confirmPayment(transactionId: string): Promise<PaymentGatewayResult>;

  processRefund(params: {
    transactionId: string;
    amount: number;
    reason?: string;
  }): Promise<RefundResult>;

  getTransactionStatus(transactionId: string): Promise<PaymentGatewayResult>;
}
