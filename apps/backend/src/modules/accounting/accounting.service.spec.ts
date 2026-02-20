import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

import { AccountingService } from './accounting.service';
import {
  AccountingPeriod,
  PeriodStatus,
} from '@/common/database/entities/accounting-period.entity';
import {
  RevenueEntry,
  RevenueEntryType,
} from '@/common/database/entities/revenue-entry.entity';

// ── Helper: build a mock AccountingPeriod ────────────────────────────
function mockPeriod(overrides: Partial<AccountingPeriod> = {}): AccountingPeriod {
  return {
    id: 'period-uuid-1',
    name: '2025-01',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-01-31'),
    status: PeriodStatus.OPEN,
    closedAt: null,
    closedBy: null,
    closingNotes: null,
    createdBy: 'admin-uuid-1',
    updatedBy: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    deletedAt: null,
    ...overrides,
  } as AccountingPeriod;
}

// ── Helper: build a mock RevenueEntry ────────────────────────────────
function mockRevenueEntry(overrides: Partial<RevenueEntry> = {}): RevenueEntry {
  return {
    id: 'entry-uuid-1',
    sourceType: 'pass',
    sourceId: 'pass-uuid-1',
    date: new Date('2025-01-15'),
    entryType: RevenueEntryType.RECOGNITION,
    recognizedAmount: 100,
    deferredRemaining: 900,
    totalContractValue: 1000,
    currency: 'GEL',
    locationId: 'loc-1',
    productType: 'coworking_pass',
    accountingPeriodId: 'period-uuid-1',
    bcJournalEntryRef: null,
    bcSynced: false,
    calculationDetails: {
      dailyRate: 33.33,
      totalDays: 30,
      daysElapsed: 3,
      daysRemaining: 27,
      periodStart: '2025-01-01',
      periodEnd: '2025-01-31',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  } as RevenueEntry;
}

// ── QueryBuilder mock factory ────────────────────────────────────────
function createQueryBuilderMock(overrides: Record<string, any> = {}) {
  const qb: Record<string, jest.Mock> = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    setParameter: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    getOne: jest.fn().mockResolvedValue(null),
    getCount: jest.fn().mockResolvedValue(0),
    getRawOne: jest.fn().mockResolvedValue(null),
    getRawMany: jest.fn().mockResolvedValue([]),
    ...overrides,
  };
  return qb;
}

