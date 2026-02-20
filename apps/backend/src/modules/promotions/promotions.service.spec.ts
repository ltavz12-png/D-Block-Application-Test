import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import {
  Promotion,
  DiscountType,
} from '@/common/database/entities/promotion.entity';
import { PromoCode } from '@/common/database/entities/promo-code.entity';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { GeneratePromoCodesDto } from './dto/generate-promo-codes.dto';
import { ValidatePromoCodeDto } from './dto/validate-promo-code.dto';
import { QueryPromotionsDto } from './dto/query-promotions.dto';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockUserId = 'user-0001-0001-0001-000000000001';
const mockPromotionId = 'promo-001-0001-0001-000000000001';
const mockPromoCodeId = 'code-0001-0001-0001-000000000001';
const mockLocationId = 'loc-00001-0001-0001-000000000001';
const mockProductId = 'prod-0001-0001-0001-000000000001';

function createMockPromotion(overrides: Partial<Promotion> = {}): Promotion {
  return {
    id: mockPromotionId,
    name: 'Summer Sale',
    description: 'Summer discount',
    rules: { conditions: [], logic: 'AND' as const },
    discountType: DiscountType.PERCENTAGE,
    discountValue: 20,
    maxDiscountAmount: 100,
    validFrom: new Date('2025-01-01'),
    validUntil: new Date('2025-12-31'),
    usageLimit: 1000,
    usageCount: 0,
    perUserLimit: 3,
    isActive: true,
    locationIds: null,
    productIds: null,
    promoCodes: [],
    createdBy: mockUserId,
    updatedBy: mockUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null as any,
    ...overrides,
  } as Promotion;
}

function createMockPromoCode(overrides: Partial<PromoCode> = {}): PromoCode {
  return {
    id: mockPromoCodeId,
    code: 'SUMMER2025',
    promotionId: mockPromotionId,
    promotion: undefined as any,
    maxUses: 100,
    timesUsed: 0,
    isActive: true,
    validFrom: new Date('2025-01-01'),
    validUntil: new Date('2025-12-31'),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null as any,
    ...overrides,
  } as PromoCode;
}

// ---------------------------------------------------------------------------
// Query builder mock factory
// ---------------------------------------------------------------------------

