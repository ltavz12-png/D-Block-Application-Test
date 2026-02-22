import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from '@/common/decorators/public.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

import { RegisterDto } from './dto/register.dto';
import { LoginDto, RefreshTokenDto, LogoutDto } from './dto/login.dto';
import { ForgotPasswordDto, ResetPasswordDto, VerifyEmailDto } from './dto/password.dto';
import { SendOtpDto, VerifyOtpDto } from './dto/otp.dto';
import { Setup2faDto, Verify2faDto } from './dto/two-factor.dto';
import { SocialAuthTokenDto } from './dto/social-auth.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ─── Email + Password ───────────────────────────────────────────

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register with email and password' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  getMe(@CurrentUser() user: { id: string }) {
    return this.authService.getMe(user.id);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  logout(@Body() dto: LogoutDto) {
    return this.authService.logout(dto);
  }

  // ─── Password Reset ─────────────────────────────────────────────

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset email' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // ─── Email Verification ─────────────────────────────────────────

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address with token' })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  // ─── Phone + OTP ────────────────────────────────────────────────

  @Public()
  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to phone number' })
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @Public()
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP code' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  // ─── Social Auth (Mock Mode) ────────────────────────────────────

  @Public()
  @Post('social/:provider')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with social provider (google, apple, facebook)' })
  socialLogin(
    @Param('provider') provider: string,
    @Body() dto: SocialAuthTokenDto,
  ) {
    return this.authService.socialLogin(provider, dto);
  }

  // ─── Two-Factor Authentication ──────────────────────────────────

  @Post('2fa/setup')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate TOTP secret and QR code for 2FA setup' })
  setup2fa(@CurrentUser() user: { id: string }, @Body() dto: Setup2faDto) {
    return this.authService.setup2fa(user.id, dto);
  }

  @Post('2fa/verify')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify TOTP code to complete 2FA setup' })
  verify2fa(@CurrentUser() user: { id: string }, @Body() dto: Verify2faDto) {
    return this.authService.verify2fa(user.id, dto);
  }

  @Post('2fa/disable')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable two-factor authentication' })
  disable2fa(@CurrentUser() user: { id: string }) {
    return this.authService.disable2fa(user.id);
  }
}
