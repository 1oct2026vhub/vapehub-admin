import axiosInstance from '@/utils/axiosApi';

export interface Coupon {
  id: number;
  code: string;
  description: string;
  status: 'active' | 'inactive' | 'expired';
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  entity_type?: 'product' | 'brand' | 'category' | null;
  start_date: string;
  end_date: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CouponListResponse {
  data: {
    coupons: Coupon[];
    pagination: {
      total: number;
      page: number;
      limit: number;
    };
  };
}

export interface FetchCouponsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive' | 'expired';
  discount_type?: 'percentage' | 'fixed_amount';
  entity_type?: 'product' | 'brand' | 'category';
  entity_id?: number;
  start_date?: string;
  end_date?: string;
  deleted?: boolean;
}

export interface CreateCouponData {
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  minimum_purchase: number;
  maximum_discount: number;
  usage_limit: number;
  is_single_use: boolean;
  start_date: string;
  end_date: string;
  status: 'active' | 'inactive' | 'expired';
  entity_type?: 'product' | 'brand' | 'category' | null;
  entity_id?: string | number | null;
}

export async function getCoupons(params: FetchCouponsParams = {}): Promise<CouponListResponse> {
  const response = await axiosInstance.get('/api/admin/coupons', { params });
  return response.data;
}

export async function deleteCoupon(id: number): Promise<any> {
  const response = await axiosInstance.delete(`/api/admin/coupons/${id}`);
  return response.data;
}

export async function restoreCoupon(id: number): Promise<any> {
  const response = await axiosInstance.post(`/api/admin/coupons/${id}/restore`);
  return response.data;
}

export async function createCoupon(data: CreateCouponData): Promise<any> {
  const response = await axiosInstance.post('/api/admin/coupons', data);
  return response.data;
}

export async function getCouponById(id: number): Promise<any> {
  const response = await axiosInstance.get(`/api/admin/coupons/${id}`);
  return response.data;
}

export async function updateCoupon(id: number, data: CreateCouponData): Promise<any> {
  const response = await axiosInstance.put(`/api/admin/coupons/${id}`, data);
  return response.data;
}

export async function bulkDeleteCoupons(ids: number[]): Promise<any> {
  const response = await axiosInstance.delete('/api/admin/coupons/bulk-delete', {
    data: { ids }
  });
  return response.data;
}

export async function bulkRestoreCoupons(ids: number[]): Promise<any> {
  const response = await axiosInstance.put('/api/admin/coupons/bulk-restore', {
    ids
  });
  return response.data;
} 