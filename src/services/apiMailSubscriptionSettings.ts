import axiosInstance from '@/utils/axiosApi';

export interface MailSubscriptionSetting {
  id: number;
  email_frequency: 'daily' | 'weekly' | 'monthly';
  product_updates: boolean;
  discount_notifications: boolean;
  discount_amount: number;
  discount_type: 'percentage' | 'fixed';
  status: boolean;
  created_at: string;
  updated_at: string;
  deletedAt?: string | null;
}

export interface SingleSettingApiResponse {
    success: boolean;
    data: MailSubscriptionSetting;
    message: string;
}

export interface MailSubscriptionSettingsApiResponse {
  success: boolean;
  data: {
    settings: MailSubscriptionSetting[];
    pagination: {
      total: number;
      page: number;
      limit: number;
    };
  };
  message: string;
}

export interface FetchSettingsParams {
  page?: number;
  limit?: number;
}

export type UpdateSettingData = Partial<CreateSettingData>;

export async function getMailSubscriptionSettings(params: FetchSettingsParams = {}): Promise<MailSubscriptionSettingsApiResponse> {
  const response = await axiosInstance.get('/api/admin/mail-subscription-settings', { params });
  return response.data;
}

export async function getSettingById(id: number): Promise<SingleSettingApiResponse> {
    const response = await axiosInstance.get(`/api/admin/mail-subscription-settings/${id}`);
    return response.data;
}

export interface CreateSettingData {
  email_frequency: 'daily' | 'weekly' | 'monthly';
  product_updates: boolean;
  discount_notifications: boolean;
  discount_amount: number;
  discount_type: 'percentage' | 'fixed_amount';
  status: boolean;
}

export async function createSetting(data: CreateSettingData): Promise<any> {
  const response = await axiosInstance.post('/api/admin/mail-subscription-settings', data);
  return response.data;
}

export async function getMailSubscriptionSettingById(id: number): Promise<{ data: MailSubscriptionSetting }> {
  const response = await axiosInstance.get(`/api/admin/mail-subscription-settings/${id}`);
  return response.data;
}

export async function updateSetting(id: number, data: Partial<CreateSettingData>): Promise<any> {
  const response = await axiosInstance.put(`/api/admin/mail-subscription-settings/${id}`, data);
  return response.data;
}

export async function deleteSetting(id: number): Promise<any> {
  const response = await axiosInstance.delete(`/api/admin/mail-subscription-settings/${id}`);
  return response.data;
}

export interface SubscriberStatsData {
  totalSubscribers: number;
  recentSubscribers: number;
  frequencyStats: {
    [key: string]: number;
  };
}

export interface SubscriberStatsApiResponse {
    success: boolean;
    data: SubscriberStatsData;
    message: string;
}

export async function getSubscriberStats(): Promise<SubscriberStatsApiResponse> {
  const response = await axiosInstance.get('/api/admin/mail-subscription-settings/subscribers/stats');
  return response.data;
}

export async function restoreSetting(id: number): Promise<any> {
  const response = await axiosInstance.post(`/api/admin/mail-subscription-settings/${id}/restore`);
  return response.data;
} 

export interface PromotionalEmailData {
  subject?: string;
  content?: string;
  templateId?: string;
  groupId?: string;
  highlightText?: string;
  ctaText?: string;
  ctaUrl?: string;
  sendToAll: boolean;
  selectedEmails?: string[];
  images?: {
    url: string;
    alt: string;
    isPrimary?: boolean;
  }[];
}

export async function sendPromotionalEmail(data: PromotionalEmailData): Promise<any> {
  const response = await axiosInstance.post('/api/admin/mail-subscription-settings/promotional/send', data);
  return response.data;
} 