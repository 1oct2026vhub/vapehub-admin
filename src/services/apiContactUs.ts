import axiosInstance from '@/utils/axiosApi';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface ContactInfo {
    id: number;
    send_us_a_message: string;
    call_us: string;
    social_media: string;
    facebook?: string;
    whatsapp?: string;
    instagram?: string;
    email?: string;
    phone_number?: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

export const listContactUs = async (): Promise<ApiResponse<ContactInfo[]>> => {
    try {
        const response = await axiosInstance.get('/api/admin/contactus');
        return response.data;
    } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred.';
        return {
            success: false,
            message: errorMessage,
        }
    }
};

export const deleteContactUs = async (id: number): Promise<ApiResponse<null>> => {
    try {
        const response = await axiosInstance.delete(`/api/admin/contactus/${id}`);
        return response.data;
    } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred.';
        return {
            success: false,
            message: errorMessage,
        }
    }
};

export interface ContactUsPayload {
    send_us_a_message: string;
    call_us: string;
    social_media: string;
    facebook?: string;
    twitter?: string;
    instagram?: string;
    email?: string;
    phone_number?: string;
}

export const createContactUs = async (data: ContactUsPayload): Promise<ApiResponse<ContactInfo>> => {
    try {
        const response = await axiosInstance.post('/api/admin/contactus', data);
        return response.data;
    } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred.';
        return {
            success: false,
            message: errorMessage,
        }
    }
};

export const getContactUsById = async (id: number): Promise<ApiResponse<ContactInfo>> => {
    try {
        const response = await axiosInstance.get(`/api/admin/contactus/${id}`);
        return response.data;
    } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred.';
        return {
            success: false,
            message: errorMessage,
        }
    }
};

export const updateContactUs = async (id: number, data: ContactUsPayload): Promise<ApiResponse<ContactInfo>> => {
    try {
        const response = await axiosInstance.put(`/api/admin/contactus/${id}`, data);
        return response.data;
    } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred.';
        return {
            success: false,
            message: errorMessage,
        }
    }
}; 