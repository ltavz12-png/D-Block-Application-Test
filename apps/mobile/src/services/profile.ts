import api from './api';

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  preferredLanguage?: string;
}

export interface NotificationPreferences {
  push: boolean;
  email: boolean;
  sms: boolean;
  marketing: boolean;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<any> {
  const { data } = await api.patch('/users/me', payload);
  return data;
}

export async function updateNotificationPreferences(
  prefs: NotificationPreferences,
): Promise<any> {
  const { data } = await api.patch('/users/me', { notificationPreferences: prefs });
  return data;
}
