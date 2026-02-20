import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntityWithCreator } from './base.entity';
import { Company } from './company.entity';
import { Location } from './location.entity';

export enum ContractStatus {
  DRAFT = 'draft',
  PENDING_SIGNATURE = 'pending_signature',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  TERMINATED = 'terminated',
  RENEWED = 'renewed',
}

export enum ContractType {
  RENTAL = 'rental',
  COWORKING = 'coworking',
  B2B_SERVICE = 'b2b_service',
}

@Entity('contracts')
export class Contract extends BaseEntityWithCreator {
  @Column({ name: 'contract_number', length: 50, unique: true })
  contractNumber: string;

  @Index()
  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @ManyToOne(() => Company, (company) => company.contracts)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'location_id', type: 'uuid' })
  locationId: string;

  @ManyToOne(() => Location)
  @JoinColumn({ name: 'location_id' })
  location: Location;

  @Column({ type: 'enum', enum: ContractType, name: 'contract_type' })
  contractType: ContractType;

  @Column({ type: 'enum', enum: ContractStatus, default: ContractStatus.DRAFT })
  status: ContractStatus;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @Column({ name: 'auto_renew', default: false })
  autoRenew: boolean;

  @Column({ name: 'notice_period_days', type: 'int', default: 30 })
  noticePeriodDays: number;

  @Column({ name: 'area_sqm', type: 'decimal', precision: 10, scale: 2, nullable: true })
  areaSqm: number | null;

  @Column({ name: 'price_per_sqm', type: 'decimal', precision: 10, scale: 2, nullable: true })
  pricePerSqm: number | null;

  @Column({ name: 'monthly_amount', type: 'decimal', precision: 10, scale: 2 })
  monthlyAmount: number;

  @Column({ length: 10, default: 'GEL' })
  currency: string;

  @Column({ name: 'resource_ids', type: 'uuid', array: true, default: () => `'{}'` })
  resourceIds: string[];

  @Column({ name: 'document_url', type: 'text', nullable: true })
  documentUrl: string | null;

  @Column({ name: 'signed_at', type: 'timestamptz', nullable: true })
  signedAt: Date | null;

  @Column({ name: 'signed_by_company', length: 255, nullable: true })
  signedByCompany: string | null;

  @Column({ name: 'signed_by_dblock', length: 255, nullable: true })
  signedByDblock: string | null;

  @Column({ name: 'docusign_envelope_id', length: 255, nullable: true })
  docusignEnvelopeId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  terms: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;
}
