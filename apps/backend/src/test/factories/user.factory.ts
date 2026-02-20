import { randomUUID } from 'crypto';
import { User, UserRole, UserStatus } from '@/common/database/entities/user.entity';

/**
 * Creates a mock User entity with sensible defaults.
 * All fields match the actual User entity schema.
 */
export function createMockUser(overrides: Partial<User> = {}): User {
  const now = new Date();

  return {
    id: randomUUID(),
    email: 'test@example.com',
    phone: null,
    passwordHash: '$2b$10$mockhashedpasswordvalue',
    firstName: 'Test',
    lastName: 'User',
    profileImageUrl: null,
    preferredLanguage: 'en',
    role: UserRole.MEMBER,
    status: UserStatus.ACTIVE,
    emailVerified: true,
    phoneVerified: false,
    twoFactorEnabled: false,
    twoFactorSecret: null,
    companyId: null,
    company: null,
    locationId: null,
    lastLoginAt: null,
    notificationPreferences: {
      push: true,
      email: true,
      sms: false,
      marketing: false,
    },
    consentLog: [],
    authProviders: [],
    bookings: [],
    passes: [],
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    get fullName() {
      return `${this.firstName} ${this.lastName}`;
    },
    ...overrides,
  } as User;
}

/**
 * Creates a mock User with SUPER_ADMIN role.
 */
export function createMockAdmin(overrides: Partial<User> = {}): User {
  return createMockUser({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@dblock.ge',
    role: UserRole.SUPER_ADMIN,
    emailVerified: true,
    ...overrides,
  });
}

/**
 * Creates a mock User with LOCATION_MANAGER role.
 */
export function createMockLocationManager(overrides: Partial<User> = {}): User {
  return createMockUser({
    firstName: 'Location',
    lastName: 'Manager',
    email: 'manager@dblock.ge',
    role: UserRole.LOCATION_MANAGER,
    locationId: randomUUID(),
    emailVerified: true,
    ...overrides,
  });
}

/**
 * Creates a mock User with RECEPTION_STAFF role.
 */
export function createMockReceptionStaff(overrides: Partial<User> = {}): User {
  return createMockUser({
    firstName: 'Reception',
    lastName: 'Staff',
    email: 'reception@dblock.ge',
    role: UserRole.RECEPTION_STAFF,
    locationId: randomUUID(),
    emailVerified: true,
    ...overrides,
  });
}
