import api from './api';

export interface Visitor {
  id: string;
  hostUserId: string;
  locationId: string;
  location?: { id: string; name: string; city: string };
  visitorName: string;
  visitorEmail: string | null;
  visitorPhone: string | null;
  purpose: string | null;
  expectedDate: string;
  expectedTime: string | null;
  notes: string | null;
  status: 'expected' | 'checked_in' | 'checked_out' | 'no_show' | 'cancelled';
  checkedInAt: string | null;
  checkedOutAt: string | null;
  createdAt: string;
}

export interface InviteVisitorPayload {
  locationId: string;
  visitorName: string;
  visitorEmail?: string;
  visitorPhone?: string;
  purpose?: string;
  expectedDate: string;
  expectedTime?: string;
  notes?: string;
}

export async function getMyVisitors(): Promise<Visitor[]> {
  const { data } = await api.get<Visitor[] | { data: Visitor[] }>('/visitors/my');
  return Array.isArray(data) ? data : data.data;
}

export async function inviteVisitor(payload: InviteVisitorPayload): Promise<Visitor> {
  const { data } = await api.post<Visitor>('/visitors', payload);
  return data;
}

export async function cancelVisitor(id: string): Promise<Visitor> {
  const { data } = await api.post<Visitor>(`/visitors/${id}/cancel`);
  return data;
}
