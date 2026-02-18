"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const DesktopRestriction = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();
  // allow desktop on reset password
  const allowDesktopRoutes = ["/login/reset-password"];

  useEffect(() => {
    setIsClient(true);

    const checkIfMobile = () => {
      const isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        (navigator.maxTouchPoints > 0 && window.screen.width <= 768) ||
        (window.innerWidth <= 768 && window.innerHeight >= window.innerWidth);

      setIsMobile(isMobileDevice);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);


  if (allowDesktopRoutes.some(route => pathname.startsWith(route))) {
    // console.log("yeah it started")
    return children;
  }


  if (!isClient) {
    return (
      <div className="min-h-dvh bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        </div>
      </div>
    );
  }

  if (!isMobile) {
    return (
      <div className="min-h-dvh bg-white flex items-center justify-center p-6">
        <div className="text-center max-w-4xl w-full">
          {/* Logo image */}
          <div className="mb-12">
            <img
              src="/qr.png"
              alt="CUNO COVO - Scan QR Code"
              className="w-full max-w-4xl mx-auto"
            />
          </div>

          {/* Tagline */}
          <p className="text-xl text-gray-700 italic">
            For Creatives on the go... Scan to join us on your phone browser.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default DesktopRestriction;