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
export const createBrand = (credentials) =>
  poster("/api/admin/brand", credentials);
export const listProductBrand = (params = {}) =>
  fetcher("/api/admin/brand", params);
// export const updateBrand = (id, brandData) => updater(`/api/admin/brand/${id}`, brandData);
export const updateBrand = (id, brandData) => {
  return axiosInstance
    .put(`/api/admin/brand/${id}`, brandData, {
      headers: {
        "Content-Type": "multipart/form-data", // ✅ Ensure correct Content-Type
      },
    })
    .then((res) => res.data);
};
export const brandDetails = (id) => fetcher(`/api/admin/brand/${id}`);
export const deleteBrand = async (id: number, redirect_url?: string) => {
  const response = await axiosInstance.delete(`/api/admin/brand/${id}`, {
    data: redirect_url ? { redirect_url } : undefined,
  });
  return response.data;
};
export const restoreBrand = (id) =>
  updater(`/api/admin/brand/${id}/restore`, {});

// Function to remove brand image
export const removeBrandImage = (id) =>
  deleter(`/api/admin/brand/${id}/remove-image`);

// Download sample Excel file
export const downloadSampleExcel = () => {
  return axiosInstance
    .get("/api/admin/brand/download/sample-excel", {
      responseType: "blob",
    })
    .then((res) => {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "brand-sample.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    });
};

// Bulk update brands from Excel file
export const bulkUpdateBrands = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axiosInstance.post(
    "/api/admin/brand/bulk-update",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

// Bulk delete brands by IDs
export const bulkDeleteBrand = async (ids: number[]) => {
  const response = await axiosInstance.delete(
    "/api/admin/brand/bulk-delete",
    {
      data: { ids },
    }
  );
  return response.data;
};

// Bulk restore soft-deleted brands by IDs
export const bulkRestoreBrand = async (ids: number[]) => {
  const response = await axiosInstance.put(
    "/api/admin/brand/bulk-restore",
    { ids }
  );
  return response.data;
};

// Entity Banner functions
export const getEntityBanners = (params = {}) =>
  fetcher("/api/entity-banners", params);

export const createEntityBanner = (bannerData) => {
  // Ensure type is lowercase and trimmed - this is critical for validation
  const type = (bannerData.type || "brand").toString().toLowerCase().trim();
  
  // If there's a file to upload, use FormData
  if (bannerData.image instanceof File) {
    const formData = new FormData();
    formData.append("type", type);
    formData.append("brand_id", bannerData.brand_id.toString());
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
    // Send as JSON when there's no file
    const payload: any = {
      type: type,
      brand_id: bannerData.brand_id,
      alt: bannerData.alt !== undefined && bannerData.alt !== null ? bannerData.alt.toString() : "",
      order: bannerData.order !== undefined && bannerData.order !== null ? bannerData.order : 0,
    };

    // Only include url if it has a non-empty value
    if (bannerData.url && typeof bannerData.url === 'string' && bannerData.url.trim() !== '') {
      payload.url = bannerData.url.toString();
    }

    // If image is a URL string, include it
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
  const type = (bannerData.type || "brand").toString().toLowerCase().trim();
  
  // If there's a file to upload, use FormData
  if (bannerData.image instanceof File) {
    const formData = new FormData();
    formData.append("type", type);
    
    if (bannerData.brand_id !== undefined && bannerData.brand_id !== null) {
      formData.append("brand_id", bannerData.brand_id.toString());
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
    // Send as JSON when there's no file
    const payload: any = {
      type: type,
      alt: bannerData.alt !== undefined && bannerData.alt !== null ? bannerData.alt.toString() : "",
      order: bannerData.order !== undefined && bannerData.order !== null ? bannerData.order : 0,
    };

    // Only include url if it has a non-empty value
    if (bannerData.url && typeof bannerData.url === 'string' && bannerData.url.trim() !== '') {
      payload.url = bannerData.url.toString();
    }

    // Include brand_id if provided
    if (bannerData.brand_id !== undefined && bannerData.brand_id !== null) {
      payload.brand_id = bannerData.brand_id;
    }

    // If image is a URL string, include it
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
