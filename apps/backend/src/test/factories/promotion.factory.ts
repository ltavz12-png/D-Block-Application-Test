import { randomUUID } from 'crypto';
import {
  Promotion,
  DiscountType,
} from '@/common/database/entities/promotion.entity';
import { PromoCode } from '@/common/database/entities/promo-code.entity';

/**
 * Creates a mock Promotion entity with sensible defaults.
 * Valid from now, valid until 30 days from now.
 */
export function createMockPromotion(
  overrides: Partial<Promotion> = {},
): Promotion {
  const now = new Date();
  const validUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  return {
    id: randomUUID(),
    name: 'Test Promotion',
    description: '10% off all meeting room bookings',
    rules: {
      conditions: [
        { field: 'resourceType', operator: 'eq', value: 'meeting_room' },
      ],
      logic: 'AND',
    },
    discountType: DiscountType.PERCENTAGE,
    discountValue: 10,
    maxDiscountAmount: 100,
    validFrom: now,
    validUntil,
    usageLimit: 100,
    usageCount: 0,
    perUserLimit: 3,
    isActive: true,
    locationIds: null,
    productIds: null,
    promoCodes: [],
    createdBy: null,
    updatedBy: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  } as Promotion;
}

/**
 * Creates a mock fixed-amount Promotion.
 */
export function createMockFixedDiscountPromotion(
  overrides: Partial<Promotion> = {},
): Promotion {
  return createMockPromotion({
    name: 'Fixed Discount Promotion',
    description: '20 GEL off your next booking',
    discountType: DiscountType.FIXED_AMOUNT,
    discountValue: 20,
    maxDiscountAmount: null,
    ...overrides,
  });
}

/**
 * Creates a mock PromoCode entity with sensible defaults.
 */
export function createMockPromoCode(
  overrides: Partial<PromoCode> = {},
): PromoCode {
  const now = new Date();
  const validUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  return {
    id: randomUUID(),
    code: `DBLOCK${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    promotionId: randomUUID(),
    promotion: undefined as any,
    maxUses: 50,
    timesUsed: 0,
    isActive: true,
    validFrom: now,
    validUntil,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  } as PromoCode;
}
