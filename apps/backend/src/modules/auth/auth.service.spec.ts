import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { authenticator } from 'otplib';

import { AuthService } from './auth.service';
import { UsersService } from '@/modules/users/users.service';
import { UserSession } from '@/common/database/entities/user-session.entity';
import {
  UserAuthProvider,
  AuthProvider,
} from '@/common/database/entities/user-auth-provider.entity';
import { User, UserRole, UserStatus } from '@/common/database/entities/user.entity';

// ── Mock bcrypt at module level ─────────────────────────────────────
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('otplib', () => ({
  authenticator: {
    verify: jest.fn(),
    generateSecret: jest.fn(),
    keyuri: jest.fn(),
  },
}));

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

// ── Helper: build a mock session ────────────────────────────────────
function mockSession(overrides: Partial<UserSession> = {}): UserSession {
  return {
    id: 'session-uuid-1',
    userId: 'user-uuid-1',
    refreshTokenHash: 'hashed-refresh-token',
    deviceInfo: null,
    ipAddress: null,
    biometricEnabled: false,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    lastUsedAt: null,
    isRevoked: false,
    createdAt: new Date(),
    user: undefined as any,
    ...overrides,
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<Partial<UsersService>>;
  let jwtService: jest.Mocked<Partial<JwtService>>;
  let configService: jest.Mocked<Partial<ConfigService>>;
  let sessionRepo: Record<string, jest.Mock>;
  let authProviderRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    usersService = {
      createUser: jest.fn(),
      findByEmail: jest.fn(),
      findByIdOrFail: jest.fn(),
      findByPhone: jest.fn(),
      findOrCreateBySocialProfile: jest.fn(),
      updateLastLogin: jest.fn(),
      updatePassword: jest.fn(),
      verifyEmail: jest.fn(),
      update2faSecret: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-access-token'),
    };

    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        const map: Record<string, any> = {
          'app.nodeEnv': 'test',
          'jwt.refreshExpiration': '7d',
          'jwt.expiration': '15m',
        };
        return map[key];
      }),
    };

    sessionRepo = {
      create: jest.fn().mockImplementation((data) => data),
      save: jest.fn().mockImplementation((data) => Promise.resolve({ id: 'session-uuid-1', ...data })),
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    authProviderRepo = {
      create: jest.fn().mockImplementation((data) => data),
      save: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: getRepositoryToken(UserSession), useValue: sessionRepo },
        { provide: getRepositoryToken(UserAuthProvider), useValue: authProviderRepo },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────
  // Registration
  // ─────────────────────────────────────────────────────────────────
  describe('register', () => {
    const registerDto = {
      email: 'new@example.com',
      password: 'StrongP@ss1',
      firstName: 'New',
      lastName: 'User',
      phone: '+995555000222',
      preferredLanguage: 'ka',
    };

    it('should hash the password and create a user', async () => {
      const hashedPw = '$2b$12$newhash';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPw);

      const createdUser = mockUser({ id: 'new-user-id', email: registerDto.email });
      (usersService.createUser as jest.Mock).mockResolvedValue(createdUser);

      const result = await service.register(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 12);
      expect(usersService.createUser).toHaveBeenCalledWith({
        email: registerDto.email,
        passwordHash: hashedPw,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        phone: registerDto.phone,
        preferredLanguage: registerDto.preferredLanguage,
      });
      expect(result.user.id).toBe('new-user-id');
      expect(result.tokens).toBeDefined();
    });

    it('should create an EMAIL auth provider link', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hash');
      const createdUser = mockUser({ id: 'u1', email: registerDto.email });
      (usersService.createUser as jest.Mock).mockResolvedValue(createdUser);

      await service.register(registerDto);

      expect(authProviderRepo.save).toHaveBeenCalled();
      expect(authProviderRepo.create).toHaveBeenCalledWith({
        userId: 'u1',
        provider: AuthProvider.EMAIL,
        providerId: registerDto.email,
      });
    });

    it('should return tokens and user in non-production mode', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hash');
      (usersService.createUser as jest.Mock).mockResolvedValue(
        mockUser({ id: 'u1', email: registerDto.email }),
      );

      const result = await service.register(registerDto);

      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.user).toBeDefined();
    });

    it('should auto-verify email in non-production mode', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hash');
      (usersService.createUser as jest.Mock).mockResolvedValue(
        mockUser({ id: 'u1', email: registerDto.email }),
      );

      await service.register(registerDto);

      expect(usersService.verifyEmail).toHaveBeenCalledWith('u1');
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Login
  // ─────────────────────────────────────────────────────────────────
  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: 'password123' };

    it('should return tokens and sanitized user on valid credentials', async () => {
      const user = mockUser();
      (usersService.findByEmail as jest.Mock).mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, user.passwordHash);
      expect(usersService.updateLastLogin).toHaveBeenCalledWith(user.id);
      expect((result as any).tokens.accessToken).toBeDefined();
      expect((result as any).tokens.refreshToken).toBeDefined();
      expect((result as any).user).toBeDefined();
      expect((result as any).user.id).toBe(user.id);
      expect((result as any).user.email).toBe(user.email);
      // Ensure passwordHash is not in the sanitized response
      expect((result as any).user?.passwordHash).toBeUndefined();
    });

    it('should throw UnauthorizedException if user not found', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user has no passwordHash', async () => {
      const user = mockUser({ passwordHash: null });
      (usersService.findByEmail as jest.Mock).mockResolvedValue(user);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException on wrong password', async () => {
      const user = mockUser();
      (usersService.findByEmail as jest.Mock).mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should return requires2fa when 2FA is enabled but no code is provided', async () => {
      const user = mockUser({
        twoFactorEnabled: true,
        twoFactorSecret: 'JBSWY3DPEHPK3PXP',
      });
      (usersService.findByEmail as jest.Mock).mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result).toEqual({
        requires2fa: true,
        message: expect.any(String),
      });
    });

    it('should throw UnauthorizedException on invalid 2FA code', async () => {
      const user = mockUser({
        twoFactorEnabled: true,
        twoFactorSecret: 'JBSWY3DPEHPK3PXP',
      });
      (usersService.findByEmail as jest.Mock).mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (authenticator.verify as jest.Mock).mockReturnValue(false);

      await expect(
        service.login({ ...loginDto, twoFactorCode: '000000' } as any),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should succeed with valid 2FA code', async () => {
      const user = mockUser({
        twoFactorEnabled: true,
        twoFactorSecret: 'JBSWY3DPEHPK3PXP',
      });
      (usersService.findByEmail as jest.Mock).mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (authenticator.verify as jest.Mock).mockReturnValue(true);

      const result = await service.login({ ...loginDto, twoFactorCode: '123456' } as any);

      expect((result as any).tokens.accessToken).toBeDefined();
      expect((result as any).user).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Token Refresh
  // ─────────────────────────────────────────────────────────────────
  describe('refresh', () => {
    it('should return new tokens after revoking old session', async () => {
      const session = mockSession();
      sessionRepo.findOne.mockResolvedValue(session);

      const user = mockUser();
      (usersService.findByIdOrFail as jest.Mock).mockResolvedValue(user);

      const result = await service.refresh({ refreshToken: 'valid-refresh-token' });

      // Old session should be revoked
      expect(sessionRepo.update).toHaveBeenCalledWith(session.id, { isRevoked: true });
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
      expect(result.user).toBeDefined();
    });

    it('should throw UnauthorizedException if session not found', async () => {
      sessionRepo.findOne.mockResolvedValue(null);

      await expect(
        service.refresh({ refreshToken: 'invalid-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Logout
  // ─────────────────────────────────────────────────────────────────
  describe('logout', () => {
    it('should revoke the session by refresh token hash', async () => {
      sessionRepo.update.mockResolvedValue({ affected: 1 });

      const result = await service.logout({ refreshToken: 'some-refresh-token' });

      expect(sessionRepo.update).toHaveBeenCalledWith(
        { refreshTokenHash: expect.any(String), isRevoked: false },
        { isRevoked: true },
      );
      expect(result.message).toContain('Logged out successfully');
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Forgot Password
  // ─────────────────────────────────────────────────────────────────
  describe('forgotPassword', () => {
    it('should return generic message even when user does not exist (prevent enumeration)', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);

      const result = await service.forgotPassword({ email: 'nonexistent@example.com' });

      expect(result.message).toContain('If the email exists');
      expect(result).not.toHaveProperty('resetToken');
    });

    it('should return resetToken in non-production when user exists', async () => {
      const user = mockUser();
      (usersService.findByEmail as jest.Mock).mockResolvedValue(user);

      const result = await service.forgotPassword({ email: user.email });

      expect(result.message).toContain('If the email exists');
      expect(result.resetToken).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Reset Password
  // ─────────────────────────────────────────────────────────────────
  describe('resetPassword', () => {
    it('should throw BadRequestException for invalid token', async () => {
      await expect(
        service.resetPassword({ token: 'bogus-token', newPassword: 'NewP@ss1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reset password, revoke sessions, and delete the token', async () => {
      // First generate a valid token via forgotPassword
      const user = mockUser();
      (usersService.findByEmail as jest.Mock).mockResolvedValue(user);
      const forgotResult = await service.forgotPassword({ email: user.email });
      const resetToken = forgotResult.resetToken!;

      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
      sessionRepo.update.mockResolvedValue({ affected: 1 });

      const result = await service.resetPassword({
        token: resetToken,
        newPassword: 'NewP@ss1',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('NewP@ss1', 12);
      expect(usersService.updatePassword).toHaveBeenCalledWith(user.id, 'new-hash');
      expect(sessionRepo.update).toHaveBeenCalledWith(
        { userId: user.id, isRevoked: false },
        { isRevoked: true },
      );
      expect(result.message).toContain('reset successfully');

      // Token should be invalidated — second use fails
      await expect(
        service.resetPassword({ token: resetToken, newPassword: 'Another1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for expired token', async () => {
      // We need to manipulate the internal store. Access it via the forgotPassword flow,
      // then mock Date.now to simulate expiry.
      const user = mockUser();
      (usersService.findByEmail as jest.Mock).mockResolvedValue(user);

      const forgotResult = await service.forgotPassword({ email: user.email });
      const resetToken = forgotResult.resetToken!;

      // Advance time past expiry (1 hour)
      const realDateNow = Date.now;
      Date.now = jest.fn().mockReturnValue(realDateNow() + 2 * 60 * 60 * 1000);

      await expect(
        service.resetPassword({ token: resetToken, newPassword: 'NewP@ss1' }),
      ).rejects.toThrow(BadRequestException);

      Date.now = realDateNow;
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Email Verification
  // ─────────────────────────────────────────────────────────────────
  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      // Register to generate a verification token
      (bcrypt.hash as jest.Mock).mockResolvedValue('hash');
      const createdUser = mockUser({ id: 'u2' });
      (usersService.createUser as jest.Mock).mockResolvedValue(createdUser);

      const regResult = await service.register({
        email: 'verify@example.com',
        password: 'P@ss1234',
        firstName: 'V',
        lastName: 'U',
      });
      // Register now auto-verifies in dev mode, so test verifyEmail separately
      // Store a manual verify token
      const verifyToken = 'manual-verify-token';
      (service as any).verifyTokenStore.set(verifyToken, {
        userId: 'u2',
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      });

      const result = await service.verifyEmail({ token: verifyToken });

      expect(usersService.verifyEmail).toHaveBeenCalledWith('u2');
      expect(result.message).toContain('verified successfully');
    });

    it('should throw BadRequestException for invalid token', async () => {
      await expect(
        service.verifyEmail({ token: 'invalid-verify-token' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for expired verification token', async () => {
      const verifyToken = 'expired-verify-token';
      (service as any).verifyTokenStore.set(verifyToken, {
        userId: 'u3',
        expiresAt: Date.now() - 1000, // already expired
      });

      await expect(
        service.verifyEmail({ token: verifyToken }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // OTP (Phone Auth)
  // ─────────────────────────────────────────────────────────────────
  describe('sendOtp', () => {
    it('should return a code in non-production mode', async () => {
      const result = await service.sendOtp({ phone: '+995555000111' });

      expect(result.message).toContain('OTP sent');
      expect(result.code).toBeDefined();
      expect(result.code).toHaveLength(6);
    });
  });

  describe('verifyOtp', () => {
    it('should throw BadRequestException for expired/nonexistent OTP', async () => {
      await expect(
        service.verifyOtp({ phone: '+995555999999', code: '123456' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException for wrong code', async () => {
      const sendResult = await service.sendOtp({ phone: '+995555000111' });

      await expect(
        service.verifyOtp({ phone: '+995555000111', code: '000000' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return isNewUser=true for unknown phone', async () => {
      const sendResult = await service.sendOtp({ phone: '+995555000333' });

      (usersService.findByPhone as jest.Mock).mockResolvedValue(null);

      const result = await service.verifyOtp({
        phone: '+995555000333',
        code: sendResult.code!,
      });

      expect(result.isNewUser).toBe(true);
      expect(result.tempToken).toBeDefined();
      expect(jwtService.sign).toHaveBeenCalledWith(
        { phone: '+995555000333', type: 'phone_verified' },
        { expiresIn: '15m' },
      );
    });

    it('should return tokens for existing user', async () => {
      const sendResult = await service.sendOtp({ phone: '+995555000444' });
      const user = mockUser({ phone: '+995555000444' });
      (usersService.findByPhone as jest.Mock).mockResolvedValue(user);

      const result = await service.verifyOtp({
        phone: '+995555000444',
        code: sendResult.code!,
      });

      expect((result as any).isNewUser).toBe(false);
      expect((result as any).tokens.accessToken).toBeDefined();
      expect((result as any).tokens.refreshToken).toBeDefined();
      expect(usersService.updateLastLogin).toHaveBeenCalledWith(user.id);
    });

    it('should invalidate OTP after successful verification', async () => {
      const sendResult = await service.sendOtp({ phone: '+995555000555' });
      (usersService.findByPhone as jest.Mock).mockResolvedValue(null);

      await service.verifyOtp({ phone: '+995555000555', code: sendResult.code! });

      // Second attempt should fail
      await expect(
        service.verifyOtp({ phone: '+995555000555', code: sendResult.code! }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Social Login
  // ─────────────────────────────────────────────────────────────────
  describe('socialLogin', () => {
    it('should find or create user by social profile and return tokens', async () => {
      const user = mockUser({ id: 'social-user-1' });
      (usersService.findOrCreateBySocialProfile as jest.Mock).mockResolvedValue(user);

      const result = await service.socialLogin('google', { token: 'google-id-token-123' });

      expect(usersService.findOrCreateBySocialProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'google',
          providerId: expect.stringContaining('google_'),
          email: expect.stringContaining('google.user.'),
        }),
      );
      expect(usersService.updateLastLogin).toHaveBeenCalledWith(user.id);
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
      expect(result.user.id).toBe('social-user-1');
      expect(result.isNewUser).toBe(false);
    });

    it('should produce deterministic mock profiles for the same token', async () => {
      const user = mockUser();
      (usersService.findOrCreateBySocialProfile as jest.Mock).mockResolvedValue(user);

      await service.socialLogin('apple', { token: 'apple-token-abc' });
      const call1 = (usersService.findOrCreateBySocialProfile as jest.Mock).mock.calls[0][0];

      await service.socialLogin('apple', { token: 'apple-token-abc' });
      const call2 = (usersService.findOrCreateBySocialProfile as jest.Mock).mock.calls[1][0];

      expect(call1.providerId).toBe(call2.providerId);
      expect(call1.email).toBe(call2.email);
    });

    it('should generate different profiles for different providers', async () => {
      const user = mockUser();
      (usersService.findOrCreateBySocialProfile as jest.Mock).mockResolvedValue(user);

      await service.socialLogin('google', { token: 'same-token' });
      const googleProfile = (usersService.findOrCreateBySocialProfile as jest.Mock).mock.calls[0][0];

      await service.socialLogin('facebook', { token: 'same-token' });
      const fbProfile = (usersService.findOrCreateBySocialProfile as jest.Mock).mock.calls[1][0];

      expect(googleProfile.provider).toBe('google');
      expect(fbProfile.provider).toBe('facebook');
      expect(googleProfile.providerId).not.toBe(fbProfile.providerId);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Two-Factor Authentication
  // ─────────────────────────────────────────────────────────────────
  describe('setup2fa', () => {
    it('should generate secret and otpAuthUrl after password validation', async () => {
      const user = mockUser();
      (usersService.findByIdOrFail as jest.Mock).mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (authenticator.generateSecret as jest.Mock).mockReturnValue('NEWSECRET');
      (authenticator.keyuri as jest.Mock).mockReturnValue('otpauth://totp/...');

      const result = await service.setup2fa('user-uuid-1', { password: 'password123' });

      expect(result.secret).toBe('NEWSECRET');
      expect(result.otpAuthUrl).toBe('otpauth://totp/...');
      expect(usersService.update2faSecret).toHaveBeenCalledWith('user-uuid-1', 'NEWSECRET');
    });

    it('should throw BadRequestException if user has no password set', async () => {
      const user = mockUser({ passwordHash: null });
      (usersService.findByIdOrFail as jest.Mock).mockResolvedValue(user);

      await expect(
        service.setup2fa('user-uuid-1', { password: 'pass' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException on wrong password', async () => {
      const user = mockUser();
      (usersService.findByIdOrFail as jest.Mock).mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.setup2fa('user-uuid-1', { password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verify2fa', () => {
    it('should succeed with valid TOTP code', async () => {
      const user = mockUser({ twoFactorSecret: 'MYSECRET' });
      (usersService.findByIdOrFail as jest.Mock).mockResolvedValue(user);
      (authenticator.verify as jest.Mock).mockReturnValue(true);

      const result = await service.verify2fa('user-uuid-1', { code: '123456' });

      expect(result.message).toContain('enabled successfully');
    });

    it('should throw BadRequestException if 2FA setup not initiated', async () => {
      const user = mockUser({ twoFactorSecret: null });
      (usersService.findByIdOrFail as jest.Mock).mockResolvedValue(user);

      await expect(
        service.verify2fa('user-uuid-1', { code: '123456' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException on invalid TOTP code', async () => {
      const user = mockUser({ twoFactorSecret: 'MYSECRET' });
      (usersService.findByIdOrFail as jest.Mock).mockResolvedValue(user);
      (authenticator.verify as jest.Mock).mockReturnValue(false);

      await expect(
        service.verify2fa('user-uuid-1', { code: '000000' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('disable2fa', () => {
    it('should call update2faSecret with null', async () => {
      const result = await service.disable2fa('user-uuid-1');

      expect(usersService.update2faSecret).toHaveBeenCalledWith('user-uuid-1', null);
      expect(result.message).toContain('disabled');
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Token Generation (indirect tests)
  // ─────────────────────────────────────────────────────────────────
  describe('token generation (via login)', () => {
    it('should call jwtService.sign with correct payload', async () => {
      const user = mockUser();
      (usersService.findByEmail as jest.Mock).mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.login({ email: user.email, password: 'p' });

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: user.id,
        email: user.email,
        role: user.role,
      });
    });

    it('should persist a session with refresh token hash', async () => {
      const user = mockUser();
      (usersService.findByEmail as jest.Mock).mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.login({ email: user.email, password: 'p' });

      expect(sessionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: user.id,
          refreshTokenHash: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      );
      expect(sessionRepo.save).toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // sanitizeUser (indirect tests)
  // ─────────────────────────────────────────────────────────────────
  describe('sanitizeUser (via login)', () => {
    it('should strip sensitive fields from the user object', async () => {
      const user = mockUser();
      (usersService.findByEmail as jest.Mock).mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({ email: user.email, password: 'p' });

      const sanitized = (result as any).user;
      expect(sanitized.id).toBe(user.id);
      expect(sanitized.email).toBe(user.email);
      expect(sanitized.firstName).toBe(user.firstName);
      expect(sanitized.lastName).toBe(user.lastName);
      expect(sanitized.role).toBe(user.role);
      expect(sanitized.status).toBe(user.status);
      expect(sanitized.twoFactorEnabled).toBe(user.twoFactorEnabled);
      // Sensitive fields should NOT be present
      expect((sanitized as any).passwordHash).toBeUndefined();
      expect((sanitized as any).twoFactorSecret).toBeUndefined();
      expect((sanitized as any).consentLog).toBeUndefined();
    });
  });
});
