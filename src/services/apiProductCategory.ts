import axiosInstance from '@/utils/axiosApi';

// Generic fetcher for GET requests
// export const fetcher = (url) => axiosInstance.get(url).then((res) => res.data);
export const fetcher = (url, params = {}) => {
    return axiosInstance.get(url, { params }).then((res) => res.data);
};

// Generic poster for POST requests
export const poster = (url, data) => axiosInstance.post(url, data).then((res) => res.data);

// Generic updater for PUT requests
export const updater = (url, data) => axiosInstance.put(url, data).then((res) => res.data);

// Generic deleter for DELETE requests
export const deleter = (url) => axiosInstance.delete(url).then((res) => res.data);

// User actions
// export const listUser = () => fetcher('/api/admin/user');
export const createCategory = (credentials) => poster('/api/admin/category', credentials);
export const listProductCategory = (params = {}) => fetcher('/api/admin/category', params);
// export const updateCategory = (id, categoryData) => updater(`/api/admin/category/${id}`, categoryData);
export const updateCategory = (id, brandData) => {
    return axiosInstance.put(`/api/admin/category/${id}`, brandData, {
        headers: {
            'Content-Type': 'multipart/form-data', //  Ensure correct Content-Type
        },
    }).then((res) => res.data);
};
export const categoryDetails = (id) => fetcher(`/api/admin/category/${id}`);
export const deleteCategory = (id) => deleter(`/api/admin/category/${id}`);
export const restoreCategory = (id) => updater(`/api/admin/category/${id}/restore`,{});
