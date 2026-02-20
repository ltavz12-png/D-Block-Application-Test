import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntityWithCreator } from './base.entity';
import { User } from './user.entity';
import { Company } from './company.entity';

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  CREDITED = 'credited',
}

@Entity('invoices')
export class Invoice extends BaseEntityWithCreator {
  @Column({ name: 'invoice_number', length: 50, unique: true })
  invoiceNumber: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Index()
  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId: string | null;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company | null;

  @Column({
    type: 'jsonb',
    name: 'line_items',
  })
  lineItems: Array<{
    description: string;
    descriptionKa: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    taxRate: number;
    taxAmount: number;
    productId?: string;
  }>;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'subtotal' })
  subtotal: number;

  @Column({ name: 'tax_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ length: 10, default: 'GEL' })
  currency: string;

  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.DRAFT })
  status: InvoiceStatus;

  @Column({ name: 'issue_date', type: 'date' })
  issueDate: Date;

  @Column({ name: 'due_date', type: 'date' })
  dueDate: Date;

  @Column({ name: 'paid_date', type: 'date', nullable: true })
  paidDate: Date | null;

  @Column({ name: 'payment_id', type: 'uuid', nullable: true })
  paymentId: string | null;

  @Column({ name: 'period_start', type: 'date', nullable: true })
  periodStart: Date | null;

  @Column({ name: 'period_end', type: 'date', nullable: true })
  periodEnd: Date | null;

  @Column({ name: 'pdf_url', type: 'text', nullable: true })
  pdfUrl: string | null;

  @Column({ length: 5, default: 'en' })
  language: string;

  @Column({ name: 'bc_synced', default: false })
  bcSynced: boolean;

  @Column({ name: 'bc_sync_error', type: 'text', nullable: true })
  bcSyncError: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;
}
