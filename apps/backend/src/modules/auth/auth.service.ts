import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { authenticator } from 'otplib';
import * as crypto from 'crypto';

import { UsersService } from '@/modules/users/users.service';
import { User } from '@/common/database/entities/user.entity';
import { UserSession } from '@/common/database/entities/user-session.entity';
import { UserAuthProvider, AuthProvider } from '@/common/database/entities/user-auth-provider.entity';

import { RegisterDto } from './dto/register.dto';
import { LoginDto, RefreshTokenDto, LogoutDto } from './dto/login.dto';
import { ForgotPasswordDto, ResetPasswordDto, VerifyEmailDto } from './dto/password.dto';
import { SendOtpDto, VerifyOtpDto } from './dto/otp.dto';
import { Setup2faDto, Verify2faDto } from './dto/two-factor.dto';
import { SocialAuthTokenDto, SocialProfile } from './dto/social-auth.dto';
import { JwtPayload } from './strategies/jwt.strategy';

const SALT_ROUNDS = 12;

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // In-memory stores for mock mode (replaced by Redis/DB in production)
  private readonly otpStore = new Map<string, { code: string; expiresAt: number }>();
  private readonly resetTokenStore = new Map<string, { userId: string; expiresAt: number }>();
  private readonly verifyTokenStore = new Map<string, { userId: string; expiresAt: number }>();

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(UserSession)
    private readonly sessionRepo: Repository<UserSession>,
    @InjectRepository(UserAuthProvider)
    private readonly authProviderRepo: Repository<UserAuthProvider>,
  ) {}

  // ─── Registration ───────────────────────────────────────────────

  async register(dto: RegisterDto) {
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await this.usersService.createUser({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      preferredLanguage: dto.preferredLanguage,
    });

    // Create email auth provider link
    await this.authProviderRepo.save(
      this.authProviderRepo.create({
        userId: user.id,
        provider: AuthProvider.EMAIL,
        providerId: user.email,
      }),
    );

    // Generate email verification token
    const verifyToken = crypto.randomBytes(32).toString('hex');
    this.verifyTokenStore.set(verifyToken, {
      userId: user.id,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24h
    });

    this.logger.log(`[MOCK EMAIL] Verification token for ${user.email}: ${verifyToken}`);

    return {
      message: 'Registration successful. Please verify your email.',
      userId: user.id,
      // In mock mode, return the token for testing
      ...(this.configService.get('app.nodeEnv') !== 'production' && { verifyToken }),
    };
  }

  // ─── Login ──────────────────────────────────────────────────────

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check 2FA
    if (user.twoFactorEnabled) {
      if (!dto.twoFactorCode) {
        return { requires2fa: true, message: 'Two-factor authentication code required' };
      }
      const isValidCode = authenticator.verify({
        token: dto.twoFactorCode,
        secret: user.twoFactorSecret!,
      });
      if (!isValidCode) {
        throw new UnauthorizedException('Invalid two-factor authentication code');
      }
    }

    await this.usersService.updateLastLogin(user.id);
    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  // ─── Token Refresh ──────────────────────────────────────────────

  async refresh(dto: RefreshTokenDto) {
    const session = await this.findValidSession(dto.refreshToken);

    const user = await this.usersService.findByIdOrFail(session.userId);

    // Rotate: revoke old session and create new one
    await this.sessionRepo.update(session.id, { isRevoked: true });

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  // ─── Logout ─────────────────────────────────────────────────────

  async logout(dto: LogoutDto) {
    const tokenHash = this.hashToken(dto.refreshToken);
    await this.sessionRepo.update(
      { refreshTokenHash: tokenHash, isRevoked: false },
      { isRevoked: true },
    );
    return { message: 'Logged out successfully' };
  }

  // ─── Password Reset ─────────────────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If the email exists, a reset link has been sent' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    this.resetTokenStore.set(resetToken, {
      userId: user.id,
      expiresAt: Date.now() + 60 * 60 * 1000, // 1h
    });

    this.logger.log(`[MOCK EMAIL] Password reset token for ${user.email}: ${resetToken}`);

    return {
      message: 'If the email exists, a reset link has been sent',
      ...(this.configService.get('app.nodeEnv') !== 'production' && { resetToken }),
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const stored = this.resetTokenStore.get(dto.token);
    if (!stored || stored.expiresAt < Date.now()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
    await this.usersService.updatePassword(stored.userId, passwordHash);

    // Revoke all sessions for this user
    await this.sessionRepo.update(
      { userId: stored.userId, isRevoked: false },
      { isRevoked: true },
    );

    this.resetTokenStore.delete(dto.token);

    return { message: 'Password has been reset successfully' };
  }

  // ─── Email Verification ─────────────────────────────────────────

  async verifyEmail(dto: VerifyEmailDto) {
    const stored = this.verifyTokenStore.get(dto.token);
    if (!stored || stored.expiresAt < Date.now()) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.usersService.verifyEmail(stored.userId);
    this.verifyTokenStore.delete(dto.token);

    return { message: 'Email verified successfully' };
  }

  // ─── OTP (Phone Auth) ──────────────────────────────────────────

  async sendOtp(dto: SendOtpDto) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.otpStore.set(dto.phone, {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5min
    });

    this.logger.log(`[MOCK SMS] OTP for ${dto.phone}: ${code}`);

    return {
      message: 'OTP sent successfully',
      ...(this.configService.get('app.nodeEnv') !== 'production' && { code }),
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const stored = this.otpStore.get(dto.phone);
    if (!stored || stored.expiresAt < Date.now()) {
      throw new BadRequestException('OTP expired or not found');
    }

    if (stored.code !== dto.code) {
      throw new UnauthorizedException('Invalid OTP code');
    }

    this.otpStore.delete(dto.phone);

    // Find or create user by phone
    let user = await this.usersService.findByPhone(dto.phone);

    if (!user) {
      // Phone-only users get a temp token until they complete profile
      return {
        isNewUser: true,
        phone: dto.phone,
        message: 'OTP verified. Please complete registration.',
        tempToken: this.jwtService.sign(
          { phone: dto.phone, type: 'phone_verified' },
          { expiresIn: '15m' },
        ),
      };
    }

    await this.usersService.updateLastLogin(user.id);
    const tokens = await this.generateTokens(user);

    return {
      isNewUser: false,
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  // ─── Social Auth (Mock Mode) ────────────────────────────────────

  async socialLogin(provider: string, dto: SocialAuthTokenDto) {
    // In mock mode, simulate social profile from token
    const mockProfile = this.getMockSocialProfile(provider, dto.token);

    const user = await this.usersService.findOrCreateBySocialProfile(mockProfile);
    await this.usersService.updateLastLogin(user.id);

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
      isNewUser: false,
    };
  }

  // ─── Two-Factor Authentication ──────────────────────────────────

  async setup2fa(userId: string, dto: Setup2faDto) {
    const user = await this.usersService.findByIdOrFail(userId);

    if (!user.passwordHash) {
      throw new BadRequestException('Password login must be set up before enabling 2FA');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid password');
    }

    const secret = authenticator.generateSecret();
    const otpAuthUrl = authenticator.keyuri(user.email, 'D Block Workspace', secret);

    // Store secret temporarily (not yet enabled until verified)
    await this.usersService.update2faSecret(userId, secret);

    return {
      secret,
      otpAuthUrl,
      message: 'Scan the QR code with your authenticator app, then verify with a code',
    };
  }

  async verify2fa(userId: string, dto: Verify2faDto) {
    const user = await this.usersService.findByIdOrFail(userId);

    if (!user.twoFactorSecret) {
      throw new BadRequestException('2FA setup not initiated. Call setup first.');
    }

    const isValid = authenticator.verify({
      token: dto.code,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid verification code');
    }

    return { message: 'Two-factor authentication enabled successfully' };
  }

  async disable2fa(userId: string) {
    await this.usersService.update2faSecret(userId, null);
    return { message: 'Two-factor authentication disabled' };
  }

  // ─── Token Generation ───────────────────────────────────────────

  private async generateTokens(user: User): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenHash = this.hashToken(refreshToken);

    const refreshExpiration = this.configService.get<string>('jwt.refreshExpiration') || '7d';
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(refreshExpiration) || 7);

    await this.sessionRepo.save(
      this.sessionRepo.create({
        userId: user.id,
        refreshTokenHash,
        expiresAt,
      }),
    );

    const expiresIn = this.parseExpirationToSeconds(
      this.configService.get<string>('jwt.expiration') || '15m',
    );

    return { accessToken, refreshToken, expiresIn };
  }

  private async findValidSession(refreshToken: string): Promise<UserSession> {
    const tokenHash = this.hashToken(refreshToken);

    const session = await this.sessionRepo.findOne({
      where: {
        refreshTokenHash: tokenHash,
        isRevoked: false,
        expiresAt: MoreThan(new Date()),
      },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Update last used
    await this.sessionRepo.update(session.id, { lastUsedAt: new Date() });

    return session;
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private parseExpirationToSeconds(expiration: string): number {
    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // default 15m
    const value = parseInt(match[1]);
    const unit = match[2];
    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 900;
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────

  private sanitizeUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      preferredLanguage: user.preferredLanguage,
      profileImageUrl: user.profileImageUrl,
    };
  }

  private getMockSocialProfile(provider: string, token: string): SocialProfile {
    // Deterministic mock based on token for consistent testing
    const hash = crypto.createHash('md5').update(token).digest('hex');
    return {
      provider,
      providerId: `${provider}_${hash.substring(0, 16)}`,
      email: `${provider}.user.${hash.substring(0, 8)}@example.com`,
      firstName: 'Mock',
      lastName: `${provider.charAt(0).toUpperCase() + provider.slice(1)}User`,
      profileImageUrl: undefined,
    };
  }
}
