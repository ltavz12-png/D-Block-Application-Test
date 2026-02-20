import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { CreditPackage } from './credit-package.entity';
import { User } from './user.entity';
import { Booking } from './booking.entity';

export enum CreditTransactionType {
  DEDUCTION = 'deduction',
  REFUND = 'refund',
  ALLOCATION = 'allocation',
  ADJUSTMENT = 'adjustment',
}

@Entity('credit_transactions')
export class CreditTransaction extends BaseEntity {
  @Index()
  @Column({ name: 'credit_package_id', type: 'uuid' })
  creditPackageId: string;

  @ManyToOne(() => CreditPackage, (pkg) => pkg.transactions)
  @JoinColumn({ name: 'credit_package_id' })
  creditPackage: CreditPackage;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'booking_id', type: 'uuid', nullable: true })
  bookingId: string | null;

  @ManyToOne(() => Booking)
  @JoinColumn({ name: 'booking_id' })
  booking: Booking | null;

  @Column({
    type: 'enum',
    enum: CreditTransactionType,
    name: 'transaction_type',
  })
  transactionType: CreditTransactionType;

  @Column({ type: 'int' })
  minutes: number;

  @Column({ name: 'balance_after', type: 'int' })
  balanceAfter: number;

  @Column({ type: 'text', nullable: true })
  description: string | null;
}
