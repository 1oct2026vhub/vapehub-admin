import { fetcher, deleter, poster, updater } from './apiService';
import axiosInstance from '@/utils/axiosApi';

export interface Review {
    id: number;
    user_id: number | null;
    order_id: number | null;
    product_id: number | null;
    user_name?: string;
    company_name: string;
    rating: number;
    comment: string;
    is_visible: boolean;
    testimonial?: boolean;
    created_at: string;
    updated_at: string;
    review_date?: string;
    product?: {
        name: string;
    };
}

export interface CreateReviewData {
    product_id: number;
    user_name: string;
    company_name: string;
    rating: number;
    comment: string;
    is_visible: boolean;
    testimonial?: boolean;
    review_date?: string;
}

export interface FetchReviewsParams {
    page?: number;
    limit?: number;
    search?: string;
    rating?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    deleted?: boolean;
}

export interface ListReviewsApiResponse {
    total: number;
    page: number;
    totalPages: number;
    reviews: Review[];
}

export const getReviews = (params: FetchReviewsParams): Promise<ListReviewsApiResponse> => {
    return fetcher('/api/admin/review', params);
};

export const createReview = (data: CreateReviewData): Promise<Review> => {
    return poster('/api/admin/review', data);
};

export const updateReview = (id: number, data: CreateReviewData): Promise<Review> => {
    return updater(`/api/admin/review/${id}`, data);
};

export const deleteReview = (id: number): Promise<void> => {
    return deleter(`/api/admin/review/${id}`);
};

export const bulkDeleteReviews = (ids: number[]): Promise<any> => {
    return axiosInstance.delete('/api/admin/review/bulk-delete', {
        data: { ids }
    }).then((res) => res.data);
};

export const bulkRestoreReviews = (ids: number[]): Promise<any> => {
    return axiosInstance.put('/api/admin/review/bulk-restore', {
        ids
    }).then((res) => res.data);
}; 