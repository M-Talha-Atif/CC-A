import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export const useNavigationHistory = () => {
  const router = useRouter();
  const [navigationStack, setNavigationStack] = useState([]);

  useEffect(() => {
    const handleRouteChange = (url) => {
      setNavigationStack((prev) => {
        const newStack = [...prev, url];
        // Keep only last 10 entries to prevent memory issues
        return newStack.slice(-10);
      });
    };

    router.events.on("routeChangeComplete", handleRouteChange);

    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router]);

  const goBackSafely = () => {
    if (navigationStack.length > 1) {
      router.back();
    } else {
      // Fallback to home if no history
      router.push("/home");
    }
  };

  return { navigationStack, goBackSafely };
};
