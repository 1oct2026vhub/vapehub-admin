import { fetcher, deleter, poster, updater } from './apiService';
import axiosInstance from '@/utils/axiosApi';

export interface PopularCategory {
  id: number;
  title: string;
  description?: string;
  status?: string;
  order?: number;
  category_id?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface FetchPopularCategoryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'id' | 'title' | 'description' | 'status' | 'order' | 'createdAt' | 'updatedAt';
  sortOrder?: 'ASC' | 'DESC';
  deleted?: boolean;
}

export interface ListPopularCategoryApiResponse {
  success: boolean;
  message: string;
  data: {
    popularCategories: PopularCategory[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
}

export const listPopularCategory = (params: FetchPopularCategoryParams = {}): Promise<ListPopularCategoryApiResponse> => {
  return fetcher('/api/admin/popularCategory', params);
};

export interface CreatePopularCategoryPayload {
  title: string;
  description?: string;
  status?: boolean;
  order?: number;
  category_id?: number;
}

export const createPopularCategory = (payload: CreatePopularCategoryPayload): Promise<any> => {
  return poster('/api/admin/popularCategory', payload);
};

export const updatePopularCategory = (id: number, payload: CreatePopularCategoryPayload): Promise<any> => {
  return updater(`/api/admin/popularCategory/${id}`, payload);
};

export const deletePopularCategory = (id: number): Promise<void> => {
  return deleter(`/api/admin/popularCategory/${id}`);
};

export const restorePopularCategory = (id: number): Promise<void> => {
  return updater(`/api/admin/popularCategory/${id}/restore`, {});
};

export const getPopularCategoryDetails = (id: number): Promise<{ success: boolean; data: { popularCategory: PopularCategory } }> => {
  return fetcher(`/api/admin/popularCategory/${id}`);
};

// Bulk delete popular categories by IDs
export const bulkDeletePopularCategory = async (ids: number[]) => {
  const response = await axiosInstance.delete(
    '/api/admin/popularCategory/bulk-delete',
    {
      data: { ids },
    }
  );
  return response.data;
};

// Bulk restore soft-deleted popular categories by IDs
export const bulkRestorePopularCategory = async (ids: number[]) => {
  const response = await axiosInstance.put(
    '/api/admin/popularCategory/bulk-restore',
    { ids }
  );
  return response.data;
};

// Update popular category order
export const updatePopularCategoryOrder = async (id: number, newOrder: number): Promise<any> => {
  const response = await axiosInstance.put(
    `/api/admin/popularCategory/${id}/shuffle-order`,
    { new_order: newOrder }
  );
  return response.data;
};

