import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  withCredentials: true, // This sends cookies automatically
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
          .then(() => axiosInstance(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try cookie-based refresh first
        const response = await axiosInstance.post("/api/auth/refresh-token");
        
        console.log("✅ Token refresh response:", response.data);
        processQueue(null, true);
        isRefreshing = false;

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error("❌ Cookie refresh failed, trying fallback:", refreshError);
        
        // Fallback: Check localStorage for refresh token
        if (typeof window !== "undefined") {
          const fallbackRefreshToken = localStorage.getItem('refreshToken');
          
          if (fallbackRefreshToken) {
            try {
              console.log("🔄 Attempting fallback refresh...");
              const fallbackResponse = await axios.post(
                `${process.env.NEXT_PUBLIC_BASE_URL}api/auth/refresh-token`,
                { refreshToken: fallbackRefreshToken },
                {
                  headers: {
                    "Content-Type": "application/json",
                  },
                  withCredentials: false // Don't use cookies for fallback
                }
              );

              if (fallbackResponse.data?.data?.accessToken) {
                // Store new tokens
                localStorage.setItem('accessToken', fallbackResponse.data.data.accessToken);
                localStorage.setItem('refreshToken', fallbackResponse.data.data.refreshToken);
                
                // Update current request header
                originalRequest.headers.Authorization = `Bearer ${fallbackResponse.data.data.accessToken}`;
                
                processQueue(null, true);
                isRefreshing = false;
                return axiosInstance(originalRequest);
              }
            } catch (fallbackError) {
              console.error("❌ Fallback refresh also failed:", fallbackError);
            }
          }
        }

        // All refresh attempts failed
        console.error("❌ All refresh attempts failed");
        processQueue(refreshError, null);
        isRefreshing = false;

        if (typeof window !== "undefined") {
          // Clear all auth data
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          sessionStorage.removeItem("user_cache");
          sessionStorage.removeItem("last_refresh");
          
          // Redirect to login
          window.location.href = "/login?flow=creative&step=login-choice&mode=login";
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
