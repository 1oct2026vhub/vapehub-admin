import axiosInstance from '@/utils/axiosApi';

// Auth
export interface NewsletterTemplatesAuthResponse {
  success: boolean;
  token: string;
  v2?: boolean;
  message?: string;
}

export async function getNewsletterTemplatesAuth(
  uid?: string,
): Promise<NewsletterTemplatesAuthResponse> {
  const response = await axiosInstance.get('/api/newsletter-templates/auth', {
    params: uid ? { uid } : undefined,
  });
  return response.data;
}

// Template types
export interface NewsletterTemplatePayload {
  id?: string;
  name: string;
  subject: string;
  designJson: string;
  html: string;
}

export interface NewsletterTemplate {
  id: string;
  name: string;
  subject: string;
  createdAt: string;
  updatedAt: string;
  designJson: string;
  html: string;
}

export interface NewsletterTemplateListResponse {
  success: boolean;
  data: NewsletterTemplate[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  message: string;
}

export interface NewsletterTemplateListParams {
  page?: number;
  pageSize?: number;
}

export interface NewsletterTemplateSingleResponse {
  success: boolean;
  data: NewsletterTemplate;
  message: string;
}

export interface NewsletterTemplateSaveResponse {
  success: boolean;
  data: {
    id: string;
    name: string;
    subject: string;
  };
  message: string;
}

export async function saveNewsletterTemplate(
  payload: NewsletterTemplatePayload,
): Promise<NewsletterTemplateSaveResponse> {
  const response = await axiosInstance.post('/api/newsletter-templates/templates', payload);
  return response.data;
}

export async function listNewsletterTemplates(
  params: NewsletterTemplateListParams = {},
): Promise<NewsletterTemplateListResponse> {
  const response = await axiosInstance.get('/api/newsletter-templates/templates', {
    params,
  });
  return response.data;
}

export async function getNewsletterTemplate(id: string): Promise<NewsletterTemplateSingleResponse> {
  const response = await axiosInstance.get(`/api/newsletter-templates/templates/${id}`);
  return response.data;
}

export interface NewsletterTemplateDeleteResponse {
  success: boolean;
  data: {
    id: string;
  };
  message: string;
}

export async function deleteNewsletterTemplate(id: string): Promise<NewsletterTemplateDeleteResponse> {
  const response = await axiosInstance.delete(`/api/newsletter-templates/templates/${id}`);
  return response.data;
}

