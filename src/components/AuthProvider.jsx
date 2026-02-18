// src/components/AuthProvider.js

"use client";

import { useEffect, useState } from "react";
import useUserStore from "@/store/userStore";

const AuthProvider = ({ children }) => {
  const { hasHydrated, initializeAuth, isAuthenticated, isTokenRefreshing } =
    useUserStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // Wait for store to hydrate first
      if (!hasHydrated) {
        return;
      }

      console.log("AuthProvider: Store hydrated, initializing auth...");

      try {
        // Try to refresh token when app loads
        await initializeAuth();
      } catch (error) {
        console.error("Auth initialization failed:", error);
      } finally {
        setIsInitializing(false);
      }
    };

    initAuth();
  }, [hasHydrated, initializeAuth]);

  // Handle page visibility changes (when user returns to tab/app)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (
        document.visibilityState === "visible" &&
        hasHydrated &&
        !isTokenRefreshing
      ) {
        // Check if user was previously authenticated
        const storedAuth = localStorage.getItem("userStorage");
        if (storedAuth) {
          try {
            const parsed = JSON.parse(storedAuth);
            if (parsed.state?.isAuthenticated && !isAuthenticated) {
              console.log(
                "User was authenticated but session lost, attempting refresh..."
              );
              await initializeAuth();
            }
          } catch (error) {
            console.error("Error parsing stored auth:", error);
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [hasHydrated, isAuthenticated, isTokenRefreshing, initializeAuth]);

  // Show loading screen during initialization
  if (!hasHydrated || isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return children;
};

export default AuthProvider;
