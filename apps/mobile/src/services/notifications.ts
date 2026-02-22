import api from './api';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  channel: string;
  isRead: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export async function getMyNotifications(params?: {
  page?: number;
  limit?: number;
  isRead?: boolean;
}): Promise<{ data: Notification[]; total: number }> {
  const { data } = await api.get<{ data: Notification[]; total: number }>(
    '/notifications/my',
    { params },
  );
  return data;
}

export async function getUnreadCount(): Promise<{ count: number }> {
  const { data } = await api.get<{ count: number }>('/notifications/my/unread-count');
  return data;
}

export async function markAsRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllAsRead(): Promise<void> {
  await api.post('/notifications/my/read-all');
}

export async function deleteNotification(id: string): Promise<void> {
  await api.delete(`/notifications/${id}`);
}
