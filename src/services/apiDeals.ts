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
  show_home_page?: boolean;
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
  show_home_page: boolean;
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
  // Banner fields
  bannerImage?: File | string | null | undefined;
  bannerAlt?: string;
  bannerUrl?: string;
  bannerOrder?: number;
  bannerId?: number;
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

/**
 * Bulk delete deals
 * @param ids - Array of deal IDs to delete
 * @returns Promise containing the API response
 */
export async function bulkDeleteDeals(ids: number[]): Promise<any> {
  const response = await axiosInstance.delete('/api/admin/deals/bulk-delete', {
    data: { ids }
  });
  return response.data;
}

/**
 * Bulk restore soft-deleted deals
 * @param ids - Array of deal IDs to restore
 * @returns Promise containing the API response
 */
export async function bulkRestoreDeals(ids: number[]): Promise<any> {
  const response = await axiosInstance.put('/api/admin/deals/bulk-restore', {
    ids
  });
  return response.data;
}

// Entity Banner functions for deals
export const getEntityBanners = (params = {}) => {
  return fetcher('/api/entity-banners', params);
};

export const createEntityBanner = (bannerData: any) => {
  // Ensure type is lowercase and trimmed - this is critical for validation
  const type = (bannerData.type || "deal").toString().toLowerCase().trim();
  
  // If there's a file to upload, use FormData
  if (bannerData.image instanceof File) {
    const formData = new FormData();
    formData.append("type", type);
    formData.append("deals_id", bannerData.deals_id.toString());
    formData.append("image", bannerData.image);
    formData.append("alt", bannerData.alt !== undefined && bannerData.alt !== null ? bannerData.alt.toString() : "");
    formData.append("url", bannerData.url !== undefined && bannerData.url !== null && bannerData.url !== "" ? bannerData.url.toString() : "");
    formData.append("order", (bannerData.order !== undefined && bannerData.order !== null ? bannerData.order : 0).toString());

    return axiosInstance
      .post("/api/entity-banners", formData)
      .then((res) => res.data);
  } else {
    // Send as JSON when there's no file
    const payload: any = {
      type: type,
      deals_id: bannerData.deals_id,
      alt: bannerData.alt !== undefined && bannerData.alt !== null ? bannerData.alt.toString() : "",
      url: bannerData.url !== undefined && bannerData.url !== null && bannerData.url !== "" ? bannerData.url.toString() : "",
      order: bannerData.order !== undefined && bannerData.order !== null ? bannerData.order : 0,
    };

    // If image is a URL string, include it
    if (bannerData.image && typeof bannerData.image === "string") {
      payload.image = bannerData.image;
    }

    console.log("Creating entity banner with JSON payload:", payload);

    return axiosInstance
      .post("/api/entity-banners", payload, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((res) => res.data);
  }
};

export const updateEntityBanner = (id: number, bannerData: any) => {
  // Ensure type is lowercase and trimmed - this is critical for validation
  const type = (bannerData.type || "deal").toString().toLowerCase().trim();
  
  // If there's a file to upload, use FormData
  if (bannerData.image instanceof File) {
    const formData = new FormData();
    formData.append("type", type);
    
    if (bannerData.deals_id !== undefined && bannerData.deals_id !== null) {
      formData.append("deals_id", bannerData.deals_id.toString());
    }
    
    formData.append("image", bannerData.image);
    formData.append("alt", bannerData.alt !== undefined && bannerData.alt !== null ? bannerData.alt.toString() : "");
    formData.append("url", bannerData.url !== undefined && bannerData.url !== null && bannerData.url !== "" ? bannerData.url.toString() : "");
    formData.append("order", (bannerData.order !== undefined && bannerData.order !== null ? bannerData.order : 0).toString());

    return axiosInstance
      .put(`/api/entity-banners/${id}`, formData)
      .then((res) => res.data);
  } else {
    // Send as JSON when there's no file
    const payload: any = {
      type: type,
      alt: bannerData.alt !== undefined && bannerData.alt !== null ? bannerData.alt.toString() : "",
      url: bannerData.url !== undefined && bannerData.url !== null && bannerData.url !== "" ? bannerData.url.toString() : "",
      order: bannerData.order !== undefined && bannerData.order !== null ? bannerData.order : 0,
    };

    // Include deal_id if provided
    if (bannerData.deals_id !== undefined && bannerData.deals_id !== null) {
      payload.deals_id = bannerData.deals_id;
    }

    // If image is a URL string, include it
    if (bannerData.image && typeof bannerData.image === "string") {
      payload.image = bannerData.image;
    }

    console.log("Updating entity banner with JSON payload:", payload);

    return axiosInstance
      .put(`/api/entity-banners/${id}`, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((res) => res.data);
  }
};

export const deleteEntityBanner = (id: number) => deleter(`/api/entity-banners/${id}`);


