"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Logout from "../../components/Logout";
import { checkUserStatus, logout } from "../../../action";
import useUserStore from "@/store/userStore";
import { toast, Toaster } from "sonner";
import SimplePopup from "../../components/Popup";
import useHelpCenterStore from "@/hooks/useHelpCenter";

const Page = () => {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);
  const { isAuthenticated, hasHydrated, clearUser } = useUserStore();
  const { openHelpCenter } = useHelpCenterStore();
  const [showRejectedPopup, setShowRejectedPopup] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated) {
      router.replace("/login?flow=creative&step=login-choice&mode=login");
      return;
    }

    const checkAndRedirect = async () => {
      try {
        setIsChecking(true);
        const statusResponse = await checkUserStatus();

        if (statusResponse.data && statusResponse.data.status === "rejected") {
          setShowRejectedPopup(true);
          setIsChecking(false);
          return;
        }

        if (statusResponse.data && statusResponse.data.status !== "pending") {
          router.replace("/home");
          return;
        }

        setIsChecking(false);
      } catch (error) {
        console.error("Status check failed:", error);
        if (error?.status === 401 || error?.status === 403) {
          router.replace("/login?flow=creative&step=login-choice&mode=login");
          return;
        }
        setIsChecking(false);
      }
    };

    checkAndRedirect();

    const statusCheckInterval = setInterval(async () => {
      if (!isAuthenticated) {
        clearInterval(statusCheckInterval);
        return;
      }

      try {
        const statusResponse = await checkUserStatus();

        if (statusResponse.data && statusResponse.data.status === "rejected") {
          clearInterval(statusCheckInterval);
          setShowRejectedPopup(true);
          return;
        }

        if (statusResponse.data && statusResponse.data.status !== "pending") {
          clearInterval(statusCheckInterval);
          router.replace("/home");
        }
      } catch (error) {
        console.error("Periodic status check failed:", error);
        if (error?.status === 401 || error?.status === 403) {
          clearInterval(statusCheckInterval);
          router.replace("/login?flow=creative&step=login-choice&mode=login");
        }
      }
    }, 30000);

    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
    };
  }, [router, hasHydrated, isAuthenticated, clearUser]);

  const handleRejectedPopupClose = async () => {
    setShowRejectedPopup(false);

    try {
      // 1. Clear session storage FIRST
      sessionStorage.removeItem("user_cache");
      sessionStorage.removeItem("last_refresh");

      // 2. Clear Zustand store
      clearUser();

      // 3. Call server logout to clear cookies
      await logout();

      // 4. Hard redirect with full page reload
      window.location.href =
        "/login?flow=creative&step=login-choice&mode=signup";
    } catch (error) {
      console.error("Logout error during rejection:", error);
      // Force logout even on error
      sessionStorage.clear();
      clearUser();
      window.location.href =
        "/login?flow=creative&step=login-choice&mode=signup";
    }
  };

  if (!hasHydrated) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
      </div>
    );
  }

  return (
    <>
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

      {showRejectedPopup && (
        <SimplePopup
          message="Referral code has reached its usage limit"
          buttonText="Continue"
          onClose={handleRejectedPopupClose}
        />
      )}
      <div className="flex w-full justify-end p-4">
        <Logout />
      </div>
      <div
        className="h-[85dvh] bg-white flex flex-col justify-between"
        style={{ fontFamily: "Nunito Sans, sans-serif" }}
      >
        <div className="flex-grow flex justify-center items-center px-6 text-center">
          <div>
            <p className="text-black text-lg font-medium mb-4">
              We are reviewing your account details to ensure the safety of our
              users.
            </p>

            {isChecking && (
              <div className="flex justify-center items-center mt-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-800"></div>
                <span className="ml-2 text-sm text-gray-600">
                  Checking status...
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="text-center mx-[0px] mb-3">
          <p className="mt-3 text-[10px] [@media(min-width:360px)]:text-[10px] text-gray-600">
            By continuing, you acknowledge that you understand and agree to the{" "}
            <span
              onClick={() => openHelpCenter("terms")}
              className="italic underline"
            >
              Terms
            </span>{" "}
            and{" "}
            <span
              onClick={() => openHelpCenter("privacy")}
              className="italic underline"
            >
              Policy
            </span>
            .
          </p>
        </div>
      </div>
    </>
  );
};

export default Page;
