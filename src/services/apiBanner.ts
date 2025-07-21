import axiosInstance from '@/utils/axiosApi';

export interface BannerItem {
  id: number;
  display_order: number;
  image_url: string;
  image_url_low?: string; // Optional based on typical use cases
  title: string;
  description?: string; // Optional based on typical use cases
  status: 'active' | 'inactive';
  redirect_url?: string; // Optional
  updated_by?: number; // Optional
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null; // Optional
}

export interface FetchBannersParams {
  page?: number;
  limit?: number;
  sort_by?: 'id' | 'display_order' | 'title' | 'createdAt' | 'updatedAt';
  order?: 'ASC' | 'DESC';
  search?: string;
  deleted?: boolean;
  status?: 'active' | 'inactive';
}

export interface BannersApiResponse {
  success: boolean;
  message: string;
  data: {
    total: number;
    page: number;
    limit: number;
    results: BannerItem[];
  };
}

/**
 * Fetches a list of banners with pagination, sorting, and filtering.
 * GET /api/admin/banners
 */
export const getBanners = async (params: FetchBannersParams = {}): Promise<BannersApiResponse['data']> => {
  try {
    const response = await axiosInstance.get<BannersApiResponse>('api/admin/banners', { params });
    if (response.data && response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch banners');
  } catch (error: any) {
    console.error('Error fetching banners:', error);
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred while fetching banners.';
    // It's often better to let the calling component handle the error state and display messages
    // Re-throwing or returning a structure that indicates error can be useful.
    // For now, re-throwing the extracted message:
    throw new Error(errorMessage);
  }
};

export interface CreateBannerPayload {
  title: string;
  status: 'active' | 'inactive';
  image: File;
  image_low: File;
  description?: string;
  redirect_url?: string;
  display_order?: number; // Optional, as API docs for POST don't specify it
}

/**
 * Creates a new banner.
 * POST /api/admin/banners
 */
export const createBanner = async (payload: CreateBannerPayload): Promise<BannerItem> => {
  const formData = new FormData();
  formData.append('title', payload.title);
  formData.append('status', payload.status);
  formData.append('image', payload.image);
  formData.append('image_low', payload.image_low);
  if (payload.description) {
    formData.append('description', payload.description);
  }
  if (payload.redirect_url) {
    formData.append('redirect_url', payload.redirect_url);
  }
  if (payload.display_order !== undefined) {
    formData.append('display_order', payload.display_order.toString());
  }

  try {
    // Assuming the response for a successful creation returns the new banner item
    // and a generic success response structure like BannersApiResponse but for a single item.
    interface CreateBannerApiResponse {
        success: boolean;
        message: string;
        data: BannerItem; // Assuming the created banner is returned
    }
    const response = await axiosInstance.post<CreateBannerApiResponse>('api/admin/banners', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    if (response.data && response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to create banner');
  } catch (error: any) {
    console.error('Error creating banner:', error);
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred while creating the banner.';
    throw new Error(errorMessage);
  }
};

export interface UpdateBannerPayload {
  title?: string;
  status?: 'active' | 'inactive';
  image?: File | null; // File for new image, null/undefined if not changing
  image_low?: File | null; // File for new image, null/undefined if not changing
  description?: string;
  redirect_url?: string;
  display_order?: number;
}

/**
 * Fetches details for a specific banner.
 * GET /api/admin/banners/{id}
 */
export const getBannerDetails = async (id: number): Promise<BannerItem> => {
  try {
    interface BannerDetailsResponse {
      success: boolean;
      message: string;
      data: BannerItem;
    }
    const response = await axiosInstance.get<BannerDetailsResponse>(`/api/admin/banners/${id}`);
    if (response.data && response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || `Failed to fetch banner details for ID ${id}`);
  } catch (error: any) {
    console.error(`Error fetching banner details for ID ${id}:`, error);
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred.';
    throw new Error(errorMessage);
  }
};

/**
 * Updates an existing banner.
 * PUT /api/admin/banners/{id}
 */
export const updateBanner = async (id: number, payload: UpdateBannerPayload): Promise<BannerItem> => {
  const formData = new FormData();

  // FormData only appends fields that are present and not undefined.
  if (payload.title !== undefined) formData.append('title', payload.title);
  if (payload.status !== undefined) formData.append('status', payload.status);
  if (payload.description !== undefined) formData.append('description', payload.description);
  if (payload.redirect_url !== undefined) formData.append('redirect_url', payload.redirect_url);
  if (payload.display_order !== undefined) formData.append('display_order', payload.display_order.toString());
  
  // Only append image if a new File is provided
  if (payload.image instanceof File) {
    formData.append('image', payload.image);
  }
  if (payload.image_low instanceof File) {
    formData.append('image_low', payload.image_low);
  }
  // Note: The API spec for PUT shows image/image_low as string($binary), implying they are optional.
  // If the API expects empty strings or some other signal to *remove* an image, that logic would go here.
  // For now, we only send new files.

  try {
    interface UpdateBannerApiResponse {
        success: boolean;
        message: string;
        data: BannerItem; 
    }
    const response = await axiosInstance.put<UpdateBannerApiResponse>(`/api/admin/banners/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    if (response.data && response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to update banner');
  } catch (error: any) {
    console.error(`Error updating banner ID ${id}:`, error);
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred.';
    throw new Error(errorMessage);
  }
};

/**
 * Deletes a banner.
 * DELETE /api/admin/banners/{id}
 */
export const deleteBanner = async (id: number): Promise<{ success: boolean; message: string }> => {
  try {
    interface DeleteResponse {
      success: boolean;
      message: string;
    }
    const response = await axiosInstance.delete<DeleteResponse>(`/api/admin/banners/${id}`);
    // Check for successful response status codes (e.g., 200, 204)
    // and presence of response.data for more robust success check if needed.
    if (response.data && response.data.success) {
      return { success: true, message: response.data.message || 'Banner deleted successfully' };
    }
    // Handle cases where API might return 200/204 but success:false or no message
    if (response.status === 200 || response.status === 204) { // Typical success codes for DELETE
        return { success: true, message: response.data?.message || 'Banner deleted successfully' };
    }
    throw new Error(response.data?.message || `Failed to delete banner ID ${id}`);
  } catch (error: any) {
    console.error(`Error deleting banner ID ${id}:`, error);
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred during deletion.';
    throw new Error(errorMessage);
  }
};

/**
 * Updates the display order of a banner and reorders other banners accordingly.
 * PUT /api/admin/banners/{id}/shuffle
 */
export const shuffleBannerDisplayOrder = async (id: number, new_display_order: number): Promise<{ success: boolean; message: string; data?: BannerItem[] }> => {
  try {
    interface ShuffleResponse {
      success: boolean;
      message: string;
      data?: BannerItem[]; // Assuming API might return the updated list or the affected banner
    }
    const response = await axiosInstance.put<ShuffleResponse>(
      `/api/admin/banners/${id}/shuffle`,
      { new_display_order }
    );

    if (response.data && response.data.success) {
      return { 
        success: true, 
        message: response.data.message || 'Banner order updated successfully', 
        data: response.data.data 
      };
    }
    throw new Error(response.data?.message || `Failed to update display order for banner ID ${id}`);
  } catch (error: any) {
    console.error(`Error shuffling banner ID ${id}:`, error);
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred.';
    throw new Error(errorMessage);
  }
};

/**
 * Restores a soft-deleted banner.
 * POST /api/admin/banners/{id}/restore
 */
export const restoreBanner = async (id: number): Promise<{ success: boolean; message: string }> => {
  try {
    interface RestoreResponse {
      success: boolean;
      message: string;
    }
    const response = await axiosInstance.post<RestoreResponse>(`/api/admin/banners/${id}/restore`);
    if (response.data && response.data.success) {
      return { success: true, message: response.data.message || 'Banner restored successfully' };
    }
    throw new Error(response.data?.message || `Failed to restore banner ID ${id}`);
  } catch (error: any) {
    console.error(`Error restoring banner ID ${id}:`, error);
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred during restoration.';
    throw new Error(errorMessage);
  }
};

// Placeholder for future CRUD operations:
// export const restoreBanner = async (bannerId: number) => { /* ... */ };
