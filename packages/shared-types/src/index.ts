// API Response types shared between backend, admin, and mobile

export interface ApiResponse<T = any> {
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  errors?: string[];
  timestamp: string;
  path: string;
  correlationId?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  preferredLanguage?: 'en' | 'ka';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  profileImageUrl?: string;
  preferredLanguage: string;
  companyId?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
}

// Booking types
export enum BookingStatusType {
  HELD = 'held',
  CONFIRMED = 'confirmed',
  CHECKED_IN = 'checked_in',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export interface CreateBookingRequest {
  resourceId: string;
  startTime: string;
  endTime: string;
  notes?: string;
  promoCode?: string;
  paymentMethod?: string;
  useCredits?: boolean;
}

export interface BookingSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  price?: number;
  currency?: string;
}

// Location types
export interface LocationSummary {
  id: string;
  name: string;
  city: string;
  address?: string;
  imageUrl?: string;
  isActive: boolean;
}

// Resource types
export interface ResourceSummary {
  id: string;
  name: string;
  locationId: string;
  resourceType: string;
  block?: string;
  floor?: string;
  capacity: number;
  imageUrls: string[];
  isBookable: boolean;
}

// WebSocket event types
export enum WsEvent {
  BOOKING_CREATED = 'booking:created',
  BOOKING_CANCELLED = 'booking:cancelled',
  BOOKING_HOLD = 'booking:hold',
  BOOKING_HOLD_RELEASED = 'booking:hold_released',
  AVAILABILITY_CHANGED = 'availability:changed',
  CREDIT_BALANCE_CHANGED = 'credit:balance_changed',
  OCCUPANCY_UPDATED = 'occupancy:updated',
  NOTIFICATION_NEW = 'notification:new',
}

// i18n
export type SupportedLanguage = 'en' | 'ka';
