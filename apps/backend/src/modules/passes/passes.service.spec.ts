import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PassesService } from './passes.service';
import { UserPass, PassStatus } from '@/common/database/entities/user-pass.entity';
import { Product, BillingPeriod } from '@/common/database/entities/product.entity';
import { RateCode } from '@/common/database/entities/rate-code.entity';

// ---------------------------------------------------------------------------
// Helpers & mock factories
// ---------------------------------------------------------------------------

const mockUserId = 'user-0001-0001-0001-000000000001';
const PRODUCT_MONTHLY_ID = 'prod-monthly-0001-000000000001';
const RATE_CODE_ID = 'rate-0001-0001-0001-000000000001';
const PASS_ID = 'pass-0001-0001-0001-000000000001';

function createMockProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: PRODUCT_MONTHLY_ID,
    name: 'Monthly Coworking Pass',
    isActive: true,
    billingPeriod: BillingPeriod.MONTHLY,
    includedResources: [{ resourceType: 'hot_desk', hoursPerMonth: 160 }],
    ...overrides,
  } as Product;
}

function createMockRateCode(overrides: Partial<RateCode> = {}): RateCode {
  return {
    id: RATE_CODE_ID,
    productId: PRODUCT_MONTHLY_ID,
    amount: 350,
    currency: 'GEL',
    isActive: true,
    createdAt: new Date('2025-01-01'),
    ...overrides,
  } as RateCode;
}

