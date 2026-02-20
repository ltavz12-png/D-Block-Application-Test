import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { ConsentService } from './consent/consent.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

// ────────────────────────────────────────────────────────────────────────────
// Mock data
// ────────────────────────────────────────────────────────────────────────────

const mockUser = { id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' };

const mockEvent = {
  id: '11111111-2222-3333-4444-555555555555',
  userId: mockUser.id,
  eventName: 'page_view',
  properties: { page: '/dashboard' },
  platform: 'web',
  createdAt: new Date().toISOString(),
};

const mockEventsList = {
  data: [mockEvent],
  total: 1,
  page: 1,
  limit: 20,
};

const mockEventCounts = [
  { eventName: 'page_view', count: 120, date: '2025-06-01' },
  { eventName: 'booking_created', count: 45, date: '2025-06-01' },
];

const mockActiveUsers = [
  { date: '2025-06-01', count: 80 },
  { date: '2025-06-02', count: 95 },
];

const mockFunnel = {
  signup: 1000,
  booking: 500,
  payment: 400,
  repeat: 200,
};

const mockTopEvents = [
  { eventName: 'page_view', count: 5000 },
  { eventName: 'booking_created', count: 1200 },
];

const mockPlatformBreakdown = [
  { platform: 'web', count: 3000 },
  { platform: 'ios', count: 1500 },
  { platform: 'android', count: 800 },
];

const mockLocationBreakdown = [
  { locationId: 'loc-1', name: 'Main Office', count: 2500 },
  { locationId: 'loc-2', name: 'Branch', count: 1200 },
];

const mockConsent = {
  analytics: true,
  marketing: false,
  thirdParty: false,
};

const mockExportData = {
  events: [mockEvent],
  totalEvents: 1,
};

const mockReq = {
  ip: '127.0.0.1',
  headers: { 'user-agent': 'Jest/29' },
};

// ────────────────────────────────────────────────────────────────────────────
// Mock services
// ────────────────────────────────────────────────────────────────────────────

const mockAnalyticsService = {
  trackEvent: jest.fn().mockResolvedValue(mockEvent),
  trackBatchEvents: jest.fn().mockResolvedValue({ tracked: 5 }),
  findAll: jest.fn().mockResolvedValue(mockEventsList),
  getEventCounts: jest.fn().mockResolvedValue(mockEventCounts),
  getActiveUsers: jest.fn().mockResolvedValue(mockActiveUsers),
  getUserFunnel: jest.fn().mockResolvedValue(mockFunnel),
  getTopEvents: jest.fn().mockResolvedValue(mockTopEvents),
  getPlatformBreakdown: jest.fn().mockResolvedValue(mockPlatformBreakdown),
  getLocationBreakdown: jest.fn().mockResolvedValue(mockLocationBreakdown),
  exportUserAnalytics: jest.fn().mockResolvedValue(mockExportData),
  deleteUserAnalytics: jest.fn().mockResolvedValue({ deleted: 42 }),
};

const mockConsentService = {
  getUserConsent: jest.fn().mockResolvedValue(mockConsent),
  updateUserConsent: jest.fn().mockResolvedValue(mockConsent),
};

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let analyticsService: AnalyticsService;
  let consentService: ConsentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        { provide: AnalyticsService, useValue: mockAnalyticsService },
        { provide: ConsentService, useValue: mockConsentService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    analyticsService = module.get<AnalyticsService>(AnalyticsService);
    consentService = module.get<ConsentService>(ConsentService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ── POST /track ──────────────────────────────────────────────────────────

  describe('POST /track (trackEvent)', () => {
    it('should call analyticsService.trackEvent with userId, dto and req', async () => {
      const dto = {
        eventName: 'page_view',
        properties: { page: '/home' },
      } as any;

      const result = await controller.trackEvent(mockUser, dto, mockReq);

      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        mockUser.id,
        dto,
        mockReq,
      );
      expect(result).toEqual(mockEvent);
    });
  });

  // ── POST /track/batch ────────────────────────────────────────────────────

  describe('POST /track/batch (trackBatchEvents)', () => {
    it('should call analyticsService.trackBatchEvents with userId, dto and req', async () => {
      const dto = {
        events: [
          { eventName: 'page_view', properties: { page: '/home' } },
          { eventName: 'button_click', properties: { button: 'signup' } },
        ],
      } as any;

      const result = await controller.trackBatchEvents(mockUser, dto, mockReq);

      expect(analyticsService.trackBatchEvents).toHaveBeenCalledWith(
        mockUser.id,
        dto,
        mockReq,
      );
      expect(result).toEqual({ tracked: 5 });
    });
  });

  // ── GET /events ──────────────────────────────────────────────────────────

  describe('GET /events (findAll)', () => {
    it('should call analyticsService.findAll with query', async () => {
      const query = { page: 1, limit: 20 } as any;
      const result = await controller.findAll(query);

      expect(analyticsService.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockEventsList);
    });
  });

  // ── GET /dashboard/event-counts ──────────────────────────────────────────

  describe('GET /dashboard/event-counts (getEventCounts)', () => {
    it('should call analyticsService.getEventCounts with dashboard query fields', async () => {
      const query = {
        dateFrom: '2025-06-01',
        dateTo: '2025-06-30',
        locationId: 'loc-1',
        granularity: 'day',
      } as any;

      const result = await controller.getEventCounts(query);

      expect(analyticsService.getEventCounts).toHaveBeenCalledWith(
        query.dateFrom,
        query.dateTo,
        query.locationId,
        query.granularity,
      );
      expect(result).toEqual(mockEventCounts);
    });
  });

  // ── GET /dashboard/active-users ──────────────────────────────────────────

  describe('GET /dashboard/active-users (getActiveUsers)', () => {
    it('should call analyticsService.getActiveUsers with date range and granularity', async () => {
      const query = {
        dateFrom: '2025-06-01',
        dateTo: '2025-06-30',
        granularity: 'day',
      } as any;

      const result = await controller.getActiveUsers(query);

      expect(analyticsService.getActiveUsers).toHaveBeenCalledWith(
        query.dateFrom,
        query.dateTo,
        query.granularity,
      );
      expect(result).toEqual(mockActiveUsers);
    });
  });

  // ── GET /dashboard/funnel ────────────────────────────────────────────────

  describe('GET /dashboard/funnel (getUserFunnel)', () => {
    it('should call analyticsService.getUserFunnel with date range and locationId', async () => {
      const query = {
        dateFrom: '2025-06-01',
        dateTo: '2025-06-30',
        locationId: 'loc-1',
      } as any;

      const result = await controller.getUserFunnel(query);

      expect(analyticsService.getUserFunnel).toHaveBeenCalledWith(
        query.dateFrom,
        query.dateTo,
        query.locationId,
      );
      expect(result).toEqual(mockFunnel);
    });
  });

  // ── GET /dashboard/top-events ────────────────────────────────────────────

  describe('GET /dashboard/top-events (getTopEvents)', () => {
    it('should call analyticsService.getTopEvents with date range and default limit', async () => {
      const query = {
        dateFrom: '2025-06-01',
        dateTo: '2025-06-30',
      } as any;

      const result = await controller.getTopEvents(query);

      expect(analyticsService.getTopEvents).toHaveBeenCalledWith(
        query.dateFrom,
        query.dateTo,
        undefined,
      );
      expect(result).toEqual(mockTopEvents);
    });

    it('should pass custom limit when provided', async () => {
      const query = {
        dateFrom: '2025-06-01',
        dateTo: '2025-06-30',
      } as any;

      await controller.getTopEvents(query, 10);

      expect(analyticsService.getTopEvents).toHaveBeenCalledWith(
        query.dateFrom,
        query.dateTo,
        10,
      );
    });
  });

  // ── GET /dashboard/platforms ─────────────────────────────────────────────

  describe('GET /dashboard/platforms (getPlatformBreakdown)', () => {
    it('should call analyticsService.getPlatformBreakdown with date range', async () => {
      const query = {
        dateFrom: '2025-06-01',
        dateTo: '2025-06-30',
      } as any;

      const result = await controller.getPlatformBreakdown(query);

      expect(analyticsService.getPlatformBreakdown).toHaveBeenCalledWith(
        query.dateFrom,
        query.dateTo,
      );
      expect(result).toEqual(mockPlatformBreakdown);
    });
  });

  // ── GET /dashboard/locations ─────────────────────────────────────────────

  describe('GET /dashboard/locations (getLocationBreakdown)', () => {
    it('should call analyticsService.getLocationBreakdown with date range', async () => {
      const query = {
        dateFrom: '2025-06-01',
        dateTo: '2025-06-30',
      } as any;

      const result = await controller.getLocationBreakdown(query);

      expect(analyticsService.getLocationBreakdown).toHaveBeenCalledWith(
        query.dateFrom,
        query.dateTo,
      );
      expect(result).toEqual(mockLocationBreakdown);
    });
  });

  // ── GET /consent ─────────────────────────────────────────────────────────

  describe('GET /consent (getConsent)', () => {
    it('should call consentService.getUserConsent with userId', async () => {
      const result = await controller.getConsent(mockUser);

      expect(consentService.getUserConsent).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockConsent);
    });
  });

  // ── PATCH /consent ───────────────────────────────────────────────────────

  describe('PATCH /consent (updateConsent)', () => {
    it('should call consentService.updateUserConsent with userId and dto', async () => {
      const dto = { analytics: false, marketing: true } as any;
      const result = await controller.updateConsent(mockUser, dto);

      expect(consentService.updateUserConsent).toHaveBeenCalledWith(
        mockUser.id,
        dto,
      );
      expect(result).toEqual(mockConsent);
    });
  });

  // ── GET /my/export ───────────────────────────────────────────────────────

  describe('GET /my/export (exportMyData)', () => {
    it('should call analyticsService.exportUserAnalytics with userId', async () => {
      const result = await controller.exportMyData(mockUser);

      expect(analyticsService.exportUserAnalytics).toHaveBeenCalledWith(
        mockUser.id,
      );
      expect(result).toEqual(mockExportData);
    });
  });

  // ── DELETE /my/data ──────────────────────────────────────────────────────

  describe('DELETE /my/data (deleteMyData)', () => {
    it('should call analyticsService.deleteUserAnalytics with userId', async () => {
      const result = await controller.deleteMyData(mockUser);

      expect(analyticsService.deleteUserAnalytics).toHaveBeenCalledWith(
        mockUser.id,
      );
      expect(result).toEqual({ deleted: 42 });
    });
  });
});
