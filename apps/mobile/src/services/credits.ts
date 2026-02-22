import api from './api';

export interface CreditBalance {
  balance: number;
  currency: string;
}

export interface CreditTransaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

export async function getCreditBalance(): Promise<CreditBalance> {
  try {
    const { data } = await api.get<CreditBalance>('/credits/balance');
    return data;
  } catch {
    return { balance: 0, currency: 'GEL' };
  }
}

export async function getCreditHistory(): Promise<CreditTransaction[]> {
  try {
    const { data } = await api.get<CreditTransaction[]>('/credits/history');
    return data;
  } catch {
    return [];
  }
}