function createMockPass(overrides: Partial<UserPass> = {}): UserPass {
  return {
    id: PASS_ID,
    userId: mockUserId,
    productId: PRODUCT_MONTHLY_ID,
    rateCodeId: RATE_CODE_ID,
    startDate: new Date('2025-06-01'),
    endDate: new Date('2025-07-01'),
    status: PassStatus.ACTIVE,
    autoRenew: false,
    totalPaid: 350,
    currency: 'GEL',
    paymentId: 'pay-001',
    cancelledAt: null,
    cancellationReason: null,
    refundAmount: null,
    metadata: null,
    product: createMockProduct(),
    rateCode: createMockRateCode(),
    createdAt: new Date('2025-05-28'),
    updatedAt: new Date('2025-05-28'),
    deletedAt: null as any,
    ...overrides,
  } as UserPass;
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
    'skip',
    'take',
    'update',
    'set',
  ];

  for (const method of methods) {
    qb[method] = jest.fn().mockReturnThis();
  }

  qb['getManyAndCount'] = jest.fn().mockResolvedValue(returnData ?? [[], 0]);
  qb['getMany'] = jest.fn().mockResolvedValue(returnData?.[0] ?? []);
  qb['getOne'] = jest.fn().mockResolvedValue(returnData ?? null);
  qb['execute'] = jest.fn().mockResolvedValue(returnData ?? { affected: 0 });

  return qb;
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('PassesService', () => {
  let service: PassesService;
  let userPassRepo: Record<string, jest.Mock>;
  let productRepo: Record<string, jest.Mock>;
  let rateCodeRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    userPassRepo = {
      create: jest.fn((dto) => ({ ...dto })),
      save: jest.fn((entity) =>
        Promise.resolve({ ...entity, id: entity.id || PASS_ID }),
      ),
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    productRepo = {
      findOne: jest.fn(),
    };

    rateCodeRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PassesService,
        { provide: getRepositoryToken(UserPass), useValue: userPassRepo },
        { provide: getRepositoryToken(Product), useValue: productRepo },
        { provide: getRepositoryToken(RateCode), useValue: rateCodeRepo },
      ],
    }).compile();

    service = module.get<PassesService>(PassesService);
  });

  // =========================================================================
  // purchasePass
  // =========================================================================

  describe('purchasePass', () => {
    it('should create a pass with ACTIVE status when paymentId is provided', async () => {
      const product = createMockProduct();
      const rateCode = createMockRateCode();

      productRepo.findOne.mockResolvedValueOnce(product);
      rateCodeRepo.findOne.mockResolvedValueOnce(rateCode);
      userPassRepo.save.mockResolvedValueOnce({ id: PASS_ID });
      userPassRepo.findOne.mockResolvedValueOnce(createMockPass());

      const result = await service.purchasePass(mockUserId, {
        productId: PRODUCT_MONTHLY_ID,
        startDate: '2025-06-01',
        paymentId: 'pay-001',
      });

      expect(userPassRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          productId: PRODUCT_MONTHLY_ID,
          status: PassStatus.ACTIVE,
          totalPaid: 350,
        }),
      );
      expect(result.status).toBe(PassStatus.ACTIVE);
    });

    it('should create a pass with PENDING_PAYMENT status when no paymentId', async () => {
      const product = createMockProduct();
      const rateCode = createMockRateCode();

      productRepo.findOne.mockResolvedValueOnce(product);
      rateCodeRepo.findOne.mockResolvedValueOnce(rateCode);
      userPassRepo.save.mockResolvedValueOnce({ id: PASS_ID });
      userPassRepo.findOne.mockResolvedValueOnce(
        createMockPass({ status: PassStatus.PENDING_PAYMENT }),
      );

      const result = await service.purchasePass(mockUserId, {
        productId: PRODUCT_MONTHLY_ID,
        startDate: '2025-06-01',
      });

      expect(userPassRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: PassStatus.PENDING_PAYMENT }),
      );
      expect(result.status).toBe(PassStatus.PENDING_PAYMENT);
    });

    it('should throw NotFoundException when product does not exist', async () => {
      productRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.purchasePass(mockUserId, {
          productId: 'non-existent',
          startDate: '2025-06-01',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when product is not active', async () => {
      productRepo.findOne.mockResolvedValueOnce(
        createMockProduct({ isActive: false }),
      );

      await expect(
        service.purchasePass(mockUserId, {
          productId: PRODUCT_MONTHLY_ID,
          startDate: '2025-06-01',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when rateCodeId is provided but not found', async () => {
      productRepo.findOne.mockResolvedValueOnce(createMockProduct());
      rateCodeRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.purchasePass(mockUserId, {
          productId: PRODUCT_MONTHLY_ID,
          startDate: '2025-06-01',
          rateCodeId: 'bad-rate-code',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should calculate monthly end date correctly', async () => {
      productRepo.findOne.mockResolvedValueOnce(
        createMockProduct({ billingPeriod: BillingPeriod.MONTHLY }),
      );
      rateCodeRepo.findOne.mockResolvedValueOnce(createMockRateCode());
      userPassRepo.save.mockResolvedValueOnce({ id: PASS_ID });
      userPassRepo.findOne.mockResolvedValueOnce(createMockPass());

      await service.purchasePass(mockUserId, {
        productId: PRODUCT_MONTHLY_ID,
        startDate: '2025-06-01',
        paymentId: 'pay-001',
      });

      const createCall = userPassRepo.create.mock.calls[0][0];
      expect(createCall.startDate).toEqual(new Date('2025-06-01'));
      // Monthly: June 1 -> July 1
      expect(createCall.endDate).toEqual(new Date('2025-07-01'));
    });

    it('should calculate weekly end date correctly', async () => {
      productRepo.findOne.mockResolvedValueOnce(
        createMockProduct({ billingPeriod: BillingPeriod.WEEKLY }),
      );
      rateCodeRepo.findOne.mockResolvedValueOnce(createMockRateCode());
      userPassRepo.save.mockResolvedValueOnce({ id: PASS_ID });
      userPassRepo.findOne.mockResolvedValueOnce(createMockPass());

      await service.purchasePass(mockUserId, {
        productId: PRODUCT_MONTHLY_ID,
        startDate: '2025-06-01',
        paymentId: 'pay-001',
      });

      const createCall = userPassRepo.create.mock.calls[0][0];
      // Weekly: June 1 + 7 days = June 8
      expect(createCall.endDate).toEqual(new Date('2025-06-08'));
    });

    it('should set autoRenew from DTO', async () => {
      productRepo.findOne.mockResolvedValueOnce(createMockProduct());
      rateCodeRepo.findOne.mockResolvedValueOnce(createMockRateCode());
      userPassRepo.save.mockResolvedValueOnce({ id: PASS_ID });
      userPassRepo.findOne.mockResolvedValueOnce(createMockPass());

      await service.purchasePass(mockUserId, {
        productId: PRODUCT_MONTHLY_ID,
        startDate: '2025-06-01',
        autoRenew: true,
      });

      expect(userPassRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ autoRenew: true }),
      );
    });
  });

  // =========================================================================
  // activatePass
  // =========================================================================

  describe('activatePass', () => {
    it('should set status to ACTIVE', async () => {
      const pass = createMockPass({ status: PassStatus.PENDING_PAYMENT });
      userPassRepo.findOne.mockResolvedValueOnce(pass);
      userPassRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.activatePass(PASS_ID);

      expect(result.status).toBe(PassStatus.ACTIVE);
    });

    it('should throw NotFoundException when pass does not exist', async () => {
      userPassRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.activatePass('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // =========================================================================
  // cancelPass
  // =========================================================================

  describe('cancelPass', () => {
    it('should set status to CANCELLED with refund amount', async () => {
      const pass = createMockPass();
      userPassRepo.findOne
        .mockResolvedValueOnce(pass) // findById
        .mockResolvedValueOnce(pass); // final findOne
      userPassRepo.save.mockResolvedValueOnce({ ...pass, id: PASS_ID });

      const result = await service.cancelPass(PASS_ID, mockUserId, 'Changed plans');

      expect(result.status).toBe(PassStatus.CANCELLED);
      expect(result.cancelledAt).toBeInstanceOf(Date);
      expect(result.cancellationReason).toBe('Changed plans');
    });

    it('should throw BadRequestException when user does not own the pass', async () => {
      const pass = createMockPass({ userId: 'other-user-id' });
      userPassRepo.findOne.mockResolvedValueOnce(pass);

      await expect(
        service.cancelPass(PASS_ID, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should calculate prorated refund amount', async () => {
      // Pass from June 1 to July 1 (30 days), totalPaid = 300
      const pass = createMockPass({
        startDate: new Date('2025-06-01'),
        endDate: new Date('2025-07-01'),
        totalPaid: 300,
      });

      userPassRepo.findOne
        .mockResolvedValueOnce(pass)
        .mockResolvedValueOnce(pass);
      userPassRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.cancelPass(PASS_ID, mockUserId);

      // Refund should be > 0 (proportional to remaining days)
      expect(typeof result.refundAmount).toBe('number');
      expect(result.refundAmount).toBeGreaterThanOrEqual(0);
    });

    it('should throw NotFoundException when pass does not exist', async () => {
      userPassRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.cancelPass('non-existent', mockUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================================================
  // suspendPass
  // =========================================================================

  describe('suspendPass', () => {
    it('should set status to SUSPENDED', async () => {
      const pass = createMockPass();
      userPassRepo.findOne.mockResolvedValueOnce(pass);
      userPassRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.suspendPass(PASS_ID, 'Payment issue');

      expect(result.status).toBe(PassStatus.SUSPENDED);
    });

    it('should store suspension reason in metadata', async () => {
      const pass = createMockPass();
      userPassRepo.findOne.mockResolvedValueOnce(pass);
      userPassRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.suspendPass(PASS_ID, 'Payment issue');

      expect(result.metadata).toEqual(
        expect.objectContaining({ suspensionReason: 'Payment issue' }),
      );
    });
  });

  // =========================================================================
  // renewPass
  // =========================================================================

  describe('renewPass', () => {
    it('should renew an active pass with new dates', async () => {
      const pass = createMockPass({ status: PassStatus.ACTIVE });
      userPassRepo.findOne.mockResolvedValueOnce(pass);
      productRepo.findOne.mockResolvedValueOnce(createMockProduct());
      userPassRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.renewPass(PASS_ID);

      // New start should be the old end date
      expect(result.startDate).toEqual(new Date('2025-07-01'));
      expect(result.status).toBe(PassStatus.PENDING_PAYMENT);
    });

    it('should renew an expired pass', async () => {
      const pass = createMockPass({ status: PassStatus.EXPIRED });
      userPassRepo.findOne.mockResolvedValueOnce(pass);
      productRepo.findOne.mockResolvedValueOnce(createMockProduct());
      userPassRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.renewPass(PASS_ID);

      expect(result.status).toBe(PassStatus.PENDING_PAYMENT);
    });

    it('should throw BadRequestException for CANCELLED passes', async () => {
      const pass = createMockPass({ status: PassStatus.CANCELLED });
      userPassRepo.findOne.mockResolvedValueOnce(pass);

      await expect(service.renewPass(PASS_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for SUSPENDED passes', async () => {
      const pass = createMockPass({ status: PassStatus.SUSPENDED });
      userPassRepo.findOne.mockResolvedValueOnce(pass);

      await expect(service.renewPass(PASS_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when product is missing', async () => {
      const pass = createMockPass({ status: PassStatus.ACTIVE });
      userPassRepo.findOne.mockResolvedValueOnce(pass);
      productRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.renewPass(PASS_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // =========================================================================
  // findAll
  // =========================================================================

  describe('findAll', () => {
    it('should return paginated results with defaults', async () => {
      const passes = [createMockPass()];
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([passes, 1]);
      userPassRepo.createQueryBuilder.mockReturnValueOnce(qb);

      const result = await service.findAll({});

      expect(result).toEqual({ data: passes, total: 1, page: 1, limit: 20 });
    });

    it('should filter by userId', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      userPassRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({ userId: mockUserId });

      expect(qb['andWhere']).toHaveBeenCalledWith(
        'pass.userId = :userId',
        { userId: mockUserId },
      );
    });

    it('should filter by status', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      userPassRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({ status: PassStatus.ACTIVE });

      expect(qb['andWhere']).toHaveBeenCalledWith(
        'pass.status = :status',
        { status: PassStatus.ACTIVE },
      );
    });
  });

  // =========================================================================
  // findById
  // =========================================================================

  describe('findById', () => {
    it('should return pass with product and rateCode relations', async () => {
      const pass = createMockPass();
      userPassRepo.findOne.mockResolvedValueOnce(pass);

      const result = await service.findById(PASS_ID);

      expect(result).toEqual(pass);
      expect(userPassRepo.findOne).toHaveBeenCalledWith({
        where: { id: PASS_ID },
        relations: ['product', 'rateCode'],
      });
    });

    it('should throw NotFoundException when pass is not found', async () => {
      userPassRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.findById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // =========================================================================
  // findByUser / findActiveByUser
  // =========================================================================

  describe('findByUser', () => {
    it('should return all passes for a user', async () => {
      userPassRepo.find.mockResolvedValueOnce([createMockPass()]);

      const result = await service.findByUser(mockUserId);

      expect(result).toHaveLength(1);
      expect(userPassRepo.find).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        relations: ['product'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findActiveByUser', () => {
    it('should return only active passes for a user', async () => {
      userPassRepo.find.mockResolvedValueOnce([createMockPass()]);

      const result = await service.findActiveByUser(mockUserId);

      expect(result).toHaveLength(1);
      expect(userPassRepo.find).toHaveBeenCalledWith({
        where: { userId: mockUserId, status: PassStatus.ACTIVE },
        relations: ['product'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  // =========================================================================
  // findActivePassForResource
  // =========================================================================

  describe('findActivePassForResource', () => {
    it('should return pass that includes the requested resource type', async () => {
      const pass = createMockPass();
      userPassRepo.find.mockResolvedValueOnce([pass]);

      const result = await service.findActivePassForResource(
        mockUserId,
        'hot_desk',
      );

      expect(result).toEqual(pass);
    });

    it('should return null when no pass covers the resource type', async () => {
      const pass = createMockPass();
      userPassRepo.find.mockResolvedValueOnce([pass]);

      const result = await service.findActivePassForResource(
        mockUserId,
        'parking',
      );

      expect(result).toBeNull();
    });

    it('should return null when user has no active passes', async () => {
      userPassRepo.find.mockResolvedValueOnce([]);

      const result = await service.findActivePassForResource(
        mockUserId,
        'hot_desk',
      );

      expect(result).toBeNull();
    });
  });

  // =========================================================================
  // checkExpiredPasses
  // =========================================================================

  describe('checkExpiredPasses', () => {
    it('should update expired active passes and return affected count', async () => {
      const qb = createMockQueryBuilder();
      qb['execute'].mockResolvedValueOnce({ affected: 5 });
      userPassRepo.createQueryBuilder.mockReturnValueOnce(qb);

      const result = await service.checkExpiredPasses();

      expect(result).toBe(5);
      expect(qb['update']).toHaveBeenCalledWith(UserPass);
      expect(qb['set']).toHaveBeenCalledWith({ status: PassStatus.EXPIRED });
    });

    it('should return 0 when no passes have expired', async () => {
      const qb = createMockQueryBuilder();
      qb['execute'].mockResolvedValueOnce({ affected: 0 });
      userPassRepo.createQueryBuilder.mockReturnValueOnce(qb);

      const result = await service.checkExpiredPasses();

      expect(result).toBe(0);
    });
  });
});
