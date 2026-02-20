import { randomUUID } from 'crypto';
import {
  Booking,
  BookingStatus,
  BookingPaymentStatus,
} from '@/common/database/entities/booking.entity';

/**
 * Creates a mock Booking entity with CONFIRMED status.
 * Start time defaults to 1 hour from now, end time to 2 hours from now.
 */
export function createMockBooking(overrides: Partial<Booking> = {}): Booking {
  const now = new Date();
  const startTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
  const endTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now

  return {
    id: randomUUID(),
    userId: randomUUID(),
    user: undefined as any,
    resourceId: randomUUID(),
    resource: undefined as any,
    startTime,
    endTime,
    status: BookingStatus.CONFIRMED,
    paymentStatus: BookingPaymentStatus.PAID,
    paymentId: null,
    passId: null,
    creditTransactionId: null,
    totalAmount: 50,
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
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  } as Booking;
}

/**
 * Creates a mock Booking with HELD status and PENDING payment.
 */
export function createMockPendingBooking(
  overrides: Partial<Booking> = {},
): Booking {
  return createMockBooking({
    status: BookingStatus.HELD,
    paymentStatus: BookingPaymentStatus.PENDING,
    ...overrides,
  });
}

/**
 * Creates a mock Booking with CANCELLED status.
 */
export function createMockCancelledBooking(
  overrides: Partial<Booking> = {},
): Booking {
  const cancelledAt = new Date();

  return createMockBooking({
    status: BookingStatus.CANCELLED,
    paymentStatus: BookingPaymentStatus.REFUNDED,
    cancelledAt,
    cancelledBy: randomUUID(),
    cancellationReason: 'Test cancellation',
    ...overrides,
  });
}
