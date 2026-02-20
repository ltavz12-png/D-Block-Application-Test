import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Promotion } from './promotion.entity';

@Entity('promo_codes')
export class PromoCode extends BaseEntity {
  @Index({ unique: true })
  @Column({ length: 50 })
  code: string;

  @Column({ name: 'promotion_id', type: 'uuid' })
  promotionId: string;

  @ManyToOne(() => Promotion, (promo) => promo.promoCodes)
  @JoinColumn({ name: 'promotion_id' })
  promotion: Promotion;

  @Column({ name: 'max_uses', type: 'int', nullable: true })
  maxUses: number | null;

  @Column({ name: 'times_used', type: 'int', default: 0 })
  timesUsed: number;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ name: 'valid_from', type: 'timestamptz', nullable: true })
  validFrom: Date | null;

  @Column({ name: 'valid_until', type: 'timestamptz', nullable: true })
  validUntil: Date | null;
}
