import { fetcher, poster, updater, deleter } from "./apiService";
import axiosInstance from '@/utils/axiosApi';

export interface BlogSource {
  label: string;
  href: string;
  description?: string;
}

export interface BlogRelatedBlog {
  id: number;
  title: string;
  slug?: string;
  image_url?: string;
  alt_text?: string;
  status?: string;
  published_at?: string;
}

/** @deprecated Use BlogRelatedBlog — kept for backward compatibility */
export type BlogRelatedPost = BlogRelatedBlog;

export interface BlogAuthorOverride {
  first_name?: string;
  last_name?: string;
  role?: string;
  bio?: string;
  avatar_url?: string;
  archive_url?: string;
  team_url?: string;
}

export type BlogPullQuoteSourceType =
  | "UKVIA"
  | "MHRA"
  | "OHID"
  | "peer_reviewed";

export interface BlogPullQuote {
  body: string;
  attribution: string;
  source_url: string;
  source_type: BlogPullQuoteSourceType;
  location: "mid_body_after_h2";
}

export type BlogInlineProductCardEntityType = "product" | "category";

export interface BlogInlineProductCardProduct {
  image: string;
  title: string;
  blurb: string;
  url: string;
}

export interface BlogInlineProductCard {
  entity_type: BlogInlineProductCardEntityType;
  entity_id: number;
  blurb: string;
  title?: string;
  cta_label?: string;
  location?: "mid_article";
  entity_name?: string;
  product?: BlogInlineProductCardProduct;
}

export interface BlogFirstPersonCallout {
  label?: string;
  heading: string;
  body: string;
  /** @deprecated Placement is via {{firstPersonCallout:n}} placeholders in content */
  insert_after_paragraph?: number;
}

// Types for Blog Posts, Categories, and Tags
export interface BlogPost {
  id: number;
  title: string;
  content: string;
  slug: string;
  image?: string;
  image_url?: string;
  alt_text?: string;
  published_at?: string;
  is_active?: boolean;
  status?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  categories?: BlogCategory[];
  tags?: BlogTag[];
  author_id?: number | null;
  author_override?: BlogAuthorOverride;
  author?: {
    id?: number;
    first_name: string;
    last_name: string;
    email: string;
    profile_pic_url?: string;
    blog_author_role?: string;
    blog_author_bio?: string;
    blog_author_slug?: string;
    blog_author_archive_url?: string;
    blog_author_team_url?: string;
  };
  sources?: BlogSource[];
  related_blog_ids?: number[];
  related_blogs?: BlogRelatedBlog[];
  /** @deprecated Use related_blogs */
  related_posts?: BlogRelatedBlog[];
  redirect_url?: string;
  redirect?: { redirect_url?: string };
  pull_quote?: BlogPullQuote | null;
  inline_product_card?: BlogInlineProductCard | null;
  first_person_callouts?: BlogFirstPersonCallout[];
}

export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  alt_text?: string;
  parent_id?: number;
  parent?: string;
  children?: string[];
  status: string;
  show_home_page?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface BlogTag {
  id: number;
  name: string;
  slug: string;
  updated_by?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

// Add response types
interface BlogPostResponse {
  success: boolean;
  data: {
    blogs: BlogPost[];
    pagination: {
      total: number;
      page: number;
      limit: number;
    };
  };
}

interface BlogPostParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: "title" | "created_at" | "published_at";
  order?: "ASC" | "DESC";
  deleted?: boolean;
  is_active?: boolean;
  status?: string;
}

export interface BlogCategoryResponse {
  success: boolean;
  data: {
    total: number;
    page: number;
    limit: number;
    categories: BlogCategory[];
  };
}

export interface BlogCategoryParams {
  page?: number;
  limit?: number;
  search?: string;
  deleted?: boolean;
}

// Blog Posts API Functions
export const getBlogPosts = async (
  params: BlogPostParams = {}
): Promise<BlogPostResponse> => {
  const response = await fetcher("/api/admin/blog/posts", params);
  return response;
};

export const getBlogPost = async (id: number) => {
  const response = await fetcher(`/api/admin/blog/posts/${id}`);
  return response;
};

export const createBlogPost = async (formData: FormData) => {
  const response = await poster("/api/admin/blog/posts", formData);
  return response?.data;
};

export const updateBlogPost = async (id: number, formData: FormData) => {
  const response = await updater(`/api/admin/blog/posts/${id}`, formData);
  return response?.data;
};

export const deleteBlogPost = async (id: number, redirect_url?: string) => {
  const response = await axiosInstance.delete(`/api/admin/blog/posts/${id}`, {
    data: redirect_url ? { redirect_url } : undefined,
  });
  return response.data;
};

export const publishBlogPost = async (id: number) => {
  const response = await updater(`/api/admin/blog/posts/${id}/publish`, {});
  return response?.data;
};

export const unpublishBlogPost = async (id: number) => {
  const response = await updater(`/api/admin/blog/posts/${id}/unpublish`, {});
  return response?.data;
};

/**
 * Restore a soft-deleted blog post
 * @param id - The ID of the post to restore
 * @returns Promise containing the API response
 */
export async function restoreBlogPost(id: number) {
  try {
    const response = await updater(`/api/admin/blog/posts/${id}/restore`, {});
    return response;
  } catch (error) {
    throw error;
  }
}

