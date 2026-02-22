import api from './api';

export interface RateCode {
  id: string;
  code: string;
  name: string;
  nameKa: string | null;
  productId: string;
  amount: string;
  currency: string;
  taxInclusive: boolean;
  taxRate: string;
  conditions: {
    validFrom?: string;
    validUntil?: string;
    minQuantity?: number;
    locationIds?: string[];
  } | null;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  nameKa: string | null;
  description: string | null;
  descriptionKa: string | null;
  productType: string;
  billingPeriod: string;
  locationId: string | null;
  isActive: boolean;
  includedResources: {
    resourceType: string;
    hoursPerMonth?: number;
    description?: string;
  }[] | null;
  features: string[] | null;
  sortOrder: number;
  rateCodes: RateCode[];
  createdAt: string;
}

export async function getProducts(params?: {
  locationId?: string;
  type?: string;
}): Promise<Product[]> {
  const { data } = await api.get<Product[] | { data: Product[] }>('/products', { params });
  return Array.isArray(data) ? data : data.data;
}

export async function getProductById(id: string): Promise<Product> {
  const { data } = await api.get<Product>(`/products/${id}`);
  return data;
}
