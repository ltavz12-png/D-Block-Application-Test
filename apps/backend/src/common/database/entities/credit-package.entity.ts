import { Entity, Column, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Company } from './company.entity';
import { CreditTransaction } from './credit-transaction.entity';

export enum CreditPackageStatus {
  ACTIVE = 'active',
  EXHAUSTED = 'exhausted',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

@Entity('credit_packages')
export class CreditPackage extends BaseEntity {
  @Index()
  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @ManyToOne(() => Company, (company) => company.creditPackages)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'total_minutes', type: 'int' })
  totalMinutes: number;

  @Column({ name: 'used_minutes', type: 'int', default: 0 })
  usedMinutes: number;

  @Column({ name: 'remaining_minutes', type: 'int' })
  remainingMinutes: number;

  @Column({ name: 'purchase_price', type: 'decimal', precision: 10, scale: 2 })
  purchasePrice: number;

  @Column({ length: 10, default: 'GEL' })
  currency: string;

  @Column({ name: 'payment_id', type: 'uuid', nullable: true })
  paymentId: string | null;

  @Column({
    type: 'enum',
    enum: CreditPackageStatus,
    default: CreditPackageStatus.ACTIVE,
  })
  status: CreditPackageStatus;

  @Column({ name: 'purchased_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  purchasedAt: Date;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @OneToMany(() => CreditTransaction, (tx) => tx.creditPackage)
  transactions: CreditTransaction[];
}
