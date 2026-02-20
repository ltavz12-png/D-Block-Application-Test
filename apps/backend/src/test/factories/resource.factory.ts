import { randomUUID } from 'crypto';
import {
  Resource,
  ResourceType,
  PricingModel,
  MeasurementUnit,
} from '@/common/database/entities/resource.entity';

/**
 * Creates a mock Resource entity with sensible defaults.
 */
export function createMockResource(
  overrides: Partial<Resource> = {},
): Resource {
  const now = new Date();

  return {
    id: randomUUID(),
    name: 'Test Resource',
    locationId: randomUUID(),
    location: undefined as any,
    resourceType: ResourceType.MEETING_ROOM,
    block: null,
    floor: '1',
    size: 25,
    measurementUnit: MeasurementUnit.SQM,
    capacity: 8,
    pricingModel: PricingModel.HOURLY,
    pricingDetails: {
      basePrice: 30,
      currency: 'GEL',
      perHour: 30,
    },
    availabilityRules: [
      { dayOfWeek: 1, openTime: '09:00', closeTime: '21:00' },
      { dayOfWeek: 2, openTime: '09:00', closeTime: '21:00' },
      { dayOfWeek: 3, openTime: '09:00', closeTime: '21:00' },
      { dayOfWeek: 4, openTime: '09:00', closeTime: '21:00' },
      { dayOfWeek: 5, openTime: '09:00', closeTime: '21:00' },
    ],
    bookingRules: {
      minDurationMinutes: 30,
      maxDurationMinutes: 480,
      advanceBookingDays: 30,
      bufferMinutes: 15,
    },
    amenities: ['wifi', 'whiteboard', 'projector'],
    imageUrls: [],
    metadata: null,
    isActive: true,
    isBookable: true,
    saltoLockId: null,
    bookings: [],
    createdBy: null,
    updatedBy: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  } as Resource;
}

/**
 * Creates a mock Resource of type MEETING_ROOM.
 */
export function createMockMeetingRoom(
  overrides: Partial<Resource> = {},
): Resource {
  return createMockResource({
    name: 'Conference Room A',
    resourceType: ResourceType.MEETING_ROOM,
    capacity: 12,
    size: 35,
    amenities: ['wifi', 'whiteboard', 'projector', 'video_conferencing', 'tv_screen'],
    pricingModel: PricingModel.HOURLY,
    pricingDetails: {
      basePrice: 50,
      currency: 'GEL',
      perHour: 50,
    },
    ...overrides,
  });
}

/**
 * Creates a mock Resource of type HOT_DESK.
 */
export function createMockHotDesk(
  overrides: Partial<Resource> = {},
): Resource {
  return createMockResource({
    name: 'Hot Desk 1',
    resourceType: ResourceType.HOT_DESK,
    capacity: 1,
    size: 4,
    measurementUnit: MeasurementUnit.SQM,
    amenities: ['wifi', 'power_outlet', 'monitor'],
    pricingModel: PricingModel.DAILY,
    pricingDetails: {
      basePrice: 25,
      currency: 'GEL',
      perDay: 25,
    },
    ...overrides,
  });
}

/**
 * Creates a mock Resource of type OFFICE (private office).
 */
export function createMockPrivateOffice(
  overrides: Partial<Resource> = {},
): Resource {
  return createMockResource({
    name: 'Private Office 101',
    resourceType: ResourceType.OFFICE,
    capacity: 4,
    size: 20,
    amenities: ['wifi', 'power_outlet', 'lock', 'air_conditioning'],
    pricingModel: PricingModel.MONTHLY,
    pricingDetails: {
      basePrice: 2500,
      currency: 'GEL',
      perMonth: 2500,
    },
    bookingRules: {
      minDurationMinutes: 43200, // 30 days in minutes
      advanceBookingDays: 60,
    },
    ...overrides,
  });
}