/**
 * Bulk delete blog posts
 * @param ids - Array of post IDs to delete
 * @returns Promise containing the API response
 */
export async function bulkDeleteBlogPosts(ids: number[]): Promise<any> {
  const response = await axiosInstance.delete('/api/admin/blog/posts/bulk-delete', {
    data: { ids }
  });
  return response.data;
}

/**
 * Bulk restore soft-deleted blog posts
 * @param ids - Array of post IDs to restore
 * @returns Promise containing the API response
 */
export async function bulkRestoreBlogPosts(ids: number[]): Promise<any> {
  const response = await axiosInstance.put('/api/admin/blog/posts/bulk-restore', {
    ids
  });
  return response.data;
}

// Blog Categories API Functions
export const getBlogCategories = async (
  params: BlogCategoryParams = {}
): Promise<BlogCategoryResponse> => {
  const response = await fetcher("/api/admin/blog/categories", params);
  return response;
};

export const getBlogCategory = async (id: number) => {
  const response = await fetcher(`/api/admin/blog/categories/${id}`);
  return response?.data;
};

export const createBlogCategory = async (data: FormData | Record<string, any>) => {
  const response = await poster("/api/admin/blog/categories", data);
  return response?.data;
};

export const updateBlogCategory = async (id: number, data: FormData | Record<string, any>) => {
  const response = await updater(`/api/admin/blog/categories/${id}`, data);
  return response?.data;
};

export const deleteBlogCategory = async (id: number, redirect_url?: string) => {
  const response = await axiosInstance.delete(`/api/admin/blog/categories/${id}`, {
    data: redirect_url ? { redirect_url } : undefined,
  });
  return response.data;
};

/**
 * Restore a soft-deleted blog category
 * @param id - The ID of the category to restore
 * @returns Promise containing the API response
 */
export async function restoreBlogCategory(id: number) {
  try {
    const response = await updater(`/api/admin/blog/categories/${id}/restore`, {});
    return response;
  } catch (error) {
    throw error;
  }
}

/**
 * Bulk delete blog categories
 * @param ids - Array of category IDs to delete
 * @returns Promise containing the API response
 */
export async function bulkDeleteBlogCategories(ids: number[]): Promise<any> {
  const response = await axiosInstance.delete('/api/admin/blog/categories/bulk-delete', {
    data: { ids }
  });
  return response.data;
}

/**
 * Bulk restore soft-deleted blog categories
 * @param ids - Array of category IDs to restore
 * @returns Promise containing the API response
 */
export async function bulkRestoreBlogCategories(ids: number[]): Promise<any> {
  const response = await axiosInstance.put('/api/admin/blog/categories/bulk-restore', {
    ids
  });
  return response.data;
}

// Blog Tag Types
export interface BlogTagResponse {
  success: boolean;
  data: {
    total: number;
    page: number;
    limit: number;
    tags: BlogTag[];
  };
}

export interface BlogTagParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: "name" | "slug" | "created_at" | "updated_at";
  order?: "ASC" | "DESC";
  deleted?: boolean;
}

// Blog Tag API Functions
export const getBlogTags = async (
  params: BlogTagParams = {}
): Promise<BlogTagResponse> => {
  const response = await fetcher("/api/admin/blog/tags", params);
  return response;
};

export const getBlogTag = async (id: number) => {
  const response = await fetcher(`/api/admin/blog/tags/${id}`);
  return response;
};

export const createBlogTag = async (tag: { name: string; slug: string }) => {
  const response = await poster("/api/admin/blog/tags", tag);
  return response?.data;
};

export const updateBlogTag = async (
  id: number,
  tag: {
    name?: string;
    slug?: string;
  }
) => {
  const response = await updater(`/api/admin/blog/tags/${id}`, tag);
  return response?.data;
};

export const deleteBlogTag = async (id: number, redirect_url?: string) => {
  const response = await axiosInstance.delete(`/api/admin/blog/tags/${id}`, {
    data: redirect_url ? { redirect_url } : undefined,
  });
  return response.data;
};

/**
 * Restore a soft-deleted blog tag
 * @param id - The ID of the tag to restore
 * @returns Promise containing the API response
 */
export async function restoreBlogTag(id: number) {
  try {
    const response = await updater(`/api/admin/blog/tags/${id}/restore`, {});
    return response;
  } catch (error) {
    throw error;
  }
}

/**
 * Bulk delete blog tags
 * @param ids - Array of tag IDs to delete
 * @returns Promise containing the API response
 */
export async function bulkDeleteBlogTags(ids: number[]): Promise<any> {
  const response = await axiosInstance.delete('/api/admin/blog/tags/bulk-delete', {
    data: { ids }
  });
  return response.data;
}

/**
 * Bulk restore soft-deleted blog tags
 * @param ids - Array of tag IDs to restore
 * @returns Promise containing the API response
 */
export async function bulkRestoreBlogTags(ids: number[]): Promise<any> {
  const response = await axiosInstance.put('/api/admin/blog/tags/bulk-restore', {
    ids
  });
  return response.data;
}

export interface BlogTagDetailResponse {
  success: boolean;
  message: string;
  data: BlogTag;
}

export const getBlogTagById = async (
  id: number
): Promise<BlogTagDetailResponse> => {
  try {
    const response = await fetcher(`/api/admin/blog/tags/${id}`);
    return response;
  } catch (error) {
    throw error;
  }
};
