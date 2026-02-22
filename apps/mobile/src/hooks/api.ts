import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLocations, getLocationById } from '@/services/locations';
import { getResources, getResourceById } from '@/services/resources';
import {
  getMyBookings,
  getBookingById,
  createBooking,
  cancelBooking,
  CreateBookingPayload,
} from '@/services/bookings';
import { getMyPayments, createPayment, CreatePaymentPayload } from '@/services/payments';
import {
  updateProfile,
  updateNotificationPreferences,
  UpdateProfilePayload,
  NotificationPreferences,
} from '@/services/profile';
import { getCreditBalance, getCreditHistory } from '@/services/credits';
import { getProducts, getProductById } from '@/services/products';
import {
  getMyPasses,
  getMyActivePasses,
  getPassById,
  purchasePass,
  cancelPass,
  PurchasePassPayload,
} from '@/services/passes';
import {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '@/services/notifications';
import {
  getMyVisitors,
  inviteVisitor,
  cancelVisitor,
  InviteVisitorPayload,
} from '@/services/visitors';
import {
  getEvents,
  getEventById,
  getMyTickets,
  purchaseTicket,
  PurchaseTicketPayload,
} from '@/services/events';
import {
  getCommunityPosts,
  getCommunityMembers,
  likePost,
  unlikePost,
} from '@/services/community';

// ── Location Hooks ─────────────────────────────────────────────

export function useLocations() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: getLocations,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLocation(id: string) {
  return useQuery({
    queryKey: ['locations', id],
    queryFn: () => getLocationById(id),
    enabled: !!id,
  });
}

// ── Resource Hooks ─────────────────────────────────────────────

export function useResources(params?: { locationId?: string; resourceType?: string }) {
  return useQuery({
    queryKey: ['resources', params],
    queryFn: () => getResources(params),
  });
}

export function useResource(id: string) {
  return useQuery({
    queryKey: ['resources', id],
    queryFn: () => getResourceById(id),
    enabled: !!id,
  });
}

// ── Booking Hooks ──────────────────────────────────────────────

export function useMyBookings(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['bookings', 'my', params],
    queryFn: () => getMyBookings(params),
  });
}

export function useUpcomingBookings() {
  return useQuery({
    queryKey: ['bookings', 'upcoming'],
    queryFn: () => getMyBookings({ status: 'confirmed' }),
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: ['bookings', id],
    queryFn: () => getBookingById(id),
    enabled: !!id,
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBookingPayload) => createBooking(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => cancelBooking(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  });
}

// ── Payment Hooks ──────────────────────────────────────────────

export function useMyPayments() {
  return useQuery({ queryKey: ['payments', 'my'], queryFn: getMyPayments });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePaymentPayload) => createPayment(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

// ── Profile Hooks ──────────────────────────────────────────────

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateProfile(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['auth'] }),
  });
}

export function useUpdateNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (prefs: NotificationPreferences) => updateNotificationPreferences(prefs),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['auth'] }),
  });
}

// ── Credit Hooks ───────────────────────────────────────────────

export function useCreditBalance() {
  return useQuery({ queryKey: ['credits', 'balance'], queryFn: getCreditBalance });
}

export function useCreditHistory() {
  return useQuery({ queryKey: ['credits', 'history'], queryFn: getCreditHistory });
}

// ── Product Hooks ─────────────────────────────────────────────

export function useProducts(params?: { locationId?: string; type?: string }) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => getProducts(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => getProductById(id),
    enabled: !!id,
  });
}

// ── Pass / Membership Hooks ───────────────────────────────────

export function useMyPasses() {
  return useQuery({
    queryKey: ['passes', 'my'],
    queryFn: getMyPasses,
  });
}

export function useMyActivePasses() {
  return useQuery({
    queryKey: ['passes', 'my', 'active'],
    queryFn: getMyActivePasses,
  });
}

export function usePass(id: string) {
  return useQuery({
    queryKey: ['passes', id],
    queryFn: () => getPassById(id),
    enabled: !!id,
  });
}

export function usePurchasePass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PurchasePassPayload) => purchasePass(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['passes'] });
    },
  });
}

export function useCancelPass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => cancelPass(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['passes'] });
    },
  });
}

// ── Notification Hooks ──────────────────────────────────────────

export function useMyNotifications(params?: { page?: number; limit?: number; isRead?: boolean }) {
  return useQuery({
    queryKey: ['notifications', 'my', params],
    queryFn: () => getMyNotifications(params),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: getUnreadCount,
    refetchInterval: 30 * 1000,
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markAsRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => markAllAsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// ── Visitor Hooks ───────────────────────────────────────────────

export function useMyVisitors() {
  return useQuery({
    queryKey: ['visitors', 'my'],
    queryFn: getMyVisitors,
  });
}

export function useInviteVisitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: InviteVisitorPayload) => inviteVisitor(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visitors'] });
    },
  });
}

export function useCancelVisitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelVisitor(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visitors'] });
    },
  });
}

// ── Event Hooks ─────────────────────────────────────────────────

export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: getEvents,
    staleTime: 5 * 60 * 1000,
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ['events', id],
    queryFn: () => getEventById(id),
    enabled: !!id,
  });
}

export function useMyTickets() {
  return useQuery({
    queryKey: ['tickets', 'my'],
    queryFn: getMyTickets,
  });
}

export function usePurchaseTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PurchaseTicketPayload) => purchaseTicket(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] });
      qc.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

// ── Community Hooks ─────────────────────────────────────────────

export function useCommunityPosts() {
  return useQuery({
    queryKey: ['community', 'posts'],
    queryFn: getCommunityPosts,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCommunityMembers() {
  return useQuery({
    queryKey: ['community', 'members'],
    queryFn: getCommunityMembers,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLikePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => likePost(postId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community', 'posts'] });
    },
  });
}

export function useUnlikePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => unlikePost(postId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community', 'posts'] });
    },
  });
}
