import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

import { BookingsService } from './bookings.service';
import {
  Booking,
  BookingStatus,
  BookingPaymentStatus,
} from '@/common/database/entities/booking.entity';
import {
  Resource,
  ResourceType,
  PricingModel,
} from '@/common/database/entities/resource.entity';
import {
  UserPass,
  PassStatus,
} from '@/common/database/entities/user-pass.entity';

// ── Helper: build a mock resource ────────────────────────────────────
function mockResource(overrides: Partial<Resource> = {}): Resource {
  return {
    id: 'resource-uuid-1',
    name: 'Meeting Room A',
    locationId: 'loc-1',
    location: { id: 'loc-1', name: 'Tbilisi Office' } as any,
    resourceType: ResourceType.MEETING_ROOM,
    block: null,
    floor: '2',
    size: 20,
    measurementUnit: 'sqm' as any,
    capacity: 10,
    pricingModel: PricingModel.HOURLY,
    pricingDetails: { perHour: 50, currency: 'GEL' },
    availabilityRules: null,
    bookingRules: null,
    amenities: ['wifi', 'whiteboard'],
    imageUrls: [],
    metadata: null,
    isActive: true,
    isBookable: true,
    saltoLockId: null,
    bookings: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: null,
    updatedBy: null,
    ...overrides,
  } as Resource;
}

// ── Helper: build a mock booking ────────────────────────────────────
function mockBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: 'booking-uuid-1',
    userId: 'user-uuid-1',
    user: {} as any,
    resourceId: 'resource-uuid-1',
    resource: mockResource(),
    startTime: new Date('2025-06-15T10:00:00Z'),
    endTime: new Date('2025-06-15T12:00:00Z'),
    status: BookingStatus.HELD,
    paymentStatus: BookingPaymentStatus.PENDING,
    paymentId: null,
    passId: null,
    creditTransactionId: null,
    totalAmount: 100,
    discountAmount: 0,
    currency: 'GEL',
    promoCodeId: null,
    notes: null,
    cancelledAt: null,
    cancelledBy: null,
    cancellationReason: null,
    checkedInAt: null,
    checkedOutAt: null,
    calendarEventId: null,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  } as Booking;
}

// ── QueryBuilder mock factory ────────────────────────────────────────
function createQueryBuilderMock(overrides: Record<string, any> = {}) {
  const qb: Record<string, jest.Mock> = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
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
    getCount: jest.fn().mockResolvedValue(0),
    getOne: jest.fn().mockResolvedValue(null),
    getRawOne: jest.fn().mockResolvedValue({}),
    getRawMany: jest.fn().mockResolvedValue([]),
    ...overrides,
  };
  return qb;
}

