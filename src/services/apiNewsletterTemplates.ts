import axiosInstance from "@/utils/axiosApi";

export interface NewsletterTemplate {
  id: string;
  name: string;
  subject: string;
  createdAt?: string;
  updatedAt?: string;
  designJson?: string | { editor?: string; html?: string; css?: string };
  html?: string;
}

/** Stripo catalog item returned by `GET .../default-templates` (list). */
export interface StripoDefaultTemplateListItem {
  templateId: number;
  name: string;
  logo?: string;
  premium?: boolean;
  hasAmp?: boolean;
  updatedAt?: number;
  createdTime?: number;
}

export interface ListDefaultNewsletterTemplatesResponse {
  success: boolean;
  data: StripoDefaultTemplateListItem[];
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
  message?: string;
}

/** Detail for one Stripo default template (editor load). Backend may mirror saved-template fields. */
export interface GetDefaultNewsletterTemplateResponse {
  success: boolean;
  data?: {
    id?: string;
    templateId?: number;
    name?: string;
    subject?: string;
    html?: string;
    css?: string;
    designJson?: string | { editor?: string; html?: string; css?: string };
  };
  message?: string;
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

export interface GetNewsletterTemplateByIdResponse {
  success: boolean;
  data: NewsletterTemplate;
  message?: string;
}

const BASE = "/api/admin/newsletter-templates/templates";
const DEFAULT_TEMPLATES_BASE = "/api/admin/newsletter-templates/default-templates";

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

export async function listDefaultNewsletterTemplates(params?: {
  page?: number;
  pageSize?: number;
  /** Stripo catalog filter: `basic` or `free` (prebuilt). Omit for server default. */
  type?: "basic" | "free" | string;
}): Promise<ListDefaultNewsletterTemplatesResponse> {
  const { data } =
    await axiosInstance.get<ListDefaultNewsletterTemplatesResponse>(
      DEFAULT_TEMPLATES_BASE,
      { params },
    );
  return data;
}

/**
 * Load one Stripo default template for the editor (HTML/CSS).
 * Expects: `GET /api/admin/newsletter-templates/default-templates/{templateId}`
 * returning the same `data` shape as a saved template (`designJson` or `html`).
 */
export async function getDefaultNewsletterTemplateById(
  templateId: string | number,
): Promise<GetDefaultNewsletterTemplateResponse> {
  const { data } = await axiosInstance.get<GetDefaultNewsletterTemplateResponse>(
    `${DEFAULT_TEMPLATES_BASE}/${encodeURIComponent(String(templateId))}`,
  );
  return data;
}

export async function getNewsletterTemplateById(
  id: string,
): Promise<GetNewsletterTemplateByIdResponse> {
  const { data } = await axiosInstance.get<GetNewsletterTemplateByIdResponse>(
    `${BASE}/${encodeURIComponent(id)}`,
  );
  return data;
}

export interface DeleteNewsletterTemplateResponse {
  success: boolean;
  data?: { id: string };
  message?: string;
}

export async function deleteNewsletterTemplate(
  id: string,
): Promise<DeleteNewsletterTemplateResponse> {
  const { data } =
    await axiosInstance.delete<DeleteNewsletterTemplateResponse>(
      `${BASE}/${encodeURIComponent(id)}`,
    );
  return data;
}

// ----------------------------
// Newsletter Groups
// ----------------------------

const GROUPS_BASE = "/api/admin/newsletter-templates/groups";

export interface NewsletterGroup {
  id: string;
  name: string;
  description?: string;
  userCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface NewsletterGroupPayload {
  name: string;
  description?: string;
}

export interface NewsletterGroupListResponse {
  success: boolean;
  data: NewsletterGroup[];
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
  message?: string;
}

export interface NewsletterGroupSingleResponse {
  success: boolean;
  data: NewsletterGroup;
  message?: string;
}

export interface NewsletterGroupMutationResponse {
  success: boolean;
  data?: NewsletterGroup;
  message?: string;
}

export interface NewsletterGroupDeleteResponse {
  success: boolean;
  data?: { id: string };
  message?: string;
}

export async function listNewsletterGroups(params?: {
  page?: number;
  pageSize?: number;
}): Promise<NewsletterGroupListResponse> {
  const { data } = await axiosInstance.get<NewsletterGroupListResponse>(
    GROUPS_BASE,
    { params },
  );
  return data;
}

export async function getNewsletterGroup(
  id: string,
): Promise<NewsletterGroupSingleResponse> {
  const { data } = await axiosInstance.get<NewsletterGroupSingleResponse>(
    `${GROUPS_BASE}/${encodeURIComponent(id)}`,
  );
  return data;
}

export async function createNewsletterGroup(
  payload: NewsletterGroupPayload,
): Promise<NewsletterGroupMutationResponse> {
  const { data } = await axiosInstance.post<NewsletterGroupMutationResponse>(
    GROUPS_BASE,
    payload,
  );
  return data;
}

export async function updateNewsletterGroup(
  id: string,
  payload: NewsletterGroupPayload,
): Promise<NewsletterGroupMutationResponse> {
  const { data } = await axiosInstance.put<NewsletterGroupMutationResponse>(
    `${GROUPS_BASE}/${encodeURIComponent(id)}`,
    payload,
  );
  return data;
}

export async function deleteNewsletterGroup(
  id: string,
): Promise<NewsletterGroupDeleteResponse> {
  const { data } = await axiosInstance.delete<NewsletterGroupDeleteResponse>(
    `${GROUPS_BASE}/${encodeURIComponent(id)}`,
  );
  return data;
}

// ----------------------------
// Newsletter Group Users
// ----------------------------

export interface NewsletterGroupUsersPayload {
  userIds: string[];
}

export interface NewsletterGroupUser {
  id: string;
  email: string;
  name?: string;
}

export interface NewsletterGroupUsersListResponse {
  success: boolean;
  data: NewsletterGroupUser[];
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
  message?: string;
}

export interface NewsletterGroupUsersMutationResponse {
  success: boolean;
  data?: { groupId: string; userIds: string[] };
  message?: string;
}

export async function listNewsletterGroupUsers(
  groupId: string,
  params?: { page?: number; pageSize?: number; search?: string },
): Promise<NewsletterGroupUsersListResponse> {
  const { data } = await axiosInstance.get(
    `${GROUPS_BASE}/${encodeURIComponent(groupId)}/users`,
    { params },
  );

  // API can return either:
  // 1) { success, data: NewsletterGroupUser[] }
  // 2) { success, data: { id, name, users: NewsletterGroupUser[] } }
  const rawData = (data as { data?: unknown })?.data;
  const users =
    Array.isArray(rawData)
      ? rawData
      : rawData &&
          typeof rawData === "object" &&
          "users" in rawData &&
          Array.isArray((rawData as { users?: unknown }).users)
        ? (rawData as { users: NewsletterGroupUser[] }).users
        : [];

  return {
    ...(data as Omit<NewsletterGroupUsersListResponse, "data">),
    data: users,
  };
}

export async function addUsersToNewsletterGroup(
  groupId: string,
  payload: NewsletterGroupUsersPayload,
): Promise<NewsletterGroupUsersMutationResponse> {
  const { data } =
    await axiosInstance.post<NewsletterGroupUsersMutationResponse>(
      `${GROUPS_BASE}/${encodeURIComponent(groupId)}/users`,
      payload,
    );
  return data;
}

export async function removeUsersFromNewsletterGroup(
  groupId: string,
  payload: NewsletterGroupUsersPayload,
): Promise<NewsletterGroupUsersMutationResponse> {
  const { data } =
    await axiosInstance.delete<NewsletterGroupUsersMutationResponse>(
      `${GROUPS_BASE}/${encodeURIComponent(groupId)}/users`,
      { data: payload },
    );
  return data;
}
