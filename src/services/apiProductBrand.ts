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
export const createBrand = (credentials) => poster('/api/admin/brand', credentials);
export const listProductBrand = (params = {}) => fetcher('/api/admin/brand', params);
// export const updateBrand = (id, brandData) => updater(`/api/admin/brand/${id}`, brandData);
export const updateBrand = (id, brandData) => {
    return axiosInstance.put(`/api/admin/brand/${id}`, brandData, {
        headers: {
            'Content-Type': 'multipart/form-data', // ✅ Ensure correct Content-Type
        },
    }).then((res) => res.data);
};
export const brandDetails = (id) => fetcher(`/api/admin/brand/${id}`);
export const deleteBrand = (id) => deleter(`/api/admin/brand/${id}`);
export const restoreBrand = (id) => updater(`/api/admin/brand/${id}/restore`,{});
