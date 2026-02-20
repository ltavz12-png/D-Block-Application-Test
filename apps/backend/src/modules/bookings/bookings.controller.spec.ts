import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

// ────────────────────────────────────────────────────────────────────────────
// Mock data
// ────────────────────────────────────────────────────────────────────────────

const mockUser = {
  id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  email: 'user@example.com',
  role: 'member',
};

const mockAdminUser = {
  id: 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff',
  email: 'admin@example.com',
  role: 'super_admin',
};

const mockBooking = {
  id: '11111111-2222-3333-4444-555555555555',
  userId: mockUser.id,
  locationId: '66666666-7777-8888-9999-aaaaaaaaaaaa',
  resourceId: '77777777-8888-9999-aaaa-bbbbbbbbbbbb',
  status: 'PENDING',
  startTime: '2025-06-15T09:00:00Z',
  endTime: '2025-06-15T10:00:00Z',
  notes: 'Team meeting',
  createdAt: new Date().toISOString(),
};

const mockBookingsList = {
  data: [mockBooking],
  total: 1,
  page: 1,
  limit: 20,
};

const mockStats = {
  totalBookings: 150,
  confirmedBookings: 120,
  cancelledBookings: 15,
  revenue: 25000,
};

// ────────────────────────────────────────────────────────────────────────────
// Mock service
// ────────────────────────────────────────────────────────────────────────────

const mockBookingsService = {
  createBooking: jest.fn().mockResolvedValue(mockBooking),
  findByUser: jest.fn().mockResolvedValue(mockBookingsList),
  findUpcoming: jest.fn().mockResolvedValue([mockBooking]),
  findAll: jest.fn().mockResolvedValue(mockBookingsList),
  getBookingStats: jest.fn().mockResolvedValue(mockStats),
  findById: jest.fn().mockResolvedValue(mockBooking),
  updateBooking: jest.fn().mockResolvedValue(mockBooking),
  cancelBooking: jest.fn().mockResolvedValue({ ...mockBooking, status: 'CANCELLED' }),
  confirmBooking: jest.fn().mockResolvedValue({ ...mockBooking, status: 'CONFIRMED' }),
  checkIn: jest.fn().mockResolvedValue({ ...mockBooking, status: 'CHECKED_IN' }),
  checkOut: jest.fn().mockResolvedValue({ ...mockBooking, status: 'CHECKED_OUT' }),
  markNoShow: jest.fn().mockResolvedValue({ ...mockBooking, status: 'NO_SHOW' }),
};

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────

