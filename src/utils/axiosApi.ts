// import axios from "axios";
// import { getAuthToken, logoutUser } from "@/utils/auth";

// // Remove trailing slash from base URL if it exists
// const baseURL = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '');

// const axiosApi = axios.create({
//   baseURL,
//   timeout: 30000,
//   headers: {
//     "Content-Type": "application/json",
//     "Accept": "application/json"
//   },
//   validateStatus: (status) => status >= 200 && status < 500,
// });

// // Request Interceptor - Attach Token
// axiosApi.interceptors.request.use(
//   (config) => {
//     console.log('Axios request interceptor - Starting request configuration:', {
//       url: config.url,
//       method: config.method,
//       baseURL: config.baseURL,
//       headers: config.headers,
//       data: config.data
//     });

//     if (typeof window !== "undefined") {
//       const token = getAuthToken();
//       console.log('Auth token check:', { hasToken: !!token });

//       if (token) {
//         config.headers["Authorization"] = `Bearer ${token}`;
//       }
//     }

//     // Set Content-Type based on data type
//     if (config.data instanceof FormData) {
//       config.headers["Content-Type"] = "multipart/form-data";
//     }

//     // Ensure URL starts with a single slash
//     if (config.url && !config.url.startsWith('/')) {
//       config.url = '/' + config.url;
//     }

//     // Log final request configuration
//     console.log('Axios request interceptor - Final request configuration:', {
//       url: config.url,
//       method: config.method,
//       baseURL: config.baseURL,
//       fullURL: `${config.baseURL}${config.url}`,
//       headers: config.headers,
//       data: config.data
//     });

//     return config;
//   },
//   (error) => {
//     console.error("Axios request interceptor error:", {
//       message: error.message,
//       config: error.config,
//       stack: error.stack
//     });
//     return Promise.reject({ message: "Failed to send request" });
//   }
// );

// // Response Interceptor - Handle Expired Tokens & Errors
// axiosApi.interceptors.response.use(
//   (response) => {
//     console.log('Axios response interceptor - Successful response:', {
//       status: response.status,
//       data: response.data,
//       headers: response.headers
//     });
//     return response;
//   },
//   (error) => {
//     console.error("Axios response interceptor - Error details:", {
//       error,
//       message: error.message,
//       response: error.response,
//       request: error.request,
//       config: error.config,
//       stack: error.stack
//     });

//     if (error.response) {
//       const { status, data } = error.response;
//       console.error('Axios response interceptor - Error response:', {
//         status,
//         data,
//         headers: error.response.headers
//       });

//       // Handle Unauthorized (401) - Token Expired
//       if (status === 401) {
//         console.log('Unauthorized access detected, redirecting to sign-in');
//         logoutUser();
//         window.location.href = "/sign-in";
//         return Promise.reject({ message: "Session expired. Please login again." });
//       }

//       // Handle validation errors
//       if (status === 422) {
//         return Promise.reject({
//           message: "Validation error",
//           errors: data.errors
//         });
//       }

//       // Return API error message
//       return Promise.reject(data || { message: "Something went wrong!" });
//     }

//     // Network/Timeout Errors
//     if (error.code === "ECONNABORTED") {
//       console.error('Request timeout:', {
//         timeout: error.config?.timeout,
//         url: error.config?.url
//       });
//       return Promise.reject({ message: "Request timed out. Please try again." });
//     }

//     if (!window.navigator.onLine) {
//       console.error('No internet connection');
//       return Promise.reject({ message: "No internet connection. Please check your network." });
//     }

//     // Log network error details
//     console.error('Axios response interceptor - Network error:', {
//       message: error.message,
//       code: error.code,
//       stack: error.stack,
//       config: error.config
//     });

//     return Promise.reject({ message: "Network error. Please try again." });
//   }
// );

// export default axiosApi;

import axios from "axios";
import { getAuthToken, logoutUser } from "@/utils/auth";
import { deleteCookie } from "cookies-next";

const axiosApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  timeout: 10000,
});

// Request Interceptor - Attach Token & Set Content-Type
axiosApi.interceptors.request.use(
  (config) => {
    console.log(`Request: ${config.method?.toUpperCase()} ${config.url}`, {
      data: config.data,
      params: config.params,
    });
    
    if (typeof window !== "undefined") {
      const token = getAuthToken();
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }

    // ✅ Set `Content-Type` only if not already defined
    if (!config.headers["Content-Type"]) {
      config.headers["Content-Type"] =
        config.data instanceof FormData
          ? "multipart/form-data"
          : "application/json";
    }

    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  },
);

// Response Interceptor - Handle Expired Tokens & Errors
axiosApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      // Handle Unauthorized (401) - Token Expired
      if (status === 401) {
        // Clear tokens and redirect without showing error
        deleteCookie("auth_token", { path: "/" });
        deleteCookie("user_info", { path: "/" });
        
        // Use window.location for immediate redirect
        if (typeof window !== "undefined") {
          window.location.href = "/sign-in";
        }
        
        // Return a resolved promise to prevent error handling
        return Promise.resolve({ data: { success: false } });
      }

      return Promise.reject(data || { message: "Something went wrong!" });
    }

    return Promise.reject({ message: "Network error. Please try again." });
  },
);

export default axiosApi;
