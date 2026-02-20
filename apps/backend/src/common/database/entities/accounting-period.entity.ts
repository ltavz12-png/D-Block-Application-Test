import { Entity, Column, Index } from 'typeorm';
import { BaseEntityWithCreator } from './base.entity';

export enum PeriodStatus {
  OPEN = 'open',
  CLOSING = 'closing',
  CLOSED = 'closed',
}

@Entity('accounting_periods')
export class AccountingPeriod extends BaseEntityWithCreator {
  @Column({ length: 20, unique: true })
  name: string;

  @Index()
  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @Column({ type: 'enum', enum: PeriodStatus, default: PeriodStatus.OPEN })
  status: PeriodStatus;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt: Date | null;

  @Column({ name: 'closed_by', type: 'uuid', nullable: true })
  closedBy: string | null;

  @Column({ type: 'text', nullable: true, name: 'closing_notes' })
  closingNotes: string | null;
}
