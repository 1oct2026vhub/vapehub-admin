

import axios from "axios";
import { getAuthToken, logoutUser } from "@/utils/auth";

const axiosApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// Request Interceptor - Attach Token
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

// Response Interceptor - Handle Expired Tokens & Errors
// axiosApi.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response) {
//       const { status, data } = error.response;

//       // Handle Unauthorized (401) - Token Expired
//       if (status === 401) {
//         logoutUser(); // Remove token from storage
//         window.location.href = "/sign-in"; // Redirect manually
//         return Promise.reject("Session expired. Please login again.");
//       }

//       // Return API error message
//       return Promise.reject(data?.message || "Something went wrong!");
//     }

//     //Network/Timeout Errors
//     return Promise.reject("Network error. Please try again.");
//   }
// );

axiosApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      // Handle Unauthorized (401) - Token Expired
      if (status === 401) {
        logoutUser(); // Remove token from storage
        window.location.href = "/sign-in"; // Redirect manually
        return Promise.reject({ message: "Session expired. Please login again." });
      }

      // ❗ Instead of rejecting just a string, return full `error.response.data`
      return Promise.reject(data || { message: "Something went wrong!" });
    }

    // Network/Timeout Errors
    return Promise.reject({ message: "Network error. Please try again." });
  }
);

export default axiosApi;

