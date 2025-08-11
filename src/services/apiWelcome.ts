
import { fetcher, poster } from './apiService';

export interface WelcomeContent {
    id: number;
    title: string;
    content: string;
    image_url: string;
    status: string;
    updated_by: number;
    createdAt: string;
    updatedAt: string;
    updater?: {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
    };
}

export interface FetchWelcomeContentParams {
    page?: number;
    limit?: number;
    search?: string;
    sort?: string;
    order?: 'ASC' | 'DESC';
    deleted?: boolean;
    status?: string;
}

export interface ListWelcomeContentApiResponse {
    success: boolean;
    message: string;
    data: {
        welcomeContents: WelcomeContent[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    };
}

export const getWelcomeContent = (params: FetchWelcomeContentParams): Promise<ListWelcomeContentApiResponse> => {
    return fetcher('/api/admin/welcome-content', params);
};

export const createOrUpdateWelcomeContent = (formData: FormData): Promise<any> => {
    return poster('/api/admin/welcome-content', formData);
};
