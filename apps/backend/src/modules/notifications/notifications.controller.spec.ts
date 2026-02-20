import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

// ────────────────────────────────────────────────────────────────────────────
// Mock data
// ────────────────────────────────────────────────────────────────────────────

const mockUser = { id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' };

const mockNotification = {
  id: '11111111-2222-3333-4444-555555555555',
  userId: mockUser.id,
  title: 'Booking confirmed',
  body: 'Your booking has been confirmed for tomorrow',
  type: 'BOOKING',
  channel: 'push',
  isRead: false,
  createdAt: new Date().toISOString(),
};

const mockNotificationsList = {
  data: [mockNotification],
  total: 1,
  page: 1,
  limit: 20,
};

const mockPreferences = {
  push: true,
  email: true,
  sms: false,
  marketing: false,
};

// ────────────────────────────────────────────────────────────────────────────
// Mock service
// ────────────────────────────────────────────────────────────────────────────

const mockNotificationsService = {
  findAllNotifications: jest.fn().mockResolvedValue(mockNotificationsList),
  findUserNotifications: jest.fn().mockResolvedValue(mockNotificationsList),
  getUnreadCount: jest.fn().mockResolvedValue({ count: 3 }),
  getUserPreferences: jest.fn().mockResolvedValue(mockPreferences),
  sendNotification: jest.fn().mockResolvedValue(mockNotification),
  sendBulkNotification: jest.fn().mockResolvedValue({ sent: 15 }),
  updateUserPreferences: jest.fn().mockResolvedValue(mockPreferences),
  markAllAsRead: jest.fn().mockResolvedValue({ updated: 5 }),
  markAsRead: jest.fn().mockResolvedValue({ ...mockNotification, isRead: true }),
  deleteNotification: jest.fn().mockResolvedValue(undefined),
};

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get<NotificationsService>(NotificationsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ── GET / ────────────────────────────────────────────────────────────────

  describe('GET / (findAll)', () => {
    it('should call notificationsService.findAllNotifications with query', async () => {
      const query = { page: 1, limit: 20 } as any;
      const result = await controller.findAll(query);

      expect(service.findAllNotifications).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockNotificationsList);
    });
  });

  // ── GET /my ──────────────────────────────────────────────────────────────

  describe('GET /my (findMyNotifications)', () => {
    it('should call notificationsService.findUserNotifications with userId and query', async () => {
      const query = { page: 1, limit: 10 } as any;
      const result = await controller.findMyNotifications(mockUser, query);

      expect(service.findUserNotifications).toHaveBeenCalledWith(
        mockUser.id,
        query,
      );
      expect(result).toEqual(mockNotificationsList);
    });
  });

  // ── GET /my/unread-count ─────────────────────────────────────────────────

  describe('GET /my/unread-count (getUnreadCount)', () => {
    it('should call notificationsService.getUnreadCount with userId', async () => {
      const result = await controller.getUnreadCount(mockUser);

      expect(service.getUnreadCount).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({ count: 3 });
    });
  });

  // ── GET /my/preferences ──────────────────────────────────────────────────

  describe('GET /my/preferences (getMyPreferences)', () => {
    it('should call notificationsService.getUserPreferences with userId', async () => {
      const result = await controller.getMyPreferences(mockUser);

      expect(service.getUserPreferences).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockPreferences);
    });
  });

  // ── POST /send ───────────────────────────────────────────────────────────

  describe('POST /send (sendNotification)', () => {
    it('should call notificationsService.sendNotification with dto', async () => {
      const dto = {
        userId: 'some-user-id',
        title: 'Test',
        body: 'Test notification',
        type: 'GENERAL',
      } as any;

      const result = await controller.sendNotification(dto);

      expect(service.sendNotification).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockNotification);
    });
  });

  // ── POST /broadcast ──────────────────────────────────────────────────────

  describe('POST /broadcast (broadcastNotification)', () => {
    it('should call notificationsService.sendBulkNotification with dto', async () => {
      const dto = {
        title: 'Announcement',
        body: 'System maintenance tonight',
        targetRoles: ['member'],
      } as any;

      const result = await controller.broadcastNotification(dto);

      expect(service.sendBulkNotification).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ sent: 15 });
    });
  });

  // ── PATCH /my/preferences ────────────────────────────────────────────────

  describe('PATCH /my/preferences (updateMyPreferences)', () => {
    it('should call notificationsService.updateUserPreferences with userId and dto', async () => {
      const dto = { push: false, sms: true } as any;
      const result = await controller.updateMyPreferences(mockUser, dto);

      expect(service.updateUserPreferences).toHaveBeenCalledWith(
        mockUser.id,
        dto,
      );
      expect(result).toEqual(mockPreferences);
    });
  });

  // ── POST /my/read-all ────────────────────────────────────────────────────

  describe('POST /my/read-all (markAllAsRead)', () => {
    it('should call notificationsService.markAllAsRead with userId', async () => {
      const result = await controller.markAllAsRead(mockUser);

      expect(service.markAllAsRead).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({ updated: 5 });
    });
  });

  // ── PATCH /:id/read ──────────────────────────────────────────────────────

  describe('PATCH /:id/read (markAsRead)', () => {
    it('should call notificationsService.markAsRead with notification id and userId', async () => {
      const result = await controller.markAsRead(mockNotification.id, mockUser);

      expect(service.markAsRead).toHaveBeenCalledWith(
        mockNotification.id,
        mockUser.id,
      );
      expect(result).toEqual(
        expect.objectContaining({ isRead: true }),
      );
    });
  });

  // ── DELETE /:id ──────────────────────────────────────────────────────────

  describe('DELETE /:id (deleteNotification)', () => {
    it('should call notificationsService.deleteNotification with id and userId', async () => {
      const result = await controller.deleteNotification(
        mockNotification.id,
        mockUser,
      );

      expect(service.deleteNotification).toHaveBeenCalledWith(
        mockNotification.id,
        mockUser.id,
      );
      expect(result).toBeUndefined();
    });
  });
});
