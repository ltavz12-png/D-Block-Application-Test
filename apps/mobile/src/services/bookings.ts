import api from './api';

export interface Booking {
  id: string;
  userId: string;
  resourceId: string;
  resource?: {
    id: string;
    name: string;
    resourceType: string;
    locationId: string;
    location?: { id: string; name: string; city: string };
  };
  startTime: string;
  endTime: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  currency: string;
  notes: string | null;
  cancelledAt: string | null;
  checkedInAt: string | null;
  createdAt: string;
}

export interface CreateBookingPayload {
  resourceId: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export async function getMyBookings(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: Booking[]; total: number }> {
  const { data } = await api.get<{ data: Booking[]; total: number }>(
    '/bookings/my',
    { params },
  );
  return data;
}

export async function getBookingById(id: string): Promise<Booking> {
  const { data } = await api.get<Booking>(`/bookings/${id}`);
  return data;
}

export async function createBooking(
  payload: CreateBookingPayload,
): Promise<Booking> {
  const { data } = await api.post<Booking>('/bookings', payload);
  return data;
}

export async function cancelBooking(
  id: string,
  reason?: string,
): Promise<Booking> {
  const { data } = await api.post<Booking>(`/bookings/${id}/cancel`, { reason });
  return data;
}
