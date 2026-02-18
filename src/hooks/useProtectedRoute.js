// hooks/useProtectedRoute.js
"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import useUserStore from "@/store/userStore";

export function useProtectedRoute() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, hasHydrated, isAuthenticated } = useUserStore();

  useEffect(() => {
    if (!hasHydrated) return;

    const protectedCategories = ["new", "bookmark", "my-posts", "chatrooms"];
    const currentCategory = pathname.split('/').pop();

    if (protectedCategories.includes(currentCategory)) {
      console.log("🔒 Checking protected route access:", {
        pathname,
        currentCategory,
        isAuthenticated,
        canAccessProtectedPages: user?.canAccessProtectedPages,
        user
      });

      if (!isAuthenticated) {
        console.log("🔒 Redirecting: User not authenticated");
        router.replace("/feed/popular");
        return;
      }

      // if (user?.canAccessProtectedPages === false) {
      //   // console.log("🔒 Redirecting: User cannot access protected pages");
      //   router.replace("/feed/popular");
      //   return;
      // }

      // Double-check the actual conditions
    //   if (user) {
    //     const hasAccess = 
    //       user.status === "approved" && 
    //       user.profileCompleted === true && 
    //       user.isAnonymous === true;
        
    //     if (!hasAccess) {
    //       console.log("🔒 Redirecting: User doesn't meet criteria", {
    //         status: user.status,
    //         profileCompleted: user.profileCompleted,
    //         isAnonymous: user.isAnonymous
    //       });
    //       router.replace("/feed/popular");
    //       return;
    //     }
    //   }
    }
  }, [hasHydrated, pathname, user, isAuthenticated, router]);
}