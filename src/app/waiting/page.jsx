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
  const { isAuthenticated, hasHydrated, clearUser, user } = useUserStore();
  const { openHelpCenter } = useHelpCenterStore();
  const [showRejectedPopup, setShowRejectedPopup] = useState(false);

  const handleRejectedUser = async () => {
    try {
      // Clear session storage
      sessionStorage.removeItem("user_cache");
      sessionStorage.removeItem("last_refresh");

      // Clear Zustand store
      clearUser();

      // Server logout (clear cookies)
      await logout();

      // Hard redirect
      window.location.href =
        "/login?flow=creative&step=login-choice&mode=signup";
    } catch (error) {
      console.error("Logout error during rejection:", error);

      // Fallback safety
      sessionStorage.clear();
      clearUser();
      window.location.href =
        "/login?flow=creative&step=login-choice&mode=signup";
    }
  };



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
          // await handleRejectedUser();
          return;
        }

        if (statusResponse.data && statusResponse.data.status !== "pending") {
          router.replace("/home");
          return;
        }

        setIsChecking(false);
      }
      catch (error) {
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

      // console.log(user)
      if (!isAuthenticated) {
        clearInterval(statusCheckInterval);
        return;
      }

      try {
        const statusResponse = await checkUserStatus();

        if (statusResponse.data && statusResponse.data.status === "rejected") {
          clearInterval(statusCheckInterval);
          // await handleRejectedUser();
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
    }, 10000);

    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
    };
  }, [router, hasHydrated, isAuthenticated, clearUser]);






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
          message="Application Status Update
Thank you for your interest in joining CUNO COVO, User. After careful review of your application, 
we regret to inform you that we are unable to approve your account at this time."
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
            You acknowledge that you understand and agree to the{" "}
            <span
              onClick={() => openHelpCenter("terms")}
              className="underline"
            >
              Terms
            </span>{" "}
            and{" "}
            <span
              onClick={() => openHelpCenter("privacy")}
              className="underline"
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
