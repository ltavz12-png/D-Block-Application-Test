import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntityWithCreator } from './base.entity';
import { User } from './user.entity';
import { Contract } from './contract.entity';
import { CreditPackage } from './credit-package.entity';
import { Location } from './location.entity';

export enum CompanyStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive',
}

@Entity('companies')
export class Company extends BaseEntityWithCreator {
  @Column({ length: 255 })
  name: string;

  @Column({ name: 'tax_id', length: 50, nullable: true })
  taxId: string | null;

  @Column({ name: 'registration_number', length: 100, nullable: true })
  registrationNumber: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ name: 'contact_person_name', length: 255, nullable: true })
  contactPersonName: string | null;

  @Column({ name: 'contact_email', length: 255, nullable: true })
  contactEmail: string | null;

  @Column({ name: 'contact_phone', length: 20, nullable: true })
  contactPhone: string | null;

  @Column({ name: 'location_id', type: 'uuid' })
  locationId: string;

  @ManyToOne(() => Location)
  @JoinColumn({ name: 'location_id' })
  location: Location;

  @Column({
    type: 'enum',
    enum: CompanyStatus,
    default: CompanyStatus.ACTIVE,
  })
  status: CompanyStatus;

  @Column({ name: 'billing_email', length: 255, nullable: true })
  billingEmail: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @OneToMany(() => User, (user) => user.company)
  employees: User[];

  @OneToMany(() => Contract, (contract) => contract.company)
  contracts: Contract[];

  @OneToMany(() => CreditPackage, (pkg) => pkg.company)
  creditPackages: CreditPackage[];
}
