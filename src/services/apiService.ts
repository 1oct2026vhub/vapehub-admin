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
export const updater = (url, data) => {
  return axiosInstance.put(url, data)
    .then((res) => res.data)
    .catch((error) => {
      console.error(`PUT request failed for ${url}:`, error.message);
      throw error;
    });
};

// Generic patcher for PATCH requests
export const patcher = (url, data) =>
  axiosInstance.patch(url, data).then((res) => res.data);

// Generic deleter for DELETE requests
export const deleter = (url) =>
  axiosInstance.delete(url).then((res) => res.data);

// Auth actions
export const login = (credentials) =>
  poster("/api/admin/auth/login", credentials);
export const createUser = (credentials) =>
  poster("/api/admin/user", credentials);
export const verifyEmail = (token) =>
  fetcher("/api/admin/auth/verify-email", token);
export const forgotPassword = (credentials) =>
  poster("/api/admin/auth/forgot-password", credentials);
export const resetPassword = (credentials) =>
  poster("/api/admin/auth/reset-password", credentials);

// User actions
// export const listUser = () => fetcher('/api/admin/user');
export const listUser = (params = {}) => fetcher("/api/admin/user", params);
export const updateUser = (id, userData) =>
  updater(`/api/admin/user/${id}`, userData);
export const deleteUser = (id) => deleter(`/api/admin/user/${id}`);
export const restoreUser = (id) => updater(`/api/admin/user/${id}/restore`, {});

// Customer actions
export const listCustomer = (params = {}) =>
  fetcher("/api/admin/customer", params);
export const customerDetails = (id) => fetcher(`/api/admin/customer/${id}`);
export const deleteCustomer = (id) => deleter(`/api/admin/customer/${id}`);
export const blockCustomer = (id) =>
  updater(`/api/admin/customer/${id}/block`, {});
export const unBlockCustomer = (id) =>
  updater(`/api/admin/customer/${id}/unblock`, {});
export const restoreCustomer = (id) =>
  updater(`/api/admin/customer/${id}/restore`, {});

// List admin roles
// export const listRole = (params = {}) => fetcher('/api/admin/user/roles', params);

export const listRole = async (params = {}) => {
  const response = await fetcher("/api/admin/user/roles", params);
  return response?.data || response; // Ensure correct data format
};
