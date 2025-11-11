"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/utils/axiosInstance";
import useUserStore from "@/store/userStore";

export default function SessionManager({ children }) {
  const router = useRouter();
  const { setUser, clearUser, isAuthenticated } = useUserStore();

  const refreshTimerRef = useRef(null);
  const isRefreshingRef = useRef(false);
  const hasCheckedSession = useRef(false);

  const REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes
  const CACHE_MAX_AGE = 6 * 24 * 60 * 60 * 1000; // 6 days

  // Single refresh function
  const refreshToken = async () => {
    if (isRefreshingRef.current) return false;
    isRefreshingRef.current = true;

    try {
      const { isLoggingOut } = useUserStore.getState();
      if (isLoggingOut) return false;

      console.log("🔄 Refreshing token...");

      const { data } = await axiosInstance.post("/api/auth/refresh-token");

      if (data.success && data.data?.user) {
        console.log("✅ Token refreshed successfully");
        setUser(data.data.user);
        sessionStorage.setItem("user_cache", JSON.stringify(data.data.user));
        sessionStorage.setItem("last_refresh", Date.now().toString());
        return true;
      }

      console.warn("⚠️ Refresh response missing user data");
      return false;
    } catch (error) {
      console.error("❌ Token refresh failed:", error.response?.data || error.message);
      sessionStorage.removeItem("user_cache");
      sessionStorage.removeItem("last_refresh");
      return false;
    } finally {
      isRefreshingRef.current = false;
    }
  };

  // Initial session check
  useEffect(() => {
    if (hasCheckedSession.current) return;
    hasCheckedSession.current = true;

    const checkSession = async () => {
      const refreshed = await refreshToken();

      if (!refreshed) {
        const cachedUser = sessionStorage.getItem("user_cache");
        const lastRefresh = sessionStorage.getItem("last_refresh");

        if (cachedUser && lastRefresh) {
          const cacheAge = Date.now() - parseInt(lastRefresh);
          if (cacheAge < CACHE_MAX_AGE) {
            console.log("✅ Restored session from cache");
            setUser(JSON.parse(cachedUser));
            refreshToken(); // refresh in background
            return;
          }
        }

        console.log("❌ No valid session found, logging out");
        sessionStorage.removeItem("user_cache");
        sessionStorage.removeItem("last_refresh");
        clearUser();
        router.push("/login?flow=creative&step=login-choice&mode=login");
      }
    };

    checkSession();
  }, [setUser, clearUser, router]);

  // Proactive refresh timer
  useEffect(() => {
    if (!isAuthenticated) return;

    console.log(`⏰ Starting refresh timer (${REFRESH_INTERVAL / 60000} min intervals)`);
    refreshTimerRef.current = setInterval(refreshToken, REFRESH_INTERVAL);

    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [isAuthenticated]);

  // Visibility change handler
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== "visible") return;

      const lastRefresh = sessionStorage.getItem("last_refresh");
      const now = Date.now();

      if (!lastRefresh || now - parseInt(lastRefresh) > REFRESH_INTERVAL) {
        console.log("👀 Tab visible, refreshing token");
        const refreshed = await refreshToken();

        if (!refreshed) {
          const cachedUser = sessionStorage.getItem("user_cache");
          if (cachedUser) {
            setUser(JSON.parse(cachedUser));
            refreshToken();
          } else {
            clearUser();
            router.push("/login?flow=creative&step=login-choice&mode=login");
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [setUser, clearUser, router]);

  // Update cache before unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isAuthenticated) {
        sessionStorage.setItem("last_refresh", Date.now().toString());
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isAuthenticated]);

  return children;
}
