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
export const deleteBrand = (id) => deleter(`/api/admin/brand/${id}`);
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
