import api from './api';

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  createdAt: string;
}

export interface CreatePaymentPayload {
  bookingId: string;
  provider: string;
  amount: number;
  currency?: string;
}

export async function getMyPayments(): Promise<Payment[]> {
  const { data } = await api.get<Payment[]>('/payments/my');
  return data;
}

export async function createPayment(
  payload: CreatePaymentPayload,
): Promise<Payment> {
  const { data } = await api.post<Payment>('/payments', payload);
  return data;
}
