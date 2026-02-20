import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { User, UserRole, UserStatus } from '@/common/database/entities/user.entity';
import {
  UserAuthProvider,
  AuthProvider,
} from '@/common/database/entities/user-auth-provider.entity';
import { SocialProfile } from '@/modules/auth/dto/social-auth.dto';

// ── Helper: build a mock User ───────────────────────────────────────
function mockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-uuid-1',
    email: 'test@example.com',
    phone: '+995555000111',
    passwordHash: '$2b$12$hashedpassword',
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
    notificationPreferences: { push: true, email: true, sms: false, marketing: false },
    consentLog: [],
    authProviders: [],
    bookings: [],
    passes: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
    get fullName() {
      return `${this.firstName} ${this.lastName}`;
    },
    ...overrides,
  } as User;
}

// ── Helper: build a mock UserAuthProvider ────────────────────────────
function mockAuthProvider(overrides: Partial<UserAuthProvider> = {}): UserAuthProvider {
  return {
    id: 'provider-uuid-1',
    userId: 'user-uuid-1',
    user: mockUser(),
    provider: AuthProvider.GOOGLE,
    providerId: 'google_123456',
    providerData: null,
    accessToken: null,
    refreshToken: null,
    tokenExpiresAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  } as UserAuthProvider;
}

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: Record<string, jest.Mock>;
  let authProviderRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    userRepo = {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockImplementation((data) => ({ id: 'new-user-uuid', ...data })),
      save: jest.fn().mockImplementation((data) => Promise.resolve(data)),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    authProviderRepo = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((data) => ({ id: 'new-provider-uuid', ...data })),
      save: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(UserAuthProvider), useValue: authProviderRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────
  // findById
  // ─────────────────────────────────────────────────────────────────
  describe('findById', () => {
    it('should return user when found', async () => {
      const user = mockUser();
      userRepo.findOne.mockResolvedValue(user);

      const result = await service.findById('user-uuid-1');

      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'user-uuid-1' },
      });
      expect(result).toEqual(user);
    });

    it('should return null when user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      const result = await service.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // findByIdOrFail
  // ─────────────────────────────────────────────────────────────────
  describe('findByIdOrFail', () => {
    it('should return user when found', async () => {
      const user = mockUser();
      userRepo.findOne.mockResolvedValue(user);

      const result = await service.findByIdOrFail('user-uuid-1');

      expect(result).toEqual(user);
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.findByIdOrFail('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // findByEmail
  // ─────────────────────────────────────────────────────────────────
  describe('findByEmail', () => {
    it('should find user by lowercase email', async () => {
      const user = mockUser();
      userRepo.findOne.mockResolvedValue(user);

      const result = await service.findByEmail('Test@Example.COM');

      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toEqual(user);
    });

    it('should return null when email not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nobody@example.com');

      expect(result).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // findByPhone
  // ─────────────────────────────────────────────────────────────────
  describe('findByPhone', () => {
    it('should find user by phone number', async () => {
      const user = mockUser({ phone: '+995555000111' });
      userRepo.findOne.mockResolvedValue(user);

      const result = await service.findByPhone('+995555000111');

      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { phone: '+995555000111' },
      });
      expect(result).toEqual(user);
    });

    it('should return null when phone not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      const result = await service.findByPhone('+995555999999');

      expect(result).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // createUser
  // ─────────────────────────────────────────────────────────────────
  describe('createUser', () => {
    const createData = {
      email: 'new@example.com',
      passwordHash: '$2b$12$newhash',
      firstName: 'New',
      lastName: 'User',
      phone: '+995555000222',
      preferredLanguage: 'ka',
    };

    it('should create and save a new user', async () => {
      // findByEmail returns null (no existing user)
      userRepo.findOne.mockResolvedValue(null);

      const result = await service.createUser(createData);

      expect(userRepo.create).toHaveBeenCalledWith({
        email: 'new@example.com',
        passwordHash: createData.passwordHash,
        firstName: 'New',
        lastName: 'User',
        phone: '+995555000222',
        preferredLanguage: 'ka',
        emailVerified: false,
        status: UserStatus.PENDING_VERIFICATION,
      });
      expect(userRepo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      userRepo.findOne.mockResolvedValue(mockUser());

      await expect(service.createUser(createData)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should lowercase the email', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await service.createUser({ ...createData, email: 'NEW@EXAMPLE.COM' });

      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'new@example.com' }),
      );
    });

    it('should default preferredLanguage to "en" when not provided', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await service.createUser({
        email: 'test2@example.com',
        passwordHash: 'hash',
        firstName: 'A',
        lastName: 'B',
      });

      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ preferredLanguage: 'en' }),
      );
    });

    it('should default phone to null when not provided', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await service.createUser({
        email: 'test3@example.com',
        passwordHash: 'hash',
        firstName: 'A',
        lastName: 'B',
      });

      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ phone: null }),
      );
    });

    it('should default status to PENDING_VERIFICATION when not provided', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await service.createUser({
        email: 'test4@example.com',
        passwordHash: 'hash',
        firstName: 'A',
        lastName: 'B',
      });

      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: UserStatus.PENDING_VERIFICATION }),
      );
    });

    it('should use provided status when given', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await service.createUser({
        email: 'test5@example.com',
        passwordHash: 'hash',
        firstName: 'A',
        lastName: 'B',
        status: UserStatus.ACTIVE,
      });

      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: UserStatus.ACTIVE }),
      );
    });

    it('should use provided emailVerified when given', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await service.createUser({
        email: 'test6@example.com',
        passwordHash: 'hash',
        firstName: 'A',
        lastName: 'B',
        emailVerified: true,
      });

      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ emailVerified: true }),
      );
    });

    it('should handle null passwordHash for social login users', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await service.createUser({
        email: 'social@example.com',
        passwordHash: null,
        firstName: 'Social',
        lastName: 'User',
      });

      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ passwordHash: null }),
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // findOrCreateBySocialProfile
  // ─────────────────────────────────────────────────────────────────
  describe('findOrCreateBySocialProfile', () => {
    const googleProfile: SocialProfile = {
      provider: 'google',
      providerId: 'google_abc123',
      email: 'social@example.com',
      firstName: 'Social',
      lastName: 'User',
      profileImageUrl: 'https://example.com/avatar.jpg',
    };

    it('should return existing user if provider link already exists', async () => {
      const existingUser = mockUser({ id: 'existing-user-1' });
      const existingProvider = mockAuthProvider({
        user: existingUser,
        provider: AuthProvider.GOOGLE,
        providerId: 'google_abc123',
      });
      authProviderRepo.findOne.mockResolvedValue(existingProvider);

      const result = await service.findOrCreateBySocialProfile(googleProfile);

      expect(result).toEqual(existingUser);
      expect(authProviderRepo.findOne).toHaveBeenCalledWith({
        where: { provider: 'google', providerId: 'google_abc123' },
        relations: ['user'],
      });
      // Should NOT create a new user or provider
      expect(userRepo.create).not.toHaveBeenCalled();
      expect(authProviderRepo.create).not.toHaveBeenCalled();
    });

    it('should link to existing user with same email (account linking)', async () => {
      // No existing provider link
      authProviderRepo.findOne.mockResolvedValue(null);

      // But user exists with same email
      const existingUser = mockUser({ id: 'email-user-1', email: 'social@example.com' });
      userRepo.findOne.mockResolvedValue(existingUser);

      const result = await service.findOrCreateBySocialProfile(googleProfile);

      expect(result).toEqual(existingUser);
      // Should create provider link but NOT new user
      expect(authProviderRepo.create).toHaveBeenCalledWith({
        userId: 'email-user-1',
        provider: 'google',
        providerId: 'google_abc123',
      });
      expect(authProviderRepo.save).toHaveBeenCalled();
      expect(userRepo.create).not.toHaveBeenCalled();
    });

    it('should create new user and provider link when no match exists', async () => {
      // No existing provider link
      authProviderRepo.findOne.mockResolvedValue(null);
      // No existing user with email
      userRepo.findOne.mockResolvedValue(null);

      const savedUser = mockUser({
        id: 'brand-new-user',
        email: 'social@example.com',
        firstName: 'Social',
        lastName: 'User',
      });
      userRepo.save.mockResolvedValue(savedUser);

      const result = await service.findOrCreateBySocialProfile(googleProfile);

      expect(userRepo.create).toHaveBeenCalledWith({
        email: 'social@example.com',
        passwordHash: null,
        firstName: 'Social',
        lastName: 'User',
        profileImageUrl: 'https://example.com/avatar.jpg',
        emailVerified: true,
        status: UserStatus.ACTIVE,
      });
      expect(userRepo.save).toHaveBeenCalled();

      expect(authProviderRepo.create).toHaveBeenCalledWith({
        userId: 'brand-new-user',
        provider: 'google',
        providerId: 'google_abc123',
      });
      expect(authProviderRepo.save).toHaveBeenCalled();
    });

    it('should set new social users as emailVerified and ACTIVE', async () => {
      authProviderRepo.findOne.mockResolvedValue(null);
      userRepo.findOne.mockResolvedValue(null);
      userRepo.save.mockResolvedValue(mockUser({ id: 'new-social-user' }));

      await service.findOrCreateBySocialProfile(googleProfile);

      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          emailVerified: true,
          status: UserStatus.ACTIVE,
        }),
      );
    });

    it('should lowercase the email for new social users', async () => {
      authProviderRepo.findOne.mockResolvedValue(null);
      userRepo.findOne.mockResolvedValue(null);
      userRepo.save.mockResolvedValue(mockUser({ id: 'new-social-user' }));

      await service.findOrCreateBySocialProfile({
        ...googleProfile,
        email: 'UPPERCASE@EXAMPLE.COM',
      });

      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'uppercase@example.com' }),
      );
    });

    it('should handle missing profileImageUrl', async () => {
      authProviderRepo.findOne.mockResolvedValue(null);
      userRepo.findOne.mockResolvedValue(null);
      userRepo.save.mockResolvedValue(mockUser({ id: 'new-social-user' }));

      await service.findOrCreateBySocialProfile({
        ...googleProfile,
        profileImageUrl: undefined,
      });

      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ profileImageUrl: null }),
      );
    });

    it('should work with Facebook provider', async () => {
      authProviderRepo.findOne.mockResolvedValue(null);
      userRepo.findOne.mockResolvedValue(null);
      userRepo.save.mockResolvedValue(mockUser({ id: 'fb-user' }));

      const fbProfile: SocialProfile = {
        provider: 'facebook',
        providerId: 'fb_xyz789',
        email: 'fb@example.com',
        firstName: 'FB',
        lastName: 'User',
      };

      await service.findOrCreateBySocialProfile(fbProfile);

      expect(authProviderRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'facebook',
          providerId: 'fb_xyz789',
        }),
      );
    });

    it('should work with Apple provider', async () => {
      authProviderRepo.findOne.mockResolvedValue(null);
      userRepo.findOne.mockResolvedValue(null);
      userRepo.save.mockResolvedValue(mockUser({ id: 'apple-user' }));

      const appleProfile: SocialProfile = {
        provider: 'apple',
        providerId: 'apple_000111',
        email: 'apple@example.com',
        firstName: 'Apple',
        lastName: 'User',
      };

      await service.findOrCreateBySocialProfile(appleProfile);

      expect(authProviderRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'apple',
          providerId: 'apple_000111',
        }),
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // updatePassword
  // ─────────────────────────────────────────────────────────────────
  describe('updatePassword', () => {
    it('should update password hash', async () => {
      await service.updatePassword('user-uuid-1', 'new-password-hash');

      expect(userRepo.update).toHaveBeenCalledWith('user-uuid-1', {
        passwordHash: 'new-password-hash',
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // verifyEmail
  // ─────────────────────────────────────────────────────────────────
  describe('verifyEmail', () => {
    it('should set emailVerified to true and status to ACTIVE', async () => {
      await service.verifyEmail('user-uuid-1');

      expect(userRepo.update).toHaveBeenCalledWith('user-uuid-1', {
        emailVerified: true,
        status: UserStatus.ACTIVE,
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // verifyPhone
  // ─────────────────────────────────────────────────────────────────
  describe('verifyPhone', () => {
    it('should update phone and set phoneVerified to true', async () => {
      await service.verifyPhone('user-uuid-1', '+995555000333');

      expect(userRepo.update).toHaveBeenCalledWith('user-uuid-1', {
        phone: '+995555000333',
        phoneVerified: true,
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // update2faSecret
  // ─────────────────────────────────────────────────────────────────
  describe('update2faSecret', () => {
    it('should enable 2FA when secret is provided', async () => {
      await service.update2faSecret('user-uuid-1', 'NEWSECRET');

      expect(userRepo.update).toHaveBeenCalledWith('user-uuid-1', {
        twoFactorSecret: 'NEWSECRET',
        twoFactorEnabled: true,
      });
    });

    it('should disable 2FA when secret is null', async () => {
      await service.update2faSecret('user-uuid-1', null);

      expect(userRepo.update).toHaveBeenCalledWith('user-uuid-1', {
        twoFactorSecret: null,
        twoFactorEnabled: false,
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // updateLastLogin
  // ─────────────────────────────────────────────────────────────────
  describe('updateLastLogin', () => {
    it('should update lastLoginAt to current date', async () => {
      const beforeCall = new Date();
      await service.updateLastLogin('user-uuid-1');

      expect(userRepo.update).toHaveBeenCalledWith('user-uuid-1', {
        lastLoginAt: expect.any(Date),
      });

      const callArg = userRepo.update.mock.calls[0][1].lastLoginAt;
      expect(callArg.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Email uniqueness enforcement
  // ─────────────────────────────────────────────────────────────────
  describe('email uniqueness enforcement', () => {
    it('should prevent duplicate emails with different casing', async () => {
      // First call to findByEmail inside createUser
      userRepo.findOne.mockResolvedValue(mockUser({ email: 'test@example.com' }));

      await expect(
        service.createUser({
          email: 'TEST@EXAMPLE.COM',
          passwordHash: 'hash',
          firstName: 'A',
          lastName: 'B',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Social profile account linking edge cases
  // ─────────────────────────────────────────────────────────────────
  describe('social profile account linking edge cases', () => {
    it('should link second social provider to existing user', async () => {
      // No existing Google provider
      authProviderRepo.findOne.mockResolvedValue(null);
      // But user exists (e.g., created via email or Apple)
      const existingUser = mockUser({
        id: 'multi-provider-user',
        email: 'multi@example.com',
      });
      userRepo.findOne.mockResolvedValue(existingUser);

      const result = await service.findOrCreateBySocialProfile({
        provider: 'google',
        providerId: 'google_new123',
        email: 'multi@example.com',
        firstName: 'Multi',
        lastName: 'User',
      });

      expect(result.id).toBe('multi-provider-user');
      // Should create provider link but not create user
      expect(authProviderRepo.create).toHaveBeenCalledWith({
        userId: 'multi-provider-user',
        provider: 'google',
        providerId: 'google_new123',
      });
      expect(userRepo.create).not.toHaveBeenCalled();
    });
  });
});
