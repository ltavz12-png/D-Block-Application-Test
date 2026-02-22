import api from './api';

export interface Resource {
  id: string;
  name: string;
  locationId: string;
  resourceType: string;
  block: string | null;
  floor: string | null;
  size: number;
  capacity: number;
  pricingModel: string;
  pricingDetails: {
    basePrice?: number;
    currency?: string;
    perHour?: number;
    perDay?: number;
    perMonth?: number;
  } | null;
  amenities: string[];
  imageUrls: string[];
  isActive: boolean;
  isBookable: boolean;
  createdAt: string;
}

export async function getResources(params?: {
  locationId?: string;
  resourceType?: string;
}): Promise<Resource[]> {
  const { data } = await api.get<{ data: Resource[] }>('/resources', { params });
  return data.data;
}

export async function getResourceById(id: string): Promise<Resource> {
  const { data } = await api.get<Resource>(`/resources/${id}`);
  return data;
}
