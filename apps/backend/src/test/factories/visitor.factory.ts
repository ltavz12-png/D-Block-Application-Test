import { randomUUID } from 'crypto';
import {
  Visitor,
  VisitorStatus,
} from '@/common/database/entities/visitor.entity';

/**
 * Creates a mock Visitor entity with EXPECTED status.
 * Expected date defaults to tomorrow.
 */
export function createMockVisitor(
  overrides: Partial<Visitor> = {},
): Visitor {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return {
    id: randomUUID(),
    hostUserId: randomUUID(),
    hostUser: undefined as any,
    locationId: randomUUID(),
    location: undefined as any,
    visitorName: 'John Visitor',
    visitorEmail: 'visitor@example.com',
    visitorPhone: '+995 555 123456',
    visitorCompany: 'Visitor Corp',
    purpose: 'Business meeting',
    expectedDate: tomorrow,
    expectedTime: '10:00',
    status: VisitorStatus.EXPECTED,
    checkedInAt: null,
    checkedOutAt: null,
    tempAccessKeyId: null,
    notificationSent: false,
    metadata: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  } as Visitor;
}

/**
 * Creates a mock Visitor with CHECKED_IN status.
 */
export function createMockCheckedInVisitor(
  overrides: Partial<Visitor> = {},
): Visitor {
  return createMockVisitor({
    status: VisitorStatus.CHECKED_IN,
    checkedInAt: new Date(),
    notificationSent: true,
    ...overrides,
  });
}

/**
 * Creates a mock Visitor with CANCELLED status.
 */
export function createMockCancelledVisitor(
  overrides: Partial<Visitor> = {},
): Visitor {
  return createMockVisitor({
    status: VisitorStatus.CANCELLED,
    ...overrides,
  });
}
