import axios from "axios";
import cookie from "cookie";
import useUserStore from "@/store/userStore";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor: attach token
axiosInstance.interceptors.request.use((config) => {
  if (typeof window === "undefined" && config.headers.cookie) {
    const parsed = cookie.parse(config.headers.cookie);
    if (parsed.token) {
      config.headers.Authorization = `Bearer ${parsed.token}`;
    }
  }

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

// Response interceptor: refresh token on 401
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const { refreshToken, setUser } = useUserStore.getState();

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      typeof window !== "undefined"
    ) {
      originalRequest._retry = true;

      try {
        // Call your refresh token API
        const storedRefreshToken = localStorage.getItem("refreshToken");
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_BASE_URL}/auth/refresh-token`,
          { refreshToken: storedRefreshToken },
          { withCredentials: true }
        );

        if (res.data?.accessToken) {
          localStorage.setItem("accessToken", res.data.accessToken);

          // Update Zustand user store (optional, if needed)
          setUser((prev) => ({ ...prev, accessToken: res.data.accessToken }));

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        console.error("Refresh token failed:", refreshError);
        setUser({}); // clear user if refresh fails
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
