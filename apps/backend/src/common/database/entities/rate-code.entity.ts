import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntityWithCreator } from './base.entity';
import { Product } from './product.entity';

@Entity('rate_codes')
export class RateCode extends BaseEntityWithCreator {
  @Column({ length: 100 })
  code: string;

  @Column({ length: 255 })
  name: string;

  @Column({ name: 'name_ka', type: 'varchar', length: 255, nullable: true })
  nameKa: string | null;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product, (product) => product.rateCodes)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 10, default: 'GEL' })
  currency: string;

  @Column({ name: 'tax_inclusive', default: true })
  taxInclusive: boolean;

  @Column({ name: 'tax_rate', type: 'decimal', precision: 5, scale: 2, default: 18 })
  taxRate: number;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  conditions: {
    validFrom?: string;
    validUntil?: string;
    minQuantity?: number;
    locationIds?: string[];
  } | null;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;
}
