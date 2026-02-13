import axiosInstance from '@/utils/axiosApi';

export interface Subscriber {
  id: number;
  email: string;
  user_id: number | null;
  createdAt: string;
  subscribed?: boolean; // Add subscription status
}

export interface SubscribersApiResponse {
  success: boolean;
  data: {
    subscribers: Subscriber[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
  message: string;
}

export interface FetchSubscribersParams {
  page?: number;
  limit?: number;
  search?: string;
  subscribed?: boolean;
}

export async function getSubscribers(params: FetchSubscribersParams = {}): Promise<SubscribersApiResponse> {
  const response = await axiosInstance.get('/api/admin/mail-subscription-settings/subscribers', { params });
  return response.data;
}

/**
 * PATCH /api/admin/mail-subscription-settings/subscribers/:id/unsubscribe
 */
export async function unsubscribeSubscriber(id: number): Promise<{ success: boolean; message?: string }> {
  const response = await axiosInstance.patch(
    `/api/admin/mail-subscription-settings/subscribers/${id}/unsubscribe`
  );
  return response.data;
}

/**
 * DELETE /api/admin/mail-subscription-settings/subscribers/:id
 */
export async function deleteSubscriber(id: number): Promise<{ success: boolean; message?: string }> {
  const response = await axiosInstance.delete(
    `/api/admin/mail-subscription-settings/subscribers/${id}`
  );
  return response.data;
}

