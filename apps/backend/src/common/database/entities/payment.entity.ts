import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  BOG_CARD = 'bog_card',
  TBC_CARD = 'tbc_card',
  APPLE_PAY = 'apple_pay',
  GOOGLE_PAY = 'google_pay',
  BANK_TRANSFER = 'bank_transfer',
}

export enum PaymentGateway {
  BOG_IPAY = 'bog_ipay',
  TBC_TPAY = 'tbc_tpay',
  MOCK = 'mock',
}

@Entity('payments')
export class Payment extends BaseEntity {
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 10, default: 'GEL' })
  currency: string;

  @Column({ type: 'enum', enum: PaymentMethod, name: 'payment_method' })
  paymentMethod: PaymentMethod;

  @Column({ type: 'enum', enum: PaymentGateway, name: 'payment_gateway' })
  paymentGateway: PaymentGateway;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ name: 'gateway_transaction_id', type: 'varchar', length: 500, nullable: true })
  gatewayTransactionId: string | null;

  @Column({ name: 'gateway_response', type: 'jsonb', nullable: true })
  gatewayResponse: Record<string, any> | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'refund_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  refundAmount: number;

  @Column({ name: 'refunded_at', type: 'timestamptz', nullable: true })
  refundedAt: Date | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'tax_amount' })
  taxAmount: number;

  @Column({ name: 'tax_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxRate: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;
}
