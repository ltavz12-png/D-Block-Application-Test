import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { NotificationsService, UserPreference } from './notifications.service';
import {
  Notification,
  NotificationType,
  NotificationChannel,
} from '@/common/database/entities/notification.entity';
import {
  IPushNotificationProvider,
  PUSH_NOTIFICATION_PROVIDER,
} from './providers/push-notification.provider';
import { SendNotificationDto } from './dto/send-notification.dto';
import { SendBulkNotificationDto } from './dto/send-bulk-notification.dto';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockUserId = 'user-0001-0001-0001-000000000001';
const mockNotificationId = 'notif-001-0001-0001-000000000001';

function createMockNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: mockNotificationId,
    userId: mockUserId,
    type: NotificationType.BOOKING_CONFIRMATION,
    channel: NotificationChannel.IN_APP,
    title: 'Booking Confirmed',
    body: 'Your booking has been confirmed.',
    data: null,
    isRead: false,
    readAt: null,
    sentAt: null,
    deliveryStatus: 'pending',
    language: 'en',
    user: undefined as any,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null as any,
    ...overrides,
  } as Notification;
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

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationRepo: Record<string, jest.Mock>;
  let pushProvider: Record<string, jest.Mock>;

  beforeEach(async () => {
    notificationRepo = {
      create: jest.fn((dto) => ({ ...dto })),
      save: jest.fn((entity) =>
        Promise.resolve({ ...entity, id: entity.id || mockNotificationId }),
      ),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      softRemove: jest.fn().mockResolvedValue(undefined),
      createQueryBuilder: jest.fn(),
    };

    // Attach manager separately to avoid TS strict object literal checks
    (notificationRepo as any).manager = {
      getRepository: jest.fn().mockReturnValue({
        find: jest.fn().mockResolvedValue([]),
      }),
    };

    pushProvider = {
      sendPush: jest.fn().mockResolvedValue({ success: true, messageId: 'msg-123' }),
      sendMultiple: jest.fn().mockResolvedValue({ successCount: 1, failureCount: 0 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(Notification), useValue: notificationRepo },
        { provide: PUSH_NOTIFICATION_PROVIDER, useValue: pushProvider },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  // =========================================================================
  // sendNotification
  // =========================================================================

  describe('sendNotification', () => {
    const baseDto: SendNotificationDto = {
      userId: mockUserId,
      type: NotificationType.BOOKING_CONFIRMATION,
      channels: [NotificationChannel.IN_APP],
      title: 'Booking Confirmed',
      body: 'Your booking for Room A has been confirmed.',
    };

    it('should create a notification entity for each channel', async () => {
      const dto: SendNotificationDto = {
        ...baseDto,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      };

      const result = await service.sendNotification(dto);

      expect(result).toHaveLength(2);
      expect(notificationRepo.create).toHaveBeenCalledTimes(2);
      // save called once for create + once to mark as sent, per channel = 4 total
      expect(notificationRepo.save).toHaveBeenCalled();
    });

    it('should dispatch push notification via push provider for PUSH channel', async () => {
      const dto: SendNotificationDto = {
        ...baseDto,
        channels: [NotificationChannel.PUSH],
        data: { bookingId: '123' },
      };

      await service.sendNotification(dto);

      expect(pushProvider.sendPush).toHaveBeenCalledWith(
        `device_token_${mockUserId}`,
        dto.title,
        dto.body,
        dto.data,
      );
    });

    it('should set deliveryStatus to "sent" on successful push', async () => {
      pushProvider.sendPush.mockResolvedValueOnce({ success: true, messageId: 'msg-456' });

      const dto: SendNotificationDto = {
        ...baseDto,
        channels: [NotificationChannel.PUSH],
      };

      const result = await service.sendNotification(dto);

      expect(result[0].deliveryStatus).toBe('sent');
      expect(result[0].sentAt).toBeInstanceOf(Date);
    });

    it('should set deliveryStatus to "failed" when push provider returns failure', async () => {
      pushProvider.sendPush.mockResolvedValueOnce({
        success: false,
        error: 'Invalid device token',
      });

      const dto: SendNotificationDto = {
        ...baseDto,
        channels: [NotificationChannel.PUSH],
      };

      const result = await service.sendNotification(dto);

      expect(result[0].deliveryStatus).toBe('failed');
    });

    it('should set deliveryStatus to "failed" when push provider throws', async () => {
      pushProvider.sendPush.mockRejectedValueOnce(new Error('Network error'));

      const dto: SendNotificationDto = {
        ...baseDto,
        channels: [NotificationChannel.PUSH],
      };

      const result = await service.sendNotification(dto);

      expect(result[0].deliveryStatus).toBe('failed');
    });

    it('should mark IN_APP channel as "sent" immediately', async () => {
      const dto: SendNotificationDto = {
        ...baseDto,
        channels: [NotificationChannel.IN_APP],
      };

      const result = await service.sendNotification(dto);

      expect(result[0].deliveryStatus).toBe('sent');
      expect(result[0].sentAt).toBeInstanceOf(Date);
      expect(pushProvider.sendPush).not.toHaveBeenCalled();
    });

    it('should mark EMAIL channel as "sent" immediately without push provider', async () => {
      const dto: SendNotificationDto = {
        ...baseDto,
        channels: [NotificationChannel.EMAIL],
      };

      const result = await service.sendNotification(dto);

      expect(result[0].deliveryStatus).toBe('sent');
      expect(pushProvider.sendPush).not.toHaveBeenCalled();
    });

    it('should store data payload when provided', async () => {
      const dto: SendNotificationDto = {
        ...baseDto,
        data: { bookingId: 'abc-123', roomName: 'Meeting Room A' },
      };

      await service.sendNotification(dto);

      expect(notificationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { bookingId: 'abc-123', roomName: 'Meeting Room A' },
        }),
      );
    });

    it('should default language to "en" when not specified', async () => {
      await service.sendNotification(baseDto);

      expect(notificationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ language: 'en' }),
      );
    });
  });

  // =========================================================================
  // sendBulkNotification
  // =========================================================================

  describe('sendBulkNotification', () => {
    it('should create notifications for all provided userIds', async () => {
      const qb = createMockQueryBuilder();
      notificationRepo.createQueryBuilder.mockReturnValue(qb);

      const dto: SendBulkNotificationDto = {
        userIds: ['user-1', 'user-2', 'user-3'],
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        channels: [NotificationChannel.IN_APP],
        title: 'System Update',
        body: 'We will be undergoing maintenance.',
      };

      const result = await service.sendBulkNotification(dto);

      expect(result.totalUsers).toBe(3);
      expect(result.totalSent).toBe(3); // 3 users * 1 channel
      expect(qb['execute']).toHaveBeenCalled();
    });

    it('should multiply notifications by number of channels', async () => {
      const qb = createMockQueryBuilder();
      notificationRepo.createQueryBuilder.mockReturnValue(qb);

      const dto: SendBulkNotificationDto = {
        userIds: ['user-1', 'user-2'],
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
        title: 'Announcement',
        body: 'Hello',
      };

      const result = await service.sendBulkNotification(dto);

      expect(result.totalSent).toBe(4); // 2 users * 2 channels
    });

    it('should send multicast push when PUSH is in channels', async () => {
      const qb = createMockQueryBuilder();
      notificationRepo.createQueryBuilder.mockReturnValue(qb);

      const dto: SendBulkNotificationDto = {
        userIds: ['user-1'],
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        channels: [NotificationChannel.PUSH],
        title: 'Push Alert',
        body: 'Alert body',
      };

      await service.sendBulkNotification(dto);

      expect(pushProvider.sendMultiple).toHaveBeenCalledWith(
        ['device_token_user-1'],
        'Push Alert',
        'Alert body',
        undefined,
      );
    });

    it('should fallback to all users when userIds is empty', async () => {
      const qb = createMockQueryBuilder();
      notificationRepo.createQueryBuilder.mockReturnValue(qb);

      const userRepo = {
        find: jest.fn().mockResolvedValue([{ id: 'u1' }, { id: 'u2' }]),
      };
      (notificationRepo as any).manager.getRepository.mockReturnValueOnce(userRepo);

      const dto: SendBulkNotificationDto = {
        userIds: [],
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        channels: [NotificationChannel.IN_APP],
        title: 'Broadcast',
        body: 'Broadcast message',
      };

      const result = await service.sendBulkNotification(dto);

      expect(result.totalUsers).toBe(2);
    });
  });

  // =========================================================================
  // markAsRead
  // =========================================================================

  describe('markAsRead', () => {
    it('should set isRead to true and readAt', async () => {
      const notification = createMockNotification();
      notificationRepo.findOne.mockResolvedValueOnce(notification);
      notificationRepo.save.mockImplementation((n) => Promise.resolve(n));

      const result = await service.markAsRead(mockNotificationId, mockUserId);

      expect(result.isRead).toBe(true);
      expect(result.readAt).toBeInstanceOf(Date);
    });

    it('should throw NotFoundException if notification does not exist', async () => {
      notificationRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.markAsRead('non-existent', mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own the notification', async () => {
      const notification = createMockNotification({ userId: 'other-user' });
      notificationRepo.findOne.mockResolvedValueOnce(notification);

      await expect(
        service.markAsRead(mockNotificationId, mockUserId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // =========================================================================
  // markAllAsRead
  // =========================================================================

  describe('markAllAsRead', () => {
    it('should update all unread notifications for the user', async () => {
      const qb = createMockQueryBuilder();
      qb['execute'].mockResolvedValueOnce({ affected: 5 });
      notificationRepo.createQueryBuilder.mockReturnValueOnce(qb);

      const result = await service.markAllAsRead(mockUserId);

      expect(result).toEqual({ updated: 5 });
      expect(qb['update']).toHaveBeenCalledWith(Notification);
      expect(qb['set']).toHaveBeenCalledWith(
        expect.objectContaining({ isRead: true }),
      );
      expect(qb['where']).toHaveBeenCalledWith('userId = :userId', {
        userId: mockUserId,
      });
      expect(qb['andWhere']).toHaveBeenCalledWith('isRead = :isRead', {
        isRead: false,
      });
    });

    it('should return 0 when no unread notifications exist', async () => {
      const qb = createMockQueryBuilder();
      qb['execute'].mockResolvedValueOnce({ affected: 0 });
      notificationRepo.createQueryBuilder.mockReturnValueOnce(qb);

      const result = await service.markAllAsRead(mockUserId);

      expect(result).toEqual({ updated: 0 });
    });
  });

  // =========================================================================
  // deleteNotification
  // =========================================================================

  describe('deleteNotification', () => {
    it('should soft-delete the notification', async () => {
      const notification = createMockNotification();
      notificationRepo.findOne.mockResolvedValueOnce(notification);

      await service.deleteNotification(mockNotificationId, mockUserId);

      expect(notificationRepo.softRemove).toHaveBeenCalledWith(notification);
    });

    it('should throw NotFoundException if notification does not exist', async () => {
      notificationRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.deleteNotification('non-existent', mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own the notification', async () => {
      const notification = createMockNotification({ userId: 'other-user' });
      notificationRepo.findOne.mockResolvedValueOnce(notification);

      await expect(
        service.deleteNotification(mockNotificationId, mockUserId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // =========================================================================
  // findUserNotifications
  // =========================================================================

  describe('findUserNotifications', () => {
    it('should return paginated results with defaults', async () => {
      const notifications = [createMockNotification()];
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([notifications, 1]);
      notificationRepo.createQueryBuilder.mockReturnValueOnce(qb);

      const result = await service.findUserNotifications(mockUserId, {});

      expect(result).toEqual({
        data: notifications,
        total: 1,
        page: 1,
        limit: 20,
      });
      expect(qb['where']).toHaveBeenCalledWith(
        'notification.userId = :userId',
        { userId: mockUserId },
      );
    });

    it('should apply type filter', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      notificationRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findUserNotifications(mockUserId, {
        type: NotificationType.PAYMENT_RECEIPT,
      });

      expect(qb['andWhere']).toHaveBeenCalledWith(
        'notification.type = :type',
        { type: NotificationType.PAYMENT_RECEIPT },
      );
    });

    it('should apply channel filter', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      notificationRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findUserNotifications(mockUserId, {
        channel: NotificationChannel.PUSH,
      });

      expect(qb['andWhere']).toHaveBeenCalledWith(
        'notification.channel = :channel',
        { channel: NotificationChannel.PUSH },
      );
    });

    it('should apply isRead filter', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      notificationRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findUserNotifications(mockUserId, { isRead: false });

      expect(qb['andWhere']).toHaveBeenCalledWith(
        'notification.isRead = :isRead',
        { isRead: false },
      );
    });

    it('should respect custom page and limit', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      notificationRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findUserNotifications(mockUserId, { page: 2, limit: 10 });

      expect(qb['skip']).toHaveBeenCalledWith(10); // (2-1)*10
      expect(qb['take']).toHaveBeenCalledWith(10);
    });
  });

  // =========================================================================
  // getUnreadCount
  // =========================================================================

  describe('getUnreadCount', () => {
    it('should return the correct unread count', async () => {
      notificationRepo.count.mockResolvedValueOnce(7);

      const result = await service.getUnreadCount(mockUserId);

      expect(result).toEqual({ count: 7 });
      expect(notificationRepo.count).toHaveBeenCalledWith({
        where: { userId: mockUserId, isRead: false },
      });
    });

    it('should return 0 when no unread notifications', async () => {
      notificationRepo.count.mockResolvedValueOnce(0);

      const result = await service.getUnreadCount(mockUserId);

      expect(result).toEqual({ count: 0 });
    });
  });

  // =========================================================================
  // getUserPreferences
  // =========================================================================

  describe('getUserPreferences', () => {
    it('should return default preferences for a new user', async () => {
      const result = await service.getUserPreferences(mockUserId);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(Object.values(NotificationType).length);

      // Each default preference should have IN_APP and PUSH channels, enabled = true
      for (const pref of result) {
        expect(pref.channels).toEqual([
          NotificationChannel.IN_APP,
          NotificationChannel.PUSH,
        ]);
        expect(pref.enabled).toBe(true);
      }
    });

    it('should return stored preferences when they exist', async () => {
      // First update to store
      const updateDto: UpdateNotificationPreferencesDto = {
        preferences: [
          {
            type: NotificationType.BOOKING_CONFIRMATION,
            channels: [NotificationChannel.EMAIL],
            enabled: false,
          },
        ],
      };
      await service.updateUserPreferences(mockUserId, updateDto);

      // Now fetch
      const result = await service.getUserPreferences(mockUserId);

      const bookingPref = result.find(
        (p) => p.type === NotificationType.BOOKING_CONFIRMATION,
      );
      expect(bookingPref).toBeDefined();
      expect(bookingPref!.channels).toEqual([NotificationChannel.EMAIL]);
      expect(bookingPref!.enabled).toBe(false);
    });
  });

  // =========================================================================
  // updateUserPreferences
  // =========================================================================

  describe('updateUserPreferences', () => {
    it('should merge new preferences with defaults', async () => {
      const dto: UpdateNotificationPreferencesDto = {
        preferences: [
          {
            type: NotificationType.PAYMENT_RECEIPT,
            channels: [NotificationChannel.EMAIL, NotificationChannel.SMS],
            enabled: true,
          },
        ],
      };

      const result = await service.updateUserPreferences(mockUserId, dto);

      const paymentPref = result.find(
        (p) => p.type === NotificationType.PAYMENT_RECEIPT,
      );
      expect(paymentPref).toBeDefined();
      expect(paymentPref!.channels).toEqual([
        NotificationChannel.EMAIL,
        NotificationChannel.SMS,
      ]);
    });

    it('should persist preferences between calls', async () => {
      const dto: UpdateNotificationPreferencesDto = {
        preferences: [
          {
            type: NotificationType.PASS_EXPIRING,
            channels: [NotificationChannel.PUSH],
            enabled: false,
          },
        ],
      };

      await service.updateUserPreferences(mockUserId, dto);
      const result = await service.getUserPreferences(mockUserId);

      const passPref = result.find(
        (p) => p.type === NotificationType.PASS_EXPIRING,
      );
      expect(passPref!.enabled).toBe(false);
      expect(passPref!.channels).toEqual([NotificationChannel.PUSH]);
    });

    it('should override existing preference for the same type', async () => {
      // First update
      await service.updateUserPreferences(mockUserId, {
        preferences: [
          {
            type: NotificationType.BOOKING_CONFIRMATION,
            channels: [NotificationChannel.EMAIL],
            enabled: true,
          },
        ],
      });

      // Second update for same type
      const result = await service.updateUserPreferences(mockUserId, {
        preferences: [
          {
            type: NotificationType.BOOKING_CONFIRMATION,
            channels: [NotificationChannel.PUSH],
            enabled: false,
          },
        ],
      });

      const pref = result.find(
        (p) => p.type === NotificationType.BOOKING_CONFIRMATION,
      );
      expect(pref!.channels).toEqual([NotificationChannel.PUSH]);
      expect(pref!.enabled).toBe(false);
    });
  });
});
