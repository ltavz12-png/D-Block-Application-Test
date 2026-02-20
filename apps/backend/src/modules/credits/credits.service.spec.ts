import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreditsService } from './credits.service';
import {
  CreditPackage,
  CreditPackageStatus,
} from '@/common/database/entities/credit-package.entity';
import {
  CreditTransaction,
  CreditTransactionType,
} from '@/common/database/entities/credit-transaction.entity';

// ---------------------------------------------------------------------------
// Helpers & mock factories
// ---------------------------------------------------------------------------

const mockUserId = 'user-0001-0001-0001-000000000001';
const COMPANY_ID = 'comp-0001-0001-0001-000000000001';
const PACKAGE_ID = 'pkg-0001-0001-0001-000000000001';
const PACKAGE_2_ID = 'pkg-0002-0001-0001-000000000002';
const TX_ID = 'tx-00001-0001-0001-000000000001';

function createMockPackage(overrides: Partial<CreditPackage> = {}): CreditPackage {
  return {
    id: PACKAGE_ID,
    companyId: COMPANY_ID,
    totalMinutes: 1000,
    usedMinutes: 200,
    remainingMinutes: 800,
    purchasePrice: 500,
    currency: 'GEL',
    paymentId: 'pay-001',
    status: CreditPackageStatus.ACTIVE,
    expiresAt: null,
    purchasedAt: new Date('2025-01-15'),
    transactions: [],
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15'),
    deletedAt: null as any,
    ...overrides,
  } as CreditPackage;
}

function createMockTransaction(
  overrides: Partial<CreditTransaction> = {},
): CreditTransaction {
  return {
    id: TX_ID,
    creditPackageId: PACKAGE_ID,
    userId: mockUserId,
    bookingId: null,
    transactionType: CreditTransactionType.DEDUCTION,
    minutes: 60,
    balanceAfter: 740,
    description: 'Deducted 60 minutes',
    createdAt: new Date(),
    ...overrides,
  } as CreditTransaction;
}

// ---------------------------------------------------------------------------
// Query builder mock factory
// ---------------------------------------------------------------------------

