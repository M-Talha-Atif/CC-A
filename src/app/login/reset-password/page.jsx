import { Suspense } from "react";
import ResetPasswordForm from "./components/reset-password";

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full space-y-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <h2 className="mt-6 text-3xl font-bold text-gray-900">Loading...</h2>
        <p className="mt-2 text-sm text-gray-600">
          Please wait while we prepare your password reset form.
        </p>
      </div>
    </div>
  </div>
);

// Main component with Suspense boundary
const ResetPasswordPage = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
};

export default ResetPasswordPage;
