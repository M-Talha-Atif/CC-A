"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/utils/axiosInstance"; // ✅ Use configured instance
import useUserStore from "@/store/userStore";

export default function SessionManager({ children }) {
  const router = useRouter();
  const { setUser, clearUser, isAuthenticated } = useUserStore();
  const refreshTimerRef = useRef(null);
  const hasCheckedSession = useRef(false);

  const refreshToken = async () => {
    try {
      const { isLoggingOut } = useUserStore.getState();
      if (isLoggingOut) {
        console.log("🚫 Logout in progress, skipping refresh");
        return false;
      }

      console.log("🔄 Attempting token refresh...");

      const { data } = await axiosInstance.post(
        "api/auth/refresh-token",
        {},
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("📦 Refresh response:", data);

      if (data.success && data.data?.user) {
        console.log("✅ Token refreshed successfully");
        setUser(data.data.user);

        sessionStorage.setItem("user_cache", JSON.stringify(data.data.user));
        sessionStorage.setItem("last_refresh", Date.now().toString());

        return true;
      } else {
        console.log("⚠️ Refresh response missing user data");
        return false;
      }
    } catch (error) {
      console.error(
        "❌ Token refresh failed:",
        error.response?.data || error.message
      );

      // Clear cache on failed refresh
      sessionStorage.removeItem("user_cache");
      sessionStorage.removeItem("last_refresh");

      return false;
    }
  };

  useEffect(() => {
    const checkAndRefreshSession = async () => {
      if (hasCheckedSession.current) return;
      hasCheckedSession.current = true;

      console.log("🔍 Initial session check...");

      // Try to refresh token on mount
      const refreshed = await refreshToken();

      if (!refreshed) {
        // 🔥 CHECK CACHE BEFORE LOGGING OUT
        const cachedUser = sessionStorage.getItem("user_cache");
        const lastRefresh = sessionStorage.getItem("last_refresh");

        // If cache exists and is less than 6 days old, restore session
        if (cachedUser && lastRefresh) {
          const cacheAge = Date.now() - parseInt(lastRefresh);
          const sixDays = 6 * 24 * 60 * 60 * 1000;

          if (cacheAge < sixDays) {
            console.log("✅ Restored session from cache");
            setUser(JSON.parse(cachedUser));
            // Try to refresh in background
            refreshToken();
            return;
          }
        }

        console.log("❌ No valid session found");
        sessionStorage.removeItem("user_cache");
        sessionStorage.removeItem("last_refresh");
        clearUser();
      }
    };

    checkAndRefreshSession();
  }, [setUser, clearUser]);

  // 🔥 Proactive token refresh - Every 5 minutes (more aggressive)
  useEffect(() => {
    if (!isAuthenticated) {
      console.log("⏸️ Not authenticated, skipping refresh timer");
      return;
    }

    console.log("⏰ Starting refresh timer (5 min intervals)");

    const startRefreshTimer = () => {
      refreshTimerRef.current = setInterval(
        async () => {
          console.log("⏰ Proactive refresh triggered");
          const refreshed = await refreshToken();

          if (!refreshed) {
            clearUser();
            sessionStorage.removeItem("user_cache");
            sessionStorage.removeItem("last_refresh");
            router.push("/login?flow=creative&step=login-choice&mode=login");
          }
        },
        5 * 60 * 1000 // 🔥 5 minutes
      );
    };

    startRefreshTimer();

    return () => {
      if (refreshTimerRef.current) {
        console.log("🛑 Clearing refresh timer");
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [isAuthenticated, clearUser, router]);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      // Don't refresh during logout
      const { isLoggingOut } = useUserStore.getState();

      if (document.visibilityState === "visible" && !isLoggingOut) {
        console.log("👀 Tab became visible, refreshing token");
        const refreshed = await refreshToken();

        if (!refreshed) {
          const cachedUser = sessionStorage.getItem("user_cache");
          if (cachedUser) {
            setUser(JSON.parse(cachedUser));
            refreshToken();
          } else {
            clearUser();
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [setUser, clearUser]);

  // 🔥 NEW: Handle beforeunload to ensure cache is updated
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