describe('BookingsService', () => {
  let service: BookingsService;
  let bookingRepo: Record<string, jest.Mock>;
  let resourceRepo: Record<string, jest.Mock>;
  let userPassRepo: Record<string, jest.Mock>;

  let bookingQb: ReturnType<typeof createQueryBuilderMock>;
  let conflictQb: ReturnType<typeof createQueryBuilderMock>;

  beforeEach(async () => {
    bookingQb = createQueryBuilderMock();
    conflictQb = createQueryBuilderMock();

    // Track which query builder to return based on call order
    let qbCallCount = 0;

    bookingRepo = {
      create: jest.fn().mockImplementation((data) => ({ id: 'new-booking-id', ...data })),
      save: jest.fn().mockImplementation((data) => Promise.resolve(data)),
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      createQueryBuilder: jest.fn().mockImplementation(() => {
        // The service calls createQueryBuilder multiple times:
        // once for findAll/stats queries, once for conflict checks
        qbCallCount++;
        // For conflict checks (called inside createBooking), return conflictQb
        // For findAll queries, return bookingQb
        return bookingQb;
      }),
    };

    resourceRepo = {
      findOne: jest.fn(),
    };

    userPassRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: getRepositoryToken(Booking), useValue: bookingRepo },
        { provide: getRepositoryToken(Resource), useValue: resourceRepo },
        { provide: getRepositoryToken(UserPass), useValue: userPassRepo },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────
  // createBooking
  // ─────────────────────────────────────────────────────────────────
  describe('createBooking', () => {
    const createDto = {
      resourceId: 'resource-uuid-1',
      startTime: '2025-06-15T10:00:00Z',
      endTime: '2025-06-15T12:00:00Z',
    };

    it('should create a booking for a valid resource and time', async () => {
      const resource = mockResource();
      resourceRepo.findOne
        .mockResolvedValueOnce(resource)   // first call: resource lookup in createBooking
        .mockResolvedValueOnce(resource);  // second call: inside checkConflicts

      bookingQb.getCount.mockResolvedValue(0); // no conflicts

      const savedBooking = mockBooking();
      bookingRepo.save.mockResolvedValue(savedBooking);
      bookingRepo.findOne.mockResolvedValue(savedBooking);

      const result = await service.createBooking('user-uuid-1', createDto as any);

      expect(resourceRepo.findOne).toHaveBeenCalledWith({
        where: { id: createDto.resourceId },
        relations: ['location'],
      });
      expect(bookingRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-uuid-1',
          resourceId: createDto.resourceId,
          status: BookingStatus.HELD,
        }),
      );
      expect(result).toEqual(savedBooking);
    });

    it('should throw NotFoundException if resource does not exist', async () => {
      resourceRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createBooking('user-uuid-1', createDto as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if resource is not active', async () => {
      resourceRepo.findOne.mockResolvedValue(mockResource({ isActive: false }));

      await expect(
        service.createBooking('user-uuid-1', createDto as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if resource is not bookable', async () => {
      resourceRepo.findOne.mockResolvedValue(mockResource({ isBookable: false }));

      await expect(
        service.createBooking('user-uuid-1', createDto as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if endTime <= startTime', async () => {
      resourceRepo.findOne.mockResolvedValue(mockResource());

      await expect(
        service.createBooking('user-uuid-1', {
          ...createDto,
          endTime: '2025-06-15T09:00:00Z', // before start
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if endTime equals startTime', async () => {
      resourceRepo.findOne.mockResolvedValue(mockResource());

      await expect(
        service.createBooking('user-uuid-1', {
          ...createDto,
          endTime: createDto.startTime,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when time slot conflicts', async () => {
      const resource = mockResource();
      resourceRepo.findOne
        .mockResolvedValueOnce(resource)
        .mockResolvedValueOnce(resource);

      bookingQb.getCount.mockResolvedValue(1); // conflict found

      await expect(
        service.createBooking('user-uuid-1', createDto as any),
      ).rejects.toThrow(ConflictException);
    });

    it('should calculate hourly pricing correctly', async () => {
      const resource = mockResource({
        pricingModel: PricingModel.HOURLY,
        pricingDetails: { perHour: 25, currency: 'GEL' },
      });
      resourceRepo.findOne
        .mockResolvedValueOnce(resource)
        .mockResolvedValueOnce(resource);
      bookingQb.getCount.mockResolvedValue(0);
      bookingRepo.findOne.mockResolvedValue(mockBooking());

      await service.createBooking('user-uuid-1', createDto as any);

      // 2 hours * 25 GEL = 50
      expect(bookingRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          totalAmount: 50,
          currency: 'GEL',
        }),
      );
    });

    it('should set amount to 0 for INCLUDED_IN_PASS pricing', async () => {
      const resource = mockResource({
        pricingModel: PricingModel.INCLUDED_IN_PASS,
        pricingDetails: { currency: 'GEL' },
      });
      resourceRepo.findOne
        .mockResolvedValueOnce(resource)
        .mockResolvedValueOnce(resource);
      bookingQb.getCount.mockResolvedValue(0);
      bookingRepo.findOne.mockResolvedValue(mockBooking());

      await service.createBooking('user-uuid-1', createDto as any);

      expect(bookingRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ totalAmount: 0 }),
      );
    });

    it('should validate pass and set paymentStatus to INCLUDED_IN_PASS', async () => {
      const resource = mockResource({ resourceType: ResourceType.MEETING_ROOM });
      resourceRepo.findOne
        .mockResolvedValueOnce(resource)
        .mockResolvedValueOnce(resource);
      bookingQb.getCount.mockResolvedValue(0);

      const now = new Date();
      const passStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const passEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const userPass = {
        id: 'pass-1',
        status: PassStatus.ACTIVE,
        startDate: passStart,
        endDate: passEnd,
        product: {
          includedResources: [{ resourceType: ResourceType.MEETING_ROOM }],
        },
      };
      userPassRepo.findOne.mockResolvedValue(userPass);
      bookingRepo.findOne.mockResolvedValue(mockBooking());

      await service.createBooking('user-uuid-1', {
        ...createDto,
        passId: 'pass-1',
      } as any);

      expect(bookingRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentStatus: BookingPaymentStatus.INCLUDED_IN_PASS,
          passId: 'pass-1',
        }),
      );
    });

    it('should throw NotFoundException if pass does not exist', async () => {
      const resource = mockResource();
      resourceRepo.findOne
        .mockResolvedValueOnce(resource)
        .mockResolvedValueOnce(resource);
      bookingQb.getCount.mockResolvedValue(0);
      userPassRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createBooking('user-uuid-1', {
          ...createDto,
          passId: 'nonexistent-pass',
        } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if pass is not active', async () => {
      const resource = mockResource();
      resourceRepo.findOne
        .mockResolvedValueOnce(resource)
        .mockResolvedValueOnce(resource);
      bookingQb.getCount.mockResolvedValue(0);

      userPassRepo.findOne.mockResolvedValue({
        id: 'pass-1',
        status: PassStatus.EXPIRED,
        startDate: new Date(),
        endDate: new Date(),
        product: null,
      });

      await expect(
        service.createBooking('user-uuid-1', {
          ...createDto,
          passId: 'pass-1',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should set paymentStatus to CREDIT_USED when payWithCredits is true', async () => {
      const resource = mockResource();
      resourceRepo.findOne
        .mockResolvedValueOnce(resource)
        .mockResolvedValueOnce(resource);
      bookingQb.getCount.mockResolvedValue(0);
      bookingRepo.findOne.mockResolvedValue(mockBooking());

      await service.createBooking('user-uuid-1', {
        ...createDto,
        payWithCredits: true,
      } as any);

      expect(bookingRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentStatus: BookingPaymentStatus.CREDIT_USED,
        }),
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Booking Rules Validation
  // ─────────────────────────────────────────────────────────────────
  describe('validateBookingRules (via createBooking)', () => {
    const createDto = {
      resourceId: 'resource-uuid-1',
      startTime: '2025-06-15T10:00:00Z',
      endTime: '2025-06-15T10:15:00Z', // 15 min
    };

    it('should throw BadRequestException if duration is below minimum', async () => {
      const resource = mockResource({
        bookingRules: { minDurationMinutes: 30 },
      });
      resourceRepo.findOne.mockResolvedValue(resource);

      await expect(
        service.createBooking('user-uuid-1', createDto as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if duration exceeds maximum', async () => {
      const resource = mockResource({
        bookingRules: { maxDurationMinutes: 10 },
      });
      resourceRepo.findOne.mockResolvedValue(resource);

      await expect(
        service.createBooking('user-uuid-1', createDto as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if booking is too far in advance', async () => {
      const resource = mockResource({
        bookingRules: { advanceBookingDays: 1 },
      });
      resourceRepo.findOne.mockResolvedValue(resource);

      // Book 60 days from now
      const farFuture = new Date();
      farFuture.setDate(farFuture.getDate() + 60);
      const farFutureEnd = new Date(farFuture);
      farFutureEnd.setHours(farFutureEnd.getHours() + 1);

      await expect(
        service.createBooking('user-uuid-1', {
          resourceId: 'resource-uuid-1',
          startTime: farFuture.toISOString(),
          endTime: farFutureEnd.toISOString(),
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Availability Rules Validation
  // ─────────────────────────────────────────────────────────────────
  describe('validateAvailability (via createBooking)', () => {
    it('should throw BadRequestException if resource is not available on the day', async () => {
      // Sunday = dayOfWeek 0, provide rules only for Monday (1)
      const sundayDate = new Date('2025-06-15T10:00:00Z'); // June 15 2025 is a Sunday
      const resource = mockResource({
        availabilityRules: [{ dayOfWeek: 1, openTime: '09:00', closeTime: '18:00' }],
      });
      resourceRepo.findOne.mockResolvedValue(resource);

      await expect(
        service.createBooking('user-uuid-1', {
          resourceId: 'resource-uuid-1',
          startTime: sundayDate.toISOString(),
          endTime: new Date(sundayDate.getTime() + 3600000).toISOString(),
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if booking time is outside operating hours', async () => {
      // Create a date and use getDay() to determine the correct dayOfWeek for availability rules
      const bookingDate = new Date('2025-06-16T02:00:00Z'); // Very early UTC — maps to early morning in any timezone
      const dayOfWeek = bookingDate.getDay();

      const resource = mockResource({
        availabilityRules: [{ dayOfWeek, openTime: '09:00', closeTime: '18:00' }],
      });
      resourceRepo.findOne.mockResolvedValue(resource);

      await expect(
        service.createBooking('user-uuid-1', {
          resourceId: 'resource-uuid-1',
          startTime: bookingDate.toISOString(),
          endTime: new Date(bookingDate.getTime() + 3600000).toISOString(),
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // confirmBooking
  // ─────────────────────────────────────────────────────────────────
  describe('confirmBooking', () => {
    it('should transition from HELD to CONFIRMED', async () => {
      const booking = mockBooking({ status: BookingStatus.HELD });
      bookingRepo.findOne.mockResolvedValue(booking);
      bookingRepo.save.mockResolvedValue({ ...booking, status: BookingStatus.CONFIRMED });

      const result = await service.confirmBooking('booking-uuid-1');

      expect(result.status).toBe(BookingStatus.CONFIRMED);
    });

    it('should set paymentId and paymentStatus when provided', async () => {
      const booking = mockBooking({ status: BookingStatus.HELD });
      bookingRepo.findOne.mockResolvedValue(booking);
      bookingRepo.save.mockImplementation((b) => Promise.resolve(b));

      const result = await service.confirmBooking('booking-uuid-1', 'payment-1');

      expect(result.paymentId).toBe('payment-1');
      expect(result.paymentStatus).toBe(BookingPaymentStatus.PAID);
    });

    it('should throw BadRequestException if booking is not HELD', async () => {
      const booking = mockBooking({ status: BookingStatus.CONFIRMED });
      bookingRepo.findOne.mockResolvedValue(booking);

      await expect(service.confirmBooking('booking-uuid-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if booking not found', async () => {
      bookingRepo.findOne.mockResolvedValue(null);

      await expect(service.confirmBooking('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // cancelBooking
  // ─────────────────────────────────────────────────────────────────
  describe('cancelBooking', () => {
    it('should cancel a HELD booking', async () => {
      const booking = mockBooking({ status: BookingStatus.HELD });
      bookingRepo.findOne.mockResolvedValue(booking);
      bookingRepo.save.mockImplementation((b) => Promise.resolve(b));

      const result = await service.cancelBooking('booking-uuid-1', 'user-1', {
        reason: 'Changed plans',
      } as any);

      expect(result.status).toBe(BookingStatus.CANCELLED);
      expect(result.cancelledBy).toBe('user-1');
      expect(result.cancellationReason).toBe('Changed plans');
      expect(result.cancelledAt).toBeInstanceOf(Date);
    });

    it('should cancel a CONFIRMED booking', async () => {
      const booking = mockBooking({ status: BookingStatus.CONFIRMED });
      bookingRepo.findOne.mockResolvedValue(booking);
      bookingRepo.save.mockImplementation((b) => Promise.resolve(b));

      const result = await service.cancelBooking('booking-uuid-1', 'user-1', {} as any);

      expect(result.status).toBe(BookingStatus.CANCELLED);
    });

    it('should throw BadRequestException if booking is already CANCELLED', async () => {
      const booking = mockBooking({ status: BookingStatus.CANCELLED });
      bookingRepo.findOne.mockResolvedValue(booking);

      await expect(
        service.cancelBooking('booking-uuid-1', 'user-1', {} as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if booking is COMPLETED', async () => {
      const booking = mockBooking({ status: BookingStatus.COMPLETED });
      bookingRepo.findOne.mockResolvedValue(booking);

      await expect(
        service.cancelBooking('booking-uuid-1', 'user-1', {} as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // checkIn
  // ─────────────────────────────────────────────────────────────────
  describe('checkIn', () => {
    it('should transition CONFIRMED to CHECKED_IN', async () => {
      const booking = mockBooking({ status: BookingStatus.CONFIRMED });
      bookingRepo.findOne.mockResolvedValue(booking);
      bookingRepo.save.mockImplementation((b) => Promise.resolve(b));

      const result = await service.checkIn('booking-uuid-1');

      expect(result.status).toBe(BookingStatus.CHECKED_IN);
      expect(result.checkedInAt).toBeInstanceOf(Date);
    });

    it('should throw BadRequestException if not CONFIRMED', async () => {
      const booking = mockBooking({ status: BookingStatus.HELD });
      bookingRepo.findOne.mockResolvedValue(booking);

      await expect(service.checkIn('booking-uuid-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // checkOut
  // ─────────────────────────────────────────────────────────────────
  describe('checkOut', () => {
    it('should transition CHECKED_IN to COMPLETED', async () => {
      const booking = mockBooking({ status: BookingStatus.CHECKED_IN });
      bookingRepo.findOne.mockResolvedValue(booking);
      bookingRepo.save.mockImplementation((b) => Promise.resolve(b));

      const result = await service.checkOut('booking-uuid-1');

      expect(result.status).toBe(BookingStatus.COMPLETED);
      expect(result.checkedOutAt).toBeInstanceOf(Date);
    });

    it('should throw BadRequestException if not CHECKED_IN', async () => {
      const booking = mockBooking({ status: BookingStatus.CONFIRMED });
      bookingRepo.findOne.mockResolvedValue(booking);

      await expect(service.checkOut('booking-uuid-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // markNoShow
  // ─────────────────────────────────────────────────────────────────
  describe('markNoShow', () => {
    it('should mark CONFIRMED booking as NO_SHOW after start time', async () => {
      const pastStart = new Date(Date.now() - 60 * 60 * 1000);
      const booking = mockBooking({
        status: BookingStatus.CONFIRMED,
        startTime: pastStart,
      });
      bookingRepo.findOne.mockResolvedValue(booking);
      bookingRepo.save.mockImplementation((b) => Promise.resolve(b));

      const result = await service.markNoShow('booking-uuid-1');

      expect(result.status).toBe(BookingStatus.NO_SHOW);
    });

    it('should throw BadRequestException if not CONFIRMED', async () => {
      const booking = mockBooking({ status: BookingStatus.HELD });
      bookingRepo.findOne.mockResolvedValue(booking);

      await expect(service.markNoShow('booking-uuid-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if before start time', async () => {
      const futureStart = new Date(Date.now() + 60 * 60 * 1000);
      const booking = mockBooking({
        status: BookingStatus.CONFIRMED,
        startTime: futureStart,
      });
      bookingRepo.findOne.mockResolvedValue(booking);

      await expect(service.markNoShow('booking-uuid-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // updateBooking
  // ─────────────────────────────────────────────────────────────────
  describe('updateBooking', () => {
    it('should update notes and metadata', async () => {
      const booking = mockBooking();
      bookingRepo.findOne.mockResolvedValue(booking);
      bookingRepo.save.mockImplementation((b) => Promise.resolve(b));

      const result = await service.updateBooking('booking-uuid-1', {
        notes: 'New notes',
        metadata: { key: 'value' },
      } as any);

      expect(result.notes).toBe('New notes');
      expect(result.metadata).toEqual({ key: 'value' });
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // findById
  // ─────────────────────────────────────────────────────────────────
  describe('findById', () => {
    it('should return booking with relations', async () => {
      const booking = mockBooking();
      bookingRepo.findOne.mockResolvedValue(booking);

      const result = await service.findById('booking-uuid-1');

      expect(bookingRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'booking-uuid-1' },
        relations: ['resource', 'resource.location', 'user'],
      });
      expect(result).toEqual(booking);
    });

    it('should throw NotFoundException if booking not found', async () => {
      bookingRepo.findOne.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // findAll
  // ─────────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return paginated results', async () => {
      const bookings = [mockBooking()];
      bookingQb.getManyAndCount.mockResolvedValue([bookings, 1]);

      const result = await service.findAll({ page: 1, limit: 20 } as any);

      expect(result.data).toEqual(bookings);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should apply filters when provided', async () => {
      bookingQb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({
        userId: 'user-1',
        resourceId: 'res-1',
        locationId: 'loc-1',
        status: BookingStatus.CONFIRMED,
        paymentStatus: BookingPaymentStatus.PAID,
        resourceType: ResourceType.MEETING_ROOM,
        dateFrom: '2025-01-01',
        dateTo: '2025-12-31',
        page: 2,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'ASC',
      } as any);

      // Verify filters applied via andWhere calls (8 filters: user, resource, location, status, paymentStatus, resourceType, dateFrom, dateTo)
      expect(bookingQb.andWhere).toHaveBeenCalledTimes(8);
      expect(bookingQb.skip).toHaveBeenCalledWith(10); // (2-1) * 10
      expect(bookingQb.take).toHaveBeenCalledWith(10);
    });

    it('should use default pagination values', async () => {
      bookingQb.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll({} as any);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // findUpcoming
  // ─────────────────────────────────────────────────────────────────
  describe('findUpcoming', () => {
    it('should return upcoming bookings for user', async () => {
      const bookings = [mockBooking()];
      bookingRepo.find.mockResolvedValue(bookings);

      const result = await service.findUpcoming('user-uuid-1');

      expect(bookingRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-uuid-1' }),
          order: { startTime: 'ASC' },
          take: 10,
        }),
      );
      expect(result).toEqual(bookings);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // findByUser
  // ─────────────────────────────────────────────────────────────────
  describe('findByUser', () => {
    it('should delegate to findAll with userId', async () => {
      bookingQb.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.findByUser('user-1', { page: 1, limit: 10 } as any);

      expect(result).toEqual({ data: [], total: 0, page: 1, limit: 10 });
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // getBookingStats
  // ─────────────────────────────────────────────────────────────────
  describe('getBookingStats', () => {
    it('should return aggregated stats', async () => {
      bookingQb.getRawOne.mockResolvedValue({
        totalBookings: '15',
        confirmedBookings: '10',
        cancelledBookings: '3',
        totalRevenue: '2500.00',
        averageBookingDuration: '90.5',
      });

      const result = await service.getBookingStats();

      expect(result).toEqual({
        totalBookings: 15,
        confirmedBookings: 10,
        cancelledBookings: 3,
        totalRevenue: 2500,
        averageBookingDuration: 91, // rounded
      });
    });

    it('should handle null/empty stats gracefully', async () => {
      bookingQb.getRawOne.mockResolvedValue({
        totalBookings: null,
        confirmedBookings: null,
        cancelledBookings: null,
        totalRevenue: null,
        averageBookingDuration: null,
      });

      const result = await service.getBookingStats();

      expect(result).toEqual({
        totalBookings: 0,
        confirmedBookings: 0,
        cancelledBookings: 0,
        totalRevenue: 0,
        averageBookingDuration: 0,
      });
    });

    it('should apply location and date filters', async () => {
      bookingQb.getRawOne.mockResolvedValue({
        totalBookings: '5',
        confirmedBookings: '4',
        cancelledBookings: '1',
        totalRevenue: '500',
        averageBookingDuration: '60',
      });

      await service.getBookingStats({
        locationId: 'loc-1',
        dateFrom: new Date('2025-01-01'),
        dateTo: new Date('2025-12-31'),
      });

      expect(bookingQb.andWhere).toHaveBeenCalledTimes(3);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Pricing calculations
  // ─────────────────────────────────────────────────────────────────
  describe('pricing calculations (via createBooking)', () => {
    const baseDto = {
      resourceId: 'resource-uuid-1',
      startTime: '2025-06-15T10:00:00Z',
      endTime: '2025-06-16T10:00:00Z', // 24 hours = 1 day
    };

    it('should calculate daily pricing correctly', async () => {
      const resource = mockResource({
        pricingModel: PricingModel.DAILY,
        pricingDetails: { perDay: 100, currency: 'GEL' },
      });
      resourceRepo.findOne
        .mockResolvedValueOnce(resource)
        .mockResolvedValueOnce(resource);
      bookingQb.getCount.mockResolvedValue(0);
      bookingRepo.findOne.mockResolvedValue(mockBooking());

      await service.createBooking('user-uuid-1', baseDto as any);

      expect(bookingRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ totalAmount: 100, currency: 'GEL' }),
      );
    });

    it('should calculate per-use pricing correctly', async () => {
      const resource = mockResource({
        pricingModel: PricingModel.PER_USE,
        pricingDetails: { basePrice: 30, currency: 'GEL' },
      });
      resourceRepo.findOne
        .mockResolvedValueOnce(resource)
        .mockResolvedValueOnce(resource);
      bookingQb.getCount.mockResolvedValue(0);
      bookingRepo.findOne.mockResolvedValue(mockBooking());

      await service.createBooking('user-uuid-1', baseDto as any);

      expect(bookingRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ totalAmount: 30 }),
      );
    });

    it('should calculate per-sqm pricing correctly', async () => {
      const resource = mockResource({
        pricingModel: PricingModel.PER_SQM,
        pricingDetails: { perSqm: 10, currency: 'GEL' },
        size: 25,
      });
      resourceRepo.findOne
        .mockResolvedValueOnce(resource)
        .mockResolvedValueOnce(resource);
      bookingQb.getCount.mockResolvedValue(0);
      bookingRepo.findOne.mockResolvedValue(mockBooking());

      await service.createBooking('user-uuid-1', baseDto as any);

      // 10 * 25 = 250
      expect(bookingRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ totalAmount: 250 }),
      );
    });

    it('should return 0 for CREDIT_BASED pricing model', async () => {
      const resource = mockResource({
        pricingModel: PricingModel.CREDIT_BASED,
        pricingDetails: { currency: 'GEL' },
      });
      resourceRepo.findOne
        .mockResolvedValueOnce(resource)
        .mockResolvedValueOnce(resource);
      bookingQb.getCount.mockResolvedValue(0);
      bookingRepo.findOne.mockResolvedValue(mockBooking());

      await service.createBooking('user-uuid-1', baseDto as any);

      expect(bookingRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ totalAmount: 0 }),
      );
    });

    it('should calculate monthly pricing correctly', async () => {
      const resource = mockResource({
        pricingModel: PricingModel.MONTHLY,
        pricingDetails: { perMonth: 1500, currency: 'GEL' },
      });
      resourceRepo.findOne
        .mockResolvedValueOnce(resource)
        .mockResolvedValueOnce(resource);
      bookingQb.getCount.mockResolvedValue(0);
      bookingRepo.findOne.mockResolvedValue(mockBooking());

      await service.createBooking('user-uuid-1', baseDto as any);

      expect(bookingRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ totalAmount: 1500 }),
      );
    });
  });
});
