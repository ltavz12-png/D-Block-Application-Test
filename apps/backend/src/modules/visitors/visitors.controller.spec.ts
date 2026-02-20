import { Test, TestingModule } from '@nestjs/testing';
import { VisitorsController } from './visitors.controller';
import { VisitorsService } from './visitors.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

// ────────────────────────────────────────────────────────────────────────────
// Mock data
// ────────────────────────────────────────────────────────────────────────────

const mockUser = { id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' };

const mockVisitor = {
  id: '11111111-2222-3333-4444-555555555555',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '+995555000111',
  hostUserId: mockUser.id,
  locationId: '66666666-7777-8888-9999-aaaaaaaaaaaa',
  status: 'EXPECTED',
  purpose: 'Business meeting',
  expectedDate: '2025-06-15',
  createdAt: new Date().toISOString(),
};

const mockVisitorsList = {
  data: [mockVisitor],
  total: 1,
  page: 1,
  limit: 20,
};

const mockStats = {
  totalToday: 5,
  checkedIn: 2,
  expected: 3,
  noShow: 0,
};

// ────────────────────────────────────────────────────────────────────────────
// Mock service
// ────────────────────────────────────────────────────────────────────────────

const mockVisitorsService = {
  findAll: jest.fn().mockResolvedValue(mockVisitorsList),
  findMyVisitors: jest.fn().mockResolvedValue(mockVisitorsList),
  findTodaysVisitors: jest.fn().mockResolvedValue([mockVisitor]),
  getVisitorStats: jest.fn().mockResolvedValue(mockStats),
  inviteVisitor: jest.fn().mockResolvedValue(mockVisitor),
  findById: jest.fn().mockResolvedValue(mockVisitor),
  updateVisitor: jest.fn().mockResolvedValue(mockVisitor),
  cancelVisitor: jest.fn().mockResolvedValue({ ...mockVisitor, status: 'CANCELLED' }),
  checkInVisitor: jest.fn().mockResolvedValue({ ...mockVisitor, status: 'CHECKED_IN' }),
  checkOutVisitor: jest.fn().mockResolvedValue({ ...mockVisitor, status: 'CHECKED_OUT' }),
  markNoShow: jest.fn().mockResolvedValue({ ...mockVisitor, status: 'NO_SHOW' }),
};

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────

describe('VisitorsController', () => {
  let controller: VisitorsController;
  let service: VisitorsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VisitorsController],
      providers: [
        { provide: VisitorsService, useValue: mockVisitorsService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<VisitorsController>(VisitorsController);
    service = module.get<VisitorsService>(VisitorsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ── GET / ────────────────────────────────────────────────────────────────

  describe('GET / (findAll)', () => {
    it('should call visitorsService.findAll with query params', async () => {
      const query = { page: 1, limit: 20, status: 'EXPECTED' } as any;
      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockVisitorsList);
    });

    it('should call visitorsService.findAll with empty query', async () => {
      await controller.findAll({} as any);
      expect(service.findAll).toHaveBeenCalledWith({});
    });
  });

  // ── GET /my ──────────────────────────────────────────────────────────────

  describe('GET /my (findMyVisitors)', () => {
    it('should call visitorsService.findMyVisitors with user id and default pagination', async () => {
      const result = await controller.findMyVisitors(mockUser);

      expect(service.findMyVisitors).toHaveBeenCalledWith(mockUser.id, 1, 20);
      expect(result).toEqual(mockVisitorsList);
    });

    it('should pass custom page and limit', async () => {
      await controller.findMyVisitors(mockUser, 2, 10);

      expect(service.findMyVisitors).toHaveBeenCalledWith(mockUser.id, 2, 10);
    });
  });

  // ── GET /today/:locationId ───────────────────────────────────────────────

  describe('GET /today/:locationId (findTodaysVisitors)', () => {
    it('should call visitorsService.findTodaysVisitors with locationId', async () => {
      const locationId = mockVisitor.locationId;
      const result = await controller.findTodaysVisitors(locationId);

      expect(service.findTodaysVisitors).toHaveBeenCalledWith(locationId);
      expect(result).toEqual([mockVisitor]);
    });
  });

  // ── GET /stats/:locationId ───────────────────────────────────────────────

  describe('GET /stats/:locationId (getVisitorStats)', () => {
    it('should call visitorsService.getVisitorStats with locationId', async () => {
      const locationId = mockVisitor.locationId;
      const result = await controller.getVisitorStats(locationId);

      expect(service.getVisitorStats).toHaveBeenCalledWith(locationId);
      expect(result).toEqual(mockStats);
    });
  });

  // ── POST / ───────────────────────────────────────────────────────────────

  describe('POST / (inviteVisitor)', () => {
    it('should call visitorsService.inviteVisitor with user id and dto', async () => {
      const dto = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        locationId: mockVisitor.locationId,
        expectedDate: '2025-07-01',
        purpose: 'Interview',
      } as any;

      const result = await controller.inviteVisitor(mockUser, dto);

      expect(service.inviteVisitor).toHaveBeenCalledWith(mockUser.id, dto);
      expect(result).toEqual(mockVisitor);
    });
  });

  // ── GET /:id ─────────────────────────────────────────────────────────────

  describe('GET /:id (findById)', () => {
    it('should call visitorsService.findById with the visitor id', async () => {
      const result = await controller.findById(mockVisitor.id);

      expect(service.findById).toHaveBeenCalledWith(mockVisitor.id);
      expect(result).toEqual(mockVisitor);
    });
  });

  // ── PATCH /:id ───────────────────────────────────────────────────────────

  describe('PATCH /:id (updateVisitor)', () => {
    it('should call visitorsService.updateVisitor with id, userId and dto', async () => {
      const dto = { firstName: 'Updated', purpose: 'Updated meeting' } as any;
      const result = await controller.updateVisitor(mockVisitor.id, mockUser, dto);

      expect(service.updateVisitor).toHaveBeenCalledWith(
        mockVisitor.id,
        mockUser.id,
        dto,
      );
      expect(result).toEqual(mockVisitor);
    });
  });

  // ── POST /:id/cancel ────────────────────────────────────────────────────

  describe('POST /:id/cancel (cancelVisitor)', () => {
    it('should call visitorsService.cancelVisitor with id and userId', async () => {
      const result = await controller.cancelVisitor(mockVisitor.id, mockUser);

      expect(service.cancelVisitor).toHaveBeenCalledWith(
        mockVisitor.id,
        mockUser.id,
      );
      expect(result).toEqual(
        expect.objectContaining({ status: 'CANCELLED' }),
      );
    });
  });

  // ── POST /:id/check-in ──────────────────────────────────────────────────

  describe('POST /:id/check-in (checkInVisitor)', () => {
    it('should call visitorsService.checkInVisitor with id', async () => {
      const result = await controller.checkInVisitor(mockVisitor.id);

      expect(service.checkInVisitor).toHaveBeenCalledWith(mockVisitor.id);
      expect(result).toEqual(
        expect.objectContaining({ status: 'CHECKED_IN' }),
      );
    });
  });

  // ── POST /:id/check-out ─────────────────────────────────────────────────

  describe('POST /:id/check-out (checkOutVisitor)', () => {
    it('should call visitorsService.checkOutVisitor with id', async () => {
      const result = await controller.checkOutVisitor(mockVisitor.id);

      expect(service.checkOutVisitor).toHaveBeenCalledWith(mockVisitor.id);
      expect(result).toEqual(
        expect.objectContaining({ status: 'CHECKED_OUT' }),
      );
    });
  });

  // ── POST /:id/no-show ───────────────────────────────────────────────────

  describe('POST /:id/no-show (markNoShow)', () => {
    it('should call visitorsService.markNoShow with id', async () => {
      const result = await controller.markNoShow(mockVisitor.id);

      expect(service.markNoShow).toHaveBeenCalledWith(mockVisitor.id);
      expect(result).toEqual(
        expect.objectContaining({ status: 'NO_SHOW' }),
      );
    });
  });
});
