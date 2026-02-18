"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";

const EmailVerificationResult = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(5);

  const status = searchParams.get("status");

  useEffect(() => {
    if (status === "success") {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [status]);

  // Auto-close tab after countdown reaches 0 for successful verification
  useEffect(() => {
    if (status === "success" && countdown <= 0) {
      // Try to close the tab/window
      window.close();

      // Fallback: If window.close() doesn't work (some browsers block it),
      // redirect to login as backup
      const fallbackTimer = setTimeout(() => {
        router.push("/login?flow=creative&step=login-choice&mode=login");
      }, 500);

      return () => clearTimeout(fallbackTimer);
    }
  }, [status, countdown, router]);

  const getStatusConfig = () => {
    switch (status) {
      case "success":
        return {
          icon: CheckCircle,
          iconColor: "text-green-600",
          bgColor: "bg-green-100",
          title: "Email Verified Successfully!",
          message:
            "Your email has been verified. This tab will close automatically.",
          buttonText: `Closing tab in ${countdown}s...`,
          buttonAction: () => window.close(),
        };
      case "expired":
        return {
          icon: AlertCircle,
          iconColor: "text-yellow-600",
          bgColor: "bg-yellow-100",
          title: "Link Expired",
          message:
            "This verification link has expired. Please request a new verification email.",
          buttonText: "Request New Link",
          buttonAction: () => router.push("/onboarding"),
        };
      case "invalid":
        return {
          icon: XCircle,
          iconColor: "text-red-600",
          bgColor: "bg-red-100",
          title: "Invalid Link",
          message:
            "This verification link is invalid or has already been used.",
          buttonText: "Back to Registration",
          buttonAction: () => router.push("/onboarding"),
        };
      default:
        return {
          icon: XCircle,
          iconColor: "text-red-600",
          bgColor: "bg-red-100",
          title: "Verification Failed",
          message:
            "Something went wrong during email verification. Please try again.",
          buttonText: "Try Again",
          buttonAction: () => router.push("/onboarding"),
        };
    }
  };

  if (!status) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="animate-spin w-8 h-8 text-gray-500" />
      </div>
    );
  }

  const config = getStatusConfig();
  const IconComponent = config.icon;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div
          className={`w-16 h-16 mx-auto mb-6 ${config.bgColor} rounded-full flex items-center justify-center`}
        >
          <IconComponent className={`w-8 h-8 ${config.iconColor}`} />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {config.title}
        </h1>

        <p className="text-gray-600 mb-8">{config.message}</p>

        <button
          onClick={config.buttonAction}
          disabled={status === "success"}
          className={`w-full py-3 px-6 rounded-full font-semibold transition-colors ${
            status === "success"
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-black text-white hover:bg-gray-800"
          }`}
        >
          {config.buttonText}
        </button>

        {status === "success" && (
          <p className="text-sm text-gray-500 mt-4">
            You can safely close this tab or it will close automatically.
          </p>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationResult;
