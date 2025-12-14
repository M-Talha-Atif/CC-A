/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { Menu, X, ArrowLeft } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import QuoteIcon from "../../components/QuoteIcon";
import useUserStore from "@/store/userStore";
import { useSocket } from "@/hooks/useSockets";
import Image from "next/image";
import {
  getPoints,
  getRank,
  getReferralCode,
  getUnreadCount,
} from "../../../action";

import NotificationIcon from "../../components/icons/NotificationIcon";
import ActiveNotificationIcon from "../../components/icons/ActiveNotificationIcon";
import { useScrollVisibility } from "@/hooks/useScrollVisibilityContext";
import { motion } from "framer-motion";

// Extend the Window interface to include custom properties
declare global {
  interface Window {
    handleCreatePageBack?: () => void;
  }
}

const ProtectedLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetchedData, setHasFetchedData] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);
  const { onNewNotification, offNewNotification } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);

  const { isVisible, isAtTop } = useScrollVisibility();

  const [delayLayoutChange, setDelayLayoutChange] = useState(false);

  const { user, setUser, isAuthenticated, hasHydrated } = useUserStore();


  const router = useRouter();
  const pathname = usePathname();

  // Memoize computed values to prevent recalculation
  const referralCode = useMemo(() => {
    return user?.referralCode || user?.personalReferralCode || "";
  }, [user?.referralCode, user?.personalReferralCode]);

  const totalPoints = useMemo(() => {
    return user?.points || 0;
  }, [user?.points]);

  const userRank = useMemo(() => {
    return user?.rank || 0;
  }, [user?.rank]);

  // UPDATED: Separate authentication check from layout delay
  // This is the TRUE authentication state - used for showing/hiding authenticated UI
  const userIsAuthenticated = useMemo(() => {
    // If store hasn't hydrated yet, treat as NOT authenticated
    if (!hasHydrated) return false;

    // Check actual authentication state
    return isAuthenticated || Boolean(user && (user.id || user.email));
  }, [isAuthenticated, user, hasHydrated]);

  const shouldShowAuthButtons = useMemo(() => {
    if (!hasHydrated) return false;

    // Only show auth buttons if:
    // 1. User is NOT authenticated AND
    // 2. We're not in the delay period (or delay has expired)
    return !userIsAuthenticated && !delayLayoutChange;
  }, [userIsAuthenticated, delayLayoutChange, hasHydrated]);




  // Fetch initial unread count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (userIsAuthenticated && user?.id) {
        try {
          const data = await getUnreadCount();
          setUnreadCount(data.unreadCount || 0);
        } catch (error) {
          console.error("Error fetching unread count:", error);
        }
      }
    };

    fetchUnreadCount();
  }, [userIsAuthenticated, user?.id]);

  // Listen for new notifications to update count
  useEffect(() => {
    const handleNewNotification = () => {
      setUnreadCount((prev) => prev + 1);
    };

    onNewNotification(handleNewNotification);

    return () => {
      offNewNotification(handleNewNotification);
    };
  }, [onNewNotification, offNewNotification]);


  useEffect(() => {

    if (!user?.id && !user?.email) {
      console.log(user)
      console.log("delay detected")
      setDelayLayoutChange(true);
      const timeout = setTimeout(() => setDelayLayoutChange(false), 1500);
      return () => clearTimeout(timeout);
    }
  }, [user]);


  // Memoize route checks

  const backButtonRoutes = useMemo(() => ["/notifications"], []);

  const shouldShowBackButton = useMemo(() => {
    return backButtonRoutes.some((route) => pathname.includes(route));
  }, [backButtonRoutes, pathname]);

  // Check if we're on the notifications page
  const isNotificationsPage = useMemo(() => {
    return pathname === "/notifications";
  }, [pathname]);

  // Rest of your existing fetchMissingUserData logic (unchanged)
  const fetchMissingUserDataRef = useRef<(() => Promise<void>) | null>(null);

  fetchMissingUserDataRef.current = async () => {
    if (!userIsAuthenticated || isLoading || !user?.id || hasFetchedData)
      return;

    setIsLoading(true);
    try {
      const promises = [];
      const dataNeeded = [];

      // Check what data is missing and fetch accordingly
      if (!user?.referralCode && !user?.personalReferralCode) {
        promises.push(getReferralCode());
        dataNeeded.push("referralCode");
      }

      if (user?.points === undefined || user?.points === null) {
        promises.push(getPoints());
        dataNeeded.push("points");
      }

      if (user?.rank === undefined || user?.rank === null) {
        promises.push(getRank());
        dataNeeded.push("rank");
      }

      if (promises.length > 0) {
        console.log("Fetching missing user data:", dataNeeded);
        const results = await Promise.allSettled(promises);

        // Update user store with fetched data
        const updatedUser = { ...user };
        let resultIndex = 0;

        if (dataNeeded.includes("referralCode")) {
          const referralResult = results[resultIndex];
          if (referralResult.status === "fulfilled" && referralResult.value) {
            updatedUser.referralCode =
              referralResult.value?.personalReferralCode ||
              referralResult.value;
            updatedUser.personalReferralCode = updatedUser.referralCode;
          }
          resultIndex++;
        }

        if (dataNeeded.includes("points")) {
          const pointsResult = results[resultIndex];
          if (pointsResult.status === "fulfilled") {
            updatedUser.points =
              pointsResult.value?.points || pointsResult.value || 0;
          }
          resultIndex++;
        }

        if (dataNeeded.includes("rank")) {
          const rankResult = results[resultIndex];
          if (rankResult.status === "fulfilled") {
            updatedUser.rank = rankResult.value?.rank || rankResult.value || 0;
          }
          resultIndex++;
        }

        console.log("Updated user with missing data:", updatedUser);
        setUser(updatedUser);
        setHasFetchedData(true);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (
      isClient &&
      userIsAuthenticated &&
      hasHydrated &&
      user?.id &&
      !hasFetchedData
    ) {
      const timeoutId = setTimeout(() => {
        fetchMissingUserDataRef.current?.();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [isClient, userIsAuthenticated, hasHydrated, user?.id, hasFetchedData]);

  // Reset fetch flag when user changes (login/logout)
  useEffect(() => {
    if (user?.id) {
      setHasFetchedData(false);
    }
  }, [user?.id]);

  // Prevent body scroll when sidebar is open (unchanged)
  useEffect(() => {
    if (!isClient) return;

    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.top = `-${window.scrollY}px`;
    } else {
      const scrollY = document.body.style.top;
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.top = "";

      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.top = "";
    };
  }, [sidebarOpen, isClient]);

  // Memoize handlers to prevent recreation
  const toggleSidebar = useCallback(() => {
    if (userIsAuthenticated) {
      setSidebarOpen(!sidebarOpen);
    }
  }, [userIsAuthenticated, sidebarOpen]);

  const handleBack = useCallback(() => {
    if (
      pathname.includes("/create-post") &&
      typeof window !== "undefined" &&
      window.handleCreatePageBack
    ) {
      window.handleCreatePageBack();
    } else {
      router.back();
    }
  }, [pathname, router]);

  const handleNotificationClick = useCallback(() => {
    router.push("/notifications");
  }, [router]);

  const handleShare = useCallback(async () => {
    const codeToShare = referralCode || user?.personalReferralCode || "";

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join with my referral code",
          text: `Use my referral code: ${codeToShare}`,
          url: `https://cunocovo.com`,
        });
      } catch (err) {
        console.log("Error sharing:", err);
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  }, [referralCode, user?.personalReferralCode]);

  const copyToClipboard = useCallback(() => {
    const codeToShare = referralCode || user?.personalReferralCode || "";
    navigator.clipboard.writeText(codeToShare).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [referralCode, user?.personalReferralCode]);

  const handleSignUp = useCallback(() => {
    router.push("/login/new-user");
  }, [router]);


  if (!hasHydrated) {
    return null; // or a loader if you want
  }


  return (
    <div
      className="min-h-dvh bg-white relative overflow-hidden "
      style={{ fontFamily: "Nunito Sans, sans-serif" }}
    >
      <motion.header
        initial={{ y: 0 }}
        animate={{
          y: isVisible ? 0 : -130,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 40,
          mass: 0.5,
        }}
        style={{
          isolation: "isolate",
          zIndex: pathname.startsWith("/feed/create-post")
            ? 10
            : pathname.startsWith("/feed")
              ? 20
              : 30,
        }}
        className="fixed top-0 left-0 right-0 flex items-center justify-between pointer-events-auto p-6 pl-5 pb-0 bg-white"
      >
        <div className="flex items-center space-x-4">
          {hasHydrated &&
            userIsAuthenticated &&
            shouldShowBackButton &&
            !pathname.includes("/create-post") ? (
            // Show back button for chatroom and notifications
            <button
              onClick={handleBack}
              className="p-2 rounded-lg flex items-center gap-2 font-semibold transition-all duration-300 text-black cursor-pointer hover:bg-gray-100"
            >
              <ArrowLeft size={24} />
              Notifications
            </button>
          ) : userIsAuthenticated && pathname.includes("/create-post") ? (
            // Show nothing on create-post page
            <></>
          ) : (
            // Show quote icon/menu on other pages
            <button
              onClick={userIsAuthenticated ? toggleSidebar : undefined}
              className={`rounded-lg transition-all duration-300 text-black ${userIsAuthenticated ? "cursor-pointer" : "cursor-default"
                }`}
            >
              <div className="relative w-[68px] h-[55px]">
                <QuoteIcon
                  size={68}
                  className="quote-logo-crisp absolute -top-4 left-0"
                />
              </div>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 ">
          {userIsAuthenticated &&
            pathname.startsWith("/feed") &&
            !pathname.includes("/create-post") && (
              <button
                onClick={handleNotificationClick}
                className="relative p-2 -mt-8 rounded-lg transition-all duration-300 text-black cursor-pointer hover:bg-gray-100"
              >
                {unreadCount > 0 ? (
                  <ActiveNotificationIcon size={24} />
                ) : (
                  <NotificationIcon size={24} />
                )}
              </button>
            )}

          {/* Only show Sign Up/Log In buttons if not authenticated */}
          {shouldShowAuthButtons && (
            <>
              <button
                onClick={handleSignUp}
                className="px-3 py-1 -mt-8 border border-black text-black rounded-full hover:border-gray-800 transition-colors duration-300 font-small"
              >
                Sign Up
              </button>
              <button
                onClick={() =>
                  router.push(
                    "/login?flow=creative&step=auth&mode=login"
                  )
                }
                className="px-3 py-1 -mt-8 border border-black bg-black
           text-slate-200  -z-20 rounded-full hover:border-gray-800 transition-colors 
           duration-300 font-small"
              >
                Log in
              </button>
            </>
          )}
        </div>
      </motion.header>

      {!shouldShowBackButton && !isNotificationsPage && userIsAuthenticated && (
        <Sidebar
          sidebarOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
          setSidebarOpen={setSidebarOpen}
          referralCode={referralCode}
          totalPoints={totalPoints}
          handleShare={handleShare}
          userRole={user?.userType}
          user={user}
          isLoading={isLoading}
        />
      )}

      <main
        className={`relative z-10 pt-18 overflow-hidden  ${isClient && sidebarOpen ? "pointer-events-none" : ""
          }`}
      >
        {children}
      </main>
    </div>
  );
};

export default ProtectedLayout;
