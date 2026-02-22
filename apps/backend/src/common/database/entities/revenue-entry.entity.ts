import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum RevenueEntryType {
  RECOGNITION = 'recognition',
  REVERSAL = 'reversal',
  ADJUSTMENT = 'adjustment',
}

@Entity('revenue_recognition_entries')
export class RevenueEntry extends BaseEntity {
  @Column({ name: 'source_type', length: 50 })
  sourceType: string;

  @Column({ name: 'source_id', type: 'uuid' })
  sourceId: string;

  @Index()
  @Column({ type: 'date' })
  date: Date;

  @Column({
    type: 'enum',
    enum: RevenueEntryType,
    name: 'entry_type',
    default: RevenueEntryType.RECOGNITION,
  })
  entryType: RevenueEntryType;

  @Column({ name: 'recognized_amount', type: 'decimal', precision: 10, scale: 4 })
  recognizedAmount: number;

  @Column({ name: 'deferred_remaining', type: 'decimal', precision: 10, scale: 4 })
  deferredRemaining: number;

  @Column({ name: 'total_contract_value', type: 'decimal', precision: 10, scale: 2 })
  totalContractValue: number;

  @Column({ length: 10, default: 'GEL' })
  currency: string;

  @Column({ name: 'location_id', type: 'uuid', nullable: true })
  locationId: string | null;

  @Column({ name: 'product_type', type: 'varchar', length: 50, nullable: true })
  productType: string | null;

  @Index()
  @Column({ name: 'accounting_period_id', type: 'uuid', nullable: true })
  accountingPeriodId: string | null;

  @Column({ name: 'bc_journal_entry_ref', type: 'varchar', length: 255, nullable: true })
  bcJournalEntryRef: string | null;

  @Column({ name: 'bc_synced', default: false })
  bcSynced: boolean;

  @Column({ type: 'jsonb', nullable: true, name: 'calculation_details' })
  calculationDetails: {
    dailyRate: number;
    totalDays: number;
    daysElapsed: number;
    daysRemaining: number;
    periodStart: string;
    periodEnd: string;
  } | null;
}
