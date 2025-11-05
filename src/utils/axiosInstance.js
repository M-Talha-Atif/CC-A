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
  (response) => {
    // If response contains new tokens, they're already set as cookies by the server
    // But for mobile, also check the response body
    if (response.data?.data?.accessToken) {
      console.log("✅ New tokens received in response");
    }
    return response;
  },
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
        const response = await axiosInstance.post("api/auth/refresh-token");

        // ✅ Check if tokens were returned in body (fallback for mobile)
        if (response.data?.data?.accessToken) {
          console.log("✅ Tokens refreshed successfully");
        }

        processQueue(null, true);
        isRefreshing = false;

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error("❌ Refresh failed:", refreshError);
        processQueue(refreshError, null);
        isRefreshing = false;

        if (typeof window !== "undefined") {
          // Clear any cached data
          sessionStorage.removeItem("user_cache");
          sessionStorage.removeItem("last_refresh");
          window.location.href =
            "/login?flow=creative&step=login-choice&mode=login";
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
