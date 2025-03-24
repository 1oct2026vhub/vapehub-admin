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
export const deleteCategory = (id) => deleter(`/api/admin/category/${id}`);
export const restoreCategory = (id) =>
  updater(`/api/admin/category/${id}/restore`, {});

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
    },
  );
  return response.data;
};
