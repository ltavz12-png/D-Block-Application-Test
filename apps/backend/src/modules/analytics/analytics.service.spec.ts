import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import {
  AnalyticsEvent,
  AnalyticsEventCategory,
} from '@/common/database/entities/analytics-event.entity';
import {
  ConsentService,
  ConsentPurpose,
} from './consent/consent.service';
import {
  IAnalyticsProvider,
  ANALYTICS_PROVIDER,
} from './providers/analytics.provider';
import { TrackEventDto } from './dto/track-event.dto';
import { TrackBatchEventsDto } from './dto/track-batch-events.dto';
import { QueryAnalyticsDto } from './dto/query-analytics.dto';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockUserId = 'user-0001-0001-0001-000000000001';
const mockLocationId = 'loc-00001-0001-0001-000000000001';
const mockEventId = 'event-001-0001-0001-000000000001';

function createMockEvent(overrides: Partial<AnalyticsEvent> = {}): AnalyticsEvent {
  return {
    id: mockEventId,
    eventName: 'user.signup',
    category: AnalyticsEventCategory.USER,
    userId: mockUserId,
    sessionId: 'sess-abc-123',
    properties: { method: 'google' },
    locationId: mockLocationId,
    platform: 'web',
    appVersion: '2.1.0',
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
    occurredAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null as any,
    ...overrides,
  } as AnalyticsEvent;
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

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let analyticsEventRepo: Record<string, jest.Mock>;
  let consentService: Record<string, jest.Mock>;
  let analyticsProvider: Record<string, jest.Mock>;

  beforeEach(async () => {
    analyticsEventRepo = {
      create: jest.fn((dto) => ({ ...dto })),
      save: jest.fn((entity) => {
        if (Array.isArray(entity)) {
          return Promise.resolve(
            entity.map((e, i) => ({ ...e, id: `event-${i}` })),
          );
        }
        return Promise.resolve({ ...entity, id: entity.id || mockEventId });
      }),
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      delete: jest.fn().mockResolvedValue({ affected: 0 }),
      createQueryBuilder: jest.fn(),
    };

    consentService = {
      hasConsent: jest.fn().mockReturnValue(true),
      getUserConsent: jest.fn(),
    };

    analyticsProvider = {
      trackEvent: jest.fn().mockResolvedValue(undefined),
      identifyUser: jest.fn().mockResolvedValue(undefined),
      trackPageView: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: getRepositoryToken(AnalyticsEvent),
          useValue: analyticsEventRepo,
        },
        { provide: ConsentService, useValue: consentService },
        { provide: ANALYTICS_PROVIDER, useValue: analyticsProvider },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  // =========================================================================
  // trackEvent
  // =========================================================================

  describe('trackEvent', () => {
    const dto: TrackEventDto = {
      eventName: 'user.signup',
      category: AnalyticsEventCategory.USER,
      properties: { method: 'google' },
      locationId: mockLocationId,
      sessionId: 'sess-123',
      platform: 'web',
      appVersion: '2.1.0',
    };

    it('should save an event when user has consent', async () => {
      consentService.hasConsent.mockReturnValueOnce(true);

      const result = await service.trackEvent(mockUserId, dto);

      expect(result).toBeDefined();
      expect(analyticsEventRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventName: 'user.signup',
          category: AnalyticsEventCategory.USER,
          userId: mockUserId,
          sessionId: 'sess-123',
          platform: 'web',
        }),
      );
      expect(analyticsEventRepo.save).toHaveBeenCalled();
    });

    it('should return null when user has NOT consented to analytics', async () => {
      consentService.hasConsent.mockReturnValueOnce(false);

      const result = await service.trackEvent(mockUserId, dto);

      expect(result).toBeNull();
      expect(analyticsEventRepo.save).not.toHaveBeenCalled();
    });

    it('should skip consent check for anonymous users (userId is null)', async () => {
      const result = await service.trackEvent(null, dto);

      expect(result).toBeDefined();
      expect(consentService.hasConsent).not.toHaveBeenCalled();
      expect(analyticsEventRepo.save).toHaveBeenCalled();
    });

    it('should forward event to external analytics provider', async () => {
      consentService.hasConsent.mockReturnValueOnce(true);

      await service.trackEvent(mockUserId, dto);

      expect(analyticsProvider.trackEvent).toHaveBeenCalledWith({
        name: 'user.signup',
        userId: mockUserId,
        properties: expect.objectContaining({
          method: 'google',
          category: AnalyticsEventCategory.USER,
          locationId: mockLocationId,
          platform: 'web',
        }),
      });
    });

    it('should handle analytics provider failure gracefully (fire-and-forget)', async () => {
      consentService.hasConsent.mockReturnValueOnce(true);
      analyticsProvider.trackEvent.mockRejectedValueOnce(
        new Error('Provider down'),
      );

      // Should not throw
      const result = await service.trackEvent(mockUserId, dto);
      expect(result).toBeDefined();
    });

    it('should extract IP and user-agent from request object', async () => {
      consentService.hasConsent.mockReturnValueOnce(true);

      const mockReq = {
        ip: '192.168.1.1',
        headers: { 'user-agent': 'TestAgent/1.0' },
      };

      await service.trackEvent(mockUserId, dto, mockReq);

      expect(analyticsEventRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: '192.168.1.1',
          userAgent: 'TestAgent/1.0',
        }),
      );
    });

    it('should use custom occurredAt when provided', async () => {
      consentService.hasConsent.mockReturnValueOnce(true);

      const dtoWithDate: TrackEventDto = {
        ...dto,
        occurredAt: '2025-01-15T10:30:00Z',
      };

      await service.trackEvent(mockUserId, dtoWithDate);

      expect(analyticsEventRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          occurredAt: new Date('2025-01-15T10:30:00Z'),
        }),
      );
    });

    it('should default occurredAt to now when not provided', async () => {
      consentService.hasConsent.mockReturnValueOnce(true);

      const dtoNoDate: TrackEventDto = {
        eventName: 'test.event',
        category: AnalyticsEventCategory.SYSTEM,
      };

      await service.trackEvent(mockUserId, dtoNoDate);

      expect(analyticsEventRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          occurredAt: expect.any(Date),
        }),
      );
    });
  });

  // =========================================================================
  // trackBatchEvents
  // =========================================================================

  describe('trackBatchEvents', () => {
    const batchDto: TrackBatchEventsDto = {
      events: [
        {
          eventName: 'user.signup',
          category: AnalyticsEventCategory.USER,
          properties: { method: 'google' },
        },
        {
          eventName: 'booking.created',
          category: AnalyticsEventCategory.BOOKING,
          locationId: mockLocationId,
        },
      ],
    };

    it('should save multiple events when user has consent', async () => {
      consentService.hasConsent.mockReturnValueOnce(true);

      const result = await service.trackBatchEvents(mockUserId, batchDto);

      expect(result).toEqual({ tracked: 2, skipped: 0 });
      expect(analyticsEventRepo.create).toHaveBeenCalledTimes(2);
      expect(analyticsEventRepo.save).toHaveBeenCalledWith(expect.any(Array));
    });

    it('should skip all events when user has NOT consented', async () => {
      consentService.hasConsent.mockReturnValueOnce(false);

      const result = await service.trackBatchEvents(mockUserId, batchDto);

      expect(result).toEqual({ tracked: 0, skipped: 2 });
      expect(analyticsEventRepo.save).not.toHaveBeenCalled();
    });

    it('should skip consent check for anonymous users', async () => {
      const result = await service.trackBatchEvents(null, batchDto);

      expect(result).toEqual({ tracked: 2, skipped: 0 });
      expect(consentService.hasConsent).not.toHaveBeenCalled();
    });

    it('should forward each event to external analytics provider', async () => {
      consentService.hasConsent.mockReturnValueOnce(true);

      await service.trackBatchEvents(mockUserId, batchDto);

      expect(analyticsProvider.trackEvent).toHaveBeenCalledTimes(2);
    });
  });

  // =========================================================================
  // trackSystemEvent
  // =========================================================================

  describe('trackSystemEvent', () => {
    it('should always save without checking consent', async () => {
      const result = await service.trackSystemEvent(
        'system.cron.completed',
        AnalyticsEventCategory.SYSTEM,
        { duration: 1234 },
      );

      expect(result).toBeDefined();
      expect(consentService.hasConsent).not.toHaveBeenCalled();
      expect(analyticsEventRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventName: 'system.cron.completed',
          category: AnalyticsEventCategory.SYSTEM,
          userId: null,
          platform: 'system',
          properties: { duration: 1234 },
        }),
      );
      expect(analyticsEventRepo.save).toHaveBeenCalled();
    });

    it('should set properties to null when not provided', async () => {
      await service.trackSystemEvent(
        'system.startup',
        AnalyticsEventCategory.SYSTEM,
      );

      expect(analyticsEventRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ properties: null }),
      );
    });
  });

  // =========================================================================
  // getEventCounts
  // =========================================================================

  describe('getEventCounts', () => {
    it('should group events by date and return counts', async () => {
      const mockData = [
        { eventName: 'user.signup', period: '2025-06-01', count: 5 },
        { eventName: 'user.login', period: '2025-06-01', count: 20 },
      ];
      const qb = createMockQueryBuilder();
      qb['getRawMany'].mockResolvedValueOnce(mockData);
      analyticsEventRepo.createQueryBuilder.mockReturnValueOnce(qb);

      const result = await service.getEventCounts('2025-06-01', '2025-06-30');

      expect(result).toEqual(mockData);
      expect(qb['where']).toHaveBeenCalledWith(
        'e.occurred_at >= :dateFrom',
        { dateFrom: '2025-06-01' },
      );
      expect(qb['andWhere']).toHaveBeenCalledWith(
        'e.occurred_at <= :dateTo',
        { dateTo: '2025-06-30' },
      );
      expect(qb['groupBy']).toHaveBeenCalledWith('e.event_name');
    });

    it('should apply locationId filter when provided', async () => {
      const qb = createMockQueryBuilder();
      qb['getRawMany'].mockResolvedValueOnce([]);
      analyticsEventRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.getEventCounts(
        '2025-06-01',
        '2025-06-30',
        mockLocationId,
      );

      expect(qb['andWhere']).toHaveBeenCalledWith(
        'e.location_id = :locationId',
        { locationId: mockLocationId },
      );
    });

    it('should use provided granularity', async () => {
      const qb = createMockQueryBuilder();
      qb['getRawMany'].mockResolvedValueOnce([]);
      analyticsEventRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.getEventCounts(
        '2025-06-01',
        '2025-06-30',
        undefined,
        'week',
      );

      expect(qb['addSelect']).toHaveBeenCalledWith(
        expect.stringContaining("'week'"),
        'period',
      );
    });

    it('should default to "day" granularity for unknown values', async () => {
      const qb = createMockQueryBuilder();
      qb['getRawMany'].mockResolvedValueOnce([]);
      analyticsEventRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.getEventCounts(
        '2025-06-01',
        '2025-06-30',
        undefined,
        'invalid_granularity',
      );

      expect(qb['addSelect']).toHaveBeenCalledWith(
        expect.stringContaining("'day'"),
        'period',
      );
    });
  });

  // =========================================================================
  // getActiveUsers
  // =========================================================================

  describe('getActiveUsers', () => {
    it('should return unique user counts grouped by period', async () => {
      const mockData = [
        { period: '2025-06-01', activeUsers: 42 },
        { period: '2025-06-02', activeUsers: 38 },
      ];
      const qb = createMockQueryBuilder();
      qb['getRawMany'].mockResolvedValueOnce(mockData);
      analyticsEventRepo.createQueryBuilder.mockReturnValueOnce(qb);

      const result = await service.getActiveUsers('2025-06-01', '2025-06-30');

      expect(result).toEqual(mockData);
      expect(qb['andWhere']).toHaveBeenCalledWith('e.user_id IS NOT NULL');
    });
  });

  // =========================================================================
  // getUserFunnel (getFunnelData)
  // =========================================================================

  describe('getUserFunnel', () => {
    it('should return conversion funnel data', async () => {
      // signup
      const qb1 = createMockQueryBuilder();
      qb1['getRawOne'].mockResolvedValueOnce({ count: 100 });
      // firstBooking
      const qb2 = createMockQueryBuilder();
      qb2['getRawOne'].mockResolvedValueOnce({ count: 60 });
      // firstPayment
      const qb3 = createMockQueryBuilder();
      qb3['getRawOne'].mockResolvedValueOnce({ count: 40 });
      // repeatBooking
      const qb4 = createMockQueryBuilder();
      qb4['getRawMany'].mockResolvedValueOnce([
        { userId: 'u1', bookingCount: 3 },
        { userId: 'u2', bookingCount: 2 },
      ]);

      analyticsEventRepo.createQueryBuilder
        .mockReturnValueOnce(qb1)
        .mockReturnValueOnce(qb2)
        .mockReturnValueOnce(qb3)
        .mockReturnValueOnce(qb4);

      const result = await service.getUserFunnel('2025-06-01', '2025-06-30');

      expect(result).toEqual({
        signup: 100,
        firstBooking: 60,
        firstPayment: 40,
        repeatBooking: 2,
      });
    });

    it('should apply locationId filter when provided', async () => {
      const qb1 = createMockQueryBuilder();
      qb1['getRawOne'].mockResolvedValueOnce({ count: 0 });
      const qb2 = createMockQueryBuilder();
      qb2['getRawOne'].mockResolvedValueOnce({ count: 0 });
      const qb3 = createMockQueryBuilder();
      qb3['getRawOne'].mockResolvedValueOnce({ count: 0 });
      const qb4 = createMockQueryBuilder();
      qb4['getRawMany'].mockResolvedValueOnce([]);

      analyticsEventRepo.createQueryBuilder
        .mockReturnValueOnce(qb1)
        .mockReturnValueOnce(qb2)
        .mockReturnValueOnce(qb3)
        .mockReturnValueOnce(qb4);

      await service.getUserFunnel('2025-06-01', '2025-06-30', mockLocationId);

      // Each qb should have the locationId filter applied
      for (const qb of [qb1, qb2, qb3, qb4]) {
        expect(qb['andWhere']).toHaveBeenCalledWith(
          'e.location_id = :locationId',
          { locationId: mockLocationId },
        );
      }
    });

    it('should return zeros when no data exists', async () => {
      const qb1 = createMockQueryBuilder();
      qb1['getRawOne'].mockResolvedValueOnce(null);
      const qb2 = createMockQueryBuilder();
      qb2['getRawOne'].mockResolvedValueOnce(null);
      const qb3 = createMockQueryBuilder();
      qb3['getRawOne'].mockResolvedValueOnce(null);
      const qb4 = createMockQueryBuilder();
      qb4['getRawMany'].mockResolvedValueOnce([]);

      analyticsEventRepo.createQueryBuilder
        .mockReturnValueOnce(qb1)
        .mockReturnValueOnce(qb2)
        .mockReturnValueOnce(qb3)
        .mockReturnValueOnce(qb4);

      const result = await service.getUserFunnel('2025-06-01', '2025-06-30');

      expect(result).toEqual({
        signup: 0,
        firstBooking: 0,
        firstPayment: 0,
        repeatBooking: 0,
      });
    });
  });

  // =========================================================================
  // getTopEvents
  // =========================================================================

  describe('getTopEvents', () => {
    it('should return most tracked events ordered by count', async () => {
      const mockData = [
        {
          eventName: 'user.login',
          category: AnalyticsEventCategory.USER,
          count: 500,
        },
        {
          eventName: 'booking.created',
          category: AnalyticsEventCategory.BOOKING,
          count: 200,
        },
      ];
      const qb = createMockQueryBuilder();
      qb['getRawMany'].mockResolvedValueOnce(mockData);
      analyticsEventRepo.createQueryBuilder.mockReturnValueOnce(qb);

      const result = await service.getTopEvents('2025-06-01', '2025-06-30');

      expect(result).toEqual(mockData);
      expect(qb['orderBy']).toHaveBeenCalledWith('count', 'DESC');
      expect(qb['limit']).toHaveBeenCalledWith(20); // default limit
    });

    it('should accept custom limit', async () => {
      const qb = createMockQueryBuilder();
      qb['getRawMany'].mockResolvedValueOnce([]);
      analyticsEventRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.getTopEvents('2025-06-01', '2025-06-30', 5);

      expect(qb['limit']).toHaveBeenCalledWith(5);
    });
  });

  // =========================================================================
  // getPlatformBreakdown
  // =========================================================================

  describe('getPlatformBreakdown', () => {
    it('should return counts grouped by platform', async () => {
      const mockData = [
        { platform: 'web', count: 300, uniqueUsers: 100 },
        { platform: 'ios', count: 200, uniqueUsers: 80 },
        { platform: 'android', count: 150, uniqueUsers: 60 },
      ];
      const qb = createMockQueryBuilder();
      qb['getRawMany'].mockResolvedValueOnce(mockData);
      analyticsEventRepo.createQueryBuilder.mockReturnValueOnce(qb);

      const result = await service.getPlatformBreakdown(
        '2025-06-01',
        '2025-06-30',
      );

      expect(result).toEqual(mockData);
      expect(qb['groupBy']).toHaveBeenCalledWith('e.platform');
    });
  });

  // =========================================================================
  // getLocationBreakdown
  // =========================================================================

  describe('getLocationBreakdown', () => {
    it('should return counts grouped by locationId', async () => {
      const mockData = [
        { locationId: 'loc-1', count: 400, uniqueUsers: 120 },
        { locationId: 'loc-2', count: 250, uniqueUsers: 90 },
      ];
      const qb = createMockQueryBuilder();
      qb['getRawMany'].mockResolvedValueOnce(mockData);
      analyticsEventRepo.createQueryBuilder.mockReturnValueOnce(qb);

      const result = await service.getLocationBreakdown(
        '2025-06-01',
        '2025-06-30',
      );

      expect(result).toEqual(mockData);
      expect(qb['andWhere']).toHaveBeenCalledWith(
        'e.location_id IS NOT NULL',
      );
      expect(qb['groupBy']).toHaveBeenCalledWith('e.location_id');
    });
  });

  // =========================================================================
  // findAll (admin event listing)
  // =========================================================================

  describe('findAll', () => {
    it('should return paginated events with defaults', async () => {
      const events = [createMockEvent()];
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([events, 1]);
      analyticsEventRepo.createQueryBuilder.mockReturnValueOnce(qb);

      const result = await service.findAll({});

      expect(result).toEqual({
        data: events,
        total: 1,
        page: 1,
        limit: 50,
      });
    });

    it('should apply eventName filter', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      analyticsEventRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({ eventName: 'user.signup' });

      expect(qb['andWhere']).toHaveBeenCalledWith(
        'e.event_name = :eventName',
        { eventName: 'user.signup' },
      );
    });

    it('should apply category filter', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      analyticsEventRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({ category: AnalyticsEventCategory.BOOKING });

      expect(qb['andWhere']).toHaveBeenCalledWith(
        'e.category = :category',
        { category: AnalyticsEventCategory.BOOKING },
      );
    });

    it('should apply userId filter', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      analyticsEventRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({ userId: mockUserId });

      expect(qb['andWhere']).toHaveBeenCalledWith('e.user_id = :userId', {
        userId: mockUserId,
      });
    });

    it('should apply locationId filter', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      analyticsEventRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({ locationId: mockLocationId });

      expect(qb['andWhere']).toHaveBeenCalledWith(
        'e.location_id = :locationId',
        { locationId: mockLocationId },
      );
    });

    it('should apply platform filter', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      analyticsEventRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({ platform: 'ios' });

      expect(qb['andWhere']).toHaveBeenCalledWith(
        'e.platform = :platform',
        { platform: 'ios' },
      );
    });

    it('should apply dateFrom and dateTo filters', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      analyticsEventRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({
        dateFrom: '2025-06-01',
        dateTo: '2025-06-30',
      });

      expect(qb['andWhere']).toHaveBeenCalledWith(
        'e.occurred_at >= :dateFrom',
        { dateFrom: '2025-06-01' },
      );
      expect(qb['andWhere']).toHaveBeenCalledWith(
        'e.occurred_at <= :dateTo',
        { dateTo: '2025-06-30' },
      );
    });

    it('should respect custom page and limit', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      analyticsEventRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({ page: 3, limit: 25 });

      expect(qb['skip']).toHaveBeenCalledWith(50); // (3-1)*25
      expect(qb['take']).toHaveBeenCalledWith(25);
    });
  });

  // =========================================================================
  // exportUserAnalytics (GDPR)
  // =========================================================================

  describe('exportUserAnalytics', () => {
    it('should return all events for the user', async () => {
      const events = [createMockEvent(), createMockEvent({ id: 'event-2' })];
      analyticsEventRepo.find.mockResolvedValueOnce(events);

      const result = await service.exportUserAnalytics(mockUserId);

      expect(result.events).toEqual(events);
      expect(result.exportedAt).toBeDefined();
      expect(analyticsEventRepo.find).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        order: { occurredAt: 'DESC' },
      });
    });

    it('should return empty array when user has no events', async () => {
      analyticsEventRepo.find.mockResolvedValueOnce([]);

      const result = await service.exportUserAnalytics(mockUserId);

      expect(result.events).toEqual([]);
      expect(result.exportedAt).toBeDefined();
    });
  });

  // =========================================================================
  // deleteUserAnalytics (GDPR)
  // =========================================================================

  describe('deleteUserAnalytics', () => {
    it('should delete all events for the user and return count', async () => {
      analyticsEventRepo.delete.mockResolvedValueOnce({ affected: 15 });

      const result = await service.deleteUserAnalytics(mockUserId);

      expect(result.deleted).toBe(15);
      expect(result.deletedAt).toBeDefined();
      expect(analyticsEventRepo.delete).toHaveBeenCalledWith({
        userId: mockUserId,
      });
    });

    it('should return 0 when user has no events', async () => {
      analyticsEventRepo.delete.mockResolvedValueOnce({ affected: 0 });

      const result = await service.deleteUserAnalytics(mockUserId);

      expect(result.deleted).toBe(0);
    });
  });
});
