import axiosInstance from "@/utils/axiosApi";

// Generic fetcher for GET requests
// export const fetcher = (url) => axiosInstance.get(url).then((res) => res.data);
export const fetcher = (url, params = {}) => {
  return axiosInstance.get(url, { params }).then((res) => res.data);
};

// Generic poster for POST requests
export const poster = (url, data) =>
  axiosInstance.post(url, data).then((res) => res.data);

// Generic updater for PUT requests
export const updater = (url, data) =>
  axiosInstance.put(url, data).then((res) => res.data);

// Generic deleter for DELETE requests
export const deleter = (url) =>
  axiosInstance.delete(url).then((res) => res.data);

// User actions
// export const listUser = () => fetcher('/api/admin/user');
export const createCategory = (credentials) =>
  poster("/api/admin/category", credentials);
export const listProductCategory = (params = {}) =>
  fetcher("/api/admin/category", params);
// export const updateCategory = (id, categoryData) => updater(`/api/admin/category/${id}`, categoryData);
export const updateCategory = (id, categoryData) => {
  return axiosInstance
    .put(`/api/admin/category/${id}`, categoryData, {
      headers: {
        "Content-Type": "multipart/form-data", // ✅ Ensure correct Content-Type
      },
    })
    .then((res) => res.data);
};
export const categoryDetails = (id) => fetcher(`/api/admin/category/${id}`);
export const deleteCategory = async (id: number, redirect_url?: string) => {
  const response = await axiosInstance.delete(`/api/admin/category/${id}`, {
    data: redirect_url ? { redirect_url } : undefined,
  });
  return response.data;
};
export const restoreCategory = (id) =>
  updater(`/api/admin/category/${id}/restore`, {});

// Function to remove category image
export const removeCategoryImage = (id) =>
  deleter(`/api/admin/category/${id}/remove-image`);

// Download sample Excel file
export const downloadSampleExcel = () => {
  return axiosInstance
    .get("/api/admin/category/download/sample-excel", {
      responseType: "blob",
    })
    .then((res) => {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "category-sample.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    });
};

// Bulk update Category from Excel file
export const bulkUpdateCategory = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axiosInstance.post(
    "/api/admin/category/bulk-update/categories",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

// Bulk delete categories by IDs
export const bulkDeleteCategory = async (ids: number[]) => {
  const response = await axiosInstance.delete(
    "/api/admin/category/bulk-delete",
    {
      data: { ids },
    }
  );
  return response.data;
};

// Bulk restore soft-deleted categories by IDs
export const bulkRestoreCategory = async (ids: number[]) => {
  const response = await axiosInstance.put(
    "/api/admin/category/bulk-restore",
    { ids }
  );
  return response.data;
};

// Entity Banner functions for categories
export const getEntityBanners = (params = {}) =>
  fetcher("/api/entity-banners", params);

export const createEntityBanner = (bannerData) => {
  // Ensure type is lowercase and trimmed - this is critical for validation
  const type = (bannerData.type || "category").toString().toLowerCase().trim();
  
  // If there's a file to upload, use FormData
  if (bannerData.image instanceof File) {
    const formData = new FormData();
    formData.append("type", type);
    formData.append("category_id", bannerData.category_id.toString());
    formData.append("image", bannerData.image);
    formData.append("alt", bannerData.alt !== undefined && bannerData.alt !== null ? bannerData.alt.toString() : "");
    // Only append url if it has a non-empty value
    if (bannerData.url && typeof bannerData.url === 'string' && bannerData.url.trim() !== '') {
      formData.append("url", bannerData.url.toString());
    }
    formData.append("order", (bannerData.order !== undefined && bannerData.order !== null ? bannerData.order : 0).toString());

    return axiosInstance
      .post("/api/entity-banners", formData)
      .then((res) => res.data);
  } else {
    // Send as JSON when there's no file - match exact payload format
    const payload: any = {
      type: type,
      category_id: bannerData.category_id,
      alt: bannerData.alt !== undefined && bannerData.alt !== null ? bannerData.alt.toString() : "",
      order: bannerData.order !== undefined && bannerData.order !== null ? bannerData.order : 0,
    };

    // Only include url if it has a non-empty value
    if (bannerData.url && typeof bannerData.url === 'string' && bannerData.url.trim() !== '') {
      payload.url = bannerData.url.toString();
    }

    // Always include image if it's a URL string
    if (bannerData.image && typeof bannerData.image === "string") {
      payload.image = bannerData.image;
    }

    console.log("Creating entity banner with JSON payload:", payload);

    return axiosInstance
      .post("/api/entity-banners", payload, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((res) => res.data);
  }
};

export const updateEntityBanner = (id, bannerData) => {
  // Ensure type is lowercase and trimmed - this is critical for validation
  const type = (bannerData.type || "category").toString().toLowerCase().trim();
  
  // If there's a file to upload, use FormData
  if (bannerData.image instanceof File) {
    const formData = new FormData();
    formData.append("type", type);
    
    if (bannerData.category_id !== undefined && bannerData.category_id !== null) {
      formData.append("category_id", bannerData.category_id.toString());
    }
    
    formData.append("image", bannerData.image);
    formData.append("alt", bannerData.alt !== undefined && bannerData.alt !== null ? bannerData.alt.toString() : "");
    // Only append url if it has a non-empty value
    if (bannerData.url && typeof bannerData.url === 'string' && bannerData.url.trim() !== '') {
      formData.append("url", bannerData.url.toString());
    }
    formData.append("order", (bannerData.order !== undefined && bannerData.order !== null ? bannerData.order : 0).toString());

    return axiosInstance
      .put(`/api/entity-banners/${id}`, formData)
      .then((res) => res.data);
  } else {
    // Send as JSON when there's no file - match exact payload format
    const payload: any = {
      type: type,
      alt: bannerData.alt !== undefined && bannerData.alt !== null ? bannerData.alt.toString() : "",
      order: bannerData.order !== undefined && bannerData.order !== null ? bannerData.order : 0,
    };

    // Only include url if it has a non-empty value
    if (bannerData.url && typeof bannerData.url === 'string' && bannerData.url.trim() !== '') {
      payload.url = bannerData.url.toString();
    }

    // Always include category_id if provided
    if (bannerData.category_id !== undefined && bannerData.category_id !== null) {
      payload.category_id = bannerData.category_id;
    }

    // Always include image if it's a URL string
    if (bannerData.image && typeof bannerData.image === "string") {
      payload.image = bannerData.image;
    }

    console.log("Updating entity banner with JSON payload:", payload);

    return axiosInstance
      .put(`/api/entity-banners/${id}`, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((res) => res.data);
  }
};

export const deleteEntityBanner = (id) => deleter(`/api/entity-banners/${id}`);

export interface RelatedLink {
  text: string;
  url: string;
}

export interface RelatedCategoriesApiResponse {
  success: boolean;
  message: string;
  data?: {
    related_links: RelatedLink[];
  };
  errors?: { msg?: string; message?: string; field?: string }[];
}

export const getCategoryRelatedCategories = (
  categoryId: number
): Promise<RelatedCategoriesApiResponse> => {
  return fetcher(`/api/admin/category/${categoryId}/related-categories`);
};

export const saveCategoryRelatedCategories = async (
  categoryId: number,
  related_links: RelatedLink[]
): Promise<RelatedCategoriesApiResponse> => {
  const payload = { related_links };

  const response = await axiosInstance.post(
    `/api/admin/category/${categoryId}/related-categories`,
    payload,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