describe('AccountingService', () => {
  let service: AccountingService;
  let periodRepo: Record<string, jest.Mock>;
  let revenueEntryRepo: Record<string, jest.Mock>;

  let periodQb: ReturnType<typeof createQueryBuilderMock>;
  let entryQb: ReturnType<typeof createQueryBuilderMock>;

  beforeEach(async () => {
    periodQb = createQueryBuilderMock();
    entryQb = createQueryBuilderMock();

    periodRepo = {
      create: jest.fn().mockImplementation((data) => ({ id: 'period-uuid-new', ...data })),
      save: jest.fn().mockImplementation((data) => Promise.resolve(data)),
      findOne: jest.fn(),
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
      createQueryBuilder: jest.fn().mockReturnValue(periodQb),
    };

    revenueEntryRepo = {
      create: jest.fn().mockImplementation((data) => ({ id: 'entry-uuid-new', ...data })),
      save: jest.fn().mockImplementation((data) => Promise.resolve(data)),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(entryQb),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountingService,
        { provide: getRepositoryToken(AccountingPeriod), useValue: periodRepo },
        { provide: getRepositoryToken(RevenueEntry), useValue: revenueEntryRepo },
      ],
    }).compile();

    service = module.get<AccountingService>(AccountingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────
  // Period Management: createPeriod
  // ─────────────────────────────────────────────────────────────────
  describe('createPeriod', () => {
    const createDto = {
      name: '2025-02',
      startDate: '2025-02-01',
      endDate: '2025-02-28',
    };

    it('should create a new accounting period when no overlap exists', async () => {
      periodQb.getOne.mockResolvedValue(null); // no overlapping

      const result = await service.createPeriod(createDto as any, 'admin-1');

      expect(periodRepo.create).toHaveBeenCalledWith({
        name: '2025-02',
        startDate: new Date('2025-02-01'),
        endDate: new Date('2025-02-28'),
        status: PeriodStatus.OPEN,
        createdBy: 'admin-1',
      });
      expect(periodRepo.save).toHaveBeenCalled();
      expect(result.name).toBe('2025-02');
    });

    it('should throw ConflictException when period overlaps with existing', async () => {
      const existingPeriod = mockPeriod({
        name: '2025-01',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-02-15'),
      });
      periodQb.getOne.mockResolvedValue(existingPeriod);

      await expect(
        service.createPeriod(createDto as any, 'admin-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('should detect overlap when new period is entirely within existing period', async () => {
      const existingPeriod = mockPeriod({
        name: '2025-Q1',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-03-31'),
      });
      periodQb.getOne.mockResolvedValue(existingPeriod);

      await expect(
        service.createPeriod(createDto as any, 'admin-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('should detect overlap when existing period is entirely within new period', async () => {
      const existingPeriod = mockPeriod({
        name: '2025-02-mid',
        startDate: new Date('2025-02-10'),
        endDate: new Date('2025-02-20'),
      });
      periodQb.getOne.mockResolvedValue(existingPeriod);

      await expect(
        service.createPeriod(createDto as any, 'admin-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('should create period with correct status of OPEN', async () => {
      periodQb.getOne.mockResolvedValue(null);

      const result = await service.createPeriod(createDto as any, 'admin-1');

      expect(result.status).toBe(PeriodStatus.OPEN);
    });

    it('should correctly pass the creator userId', async () => {
      periodQb.getOne.mockResolvedValue(null);

      await service.createPeriod(createDto as any, 'finance-admin-99');

      expect(periodRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ createdBy: 'finance-admin-99' }),
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Period Management: findAllPeriods
  // ─────────────────────────────────────────────────────────────────
  describe('findAllPeriods', () => {
    it('should return paginated periods ordered by startDate DESC', async () => {
      const periods = [mockPeriod(), mockPeriod({ id: 'period-2', name: '2025-02' })];
      periodRepo.findAndCount.mockResolvedValue([periods, 2]);

      const result = await service.findAllPeriods(1, 20);

      expect(periodRepo.findAndCount).toHaveBeenCalledWith({
        order: { startDate: 'DESC' },
        skip: 0,
        take: 20,
      });
      expect(result.data).toEqual(periods);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should handle page 2 correctly', async () => {
      periodRepo.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAllPeriods(2, 10);

      expect(periodRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
    });

    it('should use default pagination values', async () => {
      periodRepo.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAllPeriods();

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Period Management: findPeriodById
  // ─────────────────────────────────────────────────────────────────
  describe('findPeriodById', () => {
    it('should return period when found', async () => {
      const period = mockPeriod();
      periodRepo.findOne.mockResolvedValue(period);

      const result = await service.findPeriodById('period-uuid-1');

      expect(result).toEqual(period);
      expect(periodRepo.findOne).toHaveBeenCalledWith({ where: { id: 'period-uuid-1' } });
    });

    it('should throw NotFoundException when period not found', async () => {
      periodRepo.findOne.mockResolvedValue(null);

      await expect(
        service.findPeriodById('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Period Management: findCurrentPeriod
  // ─────────────────────────────────────────────────────────────────
  describe('findCurrentPeriod', () => {
    it('should return the current open period matching today', async () => {
      const currentPeriod = mockPeriod({ status: PeriodStatus.OPEN });
      periodQb.getOne.mockResolvedValue(currentPeriod);

      const result = await service.findCurrentPeriod();

      expect(result).toEqual(currentPeriod);
      expect(periodQb.where).toHaveBeenCalledWith(
        'period.status = :status',
        { status: PeriodStatus.OPEN },
      );
    });

    it('should return null when no current period exists', async () => {
      periodQb.getOne.mockResolvedValue(null);

      const result = await service.findCurrentPeriod();

      expect(result).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Period Management: closePeriod
  // ─────────────────────────────────────────────────────────────────
  describe('closePeriod', () => {
    it('should close an OPEN period', async () => {
      const period = mockPeriod({ status: PeriodStatus.OPEN });
      periodRepo.findOne.mockResolvedValue(period);
      periodRepo.save.mockImplementation((p) => Promise.resolve(p));

      const result = await service.closePeriod(
        'period-uuid-1',
        { closingNotes: 'Month-end close' } as any,
        'admin-1',
      );

      expect(result.status).toBe(PeriodStatus.CLOSED);
      expect(result.closedAt).toBeInstanceOf(Date);
      expect(result.closedBy).toBe('admin-1');
      expect(result.closingNotes).toBe('Month-end close');
    });

    it('should throw BadRequestException when trying to close a CLOSED period', async () => {
      const period = mockPeriod({ status: PeriodStatus.CLOSED });
      periodRepo.findOne.mockResolvedValue(period);

      await expect(
        service.closePeriod('period-uuid-1', {} as any, 'admin-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when trying to close a CLOSING period', async () => {
      const period = mockPeriod({ status: PeriodStatus.CLOSING });
      periodRepo.findOne.mockResolvedValue(period);

      await expect(
        service.closePeriod('period-uuid-1', {} as any, 'admin-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if period does not exist', async () => {
      periodRepo.findOne.mockResolvedValue(null);

      await expect(
        service.closePeriod('nonexistent', {} as any, 'admin-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle null closingNotes', async () => {
      const period = mockPeriod({ status: PeriodStatus.OPEN });
      periodRepo.findOne.mockResolvedValue(period);
      periodRepo.save.mockImplementation((p) => Promise.resolve(p));

      const result = await service.closePeriod(
        'period-uuid-1',
        {} as any,
        'admin-1',
      );

      expect(result.closingNotes).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Period Management: reopenPeriod
  // ─────────────────────────────────────────────────────────────────
  describe('reopenPeriod', () => {
    it('should reopen a CLOSED period', async () => {
      const period = mockPeriod({
        status: PeriodStatus.CLOSED,
        closedAt: new Date(),
        closedBy: 'admin-1',
        closingNotes: 'Previous close',
      });
      periodRepo.findOne.mockResolvedValue(period);
      periodRepo.save.mockImplementation((p) => Promise.resolve(p));

      const result = await service.reopenPeriod('period-uuid-1');

      expect(result.status).toBe(PeriodStatus.OPEN);
      expect(result.closedAt).toBeNull();
      expect(result.closedBy).toBeNull();
      expect(result.closingNotes).toBeNull();
    });

    it('should throw BadRequestException when trying to reopen an OPEN period', async () => {
      const period = mockPeriod({ status: PeriodStatus.OPEN });
      periodRepo.findOne.mockResolvedValue(period);

      await expect(
        service.reopenPeriod('period-uuid-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when trying to reopen a CLOSING period', async () => {
      const period = mockPeriod({ status: PeriodStatus.CLOSING });
      periodRepo.findOne.mockResolvedValue(period);

      await expect(
        service.reopenPeriod('period-uuid-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if period does not exist', async () => {
      periodRepo.findOne.mockResolvedValue(null);

      await expect(
        service.reopenPeriod('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Closed Period Protection
  // ─────────────────────────────────────────────────────────────────
  describe('closed period protection', () => {
    it('closing a period should prevent re-closing', async () => {
      // First close
      const period = mockPeriod({ status: PeriodStatus.OPEN });
      periodRepo.findOne.mockResolvedValue(period);
      periodRepo.save.mockImplementation((p) => Promise.resolve(p));

      await service.closePeriod('period-uuid-1', {} as any, 'admin-1');

      // After close, period status is now CLOSED
      // Attempt to close again should fail
      await expect(
        service.closePeriod('period-uuid-1', {} as any, 'admin-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('closing should be idempotent in terms of side effects', async () => {
      const period = mockPeriod({ status: PeriodStatus.OPEN });
      periodRepo.findOne.mockResolvedValue(period);
      periodRepo.save.mockImplementation((p) => Promise.resolve(p));

      const result = await service.closePeriod('period-uuid-1', {} as any, 'admin-1');

      expect(result.status).toBe(PeriodStatus.CLOSED);
      expect(periodRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Period Summary (IFRS 15 revenue recognition aggregation)
  // ─────────────────────────────────────────────────────────────────
  describe('getPeriodSummary', () => {
    it('should return aggregated totals for a period', async () => {
      periodRepo.findOne.mockResolvedValue(mockPeriod());

      // The service calls createQueryBuilder on revenueEntryRepo three times
      const totalsQb = createQueryBuilderMock();
      const deferredQb = createQueryBuilderMock();
      const bySourceQb = createQueryBuilderMock();

      totalsQb.getRawMany.mockResolvedValue([
        { entryType: RevenueEntryType.RECOGNITION, totalAmount: '5000.5', count: '100' },
        { entryType: RevenueEntryType.REVERSAL, totalAmount: '-200', count: '5' },
        { entryType: RevenueEntryType.ADJUSTMENT, totalAmount: '150.75', count: '3' },
      ]);

      deferredQb.getRawOne.mockResolvedValue({ totalDeferred: '45000' });

      bySourceQb.getRawMany.mockResolvedValue([
        { sourceType: 'pass', recognized: '3000', deferred: '30000' },
        { sourceType: 'booking', recognized: '2000.5', deferred: '15000' },
      ]);

      let callCount = 0;
      revenueEntryRepo.createQueryBuilder.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return totalsQb;
        if (callCount === 2) return deferredQb;
        return bySourceQb;
      });

      const result = await service.getPeriodSummary('period-uuid-1');

      expect(result.totalRecognized).toBe(5000.5);
      expect(result.totalDeferred).toBe(45000);
      expect(result.totalReversals).toBe(-200);
      expect(result.totalAdjustments).toBe(150.75);
      expect(result.entryCount).toBe(108); // 100 + 5 + 3
      expect(result.bySourceType).toEqual({
        pass: { recognized: 3000, deferred: 30000 },
        booking: { recognized: 2000.5, deferred: 15000 },
      });
    });

    it('should handle empty period with zero values', async () => {
      periodRepo.findOne.mockResolvedValue(mockPeriod());

      const emptyQb = createQueryBuilderMock();
      emptyQb.getRawMany.mockResolvedValue([]);
      emptyQb.getRawOne.mockResolvedValue({ totalDeferred: null });

      revenueEntryRepo.createQueryBuilder.mockReturnValue(emptyQb);

      const result = await service.getPeriodSummary('period-uuid-1');

      expect(result.totalRecognized).toBe(0);
      expect(result.totalDeferred).toBe(0);
      expect(result.totalReversals).toBe(0);
      expect(result.totalAdjustments).toBe(0);
      expect(result.entryCount).toBe(0);
      expect(result.bySourceType).toEqual({});
    });

    it('should round financial values to 4 decimal places', async () => {
      periodRepo.findOne.mockResolvedValue(mockPeriod());

      const totalsQb = createQueryBuilderMock();
      const deferredQb = createQueryBuilderMock();
      const bySourceQb = createQueryBuilderMock();

      totalsQb.getRawMany.mockResolvedValue([
        {
          entryType: RevenueEntryType.RECOGNITION,
          totalAmount: '5000.123456789',
          count: '1',
        },
      ]);
      deferredQb.getRawOne.mockResolvedValue({ totalDeferred: '9999.999999' });
      bySourceQb.getRawMany.mockResolvedValue([]);

      let callCount = 0;
      revenueEntryRepo.createQueryBuilder.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return totalsQb;
        if (callCount === 2) return deferredQb;
        return bySourceQb;
      });

      const result = await service.getPeriodSummary('period-uuid-1');

      // Math.round(5000.123456789 * 10000) / 10000 = 5000.1235
      expect(result.totalRecognized).toBe(5000.1235);
      // Math.round(9999.999999 * 10000) / 10000 = 10000
      expect(result.totalDeferred).toBe(10000);
    });

    it('should throw NotFoundException if period does not exist', async () => {
      periodRepo.findOne.mockResolvedValue(null);

      await expect(
        service.getPeriodSummary('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle null amounts gracefully', async () => {
      periodRepo.findOne.mockResolvedValue(mockPeriod());

      const totalsQb = createQueryBuilderMock();
      totalsQb.getRawMany.mockResolvedValue([
        { entryType: RevenueEntryType.RECOGNITION, totalAmount: null, count: null },
      ]);

      const deferredQb = createQueryBuilderMock();
      deferredQb.getRawOne.mockResolvedValue({ totalDeferred: null });

      const bySourceQb = createQueryBuilderMock();
      bySourceQb.getRawMany.mockResolvedValue([
        { sourceType: 'pass', recognized: null, deferred: null },
      ]);

      let callCount = 0;
      revenueEntryRepo.createQueryBuilder.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return totalsQb;
        if (callCount === 2) return deferredQb;
        return bySourceQb;
      });

      const result = await service.getPeriodSummary('period-uuid-1');

      expect(result.totalRecognized).toBe(0);
      expect(result.totalDeferred).toBe(0);
      expect(result.bySourceType).toEqual({
        pass: { recognized: 0, deferred: 0 },
      });
    });

    it('should separate recognized vs deferred vs reversal vs adjustment correctly', async () => {
      periodRepo.findOne.mockResolvedValue(mockPeriod());

      const totalsQb = createQueryBuilderMock();
      const deferredQb = createQueryBuilderMock();
      const bySourceQb = createQueryBuilderMock();

      totalsQb.getRawMany.mockResolvedValue([
        { entryType: RevenueEntryType.RECOGNITION, totalAmount: '10000', count: '50' },
        { entryType: RevenueEntryType.REVERSAL, totalAmount: '-500', count: '2' },
        { entryType: RevenueEntryType.ADJUSTMENT, totalAmount: '300', count: '1' },
      ]);
      deferredQb.getRawOne.mockResolvedValue({ totalDeferred: '90000' });
      bySourceQb.getRawMany.mockResolvedValue([]);

      let callCount = 0;
      revenueEntryRepo.createQueryBuilder.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return totalsQb;
        if (callCount === 2) return deferredQb;
        return bySourceQb;
      });

      const result = await service.getPeriodSummary('period-uuid-1');

      expect(result.totalRecognized).toBe(10000);
      expect(result.totalReversals).toBe(-500);
      expect(result.totalAdjustments).toBe(300);
      expect(result.totalDeferred).toBe(90000);
      expect(result.entryCount).toBe(53);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Revenue Entry Queries
  // ─────────────────────────────────────────────────────────────────
  describe('findRevenueEntries', () => {
    it('should return paginated revenue entries', async () => {
      const entries = [mockRevenueEntry()];
      entryQb.getManyAndCount.mockResolvedValue([entries, 1]);

      const result = await service.findRevenueEntries({ page: 1, limit: 20 } as any);

      expect(result.data).toEqual(entries);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should apply sourceType filter', async () => {
      entryQb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findRevenueEntries({ sourceType: 'pass' } as any);

      expect(entryQb.andWhere).toHaveBeenCalledWith(
        'entry.source_type = :sourceType',
        { sourceType: 'pass' },
      );
    });

    it('should apply locationId filter', async () => {
      entryQb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findRevenueEntries({ locationId: 'loc-1' } as any);

      expect(entryQb.andWhere).toHaveBeenCalledWith(
        'entry.location_id = :locationId',
        { locationId: 'loc-1' },
      );
    });

    it('should apply productType filter', async () => {
      entryQb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findRevenueEntries({ productType: 'coworking_pass' } as any);

      expect(entryQb.andWhere).toHaveBeenCalledWith(
        'entry.product_type = :productType',
        { productType: 'coworking_pass' },
      );
    });

    it('should apply date range filters', async () => {
      entryQb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findRevenueEntries({
        dateFrom: '2025-01-01',
        dateTo: '2025-01-31',
      } as any);

      expect(entryQb.andWhere).toHaveBeenCalledWith(
        'entry.date >= :dateFrom',
        { dateFrom: '2025-01-01' },
      );
      expect(entryQb.andWhere).toHaveBeenCalledWith(
        'entry.date <= :dateTo',
        { dateTo: '2025-01-31' },
      );
    });

    it('should apply accountingPeriodId filter', async () => {
      entryQb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findRevenueEntries({
        accountingPeriodId: 'period-uuid-1',
      } as any);

      expect(entryQb.andWhere).toHaveBeenCalledWith(
        'entry.accounting_period_id = :accountingPeriodId',
        { accountingPeriodId: 'period-uuid-1' },
      );
    });

    it('should apply entryType filter', async () => {
      entryQb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findRevenueEntries({
        entryType: RevenueEntryType.REVERSAL,
      } as any);

      expect(entryQb.andWhere).toHaveBeenCalledWith(
        'entry.entry_type = :entryType',
        { entryType: RevenueEntryType.REVERSAL },
      );
    });

    it('should apply all filters simultaneously', async () => {
      entryQb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findRevenueEntries({
        sourceType: 'pass',
        locationId: 'loc-1',
        productType: 'coworking_pass',
        dateFrom: '2025-01-01',
        dateTo: '2025-01-31',
        accountingPeriodId: 'period-uuid-1',
        entryType: RevenueEntryType.RECOGNITION,
        page: 2,
        limit: 10,
      } as any);

      expect(entryQb.andWhere).toHaveBeenCalledTimes(7);
      expect(entryQb.skip).toHaveBeenCalledWith(10);
      expect(entryQb.take).toHaveBeenCalledWith(10);
    });

    it('should use default pagination when not provided', async () => {
      entryQb.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.findRevenueEntries({} as any);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(entryQb.skip).toHaveBeenCalledWith(0);
      expect(entryQb.take).toHaveBeenCalledWith(20);
    });

    it('should order entries by date DESC', async () => {
      entryQb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findRevenueEntries({} as any);

      expect(entryQb.orderBy).toHaveBeenCalledWith('entry.date', 'DESC');
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Period Lifecycle: full open -> close -> reopen cycle
  // ─────────────────────────────────────────────────────────────────
  describe('period lifecycle', () => {
    it('should support full open -> close -> reopen -> close cycle', async () => {
      const period = mockPeriod({ status: PeriodStatus.OPEN });
      periodRepo.findOne.mockResolvedValue(period);
      periodRepo.save.mockImplementation((p) => Promise.resolve(p));

      // Close
      const closed = await service.closePeriod('period-uuid-1', {
        closingNotes: 'Month-end',
      } as any, 'admin-1');
      expect(closed.status).toBe(PeriodStatus.CLOSED);

      // Reopen
      const reopened = await service.reopenPeriod('period-uuid-1');
      expect(reopened.status).toBe(PeriodStatus.OPEN);
      expect(reopened.closedAt).toBeNull();
      expect(reopened.closedBy).toBeNull();

      // Close again
      const closed2 = await service.closePeriod('period-uuid-1', {
        closingNotes: 'Corrected close',
      } as any, 'admin-2');
      expect(closed2.status).toBe(PeriodStatus.CLOSED);
      expect(closed2.closedBy).toBe('admin-2');
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // IFRS 15 Revenue Recognition: Entry type breakdown
  // ─────────────────────────────────────────────────────────────────
  describe('IFRS 15 revenue recognition entry types', () => {
    it('RECOGNITION entries should represent daily recognized amounts', async () => {
      periodRepo.findOne.mockResolvedValue(mockPeriod());

      const totalsQb = createQueryBuilderMock();
      totalsQb.getRawMany.mockResolvedValue([
        { entryType: RevenueEntryType.RECOGNITION, totalAmount: '1000', count: '30' },
      ]);

      const deferredQb = createQueryBuilderMock();
      deferredQb.getRawOne.mockResolvedValue({ totalDeferred: '11000' });

      const bySourceQb = createQueryBuilderMock();
      bySourceQb.getRawMany.mockResolvedValue([
        { sourceType: 'pass', recognized: '1000', deferred: '11000' },
      ]);

      let callCount = 0;
      revenueEntryRepo.createQueryBuilder.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return totalsQb;
        if (callCount === 2) return deferredQb;
        return bySourceQb;
      });

      const result = await service.getPeriodSummary('period-uuid-1');

      // 30 recognition entries totaling 1000 means ~33.33/day
      // totalDeferred should be the remaining contract value
      expect(result.totalRecognized).toBe(1000);
      expect(result.totalDeferred).toBe(11000);
      expect(result.entryCount).toBe(30);
    });

    it('REVERSAL entries should represent negative corrections', async () => {
      periodRepo.findOne.mockResolvedValue(mockPeriod());

      const totalsQb = createQueryBuilderMock();
      totalsQb.getRawMany.mockResolvedValue([
        { entryType: RevenueEntryType.REVERSAL, totalAmount: '-500', count: '2' },
      ]);

      const deferredQb = createQueryBuilderMock();
      deferredQb.getRawOne.mockResolvedValue({ totalDeferred: '0' });

      const bySourceQb = createQueryBuilderMock();
      bySourceQb.getRawMany.mockResolvedValue([]);

      let callCount = 0;
      revenueEntryRepo.createQueryBuilder.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return totalsQb;
        if (callCount === 2) return deferredQb;
        return bySourceQb;
      });

      const result = await service.getPeriodSummary('period-uuid-1');

      expect(result.totalReversals).toBe(-500);
      expect(result.totalRecognized).toBe(0);
    });

    it('ADJUSTMENT entries should represent forward-only corrections', async () => {
      periodRepo.findOne.mockResolvedValue(mockPeriod());

      const totalsQb = createQueryBuilderMock();
      totalsQb.getRawMany.mockResolvedValue([
        { entryType: RevenueEntryType.RECOGNITION, totalAmount: '5000', count: '30' },
        { entryType: RevenueEntryType.ADJUSTMENT, totalAmount: '200', count: '1' },
      ]);

      const deferredQb = createQueryBuilderMock();
      deferredQb.getRawOne.mockResolvedValue({ totalDeferred: '4800' });

      const bySourceQb = createQueryBuilderMock();
      bySourceQb.getRawMany.mockResolvedValue([]);

      let callCount = 0;
      revenueEntryRepo.createQueryBuilder.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return totalsQb;
        if (callCount === 2) return deferredQb;
        return bySourceQb;
      });

      const result = await service.getPeriodSummary('period-uuid-1');

      expect(result.totalRecognized).toBe(5000);
      expect(result.totalAdjustments).toBe(200);
      // Net: recognized (5000) + adjustments (200) - deferred remains separate
      expect(result.totalDeferred).toBe(4800);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // IFRS 15: By source type breakdown
  // ─────────────────────────────────────────────────────────────────
  describe('IFRS 15 revenue by source type', () => {
    it('should break down recognized and deferred by source type', async () => {
      periodRepo.findOne.mockResolvedValue(mockPeriod());

      const totalsQb = createQueryBuilderMock();
      totalsQb.getRawMany.mockResolvedValue([
        { entryType: RevenueEntryType.RECOGNITION, totalAmount: '8000', count: '60' },
      ]);

      const deferredQb = createQueryBuilderMock();
      deferredQb.getRawOne.mockResolvedValue({ totalDeferred: '72000' });

      const bySourceQb = createQueryBuilderMock();
      bySourceQb.getRawMany.mockResolvedValue([
        { sourceType: 'pass', recognized: '5000', deferred: '45000' },
        { sourceType: 'booking', recognized: '2000', deferred: '18000' },
        { sourceType: 'rental', recognized: '1000', deferred: '9000' },
      ]);

      let callCount = 0;
      revenueEntryRepo.createQueryBuilder.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return totalsQb;
        if (callCount === 2) return deferredQb;
        return bySourceQb;
      });

      const result = await service.getPeriodSummary('period-uuid-1');

      expect(Object.keys(result.bySourceType)).toHaveLength(3);
      expect(result.bySourceType['pass']).toEqual({
        recognized: 5000,
        deferred: 45000,
      });
      expect(result.bySourceType['booking']).toEqual({
        recognized: 2000,
        deferred: 18000,
      });
      expect(result.bySourceType['rental']).toEqual({
        recognized: 1000,
        deferred: 9000,
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Edge cases
  // ─────────────────────────────────────────────────────────────────
  describe('edge cases', () => {
    it('should handle periods with same start and end date (single day)', async () => {
      periodQb.getOne.mockResolvedValue(null);

      const result = await service.createPeriod(
        { name: '2025-01-15', startDate: '2025-01-15', endDate: '2025-01-15' } as any,
        'admin-1',
      );

      expect(periodRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: new Date('2025-01-15'),
          endDate: new Date('2025-01-15'),
        }),
      );
    });

    it('createPeriod should use query builder to check overlaps correctly', async () => {
      periodQb.getOne.mockResolvedValue(null);

      await service.createPeriod(
        { name: '2025-03', startDate: '2025-03-01', endDate: '2025-03-31' } as any,
        'admin-1',
      );

      expect(periodQb.where).toHaveBeenCalledWith(
        'period.start_date <= :endDate',
        { endDate: '2025-03-31' },
      );
      expect(periodQb.andWhere).toHaveBeenCalledWith(
        'period.end_date >= :startDate',
        { startDate: '2025-03-01' },
      );
    });

    it('getPeriodSummary should query with correct period ID', async () => {
      periodRepo.findOne.mockResolvedValue(mockPeriod({ id: 'specific-period-id' }));

      const emptyQb = createQueryBuilderMock();
      emptyQb.getRawMany.mockResolvedValue([]);
      emptyQb.getRawOne.mockResolvedValue({ totalDeferred: '0' });
      revenueEntryRepo.createQueryBuilder.mockReturnValue(emptyQb);

      await service.getPeriodSummary('specific-period-id');

      // Should pass periodId to the where/andWhere clause
      expect(emptyQb.where).toHaveBeenCalledWith(
        'entry.accounting_period_id = :periodId',
        { periodId: 'specific-period-id' },
      );
    });
  });
});
