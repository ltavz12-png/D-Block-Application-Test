// ─── Enums ──────────────────────────────────────────────────────────

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

export enum BookingStatus {
  HELD = 'held',
  CONFIRMED = 'confirmed',
  CHECKED_IN = 'checked_in',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum BookingPaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
  CREDIT_USED = 'credit_used',
  INCLUDED_IN_PASS = 'included_in_pass',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  BOG_CARD = 'bog_card',
  TBC_CARD = 'tbc_card',
  APPLE_PAY = 'apple_pay',
  GOOGLE_PAY = 'google_pay',
  BANK_TRANSFER = 'bank_transfer',
}

export enum PaymentGateway {
  BOG_IPAY = 'bog_ipay',
  TBC_TPAY = 'tbc_tpay',
  MOCK = 'mock',
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  CREDITED = 'credited',
}

export enum CompanyStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive',
}

export enum ContractStatus {
  DRAFT = 'draft',
  PENDING_SIGNATURE = 'pending_signature',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  TERMINATED = 'terminated',
  RENEWED = 'renewed',
}

export enum ContractType {
  RENTAL = 'rental',
  COWORKING = 'coworking',
  B2B_SERVICE = 'b2b_service',
}

export enum ResourceType {
  MEETING_ROOM = 'meeting_room',
  HOT_DESK = 'hot_desk',
  FIXED_DESK = 'fixed_desk',
  BOX = 'box',
  OFFICE = 'office',
  PARKING = 'parking',
  LOCKER = 'locker',
  PHONE_BOOTH = 'phone_booth',
  EVENT_SPACE = 'event_space',
  EQUIPMENT = 'equipment',
}

export enum ResourceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
}

export enum PricingModel {
  HOURLY = 'hourly',
  DAILY = 'daily',
  MONTHLY = 'monthly',
  PER_USE = 'per_use',
  INCLUDED_IN_PASS = 'included_in_pass',
  CREDIT_BASED = 'credit_based',
  PER_SQM = 'per_sqm',
}

export enum VisitorStatus {
  EXPECTED = 'expected',
  CHECKED_IN = 'checked_in',
  CHECKED_OUT = 'checked_out',
  NO_SHOW = 'no_show',
  CANCELLED = 'cancelled',
}

export enum AccessLevel {
  COMMON_AREAS = 'common_areas',
  BOOKED_ROOMS = 'booked_rooms',
  DEDICATED_BOX = 'dedicated_box',
  OFFICE = 'office',
  ALL_AREAS = 'all_areas',
}

export enum AccessKeyStatus {
  ACTIVE = 'active',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
}

export enum AccessMethod {
  BLE = 'ble',
  NFC = 'nfc',
  PIN = 'pin',
  QR_CODE = 'qr_code',
  MANUAL = 'manual',
}

export enum AccessDirection {
  ENTRY = 'entry',
  EXIT = 'exit',
}

export enum RevenueEntryType {
  RECOGNITION = 'recognition',
  REVERSAL = 'reversal',
  ADJUSTMENT = 'adjustment',
}

export enum PeriodStatus {
  OPEN = 'open',
  CLOSING = 'closing',
  CLOSED = 'closed',
}

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  WAITING_ON_USER = 'waiting_on_user',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TicketCategory {
  FACILITY_ISSUE = 'facility_issue',
  BOOKING_ISSUE = 'booking_issue',
  PAYMENT_ISSUE = 'payment_issue',
  ACCESS_ISSUE = 'access_issue',
  GENERAL_INQUIRY = 'general_inquiry',
  FEEDBACK = 'feedback',
  OTHER = 'other',
}

// ─── Pagination ─────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ─── Entity Interfaces ──────────────────────────────────────────────

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