describe('BookingsController', () => {
  let controller: BookingsController;
  let service: BookingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [
        { provide: BookingsService, useValue: mockBookingsService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<BookingsController>(BookingsController);
    service = module.get<BookingsService>(BookingsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ── POST / ───────────────────────────────────────────────────────────────

  describe('POST / (create)', () => {
    it('should call bookingsService.createBooking with userId and dto', async () => {
      const dto = {
        locationId: mockBooking.locationId,
        resourceId: mockBooking.resourceId,
        startTime: mockBooking.startTime,
        endTime: mockBooking.endTime,
        notes: 'Standup meeting',
      } as any;

      const result = await controller.create(dto, mockUser);

      expect(service.createBooking).toHaveBeenCalledWith(mockUser.id, dto);
      expect(result).toEqual(mockBooking);
    });
  });

  // ── GET /my ──────────────────────────────────────────────────────────────

  describe('GET /my (findMyBookings)', () => {
    it('should call bookingsService.findByUser with userId and query', async () => {
      const query = { page: 1, limit: 10 } as any;
      const result = await controller.findMyBookings(query, mockUser);

      expect(service.findByUser).toHaveBeenCalledWith(mockUser.id, query);
      expect(result).toEqual(mockBookingsList);
    });
  });

  // ── GET /my/upcoming ─────────────────────────────────────────────────────

  describe('GET /my/upcoming (findMyUpcoming)', () => {
    it('should call bookingsService.findUpcoming with userId', async () => {
      const result = await controller.findMyUpcoming(mockUser);

      expect(service.findUpcoming).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual([mockBooking]);
    });
  });

  // ── GET /admin ───────────────────────────────────────────────────────────

  describe('GET /admin (findAllAdmin)', () => {
    it('should call bookingsService.findAll with query', async () => {
      const query = { page: 1, limit: 20, status: 'CONFIRMED' } as any;
      const result = await controller.findAllAdmin(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockBookingsList);
    });
  });

  // ── GET /admin/stats ─────────────────────────────────────────────────────

  describe('GET /admin/stats (getStats)', () => {
    it('should call bookingsService.getBookingStats with parsed filters', async () => {
      const result = await controller.getStats('loc-1', '2025-06-01', '2025-06-30');

      expect(service.getBookingStats).toHaveBeenCalledWith({
        locationId: 'loc-1',
        dateFrom: new Date('2025-06-01'),
        dateTo: new Date('2025-06-30'),
      });
      expect(result).toEqual(mockStats);
    });

    it('should handle optional parameters being undefined', async () => {
      const result = await controller.getStats(undefined, undefined, undefined);

      expect(service.getBookingStats).toHaveBeenCalledWith({
        locationId: undefined,
        dateFrom: undefined,
        dateTo: undefined,
      });
      expect(result).toEqual(mockStats);
    });
  });

  // ── GET /:id ─────────────────────────────────────────────────────────────

  describe('GET /:id (findOne)', () => {
    it('should return the booking when user is the owner', async () => {
      const result = await controller.findOne(mockBooking.id, mockUser);

      expect(service.findById).toHaveBeenCalledWith(mockBooking.id);
      expect(result).toEqual(mockBooking);
    });

    it('should return the booking when user is an admin', async () => {
      const result = await controller.findOne(mockBooking.id, mockAdminUser);

      expect(service.findById).toHaveBeenCalledWith(mockBooking.id);
      expect(result).toEqual(mockBooking);
    });

    it('should throw ForbiddenException when user is not owner and not admin', async () => {
      const otherUser = {
        id: 'cccccccc-dddd-eeee-ffff-000000000000',
        email: 'other@example.com',
        role: 'member',
      };

      await expect(
        controller.findOne(mockBooking.id, otherUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ── PATCH /:id ───────────────────────────────────────────────────────────

  describe('PATCH /:id (update)', () => {
    it('should update when user is the owner', async () => {
      const dto = { notes: 'Updated notes' } as any;
      const result = await controller.update(mockBooking.id, dto, mockUser);

      expect(service.findById).toHaveBeenCalledWith(mockBooking.id);
      expect(service.updateBooking).toHaveBeenCalledWith(mockBooking.id, dto);
      expect(result).toEqual(mockBooking);
    });

    it('should update when user is an admin', async () => {
      const dto = { notes: 'Admin update' } as any;
      const result = await controller.update(mockBooking.id, dto, mockAdminUser);

      expect(service.findById).toHaveBeenCalledWith(mockBooking.id);
      expect(service.updateBooking).toHaveBeenCalledWith(mockBooking.id, dto);
      expect(result).toEqual(mockBooking);
    });

    it('should throw ForbiddenException when non-owner non-admin tries to update', async () => {
      const otherUser = {
        id: 'cccccccc-dddd-eeee-ffff-000000000000',
        email: 'other@example.com',
        role: 'member',
      };
      const dto = { notes: 'Hacked' } as any;

      await expect(
        controller.update(mockBooking.id, dto, otherUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ── POST /:id/cancel ────────────────────────────────────────────────────

  describe('POST /:id/cancel (cancel)', () => {
    it('should cancel when user is the owner', async () => {
      const dto = { reason: 'Changed plans' } as any;
      const result = await controller.cancel(mockBooking.id, dto, mockUser);

      expect(service.findById).toHaveBeenCalledWith(mockBooking.id);
      expect(service.cancelBooking).toHaveBeenCalledWith(
        mockBooking.id,
        mockUser.id,
        dto,
      );
      expect(result).toEqual(
        expect.objectContaining({ status: 'CANCELLED' }),
      );
    });

    it('should cancel when user is an admin', async () => {
      const dto = { reason: 'Admin override' } as any;
      const result = await controller.cancel(mockBooking.id, dto, mockAdminUser);

      expect(service.cancelBooking).toHaveBeenCalledWith(
        mockBooking.id,
        mockAdminUser.id,
        dto,
      );
    });

    it('should throw ForbiddenException when non-owner non-admin tries to cancel', async () => {
      const otherUser = {
        id: 'cccccccc-dddd-eeee-ffff-000000000000',
        email: 'other@example.com',
        role: 'member',
      };
      const dto = { reason: 'Steal cancel' } as any;

      await expect(
        controller.cancel(mockBooking.id, dto, otherUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ── POST /:id/confirm ───────────────────────────────────────────────────

  describe('POST /:id/confirm (confirm)', () => {
    it('should call bookingsService.confirmBooking with id and paymentId', async () => {
      const result = await controller.confirm(mockBooking.id, 'pay-123');

      expect(service.confirmBooking).toHaveBeenCalledWith(
        mockBooking.id,
        'pay-123',
      );
      expect(result).toEqual(
        expect.objectContaining({ status: 'CONFIRMED' }),
      );
    });

    it('should call bookingsService.confirmBooking without paymentId', async () => {
      const result = await controller.confirm(mockBooking.id);

      expect(service.confirmBooking).toHaveBeenCalledWith(
        mockBooking.id,
        undefined,
      );
    });
  });

  // ── POST /:id/check-in ──────────────────────────────────────────────────

  describe('POST /:id/check-in (checkIn)', () => {
    it('should call bookingsService.checkIn with id', async () => {
      const result = await controller.checkIn(mockBooking.id);

      expect(service.checkIn).toHaveBeenCalledWith(mockBooking.id);
      expect(result).toEqual(
        expect.objectContaining({ status: 'CHECKED_IN' }),
      );
    });
  });

  // ── POST /:id/check-out ─────────────────────────────────────────────────

  describe('POST /:id/check-out (checkOut)', () => {
    it('should call bookingsService.checkOut with id', async () => {
      const result = await controller.checkOut(mockBooking.id);

      expect(service.checkOut).toHaveBeenCalledWith(mockBooking.id);
      expect(result).toEqual(
        expect.objectContaining({ status: 'CHECKED_OUT' }),
      );
    });
  });

  // ── POST /:id/no-show ───────────────────────────────────────────────────

  describe('POST /:id/no-show (markNoShow)', () => {
    it('should call bookingsService.markNoShow with id', async () => {
      const result = await controller.markNoShow(mockBooking.id);

      expect(service.markNoShow).toHaveBeenCalledWith(mockBooking.id);
      expect(result).toEqual(
        expect.objectContaining({ status: 'NO_SHOW' }),
      );
    });
  });

  // ── assertOwnerOrAdmin (private method tested via public endpoints) ──────

  describe('assertOwnerOrAdmin (ownership checks)', () => {
    it('should allow location_manager role to access any booking', async () => {
      const manager = {
        id: 'dddddddd-eeee-ffff-0000-111111111111',
        email: 'manager@example.com',
        role: 'location_manager',
      };

      const result = await controller.findOne(mockBooking.id, manager);
      expect(result).toEqual(mockBooking);
    });

    it('should allow reception_staff role to access any booking', async () => {
      const reception = {
        id: 'eeeeeeee-ffff-0000-1111-222222222222',
        email: 'reception@example.com',
        role: 'reception_staff',
      };

      const result = await controller.findOne(mockBooking.id, reception);
      expect(result).toEqual(mockBooking);
    });

    it('should reject company_admin role for another users booking', async () => {
      const companyAdmin = {
        id: 'ffffffff-0000-1111-2222-333333333333',
        email: 'companyadmin@example.com',
        role: 'company_admin',
      };

      await expect(
        controller.findOne(mockBooking.id, companyAdmin),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
