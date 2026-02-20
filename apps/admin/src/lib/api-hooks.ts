import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';
import type {
  User,
  Booking,
  Payment,
  Invoice,
  Company,
  Contract,
  Resource,
  Location,
  RevenueEntry,
  AccountingPeriod,
  Visitor,
  AccessKey,
  AccessLog,
  PaginatedResponse,
  BookingStats,
  PaymentSummary,
  InvoiceSummary,
  ContractSummary,
  RevenueSummary,
  VisitorStats,
  AccessStats,
  UsersQueryParams,
  BookingsQueryParams,
  PaymentsQueryParams,
  InvoicesQueryParams,
  CompaniesQueryParams,
  ContractsQueryParams,
  RevenueEntriesQueryParams,
  RevenueSummaryQueryParams,
  ResourcesQueryParams,
  VisitorsQueryParams,
  AccessKeysQueryParams,
  AccessLogsQueryParams,
} from './types';

// ─── Query Key Factory ──────────────────────────────────────────────

export const queryKeys = {
  users: (params?: UsersQueryParams) => ['users', params] as const,
  user: (id: string) => ['users', id] as const,
  bookings: (params?: BookingsQueryParams) => ['bookings', params] as const,
  bookingStats: () => ['bookings', 'stats'] as const,
  locations: () => ['locations'] as const,
  resources: (params?: ResourcesQueryParams) => ['resources', params] as const,
  payments: (params?: PaymentsQueryParams) => ['payments', params] as const,
  paymentSummary: () => ['payments', 'summary'] as const,
  invoices: (params?: InvoicesQueryParams) => ['invoices', params] as const,
  invoiceSummary: () => ['invoices', 'summary'] as const,
  companies: (params?: CompaniesQueryParams) => ['companies', params] as const,
  contracts: (params?: ContractsQueryParams) => ['contracts', params] as const,
  contractSummary: () => ['contracts', 'summary'] as const,
  revenueEntries: (params?: RevenueEntriesQueryParams) => ['revenue-entries', params] as const,
  revenueSummary: (params?: RevenueSummaryQueryParams) => ['revenue-summary', params] as const,
  accountingPeriods: () => ['accounting-periods'] as const,
  visitors: (params?: VisitorsQueryParams) => ['visitors', params] as const,
  visitorStats: (locationId: string) => ['visitors', 'stats', locationId] as const,
  todaysVisitors: (locationId: string) => ['visitors', 'today', locationId] as const,
  accessKeys: (params?: AccessKeysQueryParams) => ['access-keys', params] as const,
  accessLogs: (params?: AccessLogsQueryParams) => ['access-logs', params] as const,
  accessStats: (locationId: string) => ['access', 'stats', locationId] as const,
};

// ─── User Hooks ─────────────────────────────────────────────────────

