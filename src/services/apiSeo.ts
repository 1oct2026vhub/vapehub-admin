import axiosInstance from '@/utils/axiosApi';

// Define the SEO data structure for POST/PUT requests
export interface SeoData {
  entityType: 'page' | 'product' | 'category' | 'brand';
  entityId: string;
  title: string;
  description: string;
  focusKeyword: string;
  slug: string;
  canonicalUrl: string;
  ogImage: string;
  noIndex: boolean;
}

// Define the structure for the GET response
export interface SeoMeta extends SeoData {
    id: number;
    createdAt: string;
    updatedAt: string;
}

export interface SeoHealth {
    status: string;
    score: number;
    details: {
        score: number;
        issues: string[];
        recommendations: string[];
        metrics: Record<string, number>;
    }
}

export interface SeoApiResponse {
    success: boolean;
    message: string;
    data: {
        seoMeta: SeoMeta;
        health: SeoHealth;
    }
}

/**
 * Create or update SEO metadata for an entity.
 * @param data - The SEO data to be created or updated.
 */
export const createOrUpdateSeo = async (data: Partial<SeoData>): Promise<SeoApiResponse> => {
  try {
    const response = await axiosInstance.post('/api/admin/seo', data);
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred while saving SEO data.';
    throw new Error(errorMessage);
  }
};

/**
 * Get SEO metadata for an entity.
 * @param entityType - The type of the entity (e.g., 'product').
 * @param entityId - The ID of the entity.
 * @param slug - The URL slug of the entity (optional).
 */
export const getSeo = async (entityType: string, entityId: string, slug?: string): Promise<SeoApiResponse> => {
  try {
    let url = `/api/admin/seo/${entityType}/${entityId}`;
    if (slug) {
      url += `?slug=${slug}`;
    }
    const response = await axiosInstance.get(url);
    return response.data;
  }
   catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred while fetching SEO data.';
    throw new Error(errorMessage);
  }
}; 