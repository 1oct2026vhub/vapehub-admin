import { fetcher, deleter, poster, updater,patcher } from './apiService';
import axiosInstance from '@/utils/axiosApi';

// Based on the user provided response
export interface TieredQty {
  min: number;
  discount: number;
}

export interface ProductInDeal {
  id: number;
  name: string;
  slug: string;
}

export interface Deal {
  id: number;
  name: string;
  slug: string;
  deal_type: 'BUY_MORE_SAVE_MORE' | 'BUY_X_GET_Y_FREE' | 'BUY_N_FOR_FIXED';
  required_qty: number | null;
  get_qty: number | null;
  fixed_price: string | null;
  discount_percent: number | null;
  tiered_qty_json: TieredQty[] | null;
  bundle_product_ids_json: number[] | null;
  is_active: boolean;
  valid_from: string;
  valid_to: string;
  is_deleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  products: ProductInDeal[];
}


export interface FetchDealsParams {
  page?: number;
  limit?: number;
  status?: boolean;
  type?: string;
  validNow?: boolean;
  search?: string;
  deleted?: boolean;
}

export interface DealsApiResponse {
  success: boolean;
  message: string;
  data: {
    deals: Deal[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }
}

export const getDeals = (params: FetchDealsParams): Promise<DealsApiResponse> => {
    return fetcher('/api/admin/deals', params);
};

export const deleteDeal = (id: number): Promise<void> => {
    return deleter(`/api/admin/deals/${id}`);
};

export const restoreDeal = (id: number): Promise<void> => {
    return patcher(`/api/admin/deals/${id}/restore`, {});
};

export interface DealFormData {
  name: string;
  deal_type: 'BUY_MORE_SAVE_MORE' | 'BUY_X_GET_Y_FREE' | 'BUY_N_FOR_FIXED';
  is_active: boolean;
  valid_from: string;
  valid_to: string;
  required_qty?: number | null;
  get_qty?: number | null;
  fixed_price?: string | null;
  discount_percent?: number | null;
  tiered_qty_json?: TieredQty[] | null;
  bundle_product_ids_json?: number[] | null;
}

export const createDeal = (data: DealFormData): Promise<Deal> => {
    return poster('/api/admin/deals', data);
};

export const updateDeal = (id: number, data: Partial<DealFormData>): Promise<Deal> => {
    return updater(`/api/admin/deals/${id}`, data);
};

export const addProductsToDeal = (id: number, product_ids: number[]): Promise<void> => {
    return poster(`/api/admin/deals/${id}/products`, { product_ids });
};

export const getDealById = (id: number): Promise<{ data: Deal }> => {
    return fetcher(`/api/admin/deals/${id}`);
};

export const removeProductsFromDeal = async (dealId: number, product_ids: number[]): Promise<void> => {
    const response = await axiosInstance.delete(`/api/admin/deals/${dealId}/products/remove`, {
        data: { product_ids },
    });
    return response.data;
};


