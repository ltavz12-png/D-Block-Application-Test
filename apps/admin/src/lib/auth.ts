import api from './api';

// ─── Types ─────────────────────────────────────────────────────────

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  FINANCE_ADMIN = 'finance_admin',
  LOCATION_MANAGER = 'location_manager',
  RECEPTION_STAFF = 'reception_staff',
  MARKETING_ADMIN = 'marketing_admin',
  SUPPORT_AGENT = 'support_agent',
  COMPANY_ADMIN = 'company_admin',
  COMPANY_EMPLOYEE = 'company_employee',
  MEMBER = 'member',
}

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DEACTIVATED = 'deactivated',
  PENDING_VERIFICATION = 'pending_verification',
}

export interface User {
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  profileImageUrl: string | null;
  preferredLanguage: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  companyId: string | null;
  locationId: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

// ─── Auth API Service ──────────────────────────────────────────────

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', data);
    return response.data;
  },

  logout: async (data: LogoutRequest): Promise<void> => {
    await api.post('/auth/logout', data);
  },

  refresh: async (data: RefreshRequest): Promise<AuthTokens> => {
    const response = await api.post<AuthTokens>('/auth/refresh', data);
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await api.get<User>('/users/me');
    return response.data;
  },
};
