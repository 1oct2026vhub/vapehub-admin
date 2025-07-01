import { fetcher, deleter, poster, updater } from './apiService';

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
    created_at: string;
    updated_at: string;
}

export interface CreateReviewData {
    product_id: number;
    user_name: string;
    company_name: string;
    rating: number;
    comment: string;
    is_visible: boolean;
}

export interface FetchReviewsParams {
    page?: number;
    limit?: number;
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