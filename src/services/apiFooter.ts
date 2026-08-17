import { fetcher, poster, updater, deleter } from "./apiService";

// Types for Footer Section and Links
export interface FooterLink {
  id: number;
  section_id: number;
  label: string;
  url: string;
  order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface FooterSection {
  id: number;
  title: string;
  order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  links?: FooterLink[];
}

const extractFooterLinkId = (response: unknown): number => {
  const payload = response as { data?: { id?: number | string }; id?: number | string } | null | undefined;
  const rawId = payload?.data?.id ?? payload?.id;

  if (rawId == null || rawId === "") {
    throw new Error("Footer link response missing id");
  }

  const id = Number(rawId);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Footer link response missing id");
  }

  return id;
};

const unwrapFooterLink = (response: unknown): FooterLink => {
  const payload = response as { data?: FooterLink; id?: number } | null | undefined;
  const link =
    payload?.data && typeof payload.data === "object" && payload.data.id != null
      ? payload.data
      : (payload as FooterLink);

  const id = extractFooterLinkId(response);

  return { ...link, id };
};

// Footer Sections API Functions
export const getFooterSections = async (params: { is_active?: boolean } = {}) => {
  const response = await fetcher('/api/admin/footer/sections', params);
  return response?.data || [];
};

export const createFooterSection = async (section: {
  title: string;
  order: number;
  is_active: boolean;
}) => {
  try {
    console.log("Creating footer section:", section);
    const response = await poster("/api/admin/footer/sections", section);
    return response?.data;
  } catch (error) {
    console.error("Error creating footer section:", error);
    throw error;
  }
};

export const updateFooterSection = async (
  id: number,
  section: {
    title: string;
    order: number;
    is_active: boolean;
  }
) => {
  const response = await updater(`/api/admin/footer/sections/${id}`, section);
  return response?.data;
};

export const deleteFooterSection = async (id: number) => {
  const response = await deleter(`/api/admin/footer/sections/${id}`);
  return response;
};

export const reorderFooterSection = async (
  id: number,
  newOrderData: { new_order: number }
) => {
  try {
    // Log the reordering attempt
    console.log(`Reordering section ${id} to order ${newOrderData.new_order}`);
    
    // Make the API call
    const response = await updater(`/api/admin/footer/sections/${id}/reorder`, newOrderData);
    return response;
  } catch (error) {
    console.error(`Error reordering section ${id}:`, error);
    throw error;
  }
};

// Footer Links API Functions
export const getFooterLinks = async () => {
  const response = await fetcher('/api/admin/footer/links');
  return response?.data || [];
};

export const getFooterLinksBySection = async (sectionId: number): Promise<FooterLink[]> => {
  const links = await getFooterLinks();
  return links
    .filter((link: FooterLink) => link.section_id === sectionId)
    .sort((a: FooterLink, b: FooterLink) => a.order - b.order);
};

export const createFooterLink = async (link: {
  section_id: number;
  label: string;
  url: string;
  order: number;
  is_active: boolean;
}) => {
  const response = await poster('/api/admin/footer/links', link);
  return unwrapFooterLink(response);
};

export const updateFooterLink = async (
  id: number,
  linkData: {
    label?: string;
    url?: string;
    order?: number;
    is_active?: boolean;
    section_id?: number;
  }
) => {
  try {
    console.log(`Updating link ${id} with data:`, linkData);
    const response = await updater(`/api/admin/footer/links/${id}`, linkData);
    return unwrapFooterLink(response);
  } catch (error) {
    console.error(`Failed to update link ${id}:`, error);
    throw error;
  }
};

export const deleteFooterLink = async (id: number) => {
  const response = await deleter(`/api/admin/footer/links/${id}`);
  return response;
};

