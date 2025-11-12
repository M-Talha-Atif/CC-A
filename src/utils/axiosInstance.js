import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor to add token from localStorage if available
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem('accessToken');
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            // Update token for the retried request
            if (typeof window !== "undefined") {
              const token = localStorage.getItem('accessToken');
              if (token) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
            }
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log("🔄 Axios interceptor: Attempting token refresh...");
        
        // Use the same endpoint but let the server handle cookie-based refresh
        const response = await axiosInstance.post("/api/auth/refresh-token");
        
        console.log("✅ Axios interceptor: Token refresh successful");
        
        // Store tokens if returned in response (for fallback)
        if (response.data?.data?.accessToken) {
          if (typeof window !== "undefined") {
            localStorage.setItem('accessToken', response.data.data.accessToken);
            if (response.data.data.refreshToken) {
              localStorage.setItem('refreshToken', response.data.data.refreshToken);
            }
          }
        }
        
        processQueue(null, true);
        isRefreshing = false;

        // Update the original request with new token
        if (typeof window !== "undefined") {
          const newToken = localStorage.getItem('accessToken');
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
        }

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error("❌ Axios interceptor: Refresh failed", refreshError);
        
        // Don't attempt fallback refresh here - let SessionManager handle it
        // This prevents multiple refresh attempts
        
        processQueue(refreshError, null);
        isRefreshing = false;

        // Clear auth data but don't redirect here
        if (typeof window !== "undefined") {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;