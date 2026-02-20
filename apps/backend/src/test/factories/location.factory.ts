import { randomUUID } from 'crypto';
import { Location } from '@/common/database/entities/location.entity';

const DEFAULT_OPERATING_HOURS = {
  monday: { open: '09:00', close: '21:00' },
  tuesday: { open: '09:00', close: '21:00' },
  wednesday: { open: '09:00', close: '21:00' },
  thursday: { open: '09:00', close: '21:00' },
  friday: { open: '09:00', close: '21:00' },
  saturday: { open: '10:00', close: '18:00' },
  sunday: { open: '10:00', close: '18:00' },
};

/**
 * Creates a mock Location entity with D Block Stamba defaults.
 */
export function createMockLocation(
  overrides: Partial<Location> = {},
): Location {
  const now = new Date();

  return {
    id: randomUUID(),
    name: 'D Block Stamba',
    city: 'Tbilisi',
    address: '14 Merab Kostava St, Tbilisi 0108',
    timezone: 'Asia/Tbilisi',
    currency: 'GEL',
    latitude: 41.7069,
    longitude: 44.7922,
    phone: '+995 32 202 0101',
    email: 'stamba@dblock.ge',
    operatingHours: DEFAULT_OPERATING_HOURS,
    metadata: null,
    isActive: true,
    imageUrl: null,
    resources: [],
    createdBy: null,
    updatedBy: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  } as Location;
}

/**
 * Creates a mock Location for D Block Stamba (alias with explicit name).
 */
export function createMockStambaLocation(
  overrides: Partial<Location> = {},
): Location {
  return createMockLocation({
    name: 'D Block Stamba',
    city: 'Tbilisi',
    address: '14 Merab Kostava St, Tbilisi 0108',
    latitude: 41.7069,
    longitude: 44.7922,
    email: 'stamba@dblock.ge',
    ...overrides,
  });
}

/**
 * Creates a mock Location for D Block Radio City.
 */
export function createMockRadioCityLocation(
  overrides: Partial<Location> = {},
): Location {
  return createMockLocation({
    name: 'D Block Radio City',
    city: 'Tbilisi',
    address: '2 Sanapiro St, Tbilisi 0105',
    latitude: 41.6972,
    longitude: 44.8065,
    email: 'radiocity@dblock.ge',
    ...overrides,
  });
}

/**
 * Creates a mock Location for D Block Batumi.
 */
export function createMockBatumiLocation(
  overrides: Partial<Location> = {},
): Location {
  return createMockLocation({
    name: 'D Block Batumi',
    city: 'Batumi',
    address: '1 Ninoshvili St, Batumi 6010',
    latitude: 41.6458,
    longitude: 41.6417,
    email: 'batumi@dblock.ge',
    ...overrides,
  });
}
