import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { Booking } from '@/common/database/entities/booking.entity';
import { Payment } from '@/common/database/entities/payment.entity';
import { Resource } from '@/common/database/entities/resource.entity';
import { User } from '@/common/database/entities/user.entity';
import { mockRepository, mockQueryBuilder } from '@/test/test-utils';

describe('ReportsService', () => {
  let service: ReportsService;
  let bookingRepo: ReturnType<typeof mockRepository>;
  let paymentRepo: ReturnType<typeof mockRepository>;
  let resourceRepo: ReturnType<typeof mockRepository>;
  let userRepo: ReturnType<typeof mockRepository>;

  beforeEach(async () => {
    bookingRepo = mockRepository();
    paymentRepo = mockRepository();
    resourceRepo = mockRepository();
    userRepo = mockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: getRepositoryToken(Booking), useValue: bookingRepo },
        { provide: getRepositoryToken(Payment), useValue: paymentRepo },
        { provide: getRepositoryToken(Resource), useValue: resourceRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBookingReport', () => {
    it('should return booking report with totals', async () => {
      const mockBookings = [
        { status: 'confirmed', totalAmount: '100' },
        { status: 'cancelled', totalAmount: '50' },
        { status: 'confirmed', totalAmount: '200' },
      ];
      const qb = mockQueryBuilder();
      qb.getMany.mockResolvedValue(mockBookings);
      bookingRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getBookingReport();

      expect(result.totalBookings).toBe(3);
      expect(result.confirmedCount).toBe(2);
      expect(result.cancelledCount).toBe(1);
      expect(result.totalRevenue).toBe(350);
      expect(result.currency).toBe('GEL');
    });

    it('should filter by date range when provided', async () => {
      const qb = mockQueryBuilder();
      qb.getMany.mockResolvedValue([]);
      bookingRepo.createQueryBuilder.mockReturnValue(qb);

      await service.getBookingReport('2025-01-01', '2025-12-31');

      expect(qb.andWhere).toHaveBeenCalled();
    });

    it('should filter by locationId when provided', async () => {
      const qb = mockQueryBuilder();
      qb.getMany.mockResolvedValue([]);
      bookingRepo.createQueryBuilder.mockReturnValue(qb);

      await service.getBookingReport(undefined, undefined, 'loc-1');

      expect(qb.andWhere).toHaveBeenCalledWith(
        'resource.locationId = :locationId',
        { locationId: 'loc-1' },
      );
    });
  });

  describe('getRevenueReport', () => {
    it('should calculate revenue by payment status', async () => {
      const mockPayments = [
        { status: 'completed', amount: '500' },
        { status: 'completed', amount: '300' },
        { status: 'pending', amount: '100' },
        { status: 'refunded', amount: '50' },
      ];
      const qb = mockQueryBuilder();
      qb.getMany.mockResolvedValue(mockPayments);
      paymentRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getRevenueReport();

      expect(result.totalRevenue).toBe(800);
      expect(result.pendingRevenue).toBe(100);
      expect(result.refundedAmount).toBe(50);
      expect(result.transactionCount).toBe(4);
      expect(result.currency).toBe('GEL');
    });
  });

  describe('getOccupancyReport', () => {
    it('should calculate occupancy rate', async () => {
      const mockResources = [
        { isActive: true },
        { isActive: true },
        { isActive: false },
      ];
      const resourceQb = mockQueryBuilder();
      resourceQb.getMany.mockResolvedValue(mockResources);
      resourceRepo.createQueryBuilder.mockReturnValue(resourceQb);

      const bookingQb = mockQueryBuilder();
      bookingQb.getCount.mockResolvedValue(1);
      bookingRepo.createQueryBuilder.mockReturnValue(bookingQb);

      const result = await service.getOccupancyReport();

      expect(result.totalResources).toBe(3);
      expect(result.activeResources).toBe(2);
      expect(result.currentlyOccupied).toBe(1);
      expect(result.occupancyRate).toBe(33);
    });

    it('should return 0 occupancy rate when no resources', async () => {
      const resourceQb = mockQueryBuilder();
      resourceQb.getMany.mockResolvedValue([]);
      resourceRepo.createQueryBuilder.mockReturnValue(resourceQb);

      const bookingQb = mockQueryBuilder();
      bookingQb.getCount.mockResolvedValue(0);
      bookingRepo.createQueryBuilder.mockReturnValue(bookingQb);

      const result = await service.getOccupancyReport();

      expect(result.occupancyRate).toBe(0);
    });
  });

  describe('getUserReport', () => {
    it('should return user statistics', async () => {
      userRepo.count.mockResolvedValueOnce(100);
      userRepo.count.mockResolvedValueOnce(85);

      const qb = mockQueryBuilder();
      qb.getCount.mockResolvedValue(12);
      userRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getUserReport();

      expect(result.totalUsers).toBe(100);
      expect(result.activeUsers).toBe(85);
      expect(result.newUsersThisMonth).toBe(12);
    });
  });
});
