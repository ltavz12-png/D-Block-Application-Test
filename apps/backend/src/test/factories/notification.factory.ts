import { randomUUID } from 'crypto';
import {
  Notification,
  NotificationType,
  NotificationChannel,
} from '@/common/database/entities/notification.entity';

/**
 * Creates a mock Notification entity with sensible defaults.
 */
export function createMockNotification(
  overrides: Partial<Notification> = {},
): Notification {
  const now = new Date();

  return {
    id: randomUUID(),
    userId: randomUUID(),
    user: undefined as any,
    type: NotificationType.BOOKING_CONFIRMATION,
    channel: NotificationChannel.IN_APP,
    title: 'Booking Confirmed',
    body: 'Your booking for Conference Room A has been confirmed.',
    data: null,
    isRead: false,
    readAt: null,
    sentAt: now,
    deliveryStatus: 'sent',
    language: 'en',
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  } as Notification;
}

/**
 * Creates a mock Notification that has been read.
 */
export function createMockReadNotification(
  overrides: Partial<Notification> = {},
): Notification {
  const readAt = new Date();

  return createMockNotification({
    isRead: true,
    readAt,
    ...overrides,
  });
}

/**
 * Creates a mock email Notification.
 */
export function createMockEmailNotification(
  overrides: Partial<Notification> = {},
): Notification {
  return createMockNotification({
    channel: NotificationChannel.EMAIL,
    deliveryStatus: 'sent',
    ...overrides,
  });
}

/**
 * Creates a mock push Notification.
 */
export function createMockPushNotification(
  overrides: Partial<Notification> = {},
): Notification {
  return createMockNotification({
    channel: NotificationChannel.PUSH,
    deliveryStatus: 'delivered',
    ...overrides,
  });
}
