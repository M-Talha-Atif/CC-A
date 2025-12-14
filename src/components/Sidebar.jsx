"use client";
import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  Share,
  Search,
  FileText,
  Users,
  HelpCircle,
  Share2,
  InfoIcon,
} from "lucide-react";
import Logout from "./Logout";
import ShareIconFilled from "../components/ShareIconFilled";
import { useRouter } from "next/navigation";
import { getPoints, getRank } from "../../action";
import Image from "next/image";
import QuoteIcon from "./QuoteIcon";
import HelpCenterIcon from "./icons/HelpCenterIcon";
import AnonIcon from "./icons/AnonIcon";
import useHelpCenterStore from "@/hooks/useHelpCenter";

const Sidebar = ({
  sidebarOpen,
  toggleSidebar,
  setSidebarOpen,
  referralCode,
  totalPoints,
  handleShare,
  userRole,
  user,
  isLoading,
}) => {
  const router = useRouter();
  const [points, setPoints] = useState(totalPoints || 0);
  const { openHelpCenter, isOpen } = useHelpCenterStore();
  const [rank, setRank] = useState(user.rank || 0);
  const [isLoadingPoints, setIsLoadingPoints] = useState(false);
  const [isLoadingRank, setIsLoadingRank] = useState(false);
  const [hasTriedFetchingPoints, setHasTriedFetchingPoints] = useState(false);
  const [hasTriedFetchingRank, setHasTriedFetchingRank] = useState(false);
  const [showReferralInfo, setShowReferralInfo] = useState(false);

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Add these refs for scroll locking
  const scrollYRef = useRef(0);
  const scrollLockApplied = useRef(false);

  // Scroll locking effect
  useEffect(() => {
    if (sidebarOpen && !isOpen) {
      // Store current scroll position
      scrollYRef.current = window.scrollY;

      // Apply scroll lock
      const body = document.body;
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

      body.style.position = 'fixed';
      body.style.top = `-${scrollYRef.current}px`;
      body.style.left = '0';
      body.style.right = '0';
      body.style.overflow = 'hidden';
      body.style.width = '100%';

      // Compensate for scrollbar gap to prevent layout shift
      if (scrollBarWidth > 0) {
        body.style.paddingRight = `${scrollBarWidth}px`;
      }

      scrollLockApplied.current = true;

      // Prevent touch move on background
      const preventTouchMove = (e) => {
        // Allow touch moves only within the sidebar
        const isSidebarContent = e.target.closest('[data-sidebar-content]');
        if (!isSidebarContent) {
          e.preventDefault();
        }
      };

      document.addEventListener('touchmove', preventTouchMove, { passive: false });

      return () => {
        document.removeEventListener('touchmove', preventTouchMove);

        // Only restore if we applied the lock
        if (scrollLockApplied.current) {
          const body = document.body;
          const scrollY = parseInt(body.style.top || '0');

          // Restore styles
          body.style.position = '';
          body.style.top = '';
          body.style.left = '';
          body.style.right = '';
          body.style.overflow = '';
          body.style.width = '';
          body.style.paddingRight = '';

          // Restore scroll position
          window.scrollTo(0, Math.abs(scrollY) || scrollYRef.current);
          scrollLockApplied.current = false;
        }
      };
    }
  }, [sidebarOpen, isOpen]);

  // Update points when totalPoints prop changes
  useEffect(() => {
    if (totalPoints !== undefined && totalPoints !== null) {
      const parsedPoints =
        typeof totalPoints === "string" ? parseFloat(totalPoints) : totalPoints;
      setPoints(parsedPoints);
      setHasTriedFetchingPoints(true);
    }
  }, [totalPoints]);

  useEffect(() => {
    if (sidebarOpen) {
      (async () => {
        console.log("refreshing the points")
        const [pointsData, rankData] = await Promise.all([getPoints(), getRank()]);
        setPoints(pointsData.points);
        setRank(rankData.rank);
        console.log("refreshing done")
      })();
    }
  }, [sidebarOpen]);



  // Update rank when user.rank prop changes
  useEffect(() => {
    if (user?.rank !== undefined && user?.rank !== null) {
      setRank(user.rank);
      setHasTriedFetchingRank(true);
    }
  }, [user?.rank]);

  // Memoize authentication check to prevent recalculation
  const isAuthenticated = useMemo(() => {
    return Boolean(user && (user.id || user.email));
  }, [user?.id, user?.email]);

  // Memoize referral code to prevent recalculation
  const displayReferralCode = useMemo(() => {
    return (
      referralCode || user?.personalReferralCode || user?.referralCode || ""
    );
  }, [referralCode, user?.personalReferralCode, user?.referralCode]);

  // Memoize couple menu items to prevent recreation
  const coupleMenuItems = useMemo(
    () => [
      {
        icon: Search,
        label: "News",
        onClick: () => {
          router.push("/feed/couple");
          toggleSidebar();
        },
      },
      {
        icon: Search,
        label: "Find a creative",
        onClick: () => {
          router.push("/find-creative");
          toggleSidebar();
        },
      },
      {
        icon: FileText,
        label: "Review proposals",
        onClick: () => {
          router.push("/find-creative");
          toggleSidebar();
        },
      },
      {
        icon: Users,
        label: "Shortlist",
        onClick: () => {
          router.push("/find-creative");
          toggleSidebar();
        },
      },
    ],
    [router, toggleSidebar]
  );

  // Memoize creative menu items to prevent recreation
  const creativeMenuItems = useMemo(
    () => [
      {
        label: "Anonymous",
        icon: <AnonIcon />,
        onClick: () => {
          router.push("/feed/new");
          toggleSidebar();
        },
      },
    ],
    [toggleSidebar]
  );

  // Fetch points effect
  useEffect(() => {
    const fetchPoints = async () => {
      if (
        !hasTriedFetchingPoints &&
        (totalPoints === undefined ||
          totalPoints === null ||
          totalPoints === 0) &&
        isAuthenticated &&
        !isLoadingPoints &&
        !isLoading &&
        user?.id
      ) {
        setIsLoadingPoints(true);
        setHasTriedFetchingPoints(true);

        try {
          const data = await getPoints();
          console.log("Fetched points data:", data); // DEBUG

          // Handle different response structures
          let pointsValue = 0;
          if (data?.user?.points !== undefined) {
            pointsValue = data.user.points;
          } else if (data?.points !== undefined) {
            pointsValue = data.points;
          }

          // Ensure it's a number
          const fetchedPoints =
            typeof pointsValue === "string"
              ? parseFloat(pointsValue)
              : Number(pointsValue);

          console.log("Parsed points:", fetchedPoints); // DEBUG
          setPoints(fetchedPoints);
        } catch (error) {
          console.error("Failed to fetch points", error);
          setPoints(0);
        } finally {
          setIsLoadingPoints(false);
        }
      }
    };

    fetchPoints();
  }, [
    hasTriedFetchingPoints,
    totalPoints,
    isAuthenticated,
    isLoadingPoints,
    isLoading,
    user?.id,
  ]);

  // Fetch rank effect
  useEffect(() => {
    const fetchRank = async () => {
      if (
        !hasTriedFetchingRank &&
        (user?.rank === undefined || user?.rank === null || user?.rank === 0) &&
        isAuthenticated &&
        !isLoadingRank &&
        !isLoading &&
        user?.id
      ) {
        setIsLoadingRank(true);
        setHasTriedFetchingRank(true);

        try {
          const data = await getRank();
          console.log("Fetched rank data:", data); // DEBUG

          // Handle different response structures
          let rankValue = 0;
          if (data?.rank !== undefined) {
            rankValue = data.rank;
          }

          // Ensure it's a number
          const fetchedRank =
            typeof rankValue === "string"
              ? parseInt(rankValue, 10)
              : Number(rankValue);

          console.log("Parsed rank:", fetchedRank); // DEBUG
          setRank(fetchedRank);
        } catch (error) {
          console.error("Failed to fetch rank", error);
          setRank(0);
        } finally {
          setIsLoadingRank(false);
        }
      }
    };

    fetchRank();
  }, [
    hasTriedFetchingRank,
    user?.rank,
    isAuthenticated,
    isLoadingRank,
    isLoading,
    user?.id,
  ]);

  // Reset fetch flags when user changes
  useEffect(() => {
    if (user?.id) {
      setHasTriedFetchingPoints(false);
      setHasTriedFetchingRank(false);
    }
  }, [user?.id]);

  // DEBUG LOGGING - Only log once when user ID changes
  useEffect(() => {
    if (process.env.NODE_ENV === "development" && user?.id) {
      console.log("Sidebar Debug (User Changed):", {
        isAuthenticated,
        hasUser: Boolean(user),
        userId: user?.id,
        userEmail: user?.email,
        referralCode: displayReferralCode,
        userRole,
      });
    }
  }, [user?.id]);

  const handleLogoClick = useCallback(() => {
    router.push("/feed");
  }, [router]);

  const handleLoginRedirect = useCallback(() => {
    router.replace("/login?flow=creative&step=login-choice&mode=login");
  }, [router]);

  const handleInfoIconClick = useCallback(
    (e) => {
      e.stopPropagation();
      setShowReferralInfo(!showReferralInfo);
    },
    [showReferralInfo]
  );

  // Handle logout state from Logout component
  const handleLogoutStart = useCallback(() => {
    setIsLoggingOut(true);
    setSidebarOpen(false);
  }, []);

  // Close info tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showReferralInfo &&
        !event.target.closest(".referral-info-container")
      ) {
        setShowReferralInfo(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showReferralInfo]);

  return (
    <>
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 md:w-80 bg-[#e5e5e5] z-50 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        data-sidebar-content
      >
        <div className="p-6 pt-3 h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between mb-8">
            <QuoteIcon
              onClick={handleLogoClick}
              size={68}
              className="cursor-pointer"
            />
          </div>

          {/* Show loading state during logout OR normal loading */}
          {isLoggingOut || (isLoading && !isAuthenticated) ? (
            <div className="h-full flex flex-col justify-center items-center text-center">
              <p className="text-black/70 text-sm mb-4">Loading...</p>
            </div>
          ) : isAuthenticated ? (
            <>
              {userRole === "couple" ? (
                // Couple Role Menu
                <>
                  {/* Menu Items */}
                  <div className="flex-1">
                    <nav className="space-y-2">
                      {coupleMenuItems.map((item, index) => (
                        <button
                          key={index}
                          onClick={item.onClick}
                          className="w-full flex items-center space-x-3 px-4 py-3 text-left text-black hover:bg-white/20 rounded-lg transition-colors duration-200"
                        >
                          <span className="font-medium">{item.label}</span>
                        </button>
                      ))}
                    </nav>
                  </div>

                  {/* Bottom Section */}
                  <div className="mt-auto space-y-4">
                    {/* Help Center */}
                    <button
                      onClick={() => openHelpCenter("faq")}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-left text-black hover:bg-white/20 rounded-lg transition-colors duration-200"
                    >
                      <HelpCenterIcon size={18} />
                      <span className="font-medium">Help Center</span>
                    </button>

                    {/* Logout */}
                    <Logout
                      className={"w-full !justify-center !items-center"}
                      onLogoutStart={handleLogoutStart}
                    />
                  </div>
                </>
              ) : (
                // Default Role Menu (creative/normal user)
                <>
                  <div
                    className="mb-auto flex items-center justify-center
                   gap-4 text-xl font-bold text-black"
                  ></div>

                  {/* Creative Menu Items */}
                  <div className="flex-1">
                    <nav className="space-y-2 mb-6">
                      {creativeMenuItems.map((item, index) => (
                        <button
                          key={index}
                          onClick={item.onClick}
                          className=" flex items-center space-x-3 px-4 py-3 text-left text-black hover:bg-white/20 rounded-lg transition-colors duration-200"
                        >
                          {item.icon}
                          <span className="font-medium">{item.label}</span>
                        </button>
                      ))}
                    </nav>
                  </div>

                  <div className="flex flex-col items-left pl-4 ml-8">
                    Points :{" "}
                    {isLoadingPoints || isLoading ? "..." : points}
                    <p className="text-xs ml-2">
                      Rank : {isLoadingRank || isLoading ? "..." : rank}
                    </p>
                  </div>

                  {/* Referral Code Input */}
                  <div className="mt-2 referral-info-container px-4 ml-8">
                    <label className="flex gap-1 items-center text-sm font-medium text-black/70 relative">
                      Referral Code
                      <InfoIcon
                        size={14}
                        className="cursor-pointer hover:text-black transition-colors"
                        onClick={handleInfoIconClick}
                      />
                      {/* Info Tooltip */}
                      {showReferralInfo && (
                        <div
                          className="absolute left-4 top-6 z-60 w-75 p-4 px-2  bg-white border border-gray-200 
                        rounded-lg shadow-lg text-[8px] text-black/80 leading-relaxed"
                        >
                          <div className="space-y-2 text-[9.1px]">
                            <p className="">
                              Share your referral code with other Creatives and
                              earn points when they sign up!
                            </p>
                            <div className="space-y-1">
                              <p>Earn 1.5 points for your first referral</p>
                              <p>Earn 2 points for your second referral</p>
                              <p>Earn 2.5 points for your third referral...</p>
                              <br></br>
                              <p className="">*Maximum of 7 referrals</p>
                            </div>
                            <p>
                              The more points you earn, the more features you unlock.
                            </p>
                          </div>

                          {/* Small arrow pointing up */}
                          <div className="absolute -top-2 left-4 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
                        </div>
                      )}
                    </label>
                    <div
                      onClick={handleShare}
                      className="flex items-center space-x-2 relative mb-4"
                    >
                      <input
                        type="text"
                        value={
                          isLoading || !displayReferralCode
                            ? "Loading..."
                            : displayReferralCode
                        }
                        readOnly
                        className="  py-2  rounded-lg text-black
                         placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-gray-400"
                      />
                      <button
                        onClick={handleShare}
                        disabled={!displayReferralCode}
                        className="p-2 rounded-lg transition-all duration-300 text-black absolute top-1
                         right-14 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ShareIconFilled />
                      </button>
                    </div>
                  </div>
                  <div className="mt-6 space-y-2">
                    {/* Help Center */}
                    <button
                      onClick={() => openHelpCenter("faq")}
                      className=" flex items-center space-x-3 px-4 py-3 text-left text-black hover:bg-white/20 rounded-lg transition-colors duration-200"
                    >
                      <HelpCenterIcon size={20} />
                      <span className="font-medium">Help Center</span>
                    </button>

                    {/* Logout */}
                    <Logout
                      className={" !items-left !justify-start !px-4.5"}
                      onLogoutStart={handleLogoutStart}
                    />
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <div className="h-full flex flex-col justify-center items-center text-center">
                <p className="text-black/70 text-sm mb-4">
                  Sign up or log in to get your referral code!
                </p>
                <button
                  onClick={handleLoginRedirect}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-300"
                >
                  Go to Login
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
