import axiosInstance from '@/utils/axiosApi';
import { Carousel, CarouselCreate, CarouselUpdate, CarouselReorder } from '@/types/carousel';

export type { Carousel, CarouselCreate, CarouselUpdate, CarouselReorder };

export interface CarouselsApiResponse {
  success: boolean;
  message: string;
  data: {
    total: number;
    page: number;
    limit: number;
    results: Carousel[];
  };
}

export interface CarouselApiResponse {
  success: boolean;
  message: string;
  data: Carousel;
}

export interface FetchCarouselsParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  order?: 'ASC' | 'DESC';
  search?: string;
  deleted?: boolean;
  status?: 'active' | 'inactive';
}

/**
 * Fetches a list of carousels with filtering and pagination.
 * GET /api/admin/carousels
 */
export const getCarousels = async (params: FetchCarouselsParams = {}): Promise<{
  total: number;
  page: number;
  limit: number;
  results: Carousel[];
}> => {
  try {
    const response = await axiosInstance.get<CarouselsApiResponse>('/api/admin/carousels', { params });
    if (response.data && response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch carousels');
  } catch (error: any) {
    console.error('Error fetching carousels:', error);
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred while fetching carousels.';
    throw new Error(errorMessage);
  }
};

/**
 * Creates a new carousel.
 * POST /api/admin/carousels
 */
export const createCarousel = async (data: FormData): Promise<Carousel> => {
  try {
    const response = await axiosInstance.post<CarouselApiResponse>('/api/admin/carousels', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    if (response.data && response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to create carousel');
  } catch (error: any) {
    console.error('Error creating carousel:', error);
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred while creating carousel.';
    throw new Error(errorMessage);
  }
};

/**
 * Updates an existing carousel.
 * PUT /api/admin/carousels/:id
 */
export const updateCarousel = async (id: number, data: CarouselUpdate): Promise<Carousel> => {
  try {
    const response = await axiosInstance.put<CarouselApiResponse>(`/api/admin/carousels/${id}`, data);
    if (response.data && response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to update carousel');
  } catch (error: any) {
    console.error('Error updating carousel:', error);
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred while updating carousel.';
    throw new Error(errorMessage);
  }
};

/**
 * Deletes a carousel.
 * DELETE /api/admin/carousels/:id
 */
export const deleteCarousel = async (id: number): Promise<void> => {
  try {
    const response = await axiosInstance.delete<{ success: boolean; message: string }>(`/api/admin/carousels/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete carousel');
    }
  } catch (error: any) {
    console.error('Error deleting carousel:', error);
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred while deleting carousel.';
    throw new Error(errorMessage);
  }
};

/**
 * Reorders carousels.
 * PUT /api/admin/carousels/reorder
 */
export const reorderCarousels = async (data: CarouselReorder): Promise<void> => {
  try {
    const response = await axiosInstance.put<{ success: boolean; message: string }>('/api/admin/carousels/reorder', data);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to reorder carousels');
    }
  } catch (error: any) {
    console.error('Error reordering carousels:', error);
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred while reordering carousels.';
    throw new Error(errorMessage);
  }
};

/**
 * Fetches a single carousel by ID.
 * GET /api/admin/carousels/:id
 */
export const getCarousel = async (id: number): Promise<Carousel> => {
  try {
    const response = await axiosInstance.get<CarouselApiResponse>(`/api/admin/carousels/${id}`);
    if (response.data && response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch carousel');
  } catch (error: any) {
    console.error('Error fetching carousel:', error);
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred while fetching carousel.';
    throw new Error(errorMessage);
  }
};

/**
 * Shuffles carousel display order.
 * PUT /api/admin/carousels/:id/shuffle
 */
export const shuffleCarousel = async (id: number, newDisplayOrder: number): Promise<Carousel[]> => {
  try {
    const response = await axiosInstance.put<{ success: boolean; message: string; data: Carousel[] }>(
      `/api/admin/carousels/${id}/shuffle`,
      { new_display_order: newDisplayOrder }
    );
    if (response.data && response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to shuffle carousel');
  } catch (error: any) {
    console.error('Error shuffling carousel:', error);
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred while shuffling carousel.';
    throw new Error(errorMessage);
  }
};
