// src/store/userStore.js

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { refreshUserToken } from "../../action";

const useUserStore = create(
  persist(
    (set, get) => ({
      user: {
        rank: null,
        referralCode: null,
      },
      isAuthenticated: false,
      hasHydrated: false,
      currentFeedCategory: null,
      isTokenRefreshing: false,
      lastTokenRefresh: null,
      isLoggingOut: false, // ADD THIS NEW STATE

      setUser: (userData) =>
        set((state) => ({
          user: { ...state.user, ...userData },
          isAuthenticated: true,
          currentFeedCategory: state.currentFeedCategory || "new",
        })),

      clearUser: () =>
        set({
          user: {
            rank: null,
            referralCode: null,
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
        const state = get();

        // Prevent multiple simultaneous refresh attempts
        if (state.isTokenRefreshing) {
          return {
            success: false,
            message: "Token refresh already in progress",
          };
        }

        // Check if we recently refreshed (within last 5 minutes)
        const now = Date.now();
        if (
          state.lastTokenRefresh &&
          now - state.lastTokenRefresh < 5 * 60 * 1000
        ) {
          return { success: true, message: "Token recently refreshed" };
        }

        set({ isTokenRefreshing: true });

        try {
          const result = await refreshUserToken();

          if (result.success) {
            set({
              isAuthenticated: true,
              isTokenRefreshing: false,
              lastTokenRefresh: now,
            });

            // Update user data if available
            if (result.data?.user) {
              set((state) => ({
                user: { ...state.user, ...result.data.user },
              }));
            }

            return result;
          } else {
            // Token refresh failed, clear user
            set({
              user: {
                rank: null,
                referralCode: null,
              },
              isAuthenticated: false,
              currentFeedCategory: "couples",
              isTokenRefreshing: false,
              lastTokenRefresh: null,
              isLoggingOut: false, // Reset logout state
            });

            return result;
          }
        } catch (error) {
          console.error("Token refresh error in store:", error);

          set({
            user: {
              rank: null,
              referralCode: null,
            },
            isAuthenticated: false,
            currentFeedCategory: "couples",
            isTokenRefreshing: false,
            lastTokenRefresh: null,
            isLoggingOut: false, // Reset logout state
          });

          return {
            success: false,
            message: "Token refresh failed",
          };
        }
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