export const reorderFooterLink = async (
  id: number,
  payload: { new_order: number }
) => {
  try {
    console.log(`Reordering link ${id} to order ${payload.new_order}`);
    // Ensure we're sending a valid payload
    if (!id || typeof payload.new_order !== 'number') {
      throw new Error('Invalid reorder parameters');
    }
    
    // Make the API call with proper error handling
    const response = await updater(`/api/admin/footer/links/${id}/reorder`, payload);
    
    // Log success and return the response data
    console.log(`Successfully reordered link ${id}`, response);
    return response?.data || response;
  } catch (error) {
    console.error(`Error reordering link ${id}:`, error);
    throw error;
  }
};

export interface FooterBadge {
  id: number;
  icon_url?: string | null;
  heading: string;
  subtitle: string;
  url?: string | null;
  order: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  updated_by?: number | string | null;
}

export interface FooterBadgePayload {
  heading?: string;
  subtitle?: string;
  url?: string | null;
  order?: number;
  is_active?: boolean;
  icon?: File;
}

export interface PublicFooterResponse {
  success?: boolean;
  data?: FooterSection[];
  socialLinks?: Record<string, unknown>;
  badges?: FooterBadge[];
}

const unwrapFooterBadges = (response: unknown): FooterBadge[] => {
  const payload = response as {
    badges?: FooterBadge[];
    data?: FooterBadge[] | { badges?: FooterBadge[] };
  } | FooterBadge[] | null | undefined;

  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.badges)) return payload.badges;
  if (Array.isArray(payload.data)) return payload.data;
  if (payload.data && Array.isArray(payload.data.badges)) return payload.data.badges;
  return [];
};

const unwrapFooterBadge = (response: unknown): FooterBadge => {
  const payload = response as { data?: FooterBadge } | FooterBadge | null | undefined;
  if (payload && "data" in payload && payload.data && typeof payload.data === "object") {
    return payload.data;
  }
  return payload as FooterBadge;
};

const buildFooterBadgeFormData = (badge: FooterBadgePayload) => {
  const formData = new FormData();

  if (badge.heading !== undefined) formData.append("heading", badge.heading);
  if (badge.subtitle !== undefined) formData.append("subtitle", badge.subtitle);
  if (badge.url !== undefined && badge.url !== null && badge.url !== "") {
    formData.append("url", badge.url);
  }
  if (badge.order !== undefined) formData.append("order", String(badge.order));
  if (badge.is_active !== undefined) formData.append("is_active", String(badge.is_active));
  if (badge.icon) formData.append("icon", badge.icon);

  return formData;
};

export const getFooterBadges = async (
  params: { is_active?: boolean } = {}
): Promise<FooterBadge[]> => {
  const response = await fetcher("/api/admin/footer/badges", params);
  return unwrapFooterBadges(response).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};

export const createFooterBadge = async (badge: FooterBadgePayload) => {
  const response = await poster("/api/admin/footer/badges", buildFooterBadgeFormData(badge));
  return unwrapFooterBadge(response);
};

export const updateFooterBadge = async (id: number, badge: FooterBadgePayload) => {
  const response = await updater(
    `/api/admin/footer/badges/${id}`,
    buildFooterBadgeFormData(badge)
  );
  return unwrapFooterBadge(response);
};

export const deleteFooterBadge = async (id: number) => {
  return deleter(`/api/admin/footer/badges/${id}`);
};

export const reorderFooterBadge = async (id: number, payload: { new_order: number }) => {
  const response = await updater(`/api/admin/footer/badges/${id}/reorder`, payload);
  return response?.data || response;
};

/** Storefront footer: badges is a sibling of data, not nested inside data. */
export const getPublicFooter = async (): Promise<PublicFooterResponse> => {
  try {
    return await fetcher("/api/footer");
  } catch {
    return await fetcher("/api/home/footer");
  }
};

export const getPublicFooterBadges = async (): Promise<FooterBadge[]> => {
  const response = await getPublicFooter();
  return Array.isArray(response?.badges) ? response.badges : [];
}; 