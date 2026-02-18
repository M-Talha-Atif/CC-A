// src/store/userStore.js

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { checkUserStatus } from "@root/action";

const useUserStore = create(
  persist(
    (set, get) => ({
      user: {
        rank: null,
        referralCode: null,
        canAccessProtectedPages: false,
      },
      isAuthenticated: false,
      hasHydrated: false,
      currentFeedCategory: null,
      isTokenRefreshing: false,
      lastTokenRefresh: null,
      isLoggingOut: false,

      setUser: (userData) =>
        set((state) => (
          { 
          user: { ...state.user, ...userData,
              canAccessProtectedPages: userData.canAccessProtectedPages !== undefined 
              ? userData.canAccessProtectedPages 
              : state.user.canAccessProtectedPages 
           },
          isAuthenticated: true,
          currentFeedCategory: state.currentFeedCategory || "new",
        }
      
      )),

      clearUser: () =>
        set({
          user: {
            rank: null,
            referralCode: null,
            canAccessProtectedPages: false,
          },
          isAuthenticated: false,
          currentFeedCategory: "couples",
          isTokenRefreshing: false,
          lastTokenRefresh: null,
          isLoggingOut: false, // Reset logout state when clearing user
        }),

      // ADD THIS NEW METHOD
      setIsLoggingOut: (value) => set({ isLoggingOut: value }),

      setCurrentFeedCategory: (category) =>
        set({ currentFeedCategory: category }),

      setHasHydrated: (value) => set({ hasHydrated: value }),

      // Token refresh logic (unchanged)
      refreshToken: async () => {

        // Just update the timestamp since axios interceptor handles the actual refresh
        const now = Date.now();

        set({
          lastTokenRefresh: now,
          isAuthenticated: true, // Assume success since interceptor will handle failures
        });

        return {
          success: true,
          message: "Token refresh handled by interceptor",
        };
      },

      // Initialize authentication state (unchanged)
      initializeAuth: async () => {
        const state = get();

        // If already authenticated, no need to refresh
        if (state.isAuthenticated) {
          return { success: true, message: "Already authenticated" };
        }

        // Try to refresh token on app initialization
        console.log("Initializing auth - attempting token refresh...");
        return await state.refreshToken();
      },

      
    }),
    {
      name: "userStorage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
          // Don't automatically refresh on rehydration
          // Let the app component handle it
        }
      },
      // Persist everything except refresh state and logout state
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        currentFeedCategory: state.currentFeedCategory,
        lastTokenRefresh: state.lastTokenRefresh,
        // NOTE: We don't persist isLoggingOut - it should always start as false
      }),
    }
  )
);

export default useUserStore;
