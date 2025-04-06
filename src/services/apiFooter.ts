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
  const response = await poster('/api/admin/footer/sections', section);
  return response?.data;
};

export const updateFooterSection = async (
  id: number,
  section: {
    title?: string;
    order?: number;
    is_active?: boolean;
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
  new_order: number
) => {
  try {
    console.log(`Reordering section ID ${id} to position ${new_order}`);
    const response = await updater(`/api/admin/footer/sections/${id}/reorder`, { new_order });
    console.log('Section reorder response:', response);
    return response?.data;
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

export const createFooterLink = async (link: {
  section_id: number;
  label: string;
  url: string;
  order: number;
  is_active: boolean;
}) => {
  const response = await poster('/api/admin/footer/links', link);
  return response?.data;
};

export const updateFooterLink = async (
  id: number,
  link: {
    section_id?: number;
    label?: string;
    url?: string;
    order?: number;
    is_active?: boolean;
  }
) => {
  const response = await updater(`/api/admin/footer/links/${id}`, link);
  return response?.data;
};

export const deleteFooterLink = async (id: number) => {
  const response = await deleter(`/api/admin/footer/links/${id}`);
  return response;
};

export const reorderFooterLink = async (
  id: number,
  new_order: number
) => {
  try {
    console.log(`Reordering link ID ${id} to position ${new_order}`);
    const response = await updater(`/api/admin/footer/links/${id}/reorder`, { new_order });
    console.log('Link reorder response:', response);
    return response?.data;
  } catch (error) {
    console.error(`Error reordering link ${id}:`, error);
    throw error;
  }
}; 