function createMockQueryBuilder(returnData?: any) {
  const qb: Record<string, jest.Mock> = {};
  const methods = [
    'leftJoinAndSelect',
    'where',
    'andWhere',
    'orderBy',
    'addOrderBy',
    'skip',
    'take',
    'select',
    'addSelect',
    'groupBy',
    'addGroupBy',
    'limit',
    'update',
    'set',
    'insert',
    'into',
    'values',
    'having',
  ];

  for (const method of methods) {
    qb[method] = jest.fn().mockReturnThis();
  }

  qb['getManyAndCount'] = jest.fn().mockResolvedValue(returnData ?? [[], 0]);
  qb['getMany'] = jest.fn().mockResolvedValue(returnData?.[0] ?? []);
  qb['getOne'] = jest.fn().mockResolvedValue(returnData ?? null);
  qb['getCount'] = jest.fn().mockResolvedValue(returnData ?? 0);
  qb['execute'] = jest.fn().mockResolvedValue(returnData ?? { affected: 0 });
  qb['getRawOne'] = jest.fn().mockResolvedValue(returnData ?? null);
  qb['getRawMany'] = jest.fn().mockResolvedValue(returnData ?? []);

  return qb;
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('PromotionsService', () => {
  let service: PromotionsService;
  let promotionRepo: Record<string, jest.Mock>;
  let promoCodeRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    promotionRepo = {
      create: jest.fn((dto) => ({ ...dto })),
      save: jest.fn((entity) =>
        Promise.resolve({ ...entity, id: entity.id || mockPromotionId }),
      ),
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: jest.fn(),
    };

    promoCodeRepo = {
      create: jest.fn((dto) => ({ ...dto })),
      save: jest.fn((entity) => {
        if (Array.isArray(entity)) {
          return Promise.resolve(
            entity.map((e, i) => ({ ...e, id: `code-gen-${i}` })),
          );
        }
        return Promise.resolve({ ...entity, id: entity.id || mockPromoCodeId });
      }),
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromotionsService,
        { provide: getRepositoryToken(Promotion), useValue: promotionRepo },
        { provide: getRepositoryToken(PromoCode), useValue: promoCodeRepo },
      ],
    }).compile();

    service = module.get<PromotionsService>(PromotionsService);
  });

  // =========================================================================
  // createPromotion
  // =========================================================================

  describe('createPromotion', () => {
    it('should create a promotion with rules', async () => {
      const dto: CreatePromotionDto = {
        name: 'VISA x FLEX',
        description: 'VISA discount',
        rules: {
          conditions: [
            { field: 'paymentMethod', operator: 'equals', value: 'visa' },
          ],
          logic: 'AND',
        },
        discountType: DiscountType.FIXED_AMOUNT,
        discountValue: 500,
        validFrom: '2025-06-01T00:00:00.000Z',
        validUntil: '2025-12-31T23:59:59.000Z',
        usageLimit: 1000,
        perUserLimit: 3,
        locationIds: [mockLocationId],
      };

      const result = await service.createPromotion(mockUserId, dto);

      expect(promotionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'VISA x FLEX',
          discountType: DiscountType.FIXED_AMOUNT,
          discountValue: 500,
          isActive: true,
          usageCount: 0,
          createdBy: mockUserId,
          updatedBy: mockUserId,
        }),
      );
      expect(promotionRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should handle optional fields with defaults', async () => {
      const dto: CreatePromotionDto = {
        name: 'Basic Promo',
        rules: { conditions: [], logic: 'AND' },
        discountType: DiscountType.PERCENTAGE,
        discountValue: 10,
        validFrom: '2025-01-01T00:00:00.000Z',
      };

      await service.createPromotion(mockUserId, dto);

      expect(promotionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          description: null,
          maxDiscountAmount: null,
          validUntil: null,
          usageLimit: null,
          perUserLimit: null,
          locationIds: null,
          productIds: null,
        }),
      );
    });
  });

  // =========================================================================
  // updatePromotion
  // =========================================================================

  describe('updatePromotion', () => {
    it('should partially update promotion fields', async () => {
      const promotion = createMockPromotion();
      promotionRepo.findOne.mockResolvedValueOnce(promotion);
      promotionRepo.save.mockImplementation((p) => Promise.resolve(p));

      const dto: UpdatePromotionDto = { name: 'Winter Sale', discountValue: 30 };
      const result = await service.updatePromotion(
        mockPromotionId,
        mockUserId,
        dto,
      );

      expect(result.name).toBe('Winter Sale');
      expect(result.discountValue).toBe(30);
      expect(result.updatedBy).toBe(mockUserId);
    });

    it('should throw NotFoundException if promotion does not exist', async () => {
      promotionRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.updatePromotion('non-existent', mockUserId, { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should only update fields present in the DTO', async () => {
      const promotion = createMockPromotion();
      promotionRepo.findOne.mockResolvedValueOnce(promotion);
      promotionRepo.save.mockImplementation((p) => Promise.resolve(p));

      const dto: UpdatePromotionDto = { name: 'New Name' };
      const result = await service.updatePromotion(
        mockPromotionId,
        mockUserId,
        dto,
      );

      // Original values should remain
      expect(result.discountType).toBe(DiscountType.PERCENTAGE);
      expect(result.discountValue).toBe(20);
    });
  });

  // =========================================================================
  // findAll
  // =========================================================================

  describe('findAll', () => {
    it('should return paginated promotions with defaults', async () => {
      const promotions = [createMockPromotion()];
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([promotions, 1]);
      promotionRepo.createQueryBuilder.mockReturnValueOnce(qb);

      const result = await service.findAll({});

      expect(result).toEqual({
        data: promotions,
        total: 1,
        page: 1,
        limit: 20,
      });
    });

    it('should apply isActive filter', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      promotionRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({ isActive: true });

      expect(qb['andWhere']).toHaveBeenCalledWith(
        'promotion.is_active = :isActive',
        { isActive: true },
      );
    });

    it('should apply search filter', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      promotionRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({ search: 'visa' });

      expect(qb['andWhere']).toHaveBeenCalledWith(
        '(promotion.name ILIKE :search OR promotion.description ILIKE :search)',
        { search: '%visa%' },
      );
    });

    it('should respect custom page and limit', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      promotionRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({ page: 2, limit: 5 });

      expect(qb['skip']).toHaveBeenCalledWith(5);
      expect(qb['take']).toHaveBeenCalledWith(5);
    });
  });

  // =========================================================================
  // findById
  // =========================================================================

  describe('findById', () => {
    it('should return promotion with promoCodes', async () => {
      const promotion = createMockPromotion();
      promotionRepo.findOne.mockResolvedValueOnce(promotion);

      const result = await service.findById(mockPromotionId);

      expect(result).toEqual(promotion);
      expect(promotionRepo.findOne).toHaveBeenCalledWith({
        where: { id: mockPromotionId },
        relations: ['promoCodes'],
      });
    });

    it('should throw NotFoundException if not found', async () => {
      promotionRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.findById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // =========================================================================
  // toggleActive
  // =========================================================================

  describe('toggleActive', () => {
    it('should flip isActive from true to false', async () => {
      const promotion = createMockPromotion({ isActive: true });
      promotionRepo.findOne.mockResolvedValueOnce(promotion);
      promotionRepo.save.mockImplementation((p) => Promise.resolve(p));

      const result = await service.toggleActive(mockPromotionId);

      expect(result.isActive).toBe(false);
    });

    it('should flip isActive from false to true', async () => {
      const promotion = createMockPromotion({ isActive: false });
      promotionRepo.findOne.mockResolvedValueOnce(promotion);
      promotionRepo.save.mockImplementation((p) => Promise.resolve(p));

      const result = await service.toggleActive(mockPromotionId);

      expect(result.isActive).toBe(true);
    });

    it('should throw NotFoundException if promotion does not exist', async () => {
      promotionRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.toggleActive('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // =========================================================================
  // createPromoCode
  // =========================================================================

  describe('createPromoCode', () => {
    it('should create a promo code linked to a promotion', async () => {
      promotionRepo.findOne.mockResolvedValueOnce(createMockPromotion());
      promoCodeRepo.findOne.mockResolvedValueOnce(null); // no existing code

      const dto: CreatePromoCodeDto = {
        promotionId: mockPromotionId,
        code: 'SUMMER2025',
        maxUses: 100,
      };

      const result = await service.createPromoCode(dto);

      expect(promoCodeRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'SUMMER2025',
          promotionId: mockPromotionId,
          maxUses: 100,
          timesUsed: 0,
          isActive: true,
        }),
      );
      expect(result).toBeDefined();
    });

    it('should auto-generate code when code is not provided', async () => {
      promotionRepo.findOne.mockResolvedValueOnce(createMockPromotion());
      promoCodeRepo.findOne.mockResolvedValueOnce(null);

      const dto: CreatePromoCodeDto = {
        promotionId: mockPromotionId,
      };

      await service.createPromoCode(dto);

      // The code should be an 8-char uppercase string
      expect(promoCodeRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          code: expect.any(String),
        }),
      );
    });

    it('should throw NotFoundException if promotion does not exist', async () => {
      promotionRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.createPromoCode({ promotionId: 'non-existent' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if code already exists', async () => {
      promotionRepo.findOne.mockResolvedValueOnce(createMockPromotion());
      promoCodeRepo.findOne.mockResolvedValueOnce(createMockPromoCode()); // existing

      await expect(
        service.createPromoCode({
          promotionId: mockPromotionId,
          code: 'SUMMER2025',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // =========================================================================
  // generatePromoCodes
  // =========================================================================

  describe('generatePromoCodes', () => {
    it('should generate N promo codes with a prefix', async () => {
      promotionRepo.findOne.mockResolvedValueOnce(createMockPromotion());

      // Mock existing codes query
      const codeQb = createMockQueryBuilder();
      codeQb['getMany'].mockResolvedValueOnce([]);
      promoCodeRepo.createQueryBuilder.mockReturnValueOnce(codeQb);

      const dto: GeneratePromoCodesDto = {
        promotionId: mockPromotionId,
        count: 3,
        prefix: 'VISA',
      };

      const result = await service.generatePromoCodes(dto);

      expect(promoCodeRepo.create).toHaveBeenCalledTimes(3);
      // Each code should start with VISA prefix
      for (const call of promoCodeRepo.create.mock.calls) {
        expect(call[0].code).toMatch(/^VISA/);
      }
      expect(promoCodeRepo.save).toHaveBeenCalledWith(expect.any(Array));
    });

    it('should throw NotFoundException if promotion does not exist', async () => {
      promotionRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.generatePromoCodes({
          promotionId: 'non-existent',
          count: 5,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should work without a prefix', async () => {
      promotionRepo.findOne.mockResolvedValueOnce(createMockPromotion());

      const codeQb = createMockQueryBuilder();
      codeQb['getMany'].mockResolvedValueOnce([]);
      promoCodeRepo.createQueryBuilder.mockReturnValueOnce(codeQb);

      const dto: GeneratePromoCodesDto = {
        promotionId: mockPromotionId,
        count: 2,
      };

      await service.generatePromoCodes(dto);

      expect(promoCodeRepo.create).toHaveBeenCalledTimes(2);
      for (const call of promoCodeRepo.create.mock.calls) {
        expect(call[0].code.length).toBe(8); // default code length without prefix
      }
    });
  });

  // =========================================================================
  // validatePromoCode
  // =========================================================================

  describe('validatePromoCode', () => {
    const now = new Date();

    function setupValidPromoCode(
      promoCodeOverrides: Partial<PromoCode> = {},
      promotionOverrides: Partial<Promotion> = {},
    ) {
      const promotion = createMockPromotion({
        isActive: true,
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2026-12-31'),
        usageLimit: 1000,
        usageCount: 0,
        perUserLimit: null,
        locationIds: null,
        productIds: null,
        rules: { conditions: [], logic: 'AND' },
        ...promotionOverrides,
      });

      const promoCode = createMockPromoCode({
        isActive: true,
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2026-12-31'),
        maxUses: 100,
        timesUsed: 0,
        promotion,
        ...promoCodeOverrides,
      });

      const codeQb = createMockQueryBuilder();
      codeQb['getOne'].mockResolvedValueOnce(promoCode);
      promoCodeRepo.createQueryBuilder.mockReturnValueOnce(codeQb);

      return { promoCode, promotion };
    }

    it('should return valid=true for a valid promo code with percentage discount', async () => {
      setupValidPromoCode(
        {},
        {
          discountType: DiscountType.PERCENTAGE,
          discountValue: 20,
          maxDiscountAmount: 100,
        },
      );

      const dto: ValidatePromoCodeDto = {
        code: 'SUMMER2025',
        userId: mockUserId,
        amount: 500,
      };

      const result = await service.validatePromoCode(dto);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.discount).toBe(100); // 20% of 500 = 100, capped at maxDiscountAmount 100
      expect(result.finalAmount).toBe(400);
      expect(result.promotion).toBeDefined();
      expect(result.promotion!.id).toBe(mockPromotionId);
    });

    it('should cap percentage discount at maxDiscountAmount', async () => {
      setupValidPromoCode(
        {},
        {
          discountType: DiscountType.PERCENTAGE,
          discountValue: 50,
          maxDiscountAmount: 200,
        },
      );

      const result = await service.validatePromoCode({
        code: 'SUMMER2025',
        userId: mockUserId,
        amount: 1000,
      });

      // 50% of 1000 = 500, but maxDiscountAmount = 200
      expect(result.discount).toBe(200);
      expect(result.finalAmount).toBe(800);
    });

    it('should return valid=true for a valid fixed_amount discount', async () => {
      setupValidPromoCode(
        {},
        {
          discountType: DiscountType.FIXED_AMOUNT,
          discountValue: 150,
          maxDiscountAmount: null,
        },
      );

      const result = await service.validatePromoCode({
        code: 'SUMMER2025',
        userId: mockUserId,
        amount: 500,
      });

      expect(result.valid).toBe(true);
      expect(result.discount).toBe(150);
      expect(result.finalAmount).toBe(350);
    });

    it('should cap fixed_amount discount to not exceed order amount', async () => {
      setupValidPromoCode(
        {},
        {
          discountType: DiscountType.FIXED_AMOUNT,
          discountValue: 1000,
          maxDiscountAmount: null,
        },
      );

      const result = await service.validatePromoCode({
        code: 'SUMMER2025',
        userId: mockUserId,
        amount: 500,
      });

      expect(result.discount).toBe(500); // capped at amount
      expect(result.finalAmount).toBe(0);
    });

    it('should return error when promo code is not found', async () => {
      const codeQb = createMockQueryBuilder();
      codeQb['getOne'].mockResolvedValueOnce(null);
      promoCodeRepo.createQueryBuilder.mockReturnValueOnce(codeQb);

      const result = await service.validatePromoCode({
        code: 'NONEXISTENT',
        userId: mockUserId,
        amount: 100,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Promo code not found');
      expect(result.discount).toBe(0);
      expect(result.finalAmount).toBe(100);
    });

    it('should return error when promo code is inactive', async () => {
      setupValidPromoCode({ isActive: false });

      const result = await service.validatePromoCode({
        code: 'SUMMER2025',
        userId: mockUserId,
        amount: 100,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Promo code is no longer active');
    });

    it('should return error when promo code has expired (validUntil in past)', async () => {
      setupValidPromoCode({
        validUntil: new Date('2020-01-01'),
      });

      const result = await service.validatePromoCode({
        code: 'SUMMER2025',
        userId: mockUserId,
        amount: 100,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Promo code has expired');
    });

    it('should return error when promo code is not yet valid (validFrom in future)', async () => {
      setupValidPromoCode({
        validFrom: new Date('2099-01-01'),
      });

      const result = await service.validatePromoCode({
        code: 'SUMMER2025',
        userId: mockUserId,
        amount: 100,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Promo code is not yet valid');
    });

    it('should return error when promo code has reached max uses', async () => {
      setupValidPromoCode({ maxUses: 10, timesUsed: 10 });

      const result = await service.validatePromoCode({
        code: 'SUMMER2025',
        userId: mockUserId,
        amount: 100,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Promo code has reached its maximum number of uses',
      );
    });

    it('should return error when associated promotion is not found', async () => {
      const promoCode = createMockPromoCode({ promotion: undefined as any });
      const codeQb = createMockQueryBuilder();
      codeQb['getOne'].mockResolvedValueOnce(promoCode);
      promoCodeRepo.createQueryBuilder.mockReturnValueOnce(codeQb);

      const result = await service.validatePromoCode({
        code: 'SUMMER2025',
        userId: mockUserId,
        amount: 100,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Associated promotion not found');
    });

    it('should return error when promotion is inactive', async () => {
      setupValidPromoCode({}, { isActive: false });

      const result = await service.validatePromoCode({
        code: 'SUMMER2025',
        userId: mockUserId,
        amount: 100,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('The associated promotion is not active');
    });

    it('should return error when promotion has not started yet', async () => {
      setupValidPromoCode(
        {},
        { validFrom: new Date('2099-01-01') },
      );

      const result = await service.validatePromoCode({
        code: 'SUMMER2025',
        userId: mockUserId,
        amount: 100,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'The associated promotion has not started yet',
      );
    });

    it('should return error when promotion has expired', async () => {
      setupValidPromoCode(
        {},
        { validUntil: new Date('2020-01-01') },
      );

      const result = await service.validatePromoCode({
        code: 'SUMMER2025',
        userId: mockUserId,
        amount: 100,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('The associated promotion has expired');
    });

    it('should return error when promotion has reached total usage limit', async () => {
      setupValidPromoCode(
        {},
        { usageLimit: 100, usageCount: 100 },
      );

      const result = await service.validatePromoCode({
        code: 'SUMMER2025',
        userId: mockUserId,
        amount: 100,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'The promotion has reached its total usage limit',
      );
    });

    it('should return error when promotion is restricted to specific locations and locationId does not match', async () => {
      setupValidPromoCode(
        {},
        { locationIds: ['other-location-id'] },
      );

      const result = await service.validatePromoCode({
        code: 'SUMMER2025',
        userId: mockUserId,
        amount: 100,
        locationId: mockLocationId,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'This promotion is not valid at the selected location',
      );
    });

    it('should pass when locationId matches promotion locationIds', async () => {
      setupValidPromoCode(
        {},
        {
          locationIds: [mockLocationId],
          discountType: DiscountType.FIXED_AMOUNT,
          discountValue: 50,
          maxDiscountAmount: null,
        },
      );

      const result = await service.validatePromoCode({
        code: 'SUMMER2025',
        userId: mockUserId,
        amount: 200,
        locationId: mockLocationId,
      });

      expect(result.valid).toBe(true);
    });

    it('should return error when promotion is restricted to specific products and productId does not match', async () => {
      setupValidPromoCode(
        {},
        { productIds: ['other-product-id'] },
      );

      const result = await service.validatePromoCode({
        code: 'SUMMER2025',
        userId: mockUserId,
        amount: 100,
        productId: mockProductId,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'This promotion is not valid for the selected product',
      );
    });

    it('should return error when rules with AND logic fail', async () => {
      setupValidPromoCode(
        {},
        {
          rules: {
            conditions: [
              { field: 'paymentMethod', operator: 'equals', value: 'visa' },
            ],
            logic: 'AND',
          },
          discountType: DiscountType.FIXED_AMOUNT,
          discountValue: 50,
          maxDiscountAmount: null,
        },
      );

      const result = await service.validatePromoCode({
        code: 'SUMMER2025',
        userId: mockUserId,
        amount: 200,
        paymentMethod: 'mastercard',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('The promotion conditions are not met');
    });

    it('should pass when rules with AND logic are satisfied', async () => {
      setupValidPromoCode(
        {},
        {
          rules: {
            conditions: [
              { field: 'paymentMethod', operator: 'equals', value: 'visa' },
            ],
            logic: 'AND',
          },
          discountType: DiscountType.FIXED_AMOUNT,
          discountValue: 50,
          maxDiscountAmount: null,
        },
      );

      const result = await service.validatePromoCode({
        code: 'SUMMER2025',
        userId: mockUserId,
        amount: 200,
        paymentMethod: 'visa',
      });

      expect(result.valid).toBe(true);
      expect(result.discount).toBe(50);
    });

    it('should evaluate OR logic rules correctly', async () => {
      setupValidPromoCode(
        {},
        {
          rules: {
            conditions: [
              { field: 'paymentMethod', operator: 'equals', value: 'visa' },
              { field: 'paymentMethod', operator: 'equals', value: 'mastercard' },
            ],
            logic: 'OR',
          },
          discountType: DiscountType.FIXED_AMOUNT,
          discountValue: 50,
          maxDiscountAmount: null,
        },
      );

      const result = await service.validatePromoCode({
        code: 'SUMMER2025',
        userId: mockUserId,
        amount: 200,
        paymentMethod: 'mastercard',
      });

      expect(result.valid).toBe(true);
    });

    it('should evaluate "greater_than" rule operator', async () => {
      setupValidPromoCode(
        {},
        {
          rules: {
            conditions: [
              { field: 'amount', operator: 'greater_than', value: 100 },
            ],
            logic: 'AND',
          },
          discountType: DiscountType.FIXED_AMOUNT,
          discountValue: 50,
          maxDiscountAmount: null,
        },
      );

      const result = await service.validatePromoCode({
        code: 'SUMMER2025',
        userId: mockUserId,
        amount: 200,
      });

      expect(result.valid).toBe(true);
    });

    it('should fail "greater_than" when amount is not sufficient', async () => {
      setupValidPromoCode(
        {},
        {
          rules: {
            conditions: [
              { field: 'amount', operator: 'greater_than', value: 500 },
            ],
            logic: 'AND',
          },
          discountType: DiscountType.FIXED_AMOUNT,
          discountValue: 50,
          maxDiscountAmount: null,
        },
      );

      const result = await service.validatePromoCode({
        code: 'SUMMER2025',
        userId: mockUserId,
        amount: 200,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('The promotion conditions are not met');
    });

    it('should evaluate "in" rule operator', async () => {
      setupValidPromoCode(
        {},
        {
          rules: {
            conditions: [
              {
                field: 'paymentMethod',
                operator: 'in',
                value: ['visa', 'mastercard', 'amex'],
              },
            ],
            logic: 'AND',
          },
          discountType: DiscountType.FIXED_AMOUNT,
          discountValue: 50,
          maxDiscountAmount: null,
        },
      );

      const result = await service.validatePromoCode({
        code: 'SUMMER2025',
        userId: mockUserId,
        amount: 200,
        paymentMethod: 'VISA', // case-insensitive
      });

      expect(result.valid).toBe(true);
    });

    it('should collect multiple errors', async () => {
      setupValidPromoCode(
        { isActive: false, validUntil: new Date('2020-01-01') },
        { isActive: false },
      );

      const result = await service.validatePromoCode({
        code: 'SUMMER2025',
        userId: mockUserId,
        amount: 100,
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.discount).toBe(0);
    });

    it('should round discount and finalAmount to 2 decimal places', async () => {
      setupValidPromoCode(
        {},
        {
          discountType: DiscountType.PERCENTAGE,
          discountValue: 33.33,
          maxDiscountAmount: null,
        },
      );

      const result = await service.validatePromoCode({
        code: 'SUMMER2025',
        userId: mockUserId,
        amount: 100,
      });

      // 33.33% of 100 = 33.33
      expect(result.discount).toBe(33.33);
      expect(result.finalAmount).toBe(66.67);
    });
  });

  // =========================================================================
  // applyPromoCode
  // =========================================================================

  describe('applyPromoCode', () => {
    it('should increment timesUsed and usageCount', async () => {
      const promoCode = createMockPromoCode();
      const codeQb = createMockQueryBuilder();
      codeQb['getOne'].mockResolvedValueOnce(promoCode);
      promoCodeRepo.createQueryBuilder.mockReturnValueOnce(codeQb);

      // For code update
      const codeUpdateQb = createMockQueryBuilder();
      promoCodeRepo.createQueryBuilder.mockReturnValueOnce(codeUpdateQb);

      // For promotion update
      const promoUpdateQb = createMockQueryBuilder();
      promotionRepo.createQueryBuilder.mockReturnValueOnce(promoUpdateQb);

      await service.applyPromoCode('SUMMER2025', mockUserId);

      expect(codeUpdateQb['update']).toHaveBeenCalledWith(PromoCode);
      expect(codeUpdateQb['set']).toHaveBeenCalledWith({
        timesUsed: expect.any(Function),
      });
      expect(promoUpdateQb['update']).toHaveBeenCalledWith(Promotion);
      expect(promoUpdateQb['set']).toHaveBeenCalledWith({
        usageCount: expect.any(Function),
      });
    });

    it('should throw NotFoundException when promo code is not found', async () => {
      const codeQb = createMockQueryBuilder();
      codeQb['getOne'].mockResolvedValueOnce(null);
      promoCodeRepo.createQueryBuilder.mockReturnValueOnce(codeQb);

      await expect(
        service.applyPromoCode('NONEXISTENT', mockUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================================================
  // getPromotionStats
  // =========================================================================

  describe('getPromotionStats', () => {
    it('should return correct stats for a promotion', async () => {
      const promotion = createMockPromotion({ usageCount: 50, discountValue: 500 });
      promotionRepo.findOne.mockResolvedValueOnce(promotion);
      promoCodeRepo.count
        .mockResolvedValueOnce(10) // totalCodes
        .mockResolvedValueOnce(8); // activeCodes

      const redemptionQb = createMockQueryBuilder();
      redemptionQb['getRawOne'].mockResolvedValueOnce({ total: '25' });
      promoCodeRepo.createQueryBuilder.mockReturnValueOnce(redemptionQb);

      const result = await service.getPromotionStats(mockPromotionId);

      expect(result).toEqual({
        totalCodes: 10,
        activeCodes: 8,
        totalRedemptions: 25,
        revenueImpact: 25000, // 50 * 500
      });
    });

    it('should throw NotFoundException if promotion does not exist', async () => {
      promotionRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.getPromotionStats('non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================================================
  // checkExpiredPromotions (cron)
  // =========================================================================

  describe('checkExpiredPromotions', () => {
    it('should deactivate expired promotions', async () => {
      const qb = createMockQueryBuilder();
      qb['execute'].mockResolvedValueOnce({ affected: 3 });
      promotionRepo.createQueryBuilder.mockReturnValueOnce(qb);

      const result = await service.checkExpiredPromotions();

      expect(result).toBe(3);
      expect(qb['update']).toHaveBeenCalledWith(Promotion);
      expect(qb['set']).toHaveBeenCalledWith({ isActive: false });
    });

    it('should return 0 when no promotions are expired', async () => {
      const qb = createMockQueryBuilder();
      qb['execute'].mockResolvedValueOnce({ affected: 0 });
      promotionRepo.createQueryBuilder.mockReturnValueOnce(qb);

      const result = await service.checkExpiredPromotions();

      expect(result).toBe(0);
    });
  });
});
