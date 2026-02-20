import { randomUUID } from 'crypto';
import {
  Payment,
  PaymentStatus,
  PaymentMethod,
  PaymentGateway,
} from '@/common/database/entities/payment.entity';

/**
 * Creates a mock Payment entity with sensible defaults.
 */
export function createMockPayment(
  overrides: Partial<Payment> = {},
): Payment {
  const now = new Date();

  return {
    id: randomUUID(),
    userId: randomUUID(),
    user: undefined as any,
    companyId: null,
    amount: 50,
    currency: 'GEL',
    paymentMethod: PaymentMethod.BOG_CARD,
    paymentGateway: PaymentGateway.BOG_IPAY,
    status: PaymentStatus.COMPLETED,
    gatewayTransactionId: `txn_${randomUUID().slice(0, 8)}`,
    gatewayResponse: null,
    description: 'Meeting room booking payment',
    refundAmount: 0,
    refundedAt: null,
    taxAmount: 0,
    taxRate: 0,
    metadata: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  } as Payment;
}

/**
 * Creates a mock Payment with PENDING status.
 */
export function createMockPendingPayment(
  overrides: Partial<Payment> = {},
): Payment {
  return createMockPayment({
    status: PaymentStatus.PENDING,
    gatewayTransactionId: null,
    ...overrides,
  });
}

/**
 * Creates a mock Payment with FAILED status.
 */
export function createMockFailedPayment(
  overrides: Partial<Payment> = {},
): Payment {
  return createMockPayment({
    status: PaymentStatus.FAILED,
    gatewayResponse: { error: 'Insufficient funds', code: 'DECLINED' },
    ...overrides,
  });
}

/**
 * Creates a mock Payment with REFUNDED status.
 */
export function createMockRefundedPayment(
  overrides: Partial<Payment> = {},
): Payment {
  const amount = overrides.amount ?? 50;

  return createMockPayment({
    status: PaymentStatus.REFUNDED,
    refundAmount: amount,
    refundedAt: new Date(),
    ...overrides,
  });
}
