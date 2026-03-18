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
  const response = await axiosInstance.get('/api/admin/newsletter-templates/auth', {
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
  const response = await axiosInstance.post('/api/admin/newsletter-templates/templates', payload);
  return response.data;
}

export async function listNewsletterTemplates(
  params: NewsletterTemplateListParams = {},
): Promise<NewsletterTemplateListResponse> {
  const response = await axiosInstance.get('/api/admin/newsletter-templates/templates', {
    params,
  });
  return response.data;
}

export async function getNewsletterTemplate(id: string): Promise<NewsletterTemplateSingleResponse> {
  const response = await axiosInstance.get(`/api/admin/newsletter-templates/templates/${id}`);
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
  const response = await axiosInstance.delete(`/api/admin/newsletter-templates/templates/${id}`);
  return response.data;
}

// ----------------------------
// Newsletter Groups
// ----------------------------

export interface NewsletterGroup {
  id: string;
  name: string;
  userCount?: number;
  createdAt?: string;
  updatedAt?: string;
  userIds?: string[];
  users?: any[];
}

export interface NewsletterGroupPayload {
  name: string;
  userIds?: string[];
}

export interface NewsletterGroupListResponse {
  success: boolean;
  data: NewsletterGroup[];
  message?: string;
}

export interface NewsletterGroupSingleResponse {
  success: boolean;
  data: NewsletterGroup;
  message?: string;
}

export interface NewsletterGroupMutationResponse {
  success: boolean;
  data: NewsletterGroup;
  message?: string;
}

export interface NewsletterGroupDeleteResponse {
  success: boolean;
  data?: { id: string };
  message?: string;
}

export async function listNewsletterGroups(): Promise<NewsletterGroupListResponse> {
  const response = await axiosInstance.get('/api/admin/newsletter-templates/groups');
  return response.data;
}

export async function getNewsletterGroup(id: string): Promise<NewsletterGroupSingleResponse> {
  const response = await axiosInstance.get(`/api/admin/newsletter-templates/groups/${id}`);
  return response.data;
}

export async function createNewsletterGroup(
  payload: NewsletterGroupPayload,
): Promise<NewsletterGroupMutationResponse> {
  const response = await axiosInstance.post('/api/admin/newsletter-templates/groups', payload);
  return response.data;
}

export async function updateNewsletterGroup(
  id: string,
  payload: NewsletterGroupPayload,
): Promise<NewsletterGroupMutationResponse> {
  const response = await axiosInstance.put(`/api/admin/newsletter-templates/groups/${id}`, payload);
  return response.data;
}

export async function deleteNewsletterGroup(id: string): Promise<NewsletterGroupDeleteResponse> {
  const response = await axiosInstance.delete(`/api/admin/newsletter-templates/groups/${id}`);
  return response.data;
}

export interface NewsletterGroupUsersPayload {
  userIds: string[];
}

export interface NewsletterGroupUser {
  userId: string;
  email?: string;
}

export interface NewsletterGroupUsersListResponse {
  success: boolean;
  data: {
    // Backend may return either simple ids or full user objects; support both.
    userIds?: string[];
    users?: NewsletterGroupUser[];
  };
  message?: string;
}

export interface NewsletterGroupUsersMutationResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export async function listNewsletterGroupUsers(id: string): Promise<NewsletterGroupUsersListResponse> {
  const response = await axiosInstance.get(`/api/admin/newsletter-templates/groups/${id}/users`);
  return response.data;
}

export async function addUsersToNewsletterGroup(
  id: string,
  payload: NewsletterGroupUsersPayload,
): Promise<NewsletterGroupUsersMutationResponse> {
  const response = await axiosInstance.post(`/api/admin/newsletter-templates/groups/${id}/users`, payload);
  return response.data;
}

export async function removeUsersFromNewsletterGroup(
  id: string,
  payload: NewsletterGroupUsersPayload,
): Promise<NewsletterGroupUsersMutationResponse> {
  const response = await axiosInstance.delete(`/api/admin/newsletter-templates/groups/${id}/users`, {
    data: payload,
  });
  return response.data;
}

export interface NewsletterUserGroupsResponse {
  success: boolean;
  data: NewsletterGroup[];
  message?: string;
}

export async function listGroupsForNewsletterUser(userId: string): Promise<NewsletterUserGroupsResponse> {
  const response = await axiosInstance.get(`/api/admin/newsletter-templates/users/${userId}/groups`);
  return response.data;
}

