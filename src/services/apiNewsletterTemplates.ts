import axiosInstance from "@/utils/axiosApi";

export interface NewsletterTemplate {
  id: string;
  name: string;
  subject: string;
  createdAt?: string;
  updatedAt?: string;
  designJson?: string;
  html?: string;
}

export interface SaveNewsletterTemplatePayload {
  id?: string;
  name: string;
  subject: string;
  designJson: string;
  html: string;
}

export interface SaveNewsletterTemplateResponse {
  success: boolean;
  data?: {
    id: string;
    name: string;
    subject: string;
  };
  message?: string;
}

export interface ListNewsletterTemplatesResponse {
  success: boolean;
  data: NewsletterTemplate[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  message?: string;
}

const BASE = "/api/admin/newsletter-templates/templates";

export async function saveNewsletterTemplate(
  payload: SaveNewsletterTemplatePayload,
): Promise<SaveNewsletterTemplateResponse> {
  const { data } = await axiosInstance.post<SaveNewsletterTemplateResponse>(
    BASE,
    payload,
  );
  return data;
}

export async function listNewsletterTemplates(params?: {
  page?: number;
  pageSize?: number;
}): Promise<ListNewsletterTemplatesResponse> {
  const { data } = await axiosInstance.get<ListNewsletterTemplatesResponse>(
    BASE,
    { params },
  );
  return data;
}
