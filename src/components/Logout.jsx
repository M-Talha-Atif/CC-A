"use client";
import React, { useState } from "react";
import useUserStore from "../store/userStore";
import { toast } from "sonner";
import { logout } from "../../action";

import LogoutIcon from "./icons/LogoutIcon";
import { useRouter } from "next/navigation";
import { clearRegistrationStorage } from "@/utils/saveToLocal";

const Logout = ({ className, onLogoutStart }) => {
  const { clearUser } = useUserStore();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    // Prevent multiple clicks
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    // Notify parent component
    if (onLogoutStart) {
      onLogoutStart();
    }

    try {
      // 1. Clear session storage FIRST (before anything else)
      sessionStorage.removeItem("user_cache");
      sessionStorage.removeItem("last_refresh");

      // 2. Clear local storage
      clearRegistrationStorage();

      // 3. Clear Zustand store
      clearUser();

      // 4. Call server logout (await it to ensure cookies are cleared)
      await logout();

      // 5. Show feedback
      toast.success("Logged out");

      // 6. Hard redirect (this will reset everything)
      window.location.href = "/feed/popular";
    } catch (error) {
      console.error("Logout error:", error);
      // Force logout even on error
      sessionStorage.clear();
      clearUser();
      window.location.href = "/feed/popular";
    }
  };

  return (
    <button
      className={`border border-gray-200 px-7 py-2 cursor-pointer rounded-2xl  
     hover:scale-105 transform transition duration-300 ease-in-out
    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center 
     gap-3
    ${className}`}
      style={{ fontFamily: "Nunito Sans, sans-serif" }}
      onClick={handleLogout}
      disabled={isLoggingOut}
    >
      <LogoutIcon size={20} /> {isLoggingOut ? "Logging out..." : "Logout"}
    </button>
  );
};

export default Logout;
