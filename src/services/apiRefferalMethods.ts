import axiosInstance from '@/utils/axiosApi';

export interface ReferralMethod {
  id: number;
  referral_value_type: 'percentage' | 'fixed_amount';
  referral_value: string;
  refer_type: 'referrer' | 'referred';
  status: 'active' | 'inactive';
  primary: boolean;
  minimum_purchase: number;
  maximum_purchase: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateReferralMethodData {
  referral_value_type: 'percentage' | 'fixed_amount';
  referral_value: string;
  refer_type: 'referrer' | 'referred';
  status: 'active' | 'inactive';
  primary: boolean;
  minimum_purchase?: number;
  maximum_purchase?: number;
}

export interface FetchReferralMethodsParams {
  page?: number;
  limit?: number;
  status?: 'active' | 'inactive';
  primary?: boolean;
  search?: string;
  sort_by?: 'id' | 'referral_value_type' | 'referral_value' | 'status' | 'primary' | 'created_at' | 'updated_at';
  order?: 'ASC' | 'DESC';
}

export interface ReferralMethodResponse {
  data: {
    data: ReferralMethod[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  };
}

export const getReferralMethods = async (params: FetchReferralMethodsParams): Promise<ReferralMethodResponse> => {
  const response = await axiosInstance.get('/api/admin/referral-method', { params });
  return response.data;
};

export const deleteReferralMethod = async (id: number): Promise<any> => {
	const response = await axiosInstance.delete(`/api/admin/referral-method/${id}`);
	return response.data;
};

export const createReferralMethod = async (data: CreateReferralMethodData): Promise<any> => {
  const response = await axiosInstance.post('/api/admin/referral-method', data);
	return response.data;
}

export const getReferralMethodById = async (id: number): Promise<any> => {
	const response = await axiosInstance.get(`/api/admin/referral-method/${id}`);
	return response.data;
}

export const updateReferralMethod = async (id: number, data: CreateReferralMethodData): Promise<any> => {
	const response = await axiosInstance.put(`/api/admin/referral-method/${id}`, data);
	return response.data;
} 