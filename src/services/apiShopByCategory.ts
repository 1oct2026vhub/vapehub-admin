import { fetcher, deleter, poster, updater } from './apiService';
import axiosInstance from '@/utils/axiosApi';

export interface ShopByCategory {
  id: number;
  category_id?: number;
  image_url?: string;
  status?: boolean | string;
  order?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface FetchShopByCategoryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'id' | 'category_id' | 'image_url' | 'status' | 'order' | 'createdAt' | 'updatedAt';
  sortOrder?: 'ASC' | 'DESC';
  deleted?: boolean;
}

export interface ListShopByCategoryApiResponse {
  success: boolean;
  message: string;
  data: {
    shopByCategories: ShopByCategory[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
}

export const listShopByCategory = (params: FetchShopByCategoryParams = {}): Promise<ListShopByCategoryApiResponse> => {
  return fetcher('/api/admin/shopByCategory', params);
};

export interface CreateShopByCategoryPayload {
  category_id: number;
  image: File;
  status?: boolean;
  order?: number;
}

export interface UpdateShopByCategoryPayload {
  category_id?: number;
  image?: File | null;
  status?: boolean;
  order?: number;
}

export const createShopByCategory = async (payload: CreateShopByCategoryPayload): Promise<any> => {
  const formData = new FormData();
  formData.append('category_id', payload.category_id.toString());
  formData.append('image', payload.image);
  if (payload.status !== undefined) {
    formData.append('status', payload.status.toString());
  }
  if (payload.order !== undefined) {
    formData.append('order', payload.order.toString());
  }

  const response = await axiosInstance.post('/api/admin/shopByCategory', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateShopByCategory = async (id: number, payload: UpdateShopByCategoryPayload): Promise<any> => {
  const formData = new FormData();
  
  if (payload.category_id !== undefined) {
    formData.append('category_id', payload.category_id.toString());
  }
  if (payload.image instanceof File) {
    formData.append('image', payload.image);
  }
  if (payload.status !== undefined) {
    formData.append('status', payload.status.toString());
  }
  if (payload.order !== undefined) {
    formData.append('order', payload.order.toString());
  }

  const response = await axiosInstance.put(`/api/admin/shopByCategory/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteShopByCategory = (id: number): Promise<void> => {
  return deleter(`/api/admin/shopByCategory/${id}`);
};

export const restoreShopByCategory = (id: number): Promise<void> => {
  return updater(`/api/admin/shopByCategory/${id}/restore`, {});
};

export const getShopByCategoryDetails = (id: number): Promise<{ success: boolean; data: { shopByCategory: ShopByCategory } }> => {
  return fetcher(`/api/admin/shopByCategory/${id}`);
};

// Bulk delete shop by categories by IDs
export const bulkDeleteShopByCategory = async (ids: number[]) => {
  const response = await axiosInstance.delete(
    '/api/admin/shopByCategory/bulk-delete',
    {
      data: { ids },
    }
  );
  return response.data;
};

// Bulk restore soft-deleted shop by categories by IDs
export const bulkRestoreShopByCategory = async (ids: number[]) => {
  const response = await axiosInstance.put(
    '/api/admin/shopByCategory/bulk-restore',
    { ids }
  );
  return response.data;
};

// Update shop by category order
export const updateShopByCategoryOrder = async (id: number, newOrder: number): Promise<any> => {
  const response = await axiosInstance.put(
    `/api/admin/shopByCategory/${id}/shuffle-order`,
    { new_order: newOrder }
  );
  return response.data;
};

