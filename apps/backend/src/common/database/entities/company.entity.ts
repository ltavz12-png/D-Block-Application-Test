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

  @Column({ name: 'tax_id', type: 'varchar', length: 50, nullable: true })
  taxId: string | null;

  @Column({ name: 'registration_number', type: 'varchar', length: 100, nullable: true })
  registrationNumber: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ name: 'contact_person_name', type: 'varchar', length: 255, nullable: true })
  contactPersonName: string | null;

  @Column({ name: 'contact_email', type: 'varchar', length: 255, nullable: true })
  contactEmail: string | null;

  @Column({ name: 'contact_phone', type: 'varchar', length: 20, nullable: true })
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

  @Column({ name: 'billing_email', type: 'varchar', length: 255, nullable: true })
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
