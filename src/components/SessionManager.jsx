"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/utils/axiosInstance";
import useUserStore from "@/store/userStore";

export default function SessionManager({ children }) {
  const router = useRouter();
  const { setUser, clearUser } = useUserStore();

  const isRefreshingRef = useRef(false);
  const hasCheckedSession = useRef(false);

  const CACHE_MAX_AGE = 6 * 24 * 60 * 60 * 1000; // 6 days

  // // Refresh token: first try cookies, fallback to localStorage (client-only)
  // const refreshToken = async (isBackground = false) => {
  //   if (isRefreshingRef.current) return false;
  //   isRefreshingRef.current = true;

  //   try {
  //     let data;

  //     // Cookie-based refresh (SSR-safe)
  //     try {
  //       const res = await axiosInstance.post("/api/auth/refresh-token");
  //       data = res.data;
  //     } catch {
  //       // Client-side fallback using localStorage
  //       if (typeof window !== "undefined") {
  //         const storedRefresh = localStorage.getItem("refreshToken");
  //         if (storedRefresh) {
  //           const fallbackRes = await fetch(
  //             `${process.env.NEXT_PUBLIC_BASE_URL}api/auth/refresh-token`,
  //             {
  //               method: "POST",
  //               headers: { "Content-Type": "application/json" },
  //               body: JSON.stringify({ refreshToken: storedRefresh }),
  //             }
  //           );
  //           data = await fallbackRes.json();
  //         }
  //       }
  //     }

  //     if (data?.success && data.data?.accessToken) {
  //       if (typeof window !== "undefined") {
  //         localStorage.setItem("accessToken", data.data.accessToken);
  //         if (data.data.refreshToken)
  //           localStorage.setItem("refreshToken", data.data.refreshToken);
  //       }

  //       if (data.data.user) {
  //         setUser(data.data.user);
  //         if (typeof window !== "undefined") {
  //           sessionStorage.setItem("user_cache", JSON.stringify(data.data.user));
  //         }
  //       }

  //       if (typeof window !== "undefined") {
  //         sessionStorage.setItem("last_refresh", Date.now().toString());
  //       }

  //       return true;
  //     }

  //     throw new Error("No valid token refresh response");
  //   } catch (err) {
  //     console.error("❌ Token refresh failed:", err.message);
  //     if (!isBackground && typeof window !== "undefined") {
  //       localStorage.removeItem("accessToken");
  //       localStorage.removeItem("refreshToken");
  //       sessionStorage.clear();
  //       clearUser();
  //       router.push("/login?flow=creative&step=login-choice&mode=login");
  //     }
  //     return false;
  //   } finally {
  //     isRefreshingRef.current = false;
  //   }
  // };

  // useEffect(() => {
  //   if (hasCheckedSession.current) return;
  //   hasCheckedSession.current = true;

  //   const checkSession = async () => {
  //     if (typeof window === "undefined") return;

  //     const cachedUser = sessionStorage.getItem("user_cache");
  //     const lastRefresh = sessionStorage.getItem("last_refresh");

  //     // Restore cached user if still valid
  //     if (cachedUser && lastRefresh) {
  //       const cacheAge = Date.now() - parseInt(lastRefresh);
  //       if (cacheAge < CACHE_MAX_AGE) {
  //         setUser(JSON.parse(cachedUser));
  //         refreshToken(true);
  //         return;
  //       }
  //       sessionStorage.clear();
  //     }

  //     // Fallback: check localStorage refresh token
  //     const storedRefresh = localStorage.getItem("refreshToken");
  //     if (storedRefresh) {
  //       console.log("local storage refreshing system")
  //       const ok = await refreshToken(false);
  //       if (ok) return;
  //     }

      

  //     // No session → redirect
  //     clearUser();
  //     router.push("/login?flow=creative&step=login-choice&mode=login");
  //   };

  //   checkSession();
  // }, [setUser, clearUser, router]);

  return children;
}
