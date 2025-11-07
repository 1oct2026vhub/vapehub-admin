import axiosInstance from '@/utils/axiosApi';

export interface FlashNews {
  id: number;
  label: string;
  url: string;
  status: boolean;
  deleted_at?: string | null;
}

export interface FlashNewsListResponse {
  data: {
    flashNews: FlashNews[];
    pagination: {
      total: number;
      page: number;
      limit: number;
    };
  };
}

export async function getFlashNews(params: { deleted?: boolean; search?: string; page?: number; limit?: number } = {}): Promise<FlashNewsListResponse> {
  const response = await axiosInstance.get('/api/admin/flash-news', { params });
  return response.data;
}

export async function createOrUpdateFlashNews(data: { label: string; url: string; status: boolean }): Promise<any> {
  const response = await axiosInstance.post('/api/admin/flash-news', data);
  return response.data;
}

export async function updateFlashNews(id: number, data: { label: string; url: string; status: boolean }): Promise<any> {
  const response = await axiosInstance.put(`/api/admin/flash-news/${id}`, data);
  return response.data;
}

export async function deleteFlashNews(id: number): Promise<any> {
  const response = await axiosInstance.delete(`/api/admin/flash-news/${id}`);
  return response.data;
}

export async function restoreFlashNews(id: number): Promise<any> {
  const response = await axiosInstance.patch(`/api/admin/flash-news/${id}/restore`);
  return response.data;
}

export async function bulkDeleteFlashNews(ids: number[]): Promise<any> {
  const response = await axiosInstance.delete('/api/admin/flash-news/bulk-delete', {
    data: { ids }
  });
  return response.data;
}

export async function bulkRestoreFlashNews(ids: number[]): Promise<any> {
  const response = await axiosInstance.put('/api/admin/flash-news/bulk-restore', {
    ids
  });
  return response.data;
} 