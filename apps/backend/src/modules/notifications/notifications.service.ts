import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import {
  Notification,
  NotificationType,
  NotificationChannel,
} from '@/common/database/entities/notification.entity';
import { User } from '@/common/database/entities/user.entity';
import { SendNotificationDto } from './dto/send-notification.dto';
import { SendBulkNotificationDto } from './dto/send-bulk-notification.dto';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import {
  IPushNotificationProvider,
  PUSH_NOTIFICATION_PROVIDER,
} from './providers/push-notification.provider';

export interface UserPreference {
  type: NotificationType;
  channels: NotificationChannel[];
  enabled: boolean;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  /**
   * In-memory user notification preferences store.
   * Key: userId, Value: array of preference items.
   * This is a temporary solution until a NotificationPreference entity is created.
   */
  private readonly userPreferences = new Map<string, UserPreference[]>();

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @Inject(PUSH_NOTIFICATION_PROVIDER)
    private readonly pushProvider: IPushNotificationProvider,
  ) {}

  // ─── Send a notification to a single user ────────────────────────────

  async sendNotification(
    dto: SendNotificationDto,
  ): Promise<Notification[]> {
    const notifications: Notification[] = [];

    for (const channel of dto.channels) {
      const notification = this.notificationRepo.create({
        userId: dto.userId,
        type: dto.type,
        channel,
        title: dto.title,
        body: dto.body,
        data: dto.data || null,
        language: dto.language || 'en',
        isRead: false,
        deliveryStatus: 'pending',
      });

      const saved = await this.notificationRepo.save(notification);

      // If channel is PUSH, attempt to send via push provider
      if (channel === NotificationChannel.PUSH) {
        try {
          // In production, we would look up the user's device token.
          // For now, use a placeholder token derived from userId.
          const deviceToken = `device_token_${dto.userId}`;
          const result = await this.pushProvider.sendPush(
            deviceToken,
            dto.title,
            dto.body,
            dto.data,
          );

          if (result.success) {
            saved.deliveryStatus = 'sent';
            saved.sentAt = new Date();
            this.logger.log(
              `Push notification sent for user=${dto.userId} | messageId=${result.messageId}`,
            );
          } else {
            saved.deliveryStatus = 'failed';
            this.logger.error(
              `Push notification failed for user=${dto.userId}: ${result.error}`,
            );
          }
        } catch (error) {
          saved.deliveryStatus = 'failed';
          this.logger.error(
            `Push notification error for user=${dto.userId}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }

        await this.notificationRepo.save(saved);
      } else {
        // For IN_APP, EMAIL, SMS — mark as sent immediately
        // EMAIL and SMS would be dispatched via their own services in the future
        saved.deliveryStatus = 'sent';
        saved.sentAt = new Date();
        await this.notificationRepo.save(saved);
      }

      notifications.push(saved);
    }

    this.logger.log(
      `Notification sent to user=${dto.userId} | type=${dto.type} | channels=${dto.channels.join(',')} | count=${notifications.length}`,
    );

    return notifications;
  }

  // ─── Broadcast / bulk send ────────────────────────────────────────────

  async sendBulkNotification(
    dto: SendBulkNotificationDto,
  ): Promise<{ totalSent: number; totalUsers: number }> {
    let userIds = dto.userIds;

    // If no userIds provided, broadcast to all users
    if (!userIds || userIds.length === 0) {
      const userRepo = this.notificationRepo.manager.getRepository(User);
      const allUsers = await userRepo.find({
        select: ['id'],
        where: { deletedAt: IsNull() },
      });
      userIds = allUsers.map((u) => u.id);
    }

    const totalUsers = userIds.length;
    let totalSent = 0;
    const batchSize = 100;

    this.logger.log(
      `Starting bulk notification | type=${dto.type} | channels=${dto.channels.join(',')} | users=${totalUsers}`,
    );

    // Process in batches of 100
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      const batchNotifications: Partial<Notification>[] = [];

      for (const userId of batch) {
        for (const channel of dto.channels) {
          batchNotifications.push({
            userId,
            type: dto.type,
            channel,
            title: dto.title,
            body: dto.body,
            data: dto.data || null,
            language: dto.language || 'en',
            isRead: false,
            deliveryStatus: 'sent',
            sentAt: new Date(),
          });
        }
      }

      // Bulk insert the batch
      await this.notificationRepo
        .createQueryBuilder()
        .insert()
        .into(Notification)
        .values(batchNotifications)
        .execute();

      totalSent += batchNotifications.length;

      // If PUSH is one of the channels, send multicast push
      if (dto.channels.includes(NotificationChannel.PUSH)) {
        const tokens = batch.map((uid) => `device_token_${uid}`);
        try {
          const result = await this.pushProvider.sendMultiple(
            tokens,
            dto.title,
            dto.body,
            dto.data,
          );
          this.logger.log(
            `Bulk push batch sent | success=${result.successCount} | failure=${result.failureCount}`,
          );
        } catch (error) {
          this.logger.error(
            `Bulk push batch failed: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      this.logger.debug(
        `Bulk notification batch ${Math.floor(i / batchSize) + 1} processed | ${batchNotifications.length} records`,
      );
    }

    this.logger.log(
      `Bulk notification complete | type=${dto.type} | totalUsers=${totalUsers} | totalSent=${totalSent}`,
    );

    return { totalSent, totalUsers };
  }

  // ─── Mark a single notification as read ───────────────────────────────

  async markAsRead(
    notificationId: string,
    userId: string,
  ): Promise<Notification> {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException(
        `Notification with ID ${notificationId} not found`,
      );
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException(
        'You can only mark your own notifications as read',
      );
    }

    notification.isRead = true;
    notification.readAt = new Date();

    return this.notificationRepo.save(notification);
  }

  // ─── Mark all user notifications as read ──────────────────────────────

  async markAllAsRead(userId: string): Promise<{ updated: number }> {
    const result = await this.notificationRepo
      .createQueryBuilder()
      .update(Notification)
      .set({ isRead: true, readAt: new Date() })
      .where('userId = :userId', { userId })
      .andWhere('isRead = :isRead', { isRead: false })
      .execute();

    const updated = result.affected || 0;

    this.logger.log(
      `Marked ${updated} notifications as read for user=${userId}`,
    );

    return { updated };
  }

  // ─── Soft delete a notification ───────────────────────────────────────

  async deleteNotification(
    notificationId: string,
    userId: string,
  ): Promise<void> {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException(
        `Notification with ID ${notificationId} not found`,
      );
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException(
        'You can only delete your own notifications',
      );
    }

    await this.notificationRepo.softRemove(notification);

    this.logger.log(
      `Notification ${notificationId} soft-deleted by user=${userId}`,
    );
  }

  // ─── Paginated list with filters ──────────────────────────────────────

  async findUserNotifications(
    userId: string,
    query: QueryNotificationsDto,
  ): Promise<{
    data: Notification[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const qb = this.notificationRepo
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId });

    if (query.type) {
      qb.andWhere('notification.type = :type', { type: query.type });
    }

    if (query.channel) {
      qb.andWhere('notification.channel = :channel', {
        channel: query.channel,
      });
    }

    if (query.isRead !== undefined) {
      qb.andWhere('notification.isRead = :isRead', { isRead: query.isRead });
    }

    qb.orderBy('notification.createdAt', 'DESC').skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

  // ─── Admin: list all notifications with filters ───────────────────────

  async findAllNotifications(
    query: QueryNotificationsDto,
  ): Promise<{
    data: Notification[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const qb = this.notificationRepo.createQueryBuilder('notification');

    if (query.userId) {
      qb.andWhere('notification.userId = :userId', { userId: query.userId });
    }

    if (query.type) {
      qb.andWhere('notification.type = :type', { type: query.type });
    }

    if (query.channel) {
      qb.andWhere('notification.channel = :channel', {
        channel: query.channel,
      });
    }

    if (query.isRead !== undefined) {
      qb.andWhere('notification.isRead = :isRead', { isRead: query.isRead });
    }

    qb.orderBy('notification.createdAt', 'DESC').skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

  // ─── Get unread count ─────────────────────────────────────────────────

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.notificationRepo.count({
      where: { userId, isRead: false },
    });

    return { count };
  }

  // ─── User preferences (in-memory mock) ────────────────────────────────

  async getUserPreferences(userId: string): Promise<UserPreference[]> {
    const existing = this.userPreferences.get(userId);

    if (existing) {
      return existing;
    }

    // Return default preferences for all notification types
    const defaults: UserPreference[] = Object.values(NotificationType).map(
      (type) => ({
        type,
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
        enabled: true,
      }),
    );

    return defaults;
  }

  async updateUserPreferences(
    userId: string,
    dto: UpdateNotificationPreferencesDto,
  ): Promise<UserPreference[]> {
    const existing = await this.getUserPreferences(userId);

    // Merge incoming preferences with existing ones
    const preferencesMap = new Map<NotificationType, UserPreference>();

    for (const pref of existing) {
      preferencesMap.set(pref.type, pref);
    }

    for (const pref of dto.preferences) {
      preferencesMap.set(pref.type, {
        type: pref.type,
        channels: pref.channels,
        enabled: pref.enabled,
      });
    }

    const updated = Array.from(preferencesMap.values());
    this.userPreferences.set(userId, updated);

    this.logger.log(
      `Updated notification preferences for user=${userId} | ${dto.preferences.length} preferences updated`,
    );

    return updated;
  }

  // ─── Convenience methods ──────────────────────────────────────────────

  async sendBookingConfirmation(
    userId: string,
    bookingData: any,
  ): Promise<Notification[]> {
    return this.sendNotification({
      userId,
      type: NotificationType.BOOKING_CONFIRMATION,
      channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
      title: 'Booking Confirmed',
      body: `Your booking for ${bookingData.roomName || 'a workspace'} on ${bookingData.date || 'the scheduled date'} has been confirmed.`,
      data: bookingData,
      language: bookingData.language || 'en',
    });
  }

  async sendPaymentReceipt(
    userId: string,
    paymentData: any,
  ): Promise<Notification[]> {
    return this.sendNotification({
      userId,
      type: NotificationType.PAYMENT_RECEIPT,
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      title: 'Payment Receipt',
      body: `Payment of ${paymentData.amount || '0'} ${paymentData.currency || 'GEL'} has been processed successfully.`,
      data: paymentData,
      language: paymentData.language || 'en',
    });
  }

  async sendPassExpiringNotification(
    userId: string,
    passData: any,
  ): Promise<Notification[]> {
    return this.sendNotification({
      userId,
      type: NotificationType.PASS_EXPIRING,
      channels: [
        NotificationChannel.IN_APP,
        NotificationChannel.PUSH,
        NotificationChannel.EMAIL,
      ],
      title: 'Pass Expiring Soon',
      body: `Your ${passData.passType || 'workspace'} pass expires on ${passData.expiryDate || 'soon'}. Renew now to continue accessing D Block Workspace.`,
      data: passData,
      language: passData.language || 'en',
    });
  }

  // ─── Bulk job: expiring pass notifications ────────────────────────────

  async checkAndSendExpiringPassNotifications(): Promise<{
    notified: number;
  }> {
    this.logger.log('Running expiring pass notification check...');

    // Calculate 7 days from now
    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(now.getDate() + 7);

    const dateStr = sevenDaysFromNow.toISOString().split('T')[0];

    // Find users with passes expiring in exactly 7 days.
    // In production, this would query a Pass/Membership entity.
    // For now, we log and return 0 since the Pass entity may not exist yet.
    try {
      const passRepo = this.notificationRepo.manager.getRepository('passes');
      const expiringPasses = await passRepo
        .createQueryBuilder('pass')
        .where('DATE(pass.expiryDate) = :dateStr', { dateStr })
        .andWhere('pass.status = :status', { status: 'active' })
        .getMany();

      let notified = 0;

      for (const pass of expiringPasses) {
        // Check if we already sent a pass_expiring notification for this pass
        const existingNotification = await this.notificationRepo.findOne({
          where: {
            userId: (pass as any).userId,
            type: NotificationType.PASS_EXPIRING,
          },
        });

        if (!existingNotification) {
          await this.sendPassExpiringNotification(
            (pass as any).userId,
            {
              passId: (pass as any).id,
              passType: (pass as any).type,
              expiryDate: dateStr,
            },
          );
          notified++;
        }
      }

      this.logger.log(
        `Expiring pass notification check complete | notified=${notified}`,
      );

      return { notified };
    } catch (error) {
      // The passes table may not exist yet
      this.logger.warn(
        `Could not check expiring passes (table may not exist): ${error instanceof Error ? error.message : String(error)}`,
      );
      return { notified: 0 };
    }
  }
}