export function useUsers(params?: UsersQueryParams) {
  return useQuery({
    queryKey: queryKeys.users(params),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<User>>('/users', { params });
      return data;
    },
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: queryKeys.user(id),
    queryFn: async () => {
      const { data } = await api.get<User>(`/users/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

// ─── Booking Hooks ──────────────────────────────────────────────────

export function useBookings(params?: BookingsQueryParams) {
  return useQuery({
    queryKey: queryKeys.bookings(params),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Booking>>('/bookings/admin', { params });
      return data;
    },
  });
}

export function useBookingStats() {
  return useQuery({
    queryKey: queryKeys.bookingStats(),
    queryFn: async () => {
      const { data } = await api.get<BookingStats>('/bookings/admin/stats');
      return data;
    },
  });
}

export function useConfirmBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<Booking>(`/bookings/admin/${id}/confirm`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { data } = await api.post<Booking>(`/bookings/${id}/cancel`, { reason });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

// ─── Location Hooks ─────────────────────────────────────────────────

export function useLocations() {
  return useQuery({
    queryKey: queryKeys.locations(),
    queryFn: async () => {
      const { data } = await api.get<Location[]>('/locations');
      return data;
    },
    staleTime: 5 * 60 * 1000, // Locations rarely change
  });
}

// ─── Resource Hooks ─────────────────────────────────────────────────

export function useResources(params?: ResourcesQueryParams) {
  return useQuery({
    queryKey: queryKeys.resources(params),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Resource>>('/resources', { params });
      return data;
    },
  });
}

// ─── Payment Hooks ──────────────────────────────────────────────────

export function usePayments(params?: PaymentsQueryParams) {
  return useQuery({
    queryKey: queryKeys.payments(params),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Payment>>('/payments', { params });
      return data;
    },
  });
}

export function usePaymentSummary() {
  return useQuery({
    queryKey: queryKeys.paymentSummary(),
    queryFn: async () => {
      const { data } = await api.get<PaymentSummary>('/payments/summary');
      return data;
    },
  });
}

export function useRefundPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount?: number }) => {
      const { data } = await api.post<Payment>(`/payments/${id}/refund`, { amount });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

// ─── Invoice Hooks ──────────────────────────────────────────────────

export function useInvoices(params?: InvoicesQueryParams) {
  return useQuery({
    queryKey: queryKeys.invoices(params),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Invoice>>('/invoices', { params });
      return data;
    },
  });
}

export function useInvoiceSummary() {
  return useQuery({
    queryKey: queryKeys.invoiceSummary(),
    queryFn: async () => {
      const { data } = await api.get<InvoiceSummary>('/invoices/summary');
      return data;
    },
  });
}

export function useSendInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<Invoice>(`/invoices/${id}/send`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useMarkInvoicePaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, paymentId }: { id: string; paymentId?: string }) => {
      const { data } = await api.post<Invoice>(`/invoices/${id}/mark-paid`, { paymentId });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}

// ─── Company Hooks (B2B) ────────────────────────────────────────────

export function useCompanies(params?: CompaniesQueryParams) {
  return useQuery({
    queryKey: queryKeys.companies(params),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Company>>('/b2b/companies', { params });
      return data;
    },
  });
}

export function useSuspendCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { data } = await api.post<Company>(`/b2b/companies/${id}/suspend`, { reason });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
}

export function useActivateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<Company>(`/b2b/companies/${id}/activate`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
}

// ─── Contract Hooks ─────────────────────────────────────────────────

export function useContracts(params?: ContractsQueryParams) {
  return useQuery({
    queryKey: queryKeys.contracts(params),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Contract>>('/contracts', { params });
      return data;
    },
  });
}

export function useContractSummary() {
  return useQuery({
    queryKey: queryKeys.contractSummary(),
    queryFn: async () => {
      const { data } = await api.get<ContractSummary>('/contracts/summary');
      return data;
    },
  });
}

// ─── Accounting / Revenue Hooks ─────────────────────────────────────

export function useRevenueEntries(params?: RevenueEntriesQueryParams) {
  return useQuery({
    queryKey: queryKeys.revenueEntries(params),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<RevenueEntry>>(
        '/accounting/revenue-entries',
        { params },
      );
      return data;
    },
  });
}

export function useRevenueSummary(params?: RevenueSummaryQueryParams) {
  return useQuery({
    queryKey: queryKeys.revenueSummary(params),
    queryFn: async () => {
      const { data } = await api.get<RevenueSummary>('/accounting/revenue-summary', { params });
      return data;
    },
  });
}

export function useAccountingPeriods() {
  return useQuery({
    queryKey: queryKeys.accountingPeriods(),
    queryFn: async () => {
      const { data } = await api.get<AccountingPeriod[]>('/accounting/periods');
      return data;
    },
  });
}

export function useClosePeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const { data } = await api.post<AccountingPeriod>(
        `/accounting/periods/${id}/close`,
        { notes },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-periods'] });
      queryClient.invalidateQueries({ queryKey: ['revenue-entries'] });
      queryClient.invalidateQueries({ queryKey: ['revenue-summary'] });
    },
  });
}

export function useReopenPeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<AccountingPeriod>(`/accounting/periods/${id}/reopen`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-periods'] });
      queryClient.invalidateQueries({ queryKey: ['revenue-entries'] });
      queryClient.invalidateQueries({ queryKey: ['revenue-summary'] });
    },
  });
}

// ─── Visitor Hooks ──────────────────────────────────────────────────

export function useVisitors(params?: VisitorsQueryParams) {
  return useQuery({
    queryKey: queryKeys.visitors(params),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Visitor>>('/visitors', { params });
      return data;
    },
  });
}

export function useVisitorStats(locationId: string) {
  return useQuery({
    queryKey: queryKeys.visitorStats(locationId),
    queryFn: async () => {
      const { data } = await api.get<VisitorStats>(`/visitors/stats/${locationId}`);
      return data;
    },
    enabled: !!locationId,
  });
}

export function useTodaysVisitors(locationId: string) {
  return useQuery({
    queryKey: queryKeys.todaysVisitors(locationId),
    queryFn: async () => {
      const { data } = await api.get<Visitor[]>(`/visitors/today/${locationId}`);
      return data;
    },
    enabled: !!locationId,
  });
}

export function useCheckInVisitor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<Visitor>(`/visitors/${id}/check-in`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
    },
  });
}

export function useCheckOutVisitor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<Visitor>(`/visitors/${id}/check-out`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
    },
  });
}

// ─── Access Hooks ───────────────────────────────────────────────────

export function useAccessKeys(params?: AccessKeysQueryParams) {
  return useQuery({
    queryKey: queryKeys.accessKeys(params),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<AccessKey>>('/access/keys', { params });
      return data;
    },
  });
}

export function useAccessLogs(params?: AccessLogsQueryParams) {
  return useQuery({
    queryKey: queryKeys.accessLogs(params),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<AccessLog>>('/access/logs', { params });
      return data;
    },
  });
}

export function useAccessStats(locationId: string) {
  return useQuery({
    queryKey: queryKeys.accessStats(locationId),
    queryFn: async () => {
      const { data } = await api.get<AccessStats>(`/access/stats/${locationId}`);
      return data;
    },
    enabled: !!locationId,
  });
}
