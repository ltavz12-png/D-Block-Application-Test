import api from './api';

// ── Types ───────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  role: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  preferredLanguage: 'en' | 'ka';
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  preferredLanguage?: 'en' | 'ka';
}

export interface OtpResponse {
  message: string;
  expiresIn: number;
}

export interface MessageResponse {
  message: string;
}

export type SocialProvider = 'google' | 'apple' | 'facebook';

// ── Auth API Service ────────────────────────────────────────────────────

export async function login(
  email: string,
  password: string,
  twoFactorCode?: string,
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', {
    email,
    password,
    twoFactorCode,
  });
  return data;
}

export async function register(
  payload: RegisterPayload,
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', payload);
  return data;
}

export async function refresh(
  refreshToken: string,
): Promise<AuthTokens> {
  const { data } = await api.post<AuthTokens>('/auth/refresh', {
    refreshToken,
  });
  return data;
}

export async function logout(
  refreshToken: string,
): Promise<MessageResponse> {
  const { data } = await api.post<MessageResponse>('/auth/logout', {
    refreshToken,
  });
  return data;
}

export async function forgotPassword(
  email: string,
): Promise<MessageResponse> {
  const { data } = await api.post<MessageResponse>('/auth/forgot-password', {
    email,
  });
  return data;
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<MessageResponse> {
  const { data } = await api.post<MessageResponse>('/auth/reset-password', {
    token,
    newPassword,
  });
  return data;
}

export async function verifyEmail(
  token: string,
): Promise<MessageResponse> {
  const { data } = await api.post<MessageResponse>('/auth/verify-email', {
    token,
  });
  return data;
}

export async function sendOtp(
  phone: string,
): Promise<OtpResponse> {
  const { data } = await api.post<OtpResponse>('/auth/otp/send', {
    phone,
  });
  return data;
}

export async function verifyOtp(
  phone: string,
  code: string,
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/otp/verify', {
    phone,
    code,
  });
  return data;
}

export async function socialLogin(
  provider: SocialProvider,
  token: string,
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>(`/auth/social/${provider}`, {
    token,
  });
  return data;
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>('/auth/me');
  return data;
}
