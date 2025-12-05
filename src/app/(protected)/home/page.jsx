"use client";
import React, { useEffect, useState } from "react";
import { Share } from "lucide-react";
import {
  getRank,
  getReferralCode,
  activateAnonymousMode,
  getPoints,
  checkUserStatus,
  getOnboardingProgress,
} from "../../../../action";
import useUserStore from "../../../store/userStore";
import Loader from "../../../components/Loader";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";

const HomePage = () => {
  const { user, setUser, isAuthenticated, hasHydrated, clearUser } =
    useUserStore();
  const router = useRouter();
  const [activatingAnon, setActivatingAnon] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  // Helper function to handle logout
  const handleLogoutAndRedirect = async (message) => {
    try {
      // Show message
      toast.error(message);

      // Background cleanup
      logout().catch((error) => {
        console.error("Background logout cleanup failed:", error);
      });

      // Small delay to show message, then clear user and redirect
      setTimeout(() => {
        clearUser();
        window.location.href =
          "/login?flow=creative&step=login-choice&mode=login";
      }, 2000);
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear and redirect even if something fails
      setTimeout(() => {
        clearUser();
        window.location.href =
          "/login?flow=creative&step=login-choice&mode=login";
      }, 2000);
    }
  };

  // Helper function to safely handle errors and show toast
  const handleError = (error, fallbackMessage = "An error occurred") => {
    console.error("Error:", error);

    let errorMessage = fallbackMessage;

    if (error?.message) {
      errorMessage = error.message;
    } else if (error?.error?.message) {
      errorMessage = error.error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    } else if (error?.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error?.response?.data?.error) {
      errorMessage = error.response.data.error;
    }

    toast.error(errorMessage);
  };

  // Safe redirect function with error handling
  const safeRedirect = (path, reason = "") => {
    try {
      console.log(`Redirecting to ${path}${reason ? `: ${reason}` : ""}`);
      setHasRedirected(true);
      router.replace(path);
    } catch (error) {
      console.error("Navigation error:", error);
      handleError(error, "Navigation failed");
    }
  };

  useEffect(() => {
    // Wait for store hydration
    if (!hasHydrated) return;

    // If user is not authenticated, redirect to login
    if (!isAuthenticated) {
      safeRedirect(
        "/login?flow=creative&step=login-choice&mode=signup",
        "User not authenticated"
      );
      return;
    }

    if (!user || hasRedirected) return;

    console.log("HomePage useEffect - User:", user);
    console.log("HomePage useEffect - isNewUser:", user.isNewUser);

    const justCompletedOnboarding =
      user.isNewUser === false && !user.hasSeenWelcome;

    // Check user status and proceed
    const checkUserStatusAndProceed = async () => {
      try {
        setIsCheckingStatus(true);
        // Check onboarding progress first
        const onboardingResponse = await getOnboardingProgress();
        // If onboarding is not completed, redirect to login
        if (
          !onboardingResponse?.data ||
          !onboardingResponse.data.progress?.onboardingCompleted
        ) {
          console.log("Onboarding not completed, redirecting to login");
          safeRedirect(
            "/login?flow=creative&step=login-choice&mode=login",
            "Onboarding not completed"
          );
          return;
        }

        // Check user status
        const statusResponse = await checkUserStatus();

        // Handle rejected status - logout and redirect
        if (statusResponse?.data && statusResponse.data.status === "rejected") {
          console.log("User status is rejected, logging out");
          await handleLogoutAndRedirect(
            "Your account was rejected due to an invalid referral code. Please sign up again with a valid code."
          );
          return;
        }

        // If user status is pending, redirect to waiting page
        if (statusResponse?.data && statusResponse.data.status === "pending") {
          console.log("User status is pending, redirecting to waiting");
          safeRedirect("/waiting", "User status is pending");
          return;
        }

        // If status check fails due to auth issues
        if (!statusResponse?.data) {
          console.log("Status check failed, redirecting to login");
          safeRedirect(
            "/login?flow=creative&step=login-choice&mode=login",
            "Status check failed"
          );
          return;
        }

        setIsCheckingStatus(false);

        // Handle user flow based on whether they just completed onboarding
        if (user.isNewUser === false && !justCompletedOnboarding) {
          console.log("Redirecting existing user to feed");
          safeRedirect("/feed/new", "Existing user flow");
          return;
        }

        // If user just completed onboarding OR if user is explicitly new
        if (user.isNewUser === true || justCompletedOnboarding) {
          console.log(
            "Showing welcome screen for new user or just completed onboarding"
          );
          setLoading(true);
          await fetchUserData();
        }
      } catch (error) {
        console.error("Status check failed:", error);
        setIsCheckingStatus(false);

        // If there's an auth error, redirect to login
        if (error?.status === 401 || error?.status === 403) {
          safeRedirect(
            "/login?flow=creative&step=login-choice&mode=login",
            "Authentication error"
          );
          return;
        }

        // For other errors, show toast but continue
        handleError(error, "Failed to check user status");
      }
    };

    checkUserStatusAndProceed();
  }, [
    user?.id,
    user?.isNewUser,
    hasRedirected,
    router,
    setUser,
    isAuthenticated,
    hasHydrated,
    clearUser,
  ]);

  // Fetch user data function
  const fetchUserData = async () => {
    try {
      const [rankData, referralCodeData, pointsData] = await Promise.allSettled(
        [getRank(), getReferralCode(), getPoints()]
      );

      const updatedUserData = { ...user };
      const errors = [];

      if (rankData.status === "fulfilled" && rankData.value) {
        updatedUserData.rank = rankData.value?.rank || rankData.value;
      } else if (rankData.status === "rejected") {
        console.error("Failed to fetch rank:", rankData.reason);
        errors.push("Failed to load rank information");
      }

      if (referralCodeData.status === "fulfilled" && referralCodeData.value) {
        updatedUserData.referralCode =
          referralCodeData.value?.personalReferralCode ||
          referralCodeData.value;
      } else if (referralCodeData.status === "rejected") {
        console.error(
          "Failed to fetch referral code:",
          referralCodeData.reason
        );
        errors.push("Failed to load referral code");
      }

      if (pointsData.status === "fulfilled" && pointsData.value) {
        updatedUserData.points = pointsData.value?.points || pointsData.value;
      } else if (pointsData.status === "rejected") {
        console.error("Failed to fetch points:", pointsData.reason);
        errors.push("Failed to load points");
      }

      if (errors.length > 0) {
        toast.error(`Some data failed to load: ${errors.join(", ")}`);
      }

      console.log("Updated user data:", updatedUserData);
      setUser(updatedUserData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching user data:", error);
      handleError(error, "Failed to load user data");
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const referralCode = user?.referralCode || "";

    if (!referralCode) {
      toast.error("Referral code not available");
      return;
    }

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: "Join with my referral code",
          text: `Use my referral code: ${referralCode}`,
          url: `https://cunocovo.com`,
        });
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(
          `Use my referral code: ${referralCode} - https://cunocovo.com`
        );
        toast.success("Referral code copied to clipboard!");
      } else {
        toast.info(`Your referral code: ${referralCode}`);
      }
    } catch (error) {
      console.error("Error sharing:", error);

      if (error.name === "AbortError") {
        return;
      } else if (error.name === "NotAllowedError") {
        toast.error("Sharing not permitted. Try copying manually.");
      } else {
        handleError(error, "Failed to share referral code");
      }
    }
  };

  const handleJoinAnonymous = async () => {
    if (activatingAnon) return;

    setActivatingAnon(true);

    try {
      const result = await activateAnonymousMode();

      if (result?.success) {
        toast.success("Anonymous mode activated successfully!");
        setTimeout(() => {
          safeRedirect("/feed/new", "Anonymous mode activated");
        }, 1000);
      } else {
        const error = result?.error;

        if (error?.errorCode === "ALREADY_ANONYMOUS") {
          toast.error("You're already in anonymous mode!");
          setTimeout(() => {
            safeRedirect("/feed/new", "Already in anonymous mode");
          }, 1500);
        } else {
          const errorMessage =
            error?.message || "Failed to activate anonymous mode";
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      console.error("Unexpected error activating anonymous mode:", error);
      handleError(error, "Failed to activate anonymous mode");
    } finally {
      setActivatingAnon(false);
    }
  };

  const renderLoader = () => (
    <div className="min-h-[85vh] flex items-center justify-center">
      <Loader />
    </div>
  );

  if (!hasHydrated) {
    return renderLoader();
  }

  if (!isAuthenticated) {
    return renderLoader();
  }

  if (isCheckingStatus) {
    return renderLoader();
  }

  if (!user || hasRedirected) {
    return renderLoader();
  }

  if (loading) {
    return renderLoader();
  }

  if (user && user.isNewUser === undefined) {
    return renderLoader();
  }

  if (user && user.isNewUser === false && !hasRedirected && user.lastLoginAt===null) {
    console.log("Early redirect: User is not new");
    safeRedirect("/feed/new", "Early redirect - not new user");
    return renderLoader();
  }

  if (user.isNewUser !== true) {
    return null;
  }

  return (
    <div className="max-w-md mx-auto px-7 md:px-6 py-2 mt-12">
      <Toaster
        position="bottom-center"
        expand={true}
        richColors={true}
        closeButton={true}
        toastOptions={{
          className: "shadow-none",
          style: {
            boxShadow: "none",
          },
          duration: 4000,
        }}
      />

      <div className="text-center space-y-8">
        <div className="space-y-4">
          <button
            onClick={handleJoinAnonymous}
            disabled={activatingAnon}
            className="w-full py-4 px-2 md:px-6 text-black font-semibold rounded-full shadow-lg transform
           hover:scale-105 transition-all duration-300 border border-black/20 cursor-pointer
           disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {activatingAnon ? "Activating..." : "Join Anonymous"}
          </button>
          <p className="text-black/80 text-sm leading-relaxed">
            Post, like, and chat with full privacy.
          </p>
        </div>

        <div className="relative">
          <div className="relative inset-0 flex items-center">
            <div className="w-full border-t border-black/20"></div>
          </div>
        </div>

        <div className="mb-2">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-black mb-2">Waitlist</h2>
            <div className="mt-3">
              <h3 className="text-lg font-semibold text-black/90">
                Rank #{user?.rank ?? "-"}
              </h3>
            </div>
          </div>

          <div className="text-left space-y-2 my-3">
            <p className="">Refer Creatives using your code</p>
            <button
              onClick={handleShare}
              disabled={!user?.referralCode}
              className="w-full py-2 px-6 bg-white/10 backdrop-blur-sm border border-black/20 hover:bg-white/20 text-black
               font-medium rounded-xl transition-all duration-300 flex items-center justify-between space-x-2 cursor-pointer
               disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/10"
            >
              <span>{user?.referralCode || "Loading..."}</span>
              <Share size={18} />
            </button>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-left mt-3 p-4">
            <h4 className="font-semibold text-black mb-2">Points System</h4>
            <ul className="text-sm text-black/70 space-y-1">
              <li>Earn 1.5 points for your first referral</li>
              <li>Earn 2 points for your second referral</li>
              <li>Earn 2.5 points for your third referral...</li>
              <li>Maximum of 8 referral</li>
            </ul>
            <p className="mt-2 text-sm text-black/70">
             Top-tier point holders unlock early access to new features.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
