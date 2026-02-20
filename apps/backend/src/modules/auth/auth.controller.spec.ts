import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

// ────────────────────────────────────────────────────────────────────────────
// Mock data
// ────────────────────────────────────────────────────────────────────────────

const mockUser = { id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' };

const mockTokens = {
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-access-token',
  refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-refresh-token',
  expiresIn: 3600,
};

const mockUserProfile = {
  id: mockUser.id,
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'member',
  emailVerified: true,
  phoneVerified: false,
  twoFactorEnabled: false,
};

const mockRegisterResponse = {
  user: mockUserProfile,
  ...mockTokens,
};

const mock2faSetup = {
  secret: 'JBSWY3DPEHPK3PXP',
  qrCodeUrl: 'otpauth://totp/DBlock:user@example.com?secret=JBSWY3DPEHPK3PXP',
};

// ────────────────────────────────────────────────────────────────────────────
// Mock service
// ────────────────────────────────────────────────────────────────────────────

const mockAuthService = {
  register: jest.fn().mockResolvedValue(mockRegisterResponse),
  login: jest.fn().mockResolvedValue(mockTokens),
  refresh: jest.fn().mockResolvedValue(mockTokens),
  logout: jest.fn().mockResolvedValue({ message: 'Logged out successfully' }),
  forgotPassword: jest.fn().mockResolvedValue({ message: 'Reset email sent' }),
  resetPassword: jest.fn().mockResolvedValue({ message: 'Password reset successful' }),
  verifyEmail: jest.fn().mockResolvedValue({ message: 'Email verified' }),
  sendOtp: jest.fn().mockResolvedValue({ message: 'OTP sent' }),
  verifyOtp: jest.fn().mockResolvedValue(mockTokens),
  socialLogin: jest.fn().mockResolvedValue(mockTokens),
  setup2fa: jest.fn().mockResolvedValue(mock2faSetup),
  verify2fa: jest.fn().mockResolvedValue({ message: '2FA enabled' }),
  disable2fa: jest.fn().mockResolvedValue({ message: '2FA disabled' }),
};

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ── POST /register ──────────────────────────────────────────────────────

  describe('POST /register (register)', () => {
    it('should call authService.register with dto', async () => {
      const dto = {
        email: 'newuser@example.com',
        password: 'StrongPass123!',
        firstName: 'Jane',
        lastName: 'Smith',
      } as any;

      const result = await controller.register(dto);

      expect(service.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockRegisterResponse);
    });
  });

  // ── POST /login ─────────────────────────────────────────────────────────

  describe('POST /login (login)', () => {
    it('should call authService.login with dto', async () => {
      const dto = {
        email: 'user@example.com',
        password: 'MyPassword123!',
      } as any;

      const result = await controller.login(dto);

      expect(service.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockTokens);
    });
  });

  // ── POST /refresh ───────────────────────────────────────────────────────

  describe('POST /refresh (refresh)', () => {
    it('should call authService.refresh with dto', async () => {
      const dto = {
        refreshToken: mockTokens.refreshToken,
      } as any;

      const result = await controller.refresh(dto);

      expect(service.refresh).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockTokens);
    });
  });

  // ── POST /logout ────────────────────────────────────────────────────────

  describe('POST /logout (logout)', () => {
    it('should call authService.logout with dto', async () => {
      const dto = {
        refreshToken: mockTokens.refreshToken,
      } as any;

      const result = await controller.logout(dto);

      expect(service.logout).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });

  // ── POST /forgot-password ───────────────────────────────────────────────

  describe('POST /forgot-password (forgotPassword)', () => {
    it('should call authService.forgotPassword with dto', async () => {
      const dto = { email: 'user@example.com' } as any;

      const result = await controller.forgotPassword(dto);

      expect(service.forgotPassword).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ message: 'Reset email sent' });
    });
  });

  // ── POST /reset-password ────────────────────────────────────────────────

  describe('POST /reset-password (resetPassword)', () => {
    it('should call authService.resetPassword with dto', async () => {
      const dto = {
        token: 'reset-token-abc',
        newPassword: 'NewPass456!',
      } as any;

      const result = await controller.resetPassword(dto);

      expect(service.resetPassword).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ message: 'Password reset successful' });
    });
  });

  // ── POST /verify-email ──────────────────────────────────────────────────

  describe('POST /verify-email (verifyEmail)', () => {
    it('should call authService.verifyEmail with dto', async () => {
      const dto = { token: 'verify-token-xyz' } as any;

      const result = await controller.verifyEmail(dto);

      expect(service.verifyEmail).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ message: 'Email verified' });
    });
  });

  // ── POST /otp/send ──────────────────────────────────────────────────────

  describe('POST /otp/send (sendOtp)', () => {
    it('should call authService.sendOtp with dto', async () => {
      const dto = { phone: '+995555000111' } as any;

      const result = await controller.sendOtp(dto);

      expect(service.sendOtp).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ message: 'OTP sent' });
    });
  });

  // ── POST /otp/verify ────────────────────────────────────────────────────

  describe('POST /otp/verify (verifyOtp)', () => {
    it('should call authService.verifyOtp with dto', async () => {
      const dto = { phone: '+995555000111', code: '123456' } as any;

      const result = await controller.verifyOtp(dto);

      expect(service.verifyOtp).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockTokens);
    });
  });

  // ── POST /social/:provider ──────────────────────────────────────────────

  describe('POST /social/:provider (socialLogin)', () => {
    it('should call authService.socialLogin with provider and dto (google)', async () => {
      const dto = { token: 'google-id-token-abc' } as any;
      const result = await controller.socialLogin('google', dto);

      expect(service.socialLogin).toHaveBeenCalledWith('google', dto);
      expect(result).toEqual(mockTokens);
    });

    it('should call authService.socialLogin with provider and dto (apple)', async () => {
      const dto = { token: 'apple-id-token-xyz' } as any;
      const result = await controller.socialLogin('apple', dto);

      expect(service.socialLogin).toHaveBeenCalledWith('apple', dto);
      expect(result).toEqual(mockTokens);
    });

    it('should call authService.socialLogin with provider and dto (facebook)', async () => {
      const dto = { token: 'fb-access-token-123' } as any;
      const result = await controller.socialLogin('facebook', dto);

      expect(service.socialLogin).toHaveBeenCalledWith('facebook', dto);
      expect(result).toEqual(mockTokens);
    });
  });

  // ── POST /2fa/setup ─────────────────────────────────────────────────────

  describe('POST /2fa/setup (setup2fa)', () => {
    it('should call authService.setup2fa with userId and dto', async () => {
      const dto = { method: 'totp' } as any;
      const result = await controller.setup2fa(mockUser, dto);

      expect(service.setup2fa).toHaveBeenCalledWith(mockUser.id, dto);
      expect(result).toEqual(mock2faSetup);
    });
  });

  // ── POST /2fa/verify ────────────────────────────────────────────────────

  describe('POST /2fa/verify (verify2fa)', () => {
    it('should call authService.verify2fa with userId and dto', async () => {
      const dto = { code: '123456' } as any;
      const result = await controller.verify2fa(mockUser, dto);

      expect(service.verify2fa).toHaveBeenCalledWith(mockUser.id, dto);
      expect(result).toEqual({ message: '2FA enabled' });
    });
  });

  // ── POST /2fa/disable ───────────────────────────────────────────────────

  describe('POST /2fa/disable (disable2fa)', () => {
    it('should call authService.disable2fa with userId', async () => {
      const result = await controller.disable2fa(mockUser);

      expect(service.disable2fa).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({ message: '2FA disabled' });
    });
  });
});
