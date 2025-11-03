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
  description?: string | null;
  is_deleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  products: ProductInDeal[];
  image_url?: string;
}


export interface FetchDealsParams {
  page?: number;
  limit?: number;
  status?: boolean;
  type?: string;
  validNow?: boolean;
  search?: string;
  deleted?: boolean;
  product_id?: number;
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
  fixed_price?: number | null;
  discount_percent?: number | null;
  tiered_qty_json?: TieredQty[] | null;
  bundle_product_ids_json?: number[] | null;
  description?: string | null;
  image?: File | null | string;
}

const buildFormData = (data: Partial<DealFormData>): FormData => {
    const formData = new FormData();
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const value = data[key];
            if (value === null || value === undefined) continue;
            if (key === 'image') {
                if (value instanceof File) {
                    formData.append(key, value);
                }
            } else if (Array.isArray(value)) {
                if(value.length > 0){
                    formData.append(key, JSON.stringify(value));
                }
            } else {
                formData.append(key, String(value));
            }
        }
    }
    return formData;
}

export const createDeal = (data: DealFormData): Promise<Deal> => {
    const formData = buildFormData(data);
    return poster('/api/admin/deals', formData);
};

export const updateDeal = (id: number, data: Partial<DealFormData>): Promise<Deal> => {
    const formData = buildFormData(data);
    return updater(`/api/admin/deals/${id}`, formData);
};

interface StockWarningDetails {
    variant_id: number;
    variant_slug: string;
    stock: number;
    low_stock_threshold: number;
    message: string;
}

interface StockIssue {
    product_id: number;
    product_name: string;
    issue: string;
    out_of_stock_variants: number;
    total_variants: number;
    out_of_stock_variant_details: StockWarningDetails[];
}

interface Warnings {
    stock_issues: StockIssue[];
    message: string;
    has_low_stock: boolean;
    has_out_of_stock: boolean;
}

export interface AddProductsToDealResponse {
    status: string;
    message: string;
    data: Deal;
    warnings?: Warnings;
}

export const addProductsToDeal = (id: number, product_ids: number[]): Promise<AddProductsToDealResponse> => {
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


