import { fetcher, deleter, poster, updater } from './apiService';

export interface LoyaltyPointSetting {
  id: number;
  program_name: string;
  points_value: string | number;
  loyalty_amount: string | number;
  loyalty_amount_type: string;
  minimum_points_redemption: number;
  minimum_purchase_amount: string | number;
  status: boolean;
  updated_by: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  updatedBy: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface CreateLoyaltyPointSettingData {
    program_name: string;
    points_value: number;
    loyalty_amount: number;
    loyalty_amount_type: 'percentage' | 'fixed';
    minimum_points_redemption: number;
    minimum_purchase_amount: number;
    status: boolean;
}

export interface FetchLoyaltyPointsSettingsParams {
    page?: number;
    limit?: number;
    status?: string;
}

export interface ListLoyaltyPointsSettingsApiResponse {
    success: boolean;
    message: string;
    data: {
        settings: LoyaltyPointSetting[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            total_pages: number;
        };
    };
}

export interface GetLoyaltyPointSettingApiResponse {
    success: boolean;
    message: string;
    data: LoyaltyPointSetting;
}

export const getLoyaltyPointsSettings = (params: FetchLoyaltyPointsSettingsParams): Promise<ListLoyaltyPointsSettingsApiResponse> => {
    return fetcher('/api/admin/loyalty-points/settings', params);
};

export const createLoyaltyPointSetting = (data: CreateLoyaltyPointSettingData): Promise<LoyaltyPointSetting> => {
    return poster('/api/admin/loyalty-points/settings', data);
};

export const getLoyaltyPointSettingById = (id: number): Promise<GetLoyaltyPointSettingApiResponse> => {
    return fetcher(`/api/admin/loyalty-points/settings/${id}`);
};

export const updateLoyaltyPointSetting = (id: number, data: Partial<CreateLoyaltyPointSettingData>): Promise<LoyaltyPointSetting> => {
    return updater(`/api/admin/loyalty-points/settings/${id}`, data);
};

export const deleteLoyaltyPointSetting = (id: number): Promise<void> => {
    return deleter(`/api/admin/loyalty-points/settings/${id}`);
}; 