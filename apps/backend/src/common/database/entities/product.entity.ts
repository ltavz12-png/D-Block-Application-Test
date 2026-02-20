import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntityWithCreator } from './base.entity';
import { Location } from './location.entity';
import { RateCode } from './rate-code.entity';

export enum ProductType {
  COWORKING_PASS = 'coworking_pass',
  BOX = 'box',
  OFFICE = 'office',
  MEETING_ROOM = 'meeting_room',
  PARKING = 'parking',
  LOCKER = 'locker',
  EVENT_SPACE = 'event_space',
  CREDIT_PACKAGE = 'credit_package',
}

export enum BillingPeriod {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUALLY = 'annually',
  ONE_TIME = 'one_time',
}

@Entity('products')
export class Product extends BaseEntityWithCreator {
  @Column({ length: 255 })
  name: string;

  @Column({ name: 'name_ka', length: 255, nullable: true })
  nameKa: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'description_ka', type: 'text', nullable: true })
  descriptionKa: string | null;

  @Column({ type: 'enum', enum: ProductType, name: 'product_type' })
  productType: ProductType;

  @Column({ name: 'location_id', type: 'uuid', nullable: true })
  locationId: string | null;

  @ManyToOne(() => Location)
  @JoinColumn({ name: 'location_id' })
  location: Location | null;

  @Column({ type: 'enum', enum: BillingPeriod, name: 'billing_period' })
  billingPeriod: BillingPeriod;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @Column({
    type: 'jsonb',
    nullable: true,
    name: 'included_resources',
  })
  includedResources: {
    resourceType: string;
    hoursPerMonth?: number;
    description?: string;
  }[] | null;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  features: string[] | null;

  @Column({ type: 'int', default: 0, name: 'sort_order' })
  sortOrder: number;

  @OneToMany(() => RateCode, (rate) => rate.product)
  rateCodes: RateCode[];
}
