import api from './api';

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
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

export async function getLocations(): Promise<Location[]> {
  const { data } = await api.get<Location[]>('/locations');
  return data;
}

export async function getLocationById(id: string): Promise<Location> {
  const { data } = await api.get<Location>(`/locations/${id}`);
  return data;
}
