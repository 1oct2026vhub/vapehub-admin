import axiosInstance from "@/utils/axiosApi";

export interface Setting {
  id: number;
  content_key: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SettingListParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  order?: "ASC" | "DESC";
  search?: string;
  content_key?: string;
  is_active?: boolean;
  deleted?: boolean;
}

export interface SettingListResponse {
  success: boolean;
  message: string;
  data: {
    total: number;
    page: number;
    limit: number;
    results: Setting[];
  };
}

export interface SettingDetailResponse {
  success: boolean;
  message: string;
  data: Setting;
}

export interface SettingDeleteResponse {
  success: boolean;
  message: string;
  data: string;
}

export interface CreateOrUpdateSettingData {
  content_key: string;
  content: string;
  is_active: boolean;
}

export interface UpdateSettingData {
  content: string;
  is_active: boolean;
}

export interface CreateOrUpdateSettingResponse {
  success: boolean;
  message: string;
  data: Setting;
}

export interface LegalContentKeysResponse {
  success: boolean;
  message: string;
  data: {
    legal_content_keys: Record<string, string>;
    legal_content_keys_array: string[];
    count: number;
    description: string;
  };
}

export const listSettings = async (
  params: SettingListParams = {},
): Promise<SettingListResponse> => {
  const {
    page = 1,
    limit = 10,
    sort_by = "created_at",
    order = "DESC",
    search = "",
    content_key = "",
    is_active,
    deleted = false,
  } = params;

  const response = await axiosInstance.get("/api/admin/settings", {
    params: {
      page,
      limit,
      sort_by,
      order,
      ...(search && { search }),
      ...(content_key && { content_key }),
      ...(is_active !== undefined && { is_active }),
      deleted,
    },
  });

  return response.data;
};

export const getSettingDetails = async (
  id: string | number,
): Promise<SettingDetailResponse> => {
  try {
    const response = await axiosInstance.get(`/api/admin/settings/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || "Failed to fetch setting details",
    );
  }
};

export const deleteSetting = async (
  id: string | number,
): Promise<SettingDeleteResponse> => {
  const response = await axiosInstance.delete(`/api/admin/settings/${id}`);
  return response.data;
};

// Get available legal content keys
export const getLegalContentKeys = async (): Promise<LegalContentKeysResponse> => {
  const response = await axiosInstance.get("/api/admin/settings/legal-content-keys");
  return response.data;
};

// Create or update setting by content_key (POST)
export const createOrUpdateSetting = async (
  data: CreateOrUpdateSettingData,
): Promise<CreateOrUpdateSettingResponse> => {
  const response = await axiosInstance.post("/api/admin/settings", data);
  return response.data;
};

// Update setting by ID (PUT)
export const updateSetting = async (
  id: string | number,
  data: UpdateSettingData,
): Promise<CreateOrUpdateSettingResponse> => {
  const response = await axiosInstance.put(`/api/admin/settings/${id}`, data);
  return response.data;
};
