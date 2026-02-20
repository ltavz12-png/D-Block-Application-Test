import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Resource } from './resource.entity';

export enum BookingStatus {
  HELD = 'held',
  CONFIRMED = 'confirmed',
  CHECKED_IN = 'checked_in',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum BookingPaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
  CREDIT_USED = 'credit_used',
  INCLUDED_IN_PASS = 'included_in_pass',
}

@Entity('bookings')
export class Booking extends BaseEntity {
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.bookings)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Index()
  @Column({ name: 'resource_id', type: 'uuid' })
  resourceId: string;

  @ManyToOne(() => Resource, (resource) => resource.bookings)
  @JoinColumn({ name: 'resource_id' })
  resource: Resource;

  @Index()
  @Column({ name: 'start_time', type: 'timestamptz' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamptz' })
  endTime: Date;

  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.HELD })
  status: BookingStatus;

  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: BookingPaymentStatus,
    default: BookingPaymentStatus.PENDING,
  })
  paymentStatus: BookingPaymentStatus;

  @Column({ name: 'payment_id', type: 'uuid', nullable: true })
  paymentId: string | null;

  @Column({ name: 'pass_id', type: 'uuid', nullable: true })
  passId: string | null;

  @Column({ name: 'credit_transaction_id', type: 'uuid', nullable: true })
  creditTransactionId: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'total_amount' })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'discount_amount' })
  discountAmount: number;

  @Column({ length: 10, default: 'GEL' })
  currency: string;

  @Column({ name: 'promo_code_id', type: 'uuid', nullable: true })
  promoCodeId: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  @Column({ name: 'cancelled_by', type: 'uuid', nullable: true })
  cancelledBy: string | null;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason: string | null;

  @Column({ name: 'checked_in_at', type: 'timestamptz', nullable: true })
  checkedInAt: Date | null;

  @Column({ name: 'checked_out_at', type: 'timestamptz', nullable: true })
  checkedOutAt: Date | null;

  @Column({
    name: 'calendar_event_id',
    type: 'text',
    nullable: true,
  })
  calendarEventId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;
}