export interface Location {
  id: string;
  name: string;
  city: string;
  address: string | null;
  timezone: string | null;
  currency: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  operatingHours: Record<string, { open: string; close: string }> | null;
  isActive: boolean;
  imageUrl: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface Resource {
  id: string;
  name: string;
  locationId: string;
  location?: Location;
  resourceType: ResourceType;
  block: string | null;
  floor: string | null;
  size: number;
  measurementUnit: string;
  capacity: number;
  pricingModel: PricingModel;
  pricingDetails: {
    basePrice?: number;
    currency?: string;
    perHour?: number;
    perDay?: number;
    perMonth?: number;
    perSqm?: number;
  } | null;
  availabilityRules: {
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
  }[] | null;
  bookingRules: {
    minDurationMinutes?: number;
    maxDurationMinutes?: number;
    advanceBookingDays?: number;
    bufferMinutes?: number;
    cancellationPolicyId?: string;
  } | null;
  amenities: string[];
  imageUrls: string[];
  isActive: boolean;
  isBookable: boolean;
  saltoLockId: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  userId: string;
  user?: User;
  resourceId: string;
  resource?: Resource;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  paymentStatus: BookingPaymentStatus;
  paymentId: string | null;
  passId: string | null;
  creditTransactionId: string | null;
  totalAmount: number;
  discountAmount: number;
  currency: string;
  promoCodeId: string | null;
  notes: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  cancellationReason: string | null;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  calendarEventId: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  userId: string;
  user?: User;
  companyId: string | null;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentGateway: PaymentGateway;
  status: PaymentStatus;
  gatewayTransactionId: string | null;
  gatewayResponse: Record<string, any> | null;
  description: string | null;
  refundAmount: number;
  refundedAt: string | null;
  taxAmount: number;
  taxRate: number;
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLine {
  description: string;
  descriptionKa: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxRate: number;
  taxAmount: number;
  productId?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  userId: string | null;
  user?: User | null;
  companyId: string | null;
  company?: Company | null;
  lineItems: InvoiceLine[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  paidDate: string | null;
  paymentId: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  pdfUrl: string | null;
  language: string;
  bcSynced: boolean;
  bcSyncError: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  taxId: string | null;
  registrationNumber: string | null;
  address: string | null;
  contactPersonName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  locationId: string;
  location?: Location;
  status: CompanyStatus;
  billingEmail: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface Contract {
  id: string;
  contractNumber: string;
  companyId: string;
  company?: Company;
  locationId: string;
  location?: Location;
  contractType: ContractType;
  status: ContractStatus;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  noticePeriodDays: number;
  areaSqm: number | null;
  pricePerSqm: number | null;
  monthlyAmount: number;
  currency: string;
  resourceIds: string[];
  documentUrl: string | null;
  signedAt: string | null;
  signedByCompany: string | null;
  signedByDblock: string | null;
  docusignEnvelopeId: string | null;
  terms: Record<string, any> | null;
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface RevenueEntry {
  id: string;
  sourceType: string;
  sourceId: string;
  date: string;
  entryType: RevenueEntryType;
  recognizedAmount: number;
  deferredRemaining: number;
  totalContractValue: number;
  currency: string;
  locationId: string | null;
  productType: string | null;
  accountingPeriodId: string | null;
  bcJournalEntryRef: string | null;
  bcSynced: boolean;
  calculationDetails: {
    dailyRate: number;
    totalDays: number;
    daysElapsed: number;
    daysRemaining: number;
    periodStart: string;
    periodEnd: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface AccountingPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: PeriodStatus;
  closedAt: string | null;
  closedBy: string | null;
  closingNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Visitor {
  id: string;
  hostUserId: string;
  hostUser?: User;
  locationId: string;
  location?: Location;
  visitorName: string;
  visitorEmail: string | null;
  visitorPhone: string | null;
  visitorCompany: string | null;
  purpose: string | null;
  expectedDate: string;
  expectedTime: string | null;
  status: VisitorStatus;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  tempAccessKeyId: string | null;
  notificationSent: boolean;
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface AccessKey {
  id: string;
  userId: string;
  user?: User;
  saltoKeyId: string | null;
  accessLevel: AccessLevel;
  locationId: string;
  resourceIds: string[];
  status: AccessKeyStatus;
  validFrom: string;
  validUntil: string | null;
  sourceType: string;
  sourceId: string;
  isVisitorKey: boolean;
  timeRestrictions: {
    dayOfWeek: number[];
    startTime: string;
    endTime: string;
  }[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface AccessLog {
  id: string;
  userId: string | null;
  locationId: string;
  resourceId: string | null;
  doorId: string | null;
  method: AccessMethod;
  direction: AccessDirection | null;
  granted: boolean;
  denialReason: string | null;
  createdAt: string;
  saltoEventId: string | null;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  user?: User;
  locationId: string | null;
  location?: Location | null;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo: string | null;
  resourceId: string | null;
  imageUrls: string[];
  messages: Array<{
    authorId: string;
    authorRole: string;
    message: string;
    imageUrls?: string[];
    createdAt: string;
  }>;
  resolvedAt: string | null;
  resolvedBy: string | null;
  rating: number | null;
  ratingComment: string | null;
  createdAt: string;
  updatedAt: string;
}

export enum ProductType {
  COWORKING_PASS = 'coworking_pass',
  BOX = 'box',
  OFFICE = 'office',
  MEETING_ROOM = 'meeting_room',
  PARKING = 'parking',
  LOCKER = 'locker',
  EVENT_SPACE = 'event_space',
  CREDIT_PACKAGE = 'credit_package',
}

export enum BillingPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUAL = 'annual',
  ONE_TIME = 'one_time',
}

export interface AdminRateCode {
  id: string;
  code: string;
  name: string;
  amount: string;
  currency: string;
  taxRate: string;
  conditions: Record<string, any> | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProduct {
  id: string;
  name: string;
  nameKa: string | null;
  description: string | null;
  descriptionKa: string | null;
  productType: ProductType;
  billingPeriod: BillingPeriod;
  features: string[];
  featuresKa: string[];
  includedResources: Record<string, any> | null;
  sortOrder: number;
  isActive: boolean;
  rateCodes: AdminRateCode[];
  createdAt: string;
  updatedAt: string;
}

// ─── Query Parameter Types ──────────────────────────────────────────

export interface UsersQueryParams {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  page?: number;
  limit?: number;
}

export interface BookingsQueryParams {
  location?: string;
  status?: BookingStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface PaymentsQueryParams {
  status?: PaymentStatus;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface InvoicesQueryParams {
  status?: InvoiceStatus;
  companyId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface CompaniesQueryParams {
  status?: CompanyStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ContractsQueryParams {
  status?: ContractStatus;
  companyId?: string;
  locationId?: string;
  page?: number;
  limit?: number;
}

export interface RevenueEntriesQueryParams {
  locationId?: string;
  productType?: string;
  dateFrom?: string;
  dateTo?: string;
  periodId?: string;
  page?: number;
  limit?: number;
}

export interface RevenueSummaryQueryParams {
  locationId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ResourcesQueryParams {
  locationId?: string;
  resourceType?: ResourceType;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface VisitorsQueryParams {
  locationId?: string;
  status?: VisitorStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface AccessKeysQueryParams {
  userId?: string;
  locationId?: string;
  status?: AccessKeyStatus;
  page?: number;
  limit?: number;
}

export interface ProductsQueryParams {
  type?: ProductType;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface AccessLogsQueryParams {
  userId?: string;
  locationId?: string;
  dateFrom?: string;
  dateTo?: string;
  granted?: boolean;
  page?: number;
  limit?: number;
}

// ─── Summary / Stats Response Types ─────────────────────────────────

export interface BookingStats {
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  revenue: number;
  averageBookingValue: number;
  occupancyRate: number;
}

export interface PaymentSummary {
  totalPayments: number;
  totalAmount: number;
  completedAmount: number;
  pendingAmount: number;
  refundedAmount: number;
}

export interface InvoiceSummary {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  overdueAmount: number;
  draftCount: number;
  sentCount: number;
  overdueCount: number;
}

export interface ContractSummary {
  totalContracts: number;
  activeContracts: number;
  expiringContracts: number;
  totalMonthlyRevenue: number;
}

export interface RevenueSummary {
  totalRecognized: number;
  totalDeferred: number;
  byLocation: Array<{
    locationId: string;
    locationName: string;
    recognized: number;
    deferred: number;
  }>;
  byProductType: Array<{
    productType: string;
    recognized: number;
    deferred: number;
  }>;
}

export interface VisitorStats {
  totalVisitors: number;
  checkedIn: number;
  expected: number;
  noShows: number;
}

export interface AccessStats {
  totalAccesses: number;
  granted: number;
  denied: number;
  uniqueUsers: number;
  peakHour: string;
}
