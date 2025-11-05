'use client';

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { handlePaymentCancel } from "../../../../action"; // Adjust path as needed

const PaymentCancelledPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inquiry_id = searchParams.get('inquiry_id');

  useEffect(() => {
    const processPaymentCancel = async () => {
      if (inquiry_id) {
        try {
          await handlePaymentCancel(inquiry_id);
        } catch (error) {
          console.error("Error handling payment cancellation:", error);
        }
      }
    };

    processPaymentCancel();
  }, [inquiry_id]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto text-center p-6">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 13.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Cancelled
        </h1>

        <p className="text-gray-600 mb-6">
          No worries! Your payment has been cancelled and no charges were made
          to your card.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => router.push("/find-creative")}
            className="w-full bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition-colors"
          >
            Try Again
          </button>

          <button
            onClick={() => router.push("/feed/couple")}
            className="w-full border border-gray-300 text-gray-700 px-6 py-3 rounded-full hover:border-gray-400 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        <p className="text-sm text-gray-500 mt-6">
          Need help?{" "}
          <a
            href="mailto:support@cunocovo.com"
            className="text-black underline"
          >
            Contact our support team
          </a>
        </p>
      </div>
    </div>
  );
};

export default PaymentCancelledPage;