function createMockQueryBuilder(returnData?: any) {
  const qb: Record<string, jest.Mock> = {};
  const methods = [
    'leftJoinAndSelect',
    'innerJoin',
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

describe('CreditsService', () => {
  let service: CreditsService;
  let creditPackageRepo: Record<string, jest.Mock>;
  let creditTransactionRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    creditPackageRepo = {
      create: jest.fn((dto) => ({ ...dto })),
      save: jest.fn((entity) =>
        Promise.resolve({ ...entity, id: entity.id || PACKAGE_ID }),
      ),
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    creditTransactionRepo = {
      create: jest.fn((dto) => ({ ...dto })),
      save: jest.fn((entity) =>
        Promise.resolve({ ...entity, id: entity.id || TX_ID }),
      ),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreditsService,
        {
          provide: getRepositoryToken(CreditPackage),
          useValue: creditPackageRepo,
        },
        {
          provide: getRepositoryToken(CreditTransaction),
          useValue: creditTransactionRepo,
        },
      ],
    }).compile();

    service = module.get<CreditsService>(CreditsService);
  });

  // =========================================================================
  // purchasePackage
  // =========================================================================

  describe('purchasePackage', () => {
    it('should create a credit package with ACTIVE status', async () => {
      creditPackageRepo.save.mockResolvedValueOnce({
        id: PACKAGE_ID,
        companyId: COMPANY_ID,
      });
      creditTransactionRepo.save.mockResolvedValueOnce(createMockTransaction());
      creditPackageRepo.findOne.mockResolvedValueOnce(
        createMockPackage({ remainingMinutes: 1000, usedMinutes: 0 }),
      );

      const result = await service.purchasePackage(
        {
          companyId: COMPANY_ID,
          totalMinutes: 1000,
          purchasePrice: 500,
          currency: 'GEL',
        },
        mockUserId,
      );

      expect(creditPackageRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: COMPANY_ID,
          totalMinutes: 1000,
          usedMinutes: 0,
          remainingMinutes: 1000,
          status: CreditPackageStatus.ACTIVE,
        }),
      );
      expect(result).toBeDefined();
    });

    it('should create an ALLOCATION transaction record', async () => {
      creditPackageRepo.save.mockResolvedValueOnce({ id: PACKAGE_ID });
      creditTransactionRepo.save.mockResolvedValueOnce(
        createMockTransaction({ transactionType: CreditTransactionType.ALLOCATION }),
      );
      creditPackageRepo.findOne.mockResolvedValueOnce(createMockPackage());

      await service.purchasePackage(
        {
          companyId: COMPANY_ID,
          totalMinutes: 500,
          purchasePrice: 250,
        },
        mockUserId,
      );

      expect(creditTransactionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionType: CreditTransactionType.ALLOCATION,
          minutes: 500,
          balanceAfter: 500,
        }),
      );
    });

    it('should set expiresAt when provided', async () => {
      creditPackageRepo.save.mockResolvedValueOnce({ id: PACKAGE_ID });
      creditTransactionRepo.save.mockResolvedValueOnce(createMockTransaction());
      creditPackageRepo.findOne.mockResolvedValueOnce(createMockPackage());

      await service.purchasePackage(
        {
          companyId: COMPANY_ID,
          totalMinutes: 1000,
          purchasePrice: 500,
          expiresAt: '2025-12-31',
        },
        mockUserId,
      );

      expect(creditPackageRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          expiresAt: new Date('2025-12-31'),
        }),
      );
    });
  });

  // =========================================================================
  // deductCredits
  // =========================================================================

  describe('deductCredits', () => {
    it('should deduct from a single package when sufficient', async () => {
      const pkg = createMockPackage({ remainingMinutes: 800 });
      creditPackageRepo.find.mockResolvedValueOnce([pkg]);
      creditPackageRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );
      creditTransactionRepo.save.mockResolvedValueOnce({
        ...createMockTransaction(),
        id: TX_ID,
      });

      const result = await service.deductCredits({
        companyId: COMPANY_ID,
        userId: mockUserId,
        minutes: 60,
      });

      expect(result.totalDeducted).toBe(60);
      expect(result.transactionIds).toHaveLength(1);
    });

    it('should deduct across multiple packages (FIFO)', async () => {
      const pkg1 = createMockPackage({
        id: PACKAGE_ID,
        remainingMinutes: 30,
        purchasedAt: new Date('2025-01-01'),
      });
      const pkg2 = createMockPackage({
        id: PACKAGE_2_ID,
        remainingMinutes: 100,
        purchasedAt: new Date('2025-02-01'),
      });

      creditPackageRepo.find.mockResolvedValueOnce([pkg1, pkg2]);
      creditPackageRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );
      creditTransactionRepo.save
        .mockResolvedValueOnce({ id: 'tx-1' })
        .mockResolvedValueOnce({ id: 'tx-2' });

      const result = await service.deductCredits({
        companyId: COMPANY_ID,
        userId: mockUserId,
        minutes: 60,
      });

      expect(result.totalDeducted).toBe(60);
      expect(result.transactionIds).toHaveLength(2);
    });

    it('should mark package as EXHAUSTED when fully consumed', async () => {
      const pkg = createMockPackage({ remainingMinutes: 60 });
      creditPackageRepo.find.mockResolvedValueOnce([pkg]);
      creditPackageRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );
      creditTransactionRepo.save.mockResolvedValueOnce({ id: TX_ID });

      await service.deductCredits({
        companyId: COMPANY_ID,
        userId: mockUserId,
        minutes: 60,
      });

      expect(pkg.status).toBe(CreditPackageStatus.EXHAUSTED);
      expect(pkg.remainingMinutes).toBe(0);
    });

    it('should throw BadRequestException when insufficient credits', async () => {
      creditPackageRepo.find.mockResolvedValueOnce([
        createMockPackage({ remainingMinutes: 10 }),
      ]);

      await expect(
        service.deductCredits({
          companyId: COMPANY_ID,
          userId: mockUserId,
          minutes: 100,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException with available amount in error', async () => {
      creditPackageRepo.find.mockResolvedValueOnce([
        createMockPackage({ remainingMinutes: 10 }),
      ]);

      await expect(
        service.deductCredits({
          companyId: COMPANY_ID,
          userId: mockUserId,
          minutes: 100,
        }),
      ).rejects.toThrow(/available: 10 minutes/);
    });
  });

  // =========================================================================
  // refundCredits
  // =========================================================================

  describe('refundCredits', () => {
    it('should add minutes back to the most recent package', async () => {
      const pkg = createMockPackage({
        usedMinutes: 200,
        remainingMinutes: 800,
      });
      creditPackageRepo.findOne.mockResolvedValueOnce(pkg);
      creditPackageRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );
      creditTransactionRepo.save.mockImplementation((entity) =>
        Promise.resolve({ ...entity, id: TX_ID }),
      );

      const result = await service.refundCredits(
        COMPANY_ID,
        mockUserId,
        60,
        'booking-123',
        'Booking cancelled',
      );

      expect(pkg.remainingMinutes).toBe(860);
      expect(pkg.usedMinutes).toBe(140);
      expect(result.transactionType).toBe(CreditTransactionType.REFUND);
    });

    it('should reactivate an EXHAUSTED package on refund', async () => {
      const pkg = createMockPackage({
        status: CreditPackageStatus.EXHAUSTED,
        remainingMinutes: 0,
        usedMinutes: 1000,
      });
      creditPackageRepo.findOne.mockResolvedValueOnce(pkg);
      creditPackageRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );
      creditTransactionRepo.save.mockResolvedValueOnce(createMockTransaction());

      await service.refundCredits(COMPANY_ID, mockUserId, 100);

      expect(pkg.status).toBe(CreditPackageStatus.ACTIVE);
      expect(pkg.remainingMinutes).toBe(100);
    });

    it('should throw NotFoundException when no package exists', async () => {
      creditPackageRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.refundCredits(COMPANY_ID, mockUserId, 60),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================================================
  // getBalance
  // =========================================================================

  describe('getBalance', () => {
    it('should aggregate totals across all active packages', async () => {
      creditPackageRepo.find.mockResolvedValueOnce([
        createMockPackage({
          totalMinutes: 1000,
          usedMinutes: 200,
          remainingMinutes: 800,
        }),
        createMockPackage({
          id: PACKAGE_2_ID,
          totalMinutes: 500,
          usedMinutes: 100,
          remainingMinutes: 400,
        }),
      ]);

      const result = await service.getBalance(COMPANY_ID);

      expect(result).toEqual({
        totalMinutes: 1500,
        usedMinutes: 300,
        remainingMinutes: 1200,
      });
    });

    it('should return zeros when no active packages', async () => {
      creditPackageRepo.find.mockResolvedValueOnce([]);

      const result = await service.getBalance(COMPANY_ID);

      expect(result).toEqual({
        totalMinutes: 0,
        usedMinutes: 0,
        remainingMinutes: 0,
      });
    });
  });

  // =========================================================================
  // getTransactionHistory
  // =========================================================================

  describe('getTransactionHistory', () => {
    it('should return paginated transaction history', async () => {
      const txs = [createMockTransaction()];
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([txs, 1]);
      creditTransactionRepo.createQueryBuilder.mockReturnValueOnce(qb);

      const result = await service.getTransactionHistory(COMPANY_ID);

      expect(result).toEqual({ data: txs, total: 1, page: 1, limit: 20 });
    });

    it('should respect custom page and limit', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      creditTransactionRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.getTransactionHistory(COMPANY_ID, 2, 10);

      expect(qb['skip']).toHaveBeenCalledWith(10);
      expect(qb['take']).toHaveBeenCalledWith(10);
    });
  });

  // =========================================================================
  // findPackageById
  // =========================================================================

  describe('findPackageById', () => {
    it('should return the package with transactions', async () => {
      const pkg = createMockPackage();
      creditPackageRepo.findOne.mockResolvedValueOnce(pkg);

      const result = await service.findPackageById(PACKAGE_ID);

      expect(result).toEqual(pkg);
      expect(creditPackageRepo.findOne).toHaveBeenCalledWith({
        where: { id: PACKAGE_ID },
        relations: ['transactions'],
      });
    });

    it('should throw NotFoundException when package is not found', async () => {
      creditPackageRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.findPackageById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // =========================================================================
  // checkExpiredPackages
  // =========================================================================

  describe('checkExpiredPackages', () => {
    it('should update expired active packages and return count', async () => {
      const qb = createMockQueryBuilder();
      qb['execute'].mockResolvedValueOnce({ affected: 3 });
      creditPackageRepo.createQueryBuilder.mockReturnValueOnce(qb);

      const result = await service.checkExpiredPackages();

      expect(result).toBe(3);
      expect(qb['update']).toHaveBeenCalledWith(CreditPackage);
      expect(qb['set']).toHaveBeenCalledWith({
        status: CreditPackageStatus.EXPIRED,
      });
    });

    it('should return 0 when no packages have expired', async () => {
      const qb = createMockQueryBuilder();
      qb['execute'].mockResolvedValueOnce({ affected: 0 });
      creditPackageRepo.createQueryBuilder.mockReturnValueOnce(qb);

      const result = await service.checkExpiredPackages();

      expect(result).toBe(0);
    });
  });
});
