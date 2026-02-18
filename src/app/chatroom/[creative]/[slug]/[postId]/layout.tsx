/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useState, useEffect } from "react";
import { Menu, X, ArrowLeft } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import useUserStore from "@/store/userStore";

import Image from "next/image";

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
  const { user, setUser } = useUserStore();
  const referralCode = user?.referralCode || "";
  const router = useRouter();
  const pathname = usePathname();

  const handleBack = () => {
    // Check if we're on the create-post page and if there's a custom handler
    if (
      pathname.includes("/create-post") &&
      typeof window !== "undefined" &&
      window.handleCreatePageBack
    ) {
      // Call the create page's custom back handler
      window.handleCreatePageBack();
    } else {
      // Default back behavior for other pages
      router.back();
    }
  };

  return (
    <div
      className="min-h-screen bg-white relative overflow-hidden"
      style={{ fontFamily: "Nunito Sans, sans-serif" }}
    >
      <header className="absolute top-0 left-0 right-0 flex items-center justify-between p-6 pl-5 pb-0">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBack}
            className="p-2 rounded-lg transition-all duration-300 text-black cursor-pointer hover:bg-gray-100"
          >
            <ArrowLeft size={24} />
          </button>
        </div>
      </header>

      {/* Main Content Area - Add pointer-events-none when sidebar is open */}
      <main
        className={`relative z-10 mt-18 md:mt-12 ${
          isClient && sidebarOpen ? "pointer-events-none" : ""
        }`}
      >
        {children}
      </main>
    </div>
  );
};

export default ProtectedLayout;
