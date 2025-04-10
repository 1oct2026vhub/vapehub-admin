import { fetcher, poster, updater, deleter } from "./apiService";

// Types for Blog Posts, Categories, and Tags
export interface BlogPost {
  id: number;
  title: string;
  content: string;
  slug: string;
  image?: string;
  image_url?: string;
  published_at?: string;
  is_active: boolean;
  status?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  categories?: BlogCategory[];
  tags?: BlogTag[];
  author?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  parent_id?: number;
  parent?: string;
  children?: string[];
  status: string;
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

export const deleteBlogPost = async (id: number) => {
  const response = await deleter(`/api/admin/blog/posts/${id}`);
  return response;
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

export const deleteBlogCategory = async (id: number) => {
  const response = await deleter(`/api/admin/blog/categories/${id}`);
  return response;
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

export const deleteBlogTag = async (id: number) => {
  const response = await deleter(`/api/admin/blog/tags/${id}`);
  return response;
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
