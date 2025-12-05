"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import useUserStore from "../../../store/userStore";

const FeedRedirect = () => {
  const router = useRouter();
   const routeParams = useParams();
  const { isAuthenticated, hasHydrated, currentFeedCategory } = useUserStore();
  console.log("At Feed Page")

  useEffect(() => {
    if (!hasHydrated) return;

    const urlCategory = routeParams.category;
    const protectedCategories = ["new", "bookmark", "my-posts", "chatrooms"];

    if (protectedCategories.includes(urlCategory) && !isAuthenticated) {
      console.log(`⚠️ FeedPage: Unauthorized access to ${urlCategory}, redirecting to popular`);
      router.replace("/feed/popular");
    }
  }, [hasHydrated, isAuthenticated, routeParams.category, router]);

  useEffect(() => {
    if (!hasHydrated) return;

    const currentPath = window.location.pathname;

    // Only redirect if exactly on /feed or /feed/
    if (currentPath === "/feed" || currentPath === "/feed/") {
      isAuthenticated;
      const targetCategory =
        isAuthenticated && isAuthenticated === true
          ? currentFeedCategory || "new"
          : "couples";

      router.replace(`/feed/${targetCategory}`);
    }
  }, [hasHydrated, isAuthenticated, currentFeedCategory, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-500">Loading...</div>
    </div>
  );
};

export default FeedRedirect;
