'use client';

import { useEffect } from 'react';

export default function InstagramCallback() {
  useEffect(() => {
    console.log("📍 Instagram callback page loaded");
    
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const error = urlParams.get("error");
    const errorDescription = urlParams.get("error_description");

    console.log("🔍 URL params:", { code, error, errorDescription });
    console.log("🌐 Current URL:", window.location.href);
    console.log("🏠 Origin:", window.location.origin);

    // Check if we're in a popup (has opener)
    if (window.opener) {
      console.log("✅ Popup detected, sending message to parent");
      
      if (error) {
        console.error("❌ Instagram OAuth error:", error, errorDescription);
        window.opener.postMessage(
          {
            type: "INSTAGRAM_AUTH_ERROR",
            error: errorDescription || error,
          },
          window.location.origin
        );
      } else if (code) {
        console.log("✅ Instagram OAuth success, code received:", code);
        window.opener.postMessage(
          {
            type: "INSTAGRAM_AUTH_SUCCESS",
            code: code,
          },
          window.location.origin
        );
      } else {
        console.error("❌ No code or error in callback");
        window.opener.postMessage(
          {
            type: "INSTAGRAM_AUTH_ERROR",
            error: "No authorization code received",
          },
          window.location.origin
        );
      }

      // Close popup after sending message
      setTimeout(() => {
        console.log("🔒 Closing popup window");
        window.close();
      }, 1000);
    } else {
      console.warn("⚠️ Not in popup, redirecting to main app");
      // Fallback: redirect to main app with parameters
      const mainAppUrl = `${window.location.origin}/?instagram_callback=true&${window.location.search.substring(1)}`;
      window.location.href = mainAppUrl;
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Connecting your Instagram account...</p>
        <p className="text-sm text-gray-500 mt-2">This window will close shortly</p>
      </div>
    </div>
  );
}