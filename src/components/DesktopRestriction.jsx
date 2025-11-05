"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";

// const DesktopRestriction = ({ children }) => {
//   const [isMobile, setIsMobile] = useState(false);
//   const [isClient, setIsClient] = useState(false);

//   useEffect(() => {
//     setIsClient(true);
    
//     const checkIfMobile = () => {
//       // Check for mobile device using multiple methods
//       const isMobileDevice = 
//         // Check user agent for mobile devices
//         /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
//         // Check for touch capability and small screen (but allow landscape)
//         (navigator.maxTouchPoints > 0 && window.screen.width <= 768) ||
//         // Fallback: check if it's a small screen device in portrait
//         (window.innerWidth <= 768 && window.innerHeight >= window.innerWidth);
      
//       setIsMobile(isMobileDevice);
//     };

//     checkIfMobile();
//     window.addEventListener("resize", checkIfMobile);
    
//     return () => window.removeEventListener("resize", checkIfMobile);
//   }, []);

//   // Show loading state during hydration
//   if (!isClient) {
//     return (
//       <div className="min-h-screen bg-white flex items-center justify-center">
//         <div className="text-center">
//           <div className="w-12 h-12 border-4 border-gray-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
//         </div>
//       </div>
//     );
//   }

//   // Show desktop restriction message
//   if (!isMobile) {
//     return (
//       <div className="min-h-screen bg-white flex items-center justify-center p-6">
//         <div className="text-center max-w-md">
//           <div className="mb-8">
//             <div className="w-full rounded-full flex items-center justify-start mx-auto mb-4">
//               <Image src="/quote.svg" alt="quote" width={68} height={68} />
//             </div>
//             <p className="text-xl font-semibold text-gray-900 mb-2">
//               For Couples and Creatives on the go.....
//             </p>
//             <p className="text-xl font-semibold text-gray-900 ml-12">
//               Please join us on your phone's browser
//             </p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return children;
// };

const DesktopRestriction = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

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