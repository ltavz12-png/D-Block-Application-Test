import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntityWithCreator } from './base.entity';
import { PromoCode } from './promo-code.entity';

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
}

@Entity('promotions')
export class Promotion extends BaseEntityWithCreator {
  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'jsonb',
    name: 'rules',
  })
  rules: {
    conditions: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
    logic: 'AND' | 'OR';
  };

  @Column({ type: 'enum', enum: DiscountType, name: 'discount_type' })
  discountType: DiscountType;

  @Column({ name: 'discount_value', type: 'decimal', precision: 10, scale: 2 })
  discountValue: number;

  @Column({ name: 'max_discount_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxDiscountAmount: number | null;

  @Column({ name: 'valid_from', type: 'timestamptz' })
  validFrom: Date;

  @Column({ name: 'valid_until', type: 'timestamptz', nullable: true })
  validUntil: Date | null;

  @Column({ name: 'usage_limit', type: 'int', nullable: true })
  usageLimit: number | null;

  @Column({ name: 'usage_count', type: 'int', default: 0 })
  usageCount: number;

  @Column({ name: 'per_user_limit', type: 'int', nullable: true })
  perUserLimit: number | null;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ name: 'location_ids', type: 'uuid', array: true, nullable: true })
  locationIds: string[] | null;

  @Column({ name: 'product_ids', type: 'uuid', array: true, nullable: true })
  productIds: string[] | null;

  @OneToMany(() => PromoCode, (code) => code.promotion)
  promoCodes: PromoCode[];
}
