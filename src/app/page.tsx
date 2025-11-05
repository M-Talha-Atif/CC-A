/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useUserStore from "@/store/userStore";

export default function Home() {
  const { user, isAuthenticated, hasHydrated } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    if (!hasHydrated) return; // Wait for Zustand hydration

    if (!isAuthenticated) {
      router.replace("/feed/popular");
    } else {
      router.replace("/home");
    }
  }, [router, isAuthenticated, hasHydrated]);

  // Optional fallback while redirecting
  return (
    <div className="w-full h-screen flex items-center justify-center">
      <p className="text-gray-500">Redirecting...</p>
    </div>
  );
}
