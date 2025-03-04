// import axios from 'axios';

// const axiosApi = axios.create({
//   baseURL: process.env.NEXT_PUBLIC_BASE_URL, 
//   timeout: 10000, 
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// export default axiosApi;

import axios from "axios";
import { getAuthToken } from "@/utils/auth";

const axiosApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to attach token dynamically
axiosApi.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = getAuthToken();
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosApi;
