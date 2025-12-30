
import { fetcher, deleter, poster, updater } from './apiService';

export interface FeatureContent {
    id: number;
    title: string;
    subtitle: string;
    icon_id: number;
    alt_text?: string;
    link?: string;
    status: string;
    updated_by: number;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;
    updater?: {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
    };
    icon?: {
        id: number;
        file_name: string;
        icon_url: string;
        createdAt: string;
    };
}

export interface FetchFeatureContentParams {
    page?: number;
    limit?: number;
    search?: string;
    sort?: string;
    order?: 'ASC' | 'DESC';
    deleted?: boolean;
    status?: string;
}

export interface ListFeatureContentApiResponse {
    success: boolean;
    message: string;
    data: {
        featureContents: FeatureContent[];
        pagination: {
            currentPage: number;
            totalPages: number;
            totalItems: number;
            itemsPerPage: number;
        };
    };
}

export const getFeatureContent = (params: FetchFeatureContentParams): Promise<ListFeatureContentApiResponse> => {
    return fetcher('/api/admin/feature-content', params);
};

export interface CreateFeatureContentPayload {
    title: string;
    subtitle: string;
    icon_id: number;
    alt_text?: string;
    link?: string;
    status: 'active' | 'inactive';
}

export const createFeatureContent = (payload: CreateFeatureContentPayload): Promise<any> => {
    return poster('/api/admin/feature-content', payload);
};

export const updateFeatureContent = (id: number, payload: CreateFeatureContentPayload): Promise<any> => {
    return updater(`/api/admin/feature-content/${id}`, payload);
};

export const deleteFeatureContent = (id: number): Promise<void> => {
    return deleter(`/api/admin/feature-content/${id}`);
};

export const restoreFeatureContent = (id: number): Promise<void> => {
    return poster(`/api/admin/feature-content/restore/${id}`, {});
};

export interface FeatureIcon {
    id: number;
    file_name: string;
    icon_url: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

export interface AddIconResponse {
    success: boolean;
    data?: { icon: FeatureIcon };
    message?: string;
}

export const addFeatureIcon = (file: File): Promise<AddIconResponse> => {
    const form = new FormData();
    form.append('icon', file);
    return poster('/api/admin/feature-content/icons/add', form);
};

export const deleteFeatureIcon = (id: number): Promise<void> => {
    return deleter(`/api/admin/feature-content/icons/${id}`);
};

export interface FetchFeatureIconsParams {
    page?: number;
    limit?: number;
    search?: string;
    sort?: string;
    order?: 'ASC' | 'DESC';
    deleted?: boolean;
}

export interface ListFeatureIconsApiResponse {
    success: boolean;
    message: string;
    data: {
        icons: FeatureIcon[];
        pagination: {
            currentPage: number;
            totalPages: number;
            totalItems: number;
            itemsPerPage: number;
        };
    };
}

export const getFeatureIcons = (params: FetchFeatureIconsParams): Promise<ListFeatureIconsApiResponse> => {
    return fetcher('/api/admin/feature-content/icons', params);
};
