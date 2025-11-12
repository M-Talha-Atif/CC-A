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

  const REFRESH_INTERVAL = 25 * 60 * 1000; // 25 minutes (more frequent)
  const CACHE_MAX_AGE = 6 * 24 * 60 * 60 * 1000; // 6 days

  // Enhanced refresh function with fallback
  const refreshToken = async (isBackgroundRefresh = false) => {
    if (isRefreshingRef.current) {
      console.log("🔄 Refresh already in progress, skipping...");
      return false;
    }
    
    isRefreshingRef.current = true;

    try {
      const { isLoggingOut } = useUserStore.getState();
      if (isLoggingOut) return false;

      console.log(`🔄 ${isBackgroundRefresh ? 'Background' : 'Manual'} token refresh...`);

      // First attempt: Cookie-based refresh
      try {
        const { data } = await axiosInstance.post("/api/auth/refresh-token");

        if (data.success && data.data?.user) {
          console.log("✅ Token refreshed successfully via cookies");
          setUser(data.data.user);
          
          // Update cache
          sessionStorage.setItem("user_cache", JSON.stringify(data.data.user));
          sessionStorage.setItem("last_refresh", Date.now().toString());
          
          // Sync tokens to localStorage if provided
          if (data.data.accessToken) {
            localStorage.setItem('accessToken', data.data.accessToken);
          }
          if (data.data.refreshToken) {
            localStorage.setItem('refreshToken', data.data.refreshToken);
          }
          
          return true;
        }
      } catch (cookieError) {
        console.warn("⚠️ Cookie-based refresh failed, trying fallback...");
        
        // Fallback: localStorage refresh token
        if (typeof window !== "undefined") {
          const fallbackRefreshToken = localStorage.getItem('refreshToken');
          
          if (fallbackRefreshToken) {
            try {
              console.log("🔄 Attempting fallback refresh with localStorage token");
              
              const fallbackResponse = await fetch(
                `${process.env.NEXT_PUBLIC_BASE_URL}api/auth/refresh-token`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ refreshToken: fallbackRefreshToken }),
                  credentials: 'omit' // Don't use cookies for fallback
                }
              );

              const fallbackData = await fallbackResponse.json();

              if (fallbackData.success && fallbackData.data?.accessToken) {
                console.log("✅ Fallback refresh successful");
                
                // Store new tokens
                localStorage.setItem('accessToken', fallbackData.data.accessToken);
                localStorage.setItem('refreshToken', fallbackData.data.refreshToken);
                
                if (fallbackData.data.user) {
                  setUser(fallbackData.data.user);
                  sessionStorage.setItem("user_cache", JSON.stringify(fallbackData.data.user));
                }
                
                sessionStorage.setItem("last_refresh", Date.now().toString());
                return true;
              }
            } catch (fallbackError) {
              console.error("❌ Fallback refresh also failed:", fallbackError);
            }
          }
        }
        
        throw cookieError; // Re-throw to trigger the catch block below
      }

      console.warn("⚠️ Refresh response missing user data");
      return false;
    } catch (error) {
      console.error("❌ All refresh attempts failed:", error);
      
      // Only clear data and redirect if this is not a background refresh
      if (!isBackgroundRefresh) {
        sessionStorage.removeItem("user_cache");
        sessionStorage.removeItem("last_refresh");
        if (typeof window !== "undefined") {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
        clearUser();
        router.push("/login?flow=creative&step=login-choice&mode=login");
      }
      
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
      console.log("🔍 Performing initial session check...");
      
      const cachedUser = sessionStorage.getItem("user_cache");
      const lastRefresh = sessionStorage.getItem("last_refresh");

      // Check if we have a valid cache first
      if (cachedUser && lastRefresh) {
        const cacheAge = Date.now() - parseInt(lastRefresh);
        if (cacheAge < CACHE_MAX_AGE) {
          console.log("✅ Restored session from cache");
          setUser(JSON.parse(cachedUser));
          // Refresh token in background without blocking
          refreshToken(true).catch(console.error);
          return;
        } else {
          console.log("🗑️ Cache expired, clearing...");
          sessionStorage.removeItem("user_cache");
          sessionStorage.removeItem("last_refresh");
        }
      }

      // No valid cache, attempt refresh
      const refreshed = await refreshToken(false);
      
      if (!refreshed) {
        console.log("❌ No valid session found");
        clearUser();
        router.push("/login?flow=creative&step=login-choice&mode=login");
      }
    };

    checkSession();
  }, [setUser, clearUser, router]);

  // // Proactive refresh timer
  // useEffect(() => {
  //   if (!isAuthenticated) return;

  //   console.log(`⏰ Starting refresh timer (${REFRESH_INTERVAL / 60000} min intervals)`);
    
  //   refreshTimerRef.current = setInterval(() => {
  //     refreshToken(true).catch(console.error); // Background refresh
  //   }, REFRESH_INTERVAL);

  //   return () => {
  //     if (refreshTimerRef.current) {
  //       clearInterval(refreshTimerRef.current);
  //       refreshTimerRef.current = null;
  //     }
  //   };
  // }, [isAuthenticated]);

  // // Visibility change handler - less aggressive
  // useEffect(() => {
  //   const handleVisibilityChange = async () => {
  //     if (document.visibilityState !== "visible") return;
      
  //     const lastRefresh = sessionStorage.getItem("last_refresh");
  //     const now = Date.now();

  //     // Only refresh if it's been a while (15 minutes)
  //     if (!lastRefresh || now - parseInt(lastRefresh) > 15 * 60 * 1000) {
  //       console.log("👀 Tab visible, refreshing token if needed");
  //       await refreshToken(true); // Background refresh
  //     }
  //   };

  //   document.addEventListener("visibilitychange", handleVisibilityChange);
  //   return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  // }, []);

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