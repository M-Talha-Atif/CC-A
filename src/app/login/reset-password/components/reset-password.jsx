"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, CheckCircle, XCircle } from "lucide-react";
import { resetPassword } from "../../../../../action";
import { toast, Toaster } from "sonner";

// Separate component for the reset password logic
const ResetPasswordForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State management
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [token, setToken] = useState(null);
  const [tokenValid, setTokenValid] = useState(null);

  // Extract token from URL on component mount
  useEffect(() => {
    const urlToken = searchParams.get("token");
    if (urlToken) {
      setToken(urlToken);
      // Optionally validate token here
      setTokenValid(true);
    } else {
      setTokenValid(false);
    }
  }, [searchParams]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Password Requirements Component
  const PasswordRequirements = ({ requirements, show }) => {
    if (!show) return null;

    const requirementsList = [
      {
        key: "length",
        text: "At least 8 characters",
        met: requirements.length,
      },
      {
        key: "uppercase",
        text: "One uppercase letter",
        met: requirements.uppercase,
      },
      {
        key: "lowercase",
        text: "One lowercase letter",
        met: requirements.lowercase,
      },
      { key: "number", text: "One number", met: requirements.number },
    ];

    return (
      <div className="mt-3 p-3 bg-gray-50 rounded-lg shadow-sm">
        <p className="text-sm font-medium text-gray-700 mb-2">
          Password must contain:
        </p>
        <div className="space-y-1">
          {requirementsList.map((req) => (
            <div key={req.key} className="flex items-center gap-2 text-sm">
              {req.met ? (
                <CheckCircle size={14} className="text-green-500" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-gray-300" />
              )}
              <span className={req.met ? "text-green-600" : "text-gray-600"}>
                {req.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.newPassword || !formData.confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    if (!passwordValidation.isValid) {
      toast.error("Password does not meet requirements");
      return;
    }

    if (!token) {
      toast.error("Invalid reset token. Please request a new password reset.");
      return;
    }

    setIsLoading(true);
    setLoadingMessage("Updating password...");

    try {
      const response = await resetPassword({
        token: token,
        password: formData.newPassword,
      });

      if (response.success) {
        toast.success("Password updated successfully! Redirecting to login...");

        // Clear form data
        setFormData({
          newPassword: "",
          confirmPassword: "",
        });

        // Redirect to login after success
        setTimeout(() => {
          router.push("/login?flow=creative&step=login-choice&mode=login");
        }, 2000);
      } else {
        // Display the specific error message from the backend
        toast.error(
          response.message || "Failed to update password. Please try again."
        );
      }
    } catch (error) {
      console.error("Password update error:", error);

      // Check if there's a response with a message
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update password. Please try again.";

      toast.error(errorMessage, {
        duration: 5000, // Show error longer so user can read it
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  // Password validation helpers
  const validatePassword = (password) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
    };

    const isValid = Object.values(requirements).every(Boolean);

    return { requirements, isValid };
  };

  const passwordValidation = validatePassword(formData.newPassword);
  const doPasswordsMatch =
    formData.newPassword === formData.confirmPassword &&
    formData.newPassword.length > 0;
  const isFormValid = passwordValidation.isValid && doPasswordsMatch;

  // If token is invalid, show error state
  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <XCircle className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Invalid Reset Link
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              This password reset link is invalid or has expired. Please request
              a new password reset.
            </p>
            <button
              onClick={() =>
                router.push("/login?flow=creative&step=login-choice&mode=login")
              }
              className="mt-4 w-full py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Toaster
          position="bottom-center"
          toastOptions={{
            className: "shadow-none",
            style: {
              boxShadow: "none",
            },
          }}
        />

        <div>
          <div className="text-center">
            <Lock className="mx-auto h-12 w-12 text-gray-400" />
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Create New Password
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please enter your new password below
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* New Password Field */}
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={formData.newPassword}
                    onChange={(e) =>
                      handleInputChange("newPassword", e.target.value)
                    }
                    disabled={isLoading}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent ${
                      isLoading
                        ? "bg-gray-100 cursor-not-allowed"
                        : "border-gray-300"
                    }`}
                    placeholder="Enter your new password"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <PasswordRequirements
                  requirements={passwordValidation.requirements}
                  show={
                    formData.newPassword.length > 0 &&
                    !passwordValidation.isValid
                  }
                />
              </div>

              {/* Confirm Password Field */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    disabled={isLoading}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent ${
                      isLoading
                        ? "bg-gray-100 cursor-not-allowed"
                        : "border-gray-300"
                    }`}
                    placeholder="Confirm your new password"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Password Requirements - Only show for confirm password if passwords don't match */}
            {formData.confirmPassword.length > 0 && !doPasswordsMatch && (
              <div className="mt-3 p-3 bg-red-50 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 text-sm">
                  <XCircle size={14} className="text-red-500" />
                  <span className="text-red-600">Passwords do not match</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="space-y-4">
              <button
                type="submit"
                disabled={isLoading || !isFormValid}
                className={`w-full py-4 px-6 rounded-full font-semibold transition-colors ${
                  isLoading || !isFormValid
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-black text-white hover:bg-gray-800"
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    {loadingMessage}
                  </div>
                ) : (
                  "Update Password"
                )}
              </button>

              <button
                type="button"
                onClick={() => router.push("/login")}
                className="w-full py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Back to Login
              </button>
            </div>
          </form>
        </div>

        <div className="text-center">
          <p className="mt-3 text-xs text-gray-600">
            Remember your password?{" "}
            <button
              onClick={() => router.push("/login")}
              className="text-blue-600 hover:text-blue-800"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordForm;
