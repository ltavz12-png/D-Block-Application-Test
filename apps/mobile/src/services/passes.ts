import api from './api';
import type { Product, RateCode } from './products';

export interface UserPass {
  id: string;
  userId: string;
  productId: string;
  product?: Product;
  rateCodeId: string | null;
  rateCode?: RateCode | null;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'cancelled' | 'suspended' | 'pending_payment';
  autoRenew: boolean;
  totalPaid: string;
  currency: string;
  paymentId: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  refundAmount: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface PurchasePassPayload {
  productId: string;
  rateCodeId?: string;
  startDate: string;
  autoRenew?: boolean;
  paymentId?: string;
  metadata?: Record<string, unknown>;
}

export async function purchasePass(
  payload: PurchasePassPayload,
): Promise<UserPass> {
  const { data } = await api.post<UserPass>('/passes', payload);
  return data;
}

export async function getMyPasses(): Promise<UserPass[]> {
  const { data } = await api.get<UserPass[]>('/passes/my');
  return data;
}

export async function getMyActivePasses(): Promise<UserPass[]> {
  const { data } = await api.get<UserPass[]>('/passes/my/active');
  return data;
}

export async function getPassById(id: string): Promise<UserPass> {
  const { data } = await api.get<UserPass>(`/passes/${id}`);
  return data;
}

export async function cancelPass(
  id: string,
  reason?: string,
): Promise<UserPass> {
  const { data } = await api.post<UserPass>(`/passes/${id}/cancel`, { reason });
  return data;
}
