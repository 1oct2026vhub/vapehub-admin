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
    return response?.data;
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