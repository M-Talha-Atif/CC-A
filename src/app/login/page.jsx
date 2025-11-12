"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  ChevronRight,
  ArrowLeft,
  Camera,
  Globe,
  Instagram,
  Phone,
  Mail,
  User,
  Building,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  checkUserStatus,
  completeProfile,
  exchangeInstagramToken,
  forgotPassword,
  getOnboardingProgress,
  googleLoginCreative,
  googleLoginCouple,
  handleGoogleToken,
  register,
  storePhoneNumber,
  updateOnboardingProgress,
  verifyOTP,
  verifyPhone,
  verifyReferralCode,
  sendVerificationEmail,
  verifyEmailToken,
  resendVerificationEmail,
  checkEmailVerificationStatus,
  checkEmailExists,
} from "../../../action";
import axios from "axios";

import { useGoogleLogin } from "@react-oauth/google";
import useUserStore from "@/store/userStore";
import Logout from "../../components/Logout";
import { toast, Toaster } from "sonner";
import Toast from "../../components/Toast";
import { useRouter, useSearchParams } from "next/navigation";
import {
  loadFromStorage,
  STORAGE_KEYS,
  saveToStorage,
} from "../../utils/saveToLocal";
import AuthLayout from "./components/AuthLayout";
import CustomApiError from "@/utils/CustomApiError";
import useHelpCenterStore from "@/hooks/useHelpCenter";

let tokenClient = null;

const page = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authMode = searchParams.get("mode") || "login";
  const [userType, setUserType] = useState("");
  const userTypeRef = useRef(userType);
  const { openHelpCenter } = useHelpCenterStore();
  const [currentStep, setCurrentStep] = useState("email-choice");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    referralCode: "",
    businessName: "",
    website: "",
    instagram: "",
    creativeDomain: [],
    phone: "",
    otpCode: "",
    resetEmail: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmPasswordValidation, setConfirmPasswordValidation] = useState({
    isValid: false,
    message: "",
    type: "",
  });
  const [confirmPasswordTypingTimer, setConfirmPasswordTypingTimer] =
    useState(null);
  const [showConfirmPasswordError, setShowConfirmPasswordError] =
    useState(false);
  const [referralCompleted, setReferralCompleted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const { user, isAuthenticated, setUser } = useUserStore();

  // Validation states
  const [emailValidation, setEmailValidation] = useState({
    isValid: false,
    message: "",
    type: "", // 'success', 'warning', 'error'
  });

  const [websiteValidation, setWebsiteValidation] = useState({
    isValid: false,
    message: "",
    type: "",
  });

  const [passwordValidation, setPasswordValidation] = useState({
    isValid: false,
    message: "",
    requirements: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [referralError, setReferralError] = useState("");
  const [otpTimer, setOtpTimer] = useState(60);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [showEmailInfo, setShowEmailInfo] = useState(false);

  const [initializing, setInitializing] = useState(true);
  const [emailTypingTimer, setEmailTypingTimer] = useState(null);
  const [passwordTypingTimer, setPasswordTypingTimer] = useState(null);
  const [websiteTypingTimer, setWebsiteTypingTimer] = useState(null);
  const [showEmailError, setShowEmailError] = useState(false);
  const [showPasswordError, setShowPasswordError] = useState(false);
  const [showWebsiteError, setShowWebsiteError] = useState(false);


  useEffect(() => {
    // Reset all validation states when auth mode changes
    setEmailValidation({
      isValid: false,
      message: "",
      type: "",
    });
    setPasswordValidation({
      isValid: false,
      message: "",
      requirements: {
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
      },
    });
    setConfirmPasswordValidation({
      isValid: false,
      message: "",
      type: "",
    });

    // Clear any visible error states
    setShowEmailError(false);
    setShowPasswordError(false);
    setShowConfirmPasswordError(false);

    // Clear any existing timers
    if (emailTypingTimer) clearTimeout(emailTypingTimer);
    if (passwordTypingTimer) clearTimeout(passwordTypingTimer);
    if (confirmPasswordTypingTimer) clearTimeout(confirmPasswordTypingTimer);
  }, [authMode]);

  useEffect(() => {
    if (!isHydrated) return;

    const flow = searchParams.get("flow");
    const step = searchParams.get("step");
    const mode = searchParams.get("mode");

    if (flow === "creative" && step === "login-choice") {
      setUserType("creative");
      setCurrentStep("login-choice");
    }

    // If mode is specified in URL, we're on email-login step
    if (flow === "creative" && step === "email-login" && mode) {
      setUserType("creative");
      setCurrentStep("email-login");
    }
  }, [isHydrated, searchParams]);

  useEffect(() => {
    const initializeOnboarding = async () => {
      if (!isAuthenticated || !user) {
        setInitializing(false);
        return;
      }

      try {
        setInitializing(true);
        setLoadingMessage("Initializing your account...");

        if (user.userType === "couple") {
          setLoadingMessage("Redirecting to your feed...");
          router.push("/feed/couple");
          return;
        }

        const response = await getOnboardingProgress();

        if (response.success) {
          const { progress, nextStep, user: serverUser } = response.data;

          if (serverUser && serverUser.personalReferralCode) {
            setUser((prevUser) => ({
              ...prevUser,
              referralCode: serverUser.personalReferralCode,
              points: serverUser.points || prevUser.points,
              rank: serverUser.rank || prevUser.rank,
            }));
          }

          if (progress.onboardingCompleted) {
            setLoadingMessage("Redirecting to your account...");

            try {
              const statusResponse = await checkUserStatus();

              if (
                statusResponse.data &&
                statusResponse.data.status === "pending"
              ) {
                router.push("/waiting");
              } else {
                if (user.userType === "couple") {
                  router.push("/feed/couple");
                } else if (user.userType === "creative") {
                  if (user.isNewUser) {
                    router.push("/home");
                  } else {
                    router.push("/feed/new");
                  }
                } else {
                  router.push("/feed/new");
                }
              }
              return;
            } catch (statusError) {
              console.error("Status check error:", statusError);
              router.push("/waiting");
              return;
            }
          }

          // Update form data - remove businessName references since we're skipping that step
          setFormData((prevData) => ({
            email: serverUser?.email || prevData.email,
            password: prevData.password,
            referralCode:
              progress.formData?.referralCode || prevData.referralCode,
            businessName: serverUser?.profile?.businessName || "", // Keep for backend compatibility but don't collect
            website:
              progress.formData?.website ||
              serverUser?.profile?.website ||
              prevData.website,
            instagram:
              progress.formData?.instagram ||
              serverUser?.profile?.instagram ||
              prevData.instagram,
            creativeDomain:
              progress.formData?.creativeDomain ||
              serverUser?.profile?.creativeDomains ||
              prevData.creativeDomain,
            phone:
              progress.formData?.phone ||
              serverUser?.profile?.phone ||
              prevData.phone,
            otpCode: prevData.otpCode,
          }));

          if (nextStep?.step && nextStep.step !== "landing") {
            if (
              nextStep.step === "email-verification" &&
              serverUser?.emailVerified
            ) {
              const emailVerificationIndex =
                steps.indexOf("email-verification");
              const nextStepAfterVerification =
                steps[emailVerificationIndex + 1];

              setTimeout(() => {
                setCurrentStep(nextStepAfterVerification || "phone-number");
                setInitializing(false);
              }, 100);
            } else {
              setTimeout(() => {
                setCurrentStep(nextStep.step);
                setInitializing(false);
              }, 100);
            }
          } else {
            setInitializing(false);
          }
        }
      } catch (error) {
        console.error("Failed to initialize onboarding:", error);
        setInitializing(false);
      }
    };

    initializeOnboarding();
  }, [isAuthenticated, user?.id, router]);

  useEffect(() => {
    setIsHydrated(true);
    setCurrentStep(loadFromStorage(STORAGE_KEYS.CURRENT_STEP, "landing"));
    setFormData(
      loadFromStorage(STORAGE_KEYS.FORM_DATA, {
        email: "",
        password: "",
        referralCode: "",
        businessName: "",
        website: "",
        instagram: "",
        creativeDomain: [],
        phone: "",
        otpCode: "",
      })
    );
    setReferralCompleted(
      loadFromStorage(STORAGE_KEYS.REFERRAL_COMPLETED, false)
    );
  }, []);

  const handleOnboardingBack = () => {
    switch (currentStep) {
      case "login-choice":
        if (window.history.length > 1) {
          router.back();
        }
        break;
      case "email-choice":
        setCurrentStep("landing");
        break;

      case "email-login":
        setCurrentStep("login-choice");
        break;

      case "email-verification":
        setCurrentStep("email-login");
        break;

      case "phone-number":
        setCurrentStep("email-verification");
        break;

      case "referral-code":
        setCurrentStep("phone-number");
        break;

      // case "business-name":
      //   setCurrentStep("referral-code");
      //   break;

      case "business-website":
        setCurrentStep("referral-code");
        break;

      case "business-instagram":
        // Go back to business-website
        setCurrentStep("business-website");
        break;

      case "creative-domain":
        // Go back to business-instagram
        setCurrentStep("business-instagram");
        break;

      case "landing":
      default:
        // If on landing step or any other step, go to previous page
        if (window.history.length > 1) {
          router.back();
        } else {
          // Fallback if no history
          router.push("/");
        }
        break;
    }
  };

  useEffect(() => {
    const handlePopState = (event) => {
      event.preventDefault();
      handleOnboardingBack();
    };

    // Add event listener for browser back button
    window.addEventListener("popstate", handlePopState);

    // Push a state so we can intercept back button
    window.history.pushState(null, "", window.location.href);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [currentStep]);

  useEffect(() => {
    if (!isHydrated || !isAuthenticated || !user) return;

    // Check if user is couple type first - always redirect to feed
    if (user.userType === "couple") {
      router.push("/feed/couple");
      return;
    }

    const hasCompletedOnboarding = user.profile?.onboardingCompleted;
    const hasVerifiedEmail = user.emailVerified;

    const isAtEntryStep = currentStep === "email-login";

    if (hasCompletedOnboarding && hasVerifiedEmail && isAtEntryStep) {
      router.push("/feed");
    }
  }, [isHydrated, isAuthenticated, user, currentStep, router]);

  useEffect(() => {
    userTypeRef.current = userType;
  }, [userType]);

  useEffect(() => {
    let interval;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  useEffect(() => {
    let pollInterval;

    if (currentStep === "email-verification" && user && !user.emailVerified) {
      // Poll every 3 seconds to check if email is verified
      pollInterval = setInterval(async () => {
        try {
          const response = await checkEmailVerificationStatus();
          if (response.success && response.data.emailVerified) {
            setVerificationStatus("verified");
            clearInterval(pollInterval);

            // Update user state
            setUser((prev) => ({
              ...prev,
              emailVerified: true,
            }));

            // Proceed to next step
            setTimeout(() => {
              setCurrentStep("phone-number");
            }, 1500);
          }
        } catch (error) {
          console.error("Email verification polling error:", error);
        }
      }, 3000);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [currentStep, user?.emailVerified]);

  const updateServerProgress = async (step, data = {}, completed = null) => {
    if (!isAuthenticated) return;

    try {
      await updateOnboardingProgress(step, data, completed);
    } catch (error) {
      console.error("Failed to update server progress:", error);
    }
  };

  const validatePassword = (password) => {
    if (!password) {
      setPasswordValidation({
        isValid: false,
        message: "",
        requirements: {
          length: false,
          uppercase: false,
          lowercase: false,
          number: false,
        },
      });
      return;
    }

    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
    };

    const isValid = Object.values(requirements).every((req) => req);

    setPasswordValidation({
      isValid,
      message: isValid
        ? "Password meets all requirements"
        : "Password requirements not met",
      requirements,
    });
  };

  const validateConfirmPassword = (password, confirmPwd) => {
    if (!confirmPwd) {
      setConfirmPasswordValidation({
        isValid: false,
        message: "",
        type: "",
      });
      return;
    }

    if (password !== confirmPwd) {
      setConfirmPasswordValidation({
        isValid: false,
        message: "Passwords do not match",
        type: "error",
      });
      return;
    }

    setConfirmPasswordValidation({
      isValid: true,
      message: "Passwords match",
      type: "success",
    });
  };

  const formatPhoneNumber = (value) => {
    // Remove all non-digit characters
    const cleaned = value.replace(/\D/g, "");

    // Format as +1 XXX XXX XXXX
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    } else {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(
        6,
        10
      )}`;
    }
  };

  const steps = [
    // "landing",
    "email-choice",
    "login-choice",
    "email-login",
    "email-verification",
    "phone-number",
    "referral-code",
    "business-website",
    "business-instagram",
    "creative-domain",
  ];

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (window.google) {
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          scope: "openid email profile",
          callback: (response) => {
            if (response.error) {
              console.error("Google login error:", response);
              toast.error("Google login failed. Please try again.", "error");
              return;
            }

            // Use the ref to get current userType
            const currentUserType = userTypeRef.current;
            console.log("Current userType in callback:", currentUserType);

            handleGoogleLogin(
              { credential: response.access_token },
              currentUserType
            );
          },
        });
      }
    };

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (emailTypingTimer) clearTimeout(emailTypingTimer);
      if (passwordTypingTimer) clearTimeout(passwordTypingTimer);
      if (confirmPasswordTypingTimer) clearTimeout(confirmPasswordTypingTimer);
      if (websiteTypingTimer) clearTimeout(websiteTypingTimer); // Add this
    };
  }, [emailTypingTimer, passwordTypingTimer, websiteTypingTimer]); // Add websiteTypingTimer

  const validateBusinessEmail = async (email) => {
    if (!email) {
      setEmailValidation({ isValid: false, message: "", type: "" });
      return;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailValidation({
        isValid: false,
        message: "Please enter a valid email address",
        type: "error",
      });
      return;
    }

    // Check email existence based on mode
    try {
      const response = await checkEmailExists(email);

      if (authMode === "signup") {
        // SIGNUP MODE: Email shouldn't exist
        if (response.success && response.exists) {
          setEmailValidation({
            isValid: false,
            message: "This email is already in use. Try to login.",
            type: "error",
          });
          return;
        }
      } else if (authMode === "login") {
        // LOGIN MODE: Email should exist
        if (response.success && !response.exists) {
          setEmailValidation({
            isValid: false,
            message: "Please sign up.",
            type: "error",
          });
          return;
        }
      }
    } catch (error) {
      console.error("Email check failed:", error);
      // Continue with validation even if check fails
    }

    const domain = email.split("@")[1].toLowerCase();

    // Common personal email providers - STRICT LIST
    const personalProviders = [
      "gmail.com",
      "yahoo.com",
      "yahoo.co.uk",
      "yahoo.ca",
      "hotmail.com",
      "hotmail.co.uk",
      "outlook.com",
      "outlook.co.uk",
      "aol.com",
      "icloud.com",
      "me.com",
      "mac.com",
      "live.com",
      "live.co.uk",
      "msn.com",
      "ymail.com",
      "rocketmail.com",
      "protonmail.com",
      "proton.me",
      "tutanota.com",
      "zoho.com",
      "mail.com",
      "gmx.com",
      "rediffmail.com",
      "fastmail.com",
      "mailfence.com",
      "guerrillamail.com",
      "10minutemail.com",
      "tempmail.org",
      "mailinator.com",
    ];

    // STRICT: Block personal emails completely
    if (personalProviders.includes(domain)) {
      setEmailValidation({
        isValid: false,
        message:
          "Personal email addresses are not allowed. Please use your business/work email.",
        type: "error",
      });
      return;
    }

    // Additional checks for business domains
    const businessIndicators = [
      ".co",
      ".com",
      ".org",
      ".com",
      ".biz",
      ".info",
      ".pro",
      ".edu",
      ".gov",
    ];

    const hasBusinessTLD = businessIndicators.some((tld) =>
      domain.endsWith(tld)
    );

    const isCustomDomain =
      !personalProviders.includes(domain) &&
      domain.includes(".") &&
      domain.split(".").length >= 2;

    if (isCustomDomain && hasBusinessTLD) {
      setEmailValidation({
        isValid: true,
        message: "Business email verified",
        type: "success",
      });
    } else {
      setEmailValidation({
        isValid: false,
        message: "Please use a valid business/work email address",
        type: "error",
      });
    }
  };

  const validateWebsite = (url, showMessage = true) => {
    if (!url) {
      setWebsiteValidation({ isValid: false, message: "", type: "" });
      return;
    }

    let formattedUrl = url.trim();
    if (
      !formattedUrl.startsWith("http://") &&
      !formattedUrl.startsWith("https://")
    ) {
      formattedUrl = "https://" + formattedUrl;
    }

    try {
      const urlObj = new URL(formattedUrl);
      const hostname = urlObj.hostname;

      if (!hostname || !hostname.includes(".") || hostname.length < 3) {
        throw new Error("Invalid hostname");
      }

      // Get the email from either formData or user state
      const email = formData.email || user?.email || "";

      if (!email) {
        setWebsiteValidation({
          isValid: false,
          message: showMessage
            ? "Email not found. Please complete email step first."
            : "",
          type: "error",
        });
        return;
      }

      const websiteDomain = hostname.replace(/^www\./, "").toLowerCase();
      const emailDomain = email.split("@")[1]?.toLowerCase();

      if (!emailDomain) {
        setWebsiteValidation({
          isValid: false,
          message: showMessage ? "Invalid email format" : "",
          type: "error",
        });
        return;
      }

      // Check if it's a personal email domain
      const personalProviders = [
        "gmail.com",
        "yahoo.com",
        "yahoo.co.uk",
        "yahoo.ca",
        "hotmail.com",
        "hotmail.co.uk",
        "outlook.com",
        "outlook.co.uk",
        "aol.com",
        "icloud.com",
        "me.com",
        "mac.com",
        "live.com",
        "live.co.uk",
        "msn.com",
        "ymail.com",
        "rocketmail.com",
        "protonmail.com",
        "proton.me",
        "tutanota.com",
        "zoho.com",
        "mail.com",
        "gmx.com",
        "rediffmail.com",
        "fastmail.com",
        "mailfence.com",
        "guerrillamail.com",
        "10minutemail.com",
        "tempmail.org",
        "mailinator.com",
      ];

      // If email is from a personal provider, allow any valid website
      if (personalProviders.includes(emailDomain)) {
        setWebsiteValidation({
          isValid: true,
          message: showMessage ? "Website format is valid" : "",
          type: "success",
        });
        return;
      }

      // For business emails, domain must match
      if (websiteDomain === emailDomain) {
        setWebsiteValidation({
          isValid: true,
          message: showMessage ? "Website matches your email domain" : "",
          type: "success",
        });
      } else {
        setWebsiteValidation({
          isValid: false,
          message: showMessage
            ? `Website domain (${websiteDomain}) must match your email domain (${emailDomain})`
            : "",
          type: "error",
        });
      }
    } catch (error) {
      setWebsiteValidation({
        isValid: false,
        message: showMessage ? "Please enter a valid website URL" : "",
        type: "error",
      });
    }
  };

  const handleInputChange = (field, value) => {
    if (field === "phone") {
      const formattedPhone = formatPhoneNumber(value);
      setFormData((prev) => ({ ...prev, [field]: formattedPhone }));
    } else if (field === "confirmPassword") {
      setConfirmPassword(value);

      // Hide error while typing
      setShowConfirmPasswordError(false);

      // Clear existing timer
      if (confirmPasswordTypingTimer) {
        clearTimeout(confirmPasswordTypingTimer);
      }

      // Set new timer - show error after user stops typing for 800ms
      const newTimer = setTimeout(() => {
        validateConfirmPassword(formData.password, value);
        setShowConfirmPasswordError(true);
      }, 800);

      setConfirmPasswordTypingTimer(newTimer);
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }

    // Validation logic with debounce
    if (field === "email") {
      // Hide error while typing
      setShowEmailError(false);

      // Clear existing timer
      if (emailTypingTimer) {
        clearTimeout(emailTypingTimer);
      }

      // Set new timer - show error after user stops typing for 800ms
      const newTimer = setTimeout(() => {
        validateBusinessEmail(value);
        setShowEmailError(true);
      }, 800);

      setEmailTypingTimer(newTimer);
    } else if (field === "password") {

      // Hide error while typing
      setShowPasswordError(false);

      // Clear existing timer
      if (passwordTypingTimer) {
        clearTimeout(passwordTypingTimer);
      }

      // Set new timer
      const newTimer = setTimeout(() => {
        validatePassword(value);
        setShowPasswordError(true);
        if (authMode === "signup" && confirmPassword) {
          validateConfirmPassword(value, confirmPassword);
        }
      }, 800);

      setPasswordTypingTimer(newTimer);
    } else if (field === "website") {
      // ADD THIS NEW BLOCK
      // Hide error while typing
      setShowWebsiteError(false);

      // Clear existing timer
      if (websiteTypingTimer) {
        clearTimeout(websiteTypingTimer);
      }

      // Set new timer - show error after user stops typing for 800ms
      const newTimer = setTimeout(() => {
        validateWebsite(value, true); // Show message after delay
        setShowWebsiteError(true);
      }, 800);

      setWebsiteTypingTimer(newTimer);
    }
  };


  const goToNextStep = async (stepCompleted = null) => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1];
      setCurrentStep(nextStep);

      // Update server with new step and completion status
      await updateServerProgress(nextStep, formData, stepCompleted);
    }
  };

  const goToPrevStep = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleGoogleLogin = async (credentialResponse, userType) => {
    setIsLoading(true);
    setLoadingMessage("Signing in with Google...");

    try {
      let result;

      // Choose the appropriate Google login function based on user type
      if (userType === "creative") {
        result = await googleLoginCreative(
          credentialResponse.credential,
          userType
        );
      } else if (userType === "couple") {
        result = await googleLoginCouple(
          credentialResponse.credential,
          userType
        );
      } else {
        throw new Error("Invalid user type");
      }

      if (result.success) {
        // For Google users, always mark as email verified
        const googleUser = {
          ...result.data.user,
          emailVerified: true, // Force email verification to true for Google users
        };

        setUser(googleUser);
        await handleGoogleToken(result.data.accessToken);

        if (userType === "couple") {
          router.push("/feed/couple");
          return;
        }

        // For creatives, check if they need to complete onboarding steps
        const userProfile = googleUser.profile || {};

        // REMOVED: Email verification check - Google users are automatically verified
        // Skip directly to phone number if not provided
        if (!userProfile.phone) {
          console.log("Google user - redirecting to phone-number step");
          setCurrentStep("phone-number");
          return;
        }

        // Continue with other onboarding steps
        if (!userProfile.businessName) {
          setCurrentStep("business-name");
          return;
        }

        if (!userProfile.website) {
          setCurrentStep("business-website");
          return;
        }

        if (!userProfile.instagram) {
          setCurrentStep("business-instagram");
          return;
        }

        if (
          !userProfile.creativeDomains ||
          userProfile.creativeDomains.length === 0
        ) {
          setCurrentStep("creative-domain");
          return;
        }

        // If user has completed all steps, redirect to appropriate page
        setLoadingMessage("Redirecting to your dashboard...");

        try {
          const statusResponse = await checkUserStatus();
          if (statusResponse?.data?.status === "pending") {
            router.push("/waiting");
          } else {
            router.push("/home");
          }
        } catch (statusError) {
          console.error("Status check failed:", statusError);
          router.push("/waiting");
        }
      } else {
        // Handle the returned error
        const error = result.error;

        if (error.errorCode === "BUSINESS_EMAIL_REQUIRED") {
          toast.info(
            "Business Email Required\n\nPlease use your company email address to sign in."
          );
        } else if (error.errorCode === "INVALID_DOMAIN") {
          toast.error(
            "Invalid Domain\n\nPlease use a valid business email address."
          );
        } else {
          toast.error(error.message);
        }
      }
    } catch (error) {
      // This should only catch unexpected errors now
      console.error("Unexpected error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const handleGoogleButtonClick = () => {
    setToast(null);

    if (tokenClient) {
      tokenClient.requestAccessToken();
    } else {
      toast.error("Google Sign-In is not available. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    switch (currentStep) {
      case "email-login":
        setIsLoading(true);

        try {
          // First, try to register/login the user
          const response = await register({
            email: formData.email,
            password: formData.password,
            userType: "creative",
          });

          if (!response.success) {
            setLoadingMessage("");
            toast.error(
              "Invalid email or password. Please check your credentials."
            );
            return;
          }

          const { accessToken, refreshToken, user } = response.data;

          console.log(user)
          
          setUser(user);
          
          if (typeof window !== "undefined" && accessToken && refreshToken) {
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", refreshToken);
            console.log("✅ Tokens stored in localStorage");
          }

          // Handle token if provided (Google auth)
          if (response.data.accessToken) {
            await handleGoogleToken(response.data.accessToken);
          }

          // Check if this is a new user or existing user
          const isNewUser = response.data.isNewUser || false;

          if (isNewUser) {
            setLoadingMessage("Setting up your account...");
          } else {
            console.log("old")
            setLoadingMessage("Signing you in...");
          }

          // Update server progress for login/registration
          await updateServerProgress(
            "email-login",
            {
              email: formData.email,
              userType: "creative",
            },
            "email-login"
          );

          // Check user's current email verification status
          if (user && user.id) {
            const emailVerificationStatus = !isNewUser
              ? await checkEmailVerificationStatus()
              : { success: true, data: { emailVerified: false } };

            if (emailVerificationStatus.success) {
              const { emailVerified } = emailVerificationStatus.data;

              if (!emailVerified) {
                // User needs email verification
                const shouldSendEmail = isNewUser || !emailVerificationSent;

                if (shouldSendEmail) {
                  try {
                    setLoadingMessage("Sending verification email...");
                    await sendVerificationEmail(formData.email, user.id);
                    setEmailVerificationSent(true);

                    const message = isNewUser
                      ? "Please check your email to verify your account."
                      : "Verification email sent. Please check your email.";

                    toast.info(message);
                  } catch (error) {
                    console.error("Failed to send verification email:", error);
                    toast.error(
                      "Failed to send verification email. Please try again."
                    );
                  }
                }

                setCurrentStep("email-verification");
                return;
              }
            }
          }

          // If we reach here, email is verified or verification check failed
          // Continue with onboarding flow based on user's profile completion status

          const userProfile = user.profile || {};

          // Check onboarding completion status
          if (user.profileCompleted || userProfile.onboardingCompleted) {
            // User has completed onboarding, redirect based on user type
            setLoadingMessage("Redirecting to your dashboard...");

            try {
              const statusResponse = await checkUserStatus();

              // Redirect based on user type and status
              if (user.userType === "couple") {
                router.push("/feed/couple");
              } else if (user.userType === "creative") {
                if (statusResponse?.data?.status === "pending") {
                  router.push("/waiting");
                } else {
                  // Redirect creative users to /feed/new
                  router.push("/feed/new");
                }
              } else {
                // Fallback for any other user types
                if (statusResponse?.data?.status === "pending") {
                  router.push("/waiting");
                } else {
                  router.push("/feed/new");
                }
              }
            } catch (statusError) {
              console.error("Status check failed:", statusError);
              router.push("/waiting");
            }
            return;
          }

          // User needs to complete onboarding - determine next step
          if (!userProfile.phone) {
            console.log("User needs to complete phone number step");
            setCurrentStep("phone-number");
            return;
          }

          if (!userProfile.businessName) {
            setCurrentStep("business-name");
            return;
          }

          if (!userProfile.website) {
            setCurrentStep("business-website");
            return;
          }

          if (!userProfile.instagram) {
            setCurrentStep("business-instagram");
            return;
          }

          if (
            !userProfile.creativeDomains ||
            userProfile.creativeDomains.length === 0
          ) {
            setCurrentStep("creative-domain");
            return;
          }

          // If all profile fields are filled but onboarding not marked complete
          setLoadingMessage("Finalizing your account...");

          try {
            const statusResponse = await checkUserStatus();

            // Redirect based on user type and status
            if (user.userType === "couple") {
              router.push("/feed/couple");
            } else if (user.userType === "creative") {
              if (statusResponse?.data?.status === "pending") {
                router.push("/waiting");
              } else {
                router.push("/feed/new");
              }
            } else {
              // Fallback
              if (statusResponse?.data?.status === "pending") {
                router.push("/waiting");
              } else {
                router.push("/feed/new");
              }
            }
          } catch (statusError) {
            console.error("Status check failed:", statusError);
            router.push("/waiting");
          }
        } catch (error) {
          console.error("Authentication failed:", error);
          setLoadingMessage("");

          if (error.message.includes("already exists")) {
            toast.info(
              "An account with this email already exists. Signing you in..."
            );
          } else {
            toast.error("Authentication failed. Please try again.");
          }
        } finally {
          setIsLoading(false);
          setLoadingMessage("");
        }
        break;

      case "phone-number":
        setIsLoading(true);
        setLoadingMessage("Saving phone number...");

        try {
          await storePhoneNumber({ phone: formData.phone });

          // Update server progress for phone number
          await updateServerProgress(
            currentStep,
            { phone: formData.phone },
            "phone-number"
          );

          // Update local user state
          setUser((prev) => ({
            ...prev,
            profile: {
              ...prev.profile,
              phone: formData.phone,
            },
          }));
          await goToNextStep("phone-number");
        } catch (error) {
          console.error("Phone storage failed:", error);
          toast.error("Failed to save phone number. Please try again.");
        } finally {
          setIsLoading(false);
          setLoadingMessage("");
        }
        break;

      case "referral-code":
        setIsLoading(true);
        setLoadingMessage("Verifying referral code...");

        try {
          await verifyReferralCode({
            referralCode: formData.referralCode,
          });
          setReferralError("");
          setReferralCompleted(true);

          // Update server progress for referral code
          await updateServerProgress(
            "referral-code",
            {
              referralCode: formData.referralCode,
            },
            "referral-code"
          );

          // Go to business name step
          // setCurrentStep("business-name");
          setCurrentStep("business-website");
        } catch (error) {
          console.error("Invalid referral code:", error);
          setReferralError("Invalid referral code.");
        } finally {
          setIsLoading(false);
          setLoadingMessage("");
        }
        break;

      case "business-website":
        if (websiteValidation.isValid) {
          // Check if URL already has protocol, if not add https://
          let finalWebsiteUrl = formData.website.trim();
          if (
            !finalWebsiteUrl.startsWith("http://") &&
            !finalWebsiteUrl.startsWith("https://")
          ) {
            finalWebsiteUrl = "https://" + finalWebsiteUrl;
          }

          await updateServerProgress(
            currentStep,
            {
              website: finalWebsiteUrl,
            },
            "business-website"
          );

          // Update local user state with the final URL
          setUser((prev) => ({
            ...prev,
            profile: {
              ...prev.profile,
              website: finalWebsiteUrl,
            },
          }));

          await goToNextStep("business-website");
        }
        break;

      case "business-instagram":
        if (formData.instagram.trim()) {
          await updateServerProgress(
            currentStep,
            {
              instagram: formData.instagram,
            },
            "business-instagram"
          );

          // Update local user state
          setUser((prev) => ({
            ...prev,
            profile: {
              ...prev.profile,
              instagram: formData.instagram,
            },
          }));

          await goToNextStep("business-instagram");
        }
        break;

      case "creative-domain":
        setIsLoading(true);
        setLoadingMessage("Saving your profile...");

        try {
          let finalWebsiteUrl = formData.website.trim();
          if (
            !finalWebsiteUrl.startsWith("http://") &&
            !finalWebsiteUrl.startsWith("https://")
          ) {
            finalWebsiteUrl = "https://" + finalWebsiteUrl;
          }

          const websiteDomain = finalWebsiteUrl
            .replace(/^https?:\/\/(www\.)?/, "")
            .split("/")[0];
          const fallbackBusinessName =
            websiteDomain.split(".")[0].charAt(0).toUpperCase() +
            websiteDomain.split(".")[0].slice(1);

          await completeProfile({
            businessName: formData.businessName || fallbackBusinessName,
            website: finalWebsiteUrl,
            instagram: formData.instagram,
            creativeDomains: formData.creativeDomain,
          });

          await updateServerProgress(
            "creative-domain",
            {
              creativeDomains: formData.creativeDomain,
            },
            "creative-domain"
          );

          console.log("new user onboarding true now")

          await updateServerProgress(
            "onboarding-completed",
            {
              onboardingCompleted: true,
            },
            "onboarding-completed"
          );

          // FIX: Update user state synchronously and wait for it
          setUser((prevUser) => ({
            ...prevUser,
            isNewUser: false,
            profile: {
              ...prevUser.profile,
              onboardingCompleted: true,
            },
          }));

          console.log("new user is false now")

          // ✅ CRITICAL: Add a small delay to ensure Zustand store persists
          // This gives the store time to save the state before navigation
          await new Promise((resolve) => setTimeout(resolve, 150));

          setLoadingMessage("Checking account status...");

          try {
            const statusResponse = await checkUserStatus();

            if (
              statusResponse.data &&
              statusResponse.data.status === "pending"
            ) {
              router.push("/waiting");
            } else {
              // Navigate to home page
              router.push("/home");
            }
          } catch (statusError) {
            console.error("Status check failed:", statusError);
            router.push("/waiting");
          }

          toast.success("Registration Complete!");
        } catch (error) {
          console.error("Profile completion failed:", error);
          toast.error("Failed to save profile. Please try again.");
        } finally {
          setIsLoading(false);
          setLoadingMessage("");
        }
        break;

      default:
        break;
    }
  };

  const handleDomainSelection = (domainId) => {
    const current = formData.creativeDomain;

    // If already selected, deselect
    if (current.includes(domainId)) {
      const updated = current.filter((id) => id !== domainId);
      setFormData((prev) => ({ ...prev, creativeDomain: updated }));
      return;
    }

    // Valid pair mapping
    const validPairs = {
      photography: "videography",
      videography: "photography",
      florist: "planner",
      planner: "florist",
    };

    // If nothing is selected yet
    if (current.length === 0) {
      setFormData((prev) => ({ ...prev, creativeDomain: [domainId] }));
      return;
    }

    // If one item is already selected, check if the second one is valid
    const first = current[0];
    const second = domainId;

    if (validPairs[first] === second) {
      setFormData((prev) => ({ ...prev, creativeDomain: [first, second] }));
    }
  };

  const handleResendVerificationEmail = async () => {
    if (resendCooldown > 0) return;

    setIsLoading(true);
    setLoadingMessage("Resending verification email...");

    try {
      await resendVerificationEmail(formData.email);
      setResendCooldown(60); // 60 second cooldown
      toast.success("Verification email resent successfully!");
    } catch (error) {
      toast.error("Failed to resend verification email. Please try again.");
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const ValidationMessage = ({ validation, show = true }) => {
    if (!validation.message || !show) return null;

    const getIcon = () => {
      switch (validation.type) {
        case "success":
          return <CheckCircle size={16} className="text-green-500" />;
        case "warning":
          return <AlertCircle size={16} className="text-yellow-500" />;
        case "error":
          return <AlertCircle size={16} className="text-red-500" />;
        default:
          return null;
      }
    };

    const getTextColor = () => {
      switch (validation.type) {
        case "success":
          return "text-green-600";
        case "warning":
          return "text-yellow-600";
        case "error":
          return "text-red-600";
        default:
          return "text-gray-600";
      }
    };

    return (
      <div className={`flex items-center gap-2 mt-2 text-sm ${getTextColor()}`}>
        {getIcon()}
        <span>{validation.message}</span>
      </div>
    );
  };

  const NavigationButtons = ({
    onNext,
    onBack,
    canContinue = true,
    showBack = true,
  }) => (
    <div className="flex items-center justify-between">
      {showBack ? (
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className={`transition-colors p-2 ${isLoading
            ? "text-gray-400 cursor-not-allowed"
            : "text-black hover:text-gray-800 cursor-pointer"
            }`}
        >
          <ChevronLeft size={24} />
        </button>
      ) : (
        <div />
      )}

      <button
        type="submit"
        onClick={onNext}
        disabled={!canContinue || isLoading}
        className={`transition-colors p-2 relative group ${canContinue && !isLoading
          ? "text-black hover:text-gray-800 cursor-pointer"
          : "text-gray-400 cursor-not-allowed"
          }`}
        title={
          !canContinue && !isLoading
            ? "Please use a valid business email address"
            : ""
        }
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
        ) : (
          <ChevronRight size={24} />
        )}
      </button>
    </div>
  );

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!formData.resetEmail) return;

    setIsLoading(true);
    setLoadingMessage("Sending reset link...");

    try {
      const response = await forgotPassword({
        email: formData.resetEmail,
      });

      if (response.success) {
        toast.success("Password reset link sent! Check your email inbox.");

        setTimeout(() => {
          setCurrentStep("email-login");
        }, 2000);
      } else {
        toast.error(
          response.message || "Failed to send reset link. Please try again."
        );
      }
    } catch (error) {
      toast.error("Failed to send reset link. Please try again.");
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const PasswordRequirements = ({ requirements, show }) => {
    if (!show || authMode === "login") return null;

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

  const LoadingOverlay = () => {
    if (!isLoading && !initializing) return null;

    return (
      <div className="fixed inset-0 bg-[#000000b0] bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          <p className="text-gray-700 font-medium">
            {loadingMessage ||
              (initializing ? "Initializing onboarding..." : "Loading...")}
          </p>
        </div>
      </div>
    );
  };

  const LoadingFallback = () => {
    if (!initializing) return null;

    return (
      <div className="fixed inset-0 bg-white bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[9999] overflow-hidden">
        <div className="flex flex-col items-center space-y-6 p-8">
          {/* Enhanced Spinner */}
          <div className="relative">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>{" "}
          </div>
        </div>
      </div>
    );
  };

  const renderStepContent = () => {
    if (initializing) return null;

    switch (currentStep) {
      case "landing":
        return (
          <div className="w-full max-w-md text-center">
            <h1 className="text-3xl font-semibold text-gray-900 mb-8 font-nunito">
              CUNO COVO
            </h1>
            <div className="space-y-4">
              <button
                onClick={() => {
                  setUserType("creative");
                  setCurrentStep("login-choice");
                }}
                className="w-full border-2 border-gray-300 text-gray-700 py-4 px-6 rounded-xl font-semibold hover:border-gray-400 transition-colors flex items-center justify-between"
              >
                <span>Creatives</span>
              </button>

              <button
                onClick={() => {
                  setUserType("couple");
                  setCurrentStep("email-choice"); // New step for couples
                }}
                className="w-full border-2 border-gray-300 text-gray-700 py-4 px-6 rounded-xl font-semibold hover:border-gray-400 transition-colors flex items-center justify-between"
              >
                <span>Couples</span>
              </button>
            </div>
          </div>
        );

      case "login-choice":
        return (
          <div className="w-full max-w-md flex flex-col items-center justify-between min-h-[90dvh]">
            <div className=""></div>
            <div className="w-full ">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-8 font-nunito">
                  CUNO COVO
                </h1>
                <div className="space-y-4">
                  <button
                    onClick={handleGoogleButtonClick}
                    className="w-full border-2 border-gray-300 text-gray-700 py-4 px-6 rounded-full font-semibold hover:border-gray-400 transition-colors flex items-center justify-center gap-3"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 48 48"
                      xmlns="http://www.w3.org/2000/svg"
                      className="fill-current text-black"
                    >
                      <path d="M43.611 20.083H42V20H24v8h11.303c-1.628 4.657-6.084 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.062 0 5.855 1.154 7.973 3.027l5.657-5.657C34.016 6.14 29.268 4 24 4 12.954 4 4 12.954 4 24s8.954 20 20 20c11.046 0 20-8.954 20-20 0-1.34-.138-2.65-.389-3.917z" />
                    </svg>
                    Continue with Google
                  </button>

                  <button
                    onClick={() => setCurrentStep("email-login")}
                    className="w-full border-2 border-gray-300 text-gray-700 py-4 px-6 rounded-full font-semibold hover:border-gray-400 transition-colors flex items-center justify-center gap-3"
                  >
                    <Mail />
                    Continue with Email
                  </button>
                </div>
              </div>
            </div>
            <div className="text-center mx-[-20px]">
              <p className="text-[10px] [@media(min-width:360px)]:text-[10px] text-gray-600">
                You acknowledge that you understand and agree to the{" "}
                <span
                  onClick={() => openHelpCenter("terms")}
                  className="underline"
                >
                  {" "}
                  Terms
                </span>{" "}
                and{" "}
                <span
                  onClick={() => openHelpCenter("privacy")}
                  className="underline"
                >
                  Policy
                </span>
              </p>
            </div>
          </div>
        );

      case "email-login":
        return (
          <div className="w-full max-w-md flex flex-col items-center justify-between min-h-[88dvh]">
            <div className="my-3"></div>
            <div className="w-full mt-7">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className=" text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    Business Email
                  </label>

                  <div className="relative">
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      disabled={isLoading}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent ${isLoading ? "bg-gray-100 cursor-not-allowed" : ""
                        } ${emailValidation.type === "error"
                          ? "border-red-300"
                          : emailValidation.type === "warning"
                            ? "border-yellow-300"
                            : emailValidation.type === "success"
                              ? "border-green-300"
                              : "border-gray-300"
                        }`}
                      placeholder="your@business.com"
                      required
                    />
                    {emailValidation.type === "success" && (
                      <CheckCircle
                        className="absolute right-3 top-3 text-green-500"
                        size={20}
                      />
                    )}
                  </div>
                  <ValidationMessage
                    validation={emailValidation}
                    show={showEmailError}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                      disabled={isLoading}
                      className={`w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent ${isLoading ? "bg-gray-100 cursor-not-allowed" : ""
                        }`}
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {authMode === "login" && (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => setCurrentStep("reset-password")}
                        className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}
                  <PasswordRequirements
                    requirements={passwordValidation.requirements}
                    show={
                      formData.password.length > 0 &&
                      !passwordValidation.isValid &&
                      showPasswordError
                    }
                  />
                  {authMode === "signup" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 my-2">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) =>
                            handleInputChange("confirmPassword", e.target.value)
                          }
                          disabled={isLoading}
                          className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent ${isLoading ? "bg-gray-100 cursor-not-allowed" : ""
                            } ${confirmPasswordValidation.type === "error"
                              ? "border-red-300"
                              : confirmPasswordValidation.type === "success"
                                ? "border-green-300"
                                : "border-gray-300"
                            }`}
                          placeholder="Confirm your password"
                          required
                        />
                        {confirmPasswordValidation.type === "success" && (
                          <CheckCircle
                            className="absolute right-3 top-3 text-green-500"
                            size={20}
                          />
                        )}
                      </div>
                      <ValidationMessage
                        validation={confirmPasswordValidation}
                        show={showConfirmPasswordError}
                      />
                    </div>
                  )}
                </div>

                <NavigationButtons
                  onNext={() => handleSubmit(event)}
                  onBack={goToPrevStep}
                  canContinue={
                    emailValidation.isValid &&
                    passwordValidation.isValid &&
                    (authMode === "signup"
                      ? confirmPasswordValidation.isValid
                      : true)
                  }
                />
              </form>

              {authMode === "signup" ? (
                <div className="mt-3 text-center text-sm">
                  Already have an account?{" "}
                  <span
                    className="font-semibold"
                    onClick={() => {
                      router.push(
                        "/login?flow=creative&step=login-choice&mode=login"
                      )
                      setFormData(prev => ({ ...prev, password: "", confirmPassword: "", email: "" }));
                    }


                    }
                  >
                    Log in here
                  </span>
                </div>
              ) : (
                <div className="mt-3 text-center text-sm">
                  Don't have an account?{" "}
                  <span
                    className="font-semibold"
                    onClick={() => {
                      router.push(
                        "/login?flow=creative&step=login-choice&mode=signup"
                      )
                      setFormData(prev => ({ ...prev, password: "", confirmPassword: "", email: "" }));
                      setConfirmPassword("")
                    }

                    }
                  >
                    Sign up here
                  </span>
                </div>
              )}
            </div>
            <div className="text-center mx-[-20px]">
              <p className="text-[8px] [@media(min-width:360px)]:text-[10px] text-gray-600">
                You acknowledge that you understand and agree to the{" "}
                <span
                  onClick={() => openHelpCenter("terms")}
                  className="underline"
                >
                  {" "}
                  Terms
                </span>{" "}
                and{" "}
                <span
                  onClick={() => openHelpCenter("privacy")}
                  className="underline"
                >
                  Policy
                </span>
              </p>
            </div>
          </div>
        );

      case "email-choice":
        return (
          <div className="w-full max-w-md flex flex-col items-center justify-between min-h-[80dvh]">
            <div className="my-3"></div>
            <div className="w-full mt-12">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-8 font-nunito">
                  CUNO COVO
                </h1>
                <div className="space-y-4">
                  <button
                    onClick={handleGoogleButtonClick}
                    className="w-full border-2 border-gray-300 text-gray-700 py-4 px-6 rounded-full font-semibold hover:border-gray-400 transition-colors flex items-center justify-center gap-3"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 48 48"
                      xmlns="http://www.w3.org/2000/svg"
                      className="fill-current text-black"
                    >
                      <path d="M43.611 20.083H42V20H24v8h11.303c-1.628 4.657-6.084 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.062 0 5.855 1.154 7.973 3.027l5.657-5.657C34.016 6.14 29.268 4 24 4 12.954 4 4 12.954 4 24s8.954 20 20 20c11.046 0 20-8.954 20-20 0-1.34-.138-2.65-.389-3.917z" />
                    </svg>
                    Continue with Google
                  </button>

                  <button
                    onClick={() => router.push("/feed")}
                    className="w-full text-gray-500 py-2 px-6 font-medium hover:text-gray-700 transition-colors"
                  >
                    Skip for now
                  </button>
                </div>
              </div>
            </div>
            <div className="text-center mx-[-20px]">
              <p className="text-[8px] [@media(min-width:360px)]:text-[10px] text-gray-600">
                You acknowledge that you understand and agree to the{" "}
                <span
                  onClick={() => openHelpCenter("terms")}
                  className="underline"
                >
                  {" "}
                  Terms
                </span>{" "}
                and{" "}
                <span
                  onClick={() => openHelpCenter("privacy")}
                  className="underline"
                >
                  Policy
                </span>
              </p>
            </div>
          </div>
        );

      case "email-verification":
        return (
          <div className="w-full max-w-md flex flex-col items-center justify-between min-h-[75dvh]">
            <div className="w-full mt-8">
              <div className="text-center">
                <div className="mb-6">
                  {verificationStatus === "verified" ? (
                    <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                      <Mail className="w-8 h-8 text-gray-600" />
                    </div>
                  )}
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {verificationStatus === "verified"
                    ? "Email Verified!"
                    : "Check Your Email"}
                </h1>

                {verificationStatus === "verified" ? (
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      Your email has been successfully verified. Redirecting you
                      to the next step...
                    </p>
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <p className="text-gray-600">
                        We've sent a verification link to:
                      </p>
                      <p className="font-semibold text-gray-900">
                        {formData.email}
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-3">
                        Click the link in your email to verify your account. The
                        link will expire in 24 hours.
                      </p>
                      <p className="text-sm text-gray-500">
                        Don't see the email? Check your spam folder or click
                        resend below.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={handleResendVerificationEmail}
                        disabled={resendCooldown > 0 || isLoading}
                        className={`w-full py-3 px-6 rounded-full font-semibold transition-colors ${resendCooldown > 0 || isLoading
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-black text-white hover:bg-gray-800"
                          }`}
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Resending...
                          </div>
                        ) : resendCooldown > 0 ? (
                          `Resend in ${resendCooldown}s`
                        ) : (
                          "Resend Verification Email"
                        )}
                      </button>

                      <button
                        onClick={() => setCurrentStep("email-login")}
                        className="w-full py-2 text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        Change Email Address
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="text-center mx-4">
              <p className="mt-3 text-[12px] text-gray-600">
                Email verification is required to ensure account security.
              </p>
            </div>
          </div>
        );

      case "phone-number":
        return (
          <div className="w-full max-w-md">
            <div className="text-left mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Phone Number</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <div className="relative">
                  <div className="flex">
                    <div className="flex items-center gap-2 px-3 py-3 border border-gray-300 rounded-l-lg">
                      <img
                        src="https://flagcdn.com/us.svg"
                        alt="US Flag"
                        className="w-5 h-5"
                      />
                      <span className="text-gray-600 font-medium">+1</span>
                    </div>

                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      className="w-full pl-3 pr-4 py-3 border border-gray-300 rounded-r-lg focus:ring-0 focus:outline-none "
                      placeholder="555 123 4567"
                      required
                    />
                  </div>
                </div>
              </div>

              <NavigationButtons
                onNext={() => handleSubmit(event)}
                onBack={goToPrevStep}
                canContinue={formData.phone.length > 8}
              />
              <p className="text-[10px] [@media(min-width:360px)]:text-[10px] text-gray-600 whitespace-nowrap">
                This is required to access main features, See{" "}
                <span className="underline" onClick={() => openHelpCenter("terms")}>Terms</span> and{" "}
                <span className="underline" onClick={() => openHelpCenter("privacy")}>Policy</span> for details.
              </p>

            </form>
          </div>
        );

      case "referral-code":
        return (
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <p className="text-gray-600 mt-2">Enter the referral code</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <input
                  type="text"
                  value={formData.referralCode}
                  onChange={(e) =>
                    handleInputChange("referralCode", e.target.value)
                  }
                  disabled={isLoading}
                  className={`w-full px-4 py-3 border text-gray-800 border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-center text-lg tracking-widest ${isLoading ? "bg-gray-100 cursor-not-allowed" : ""
                    }`}
                  placeholder="0000"
                  required
                />
                {referralError && (
                  <p className="mt-2 text-sm text-red-600 text-left">
                    {referralError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full border-2 py-4 px-6 rounded-full font-semibold transition-colors flex items-center justify-center gap-3 ${isLoading
                  ? "border-gray-200 text-gray-400 cursor-not-allowed bg-gray-100"
                  : "border-gray-300 text-gray-700 hover:border-gray-400"
                  }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
                    Verifying...
                  </>
                ) : (
                  "Continue"
                )}
              </button>
            </form>
          </div>
        );


      case "business-website":
        return (
          <div className="w-full max-w-md">
            <div className="text-left mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Business Website
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <div className="relative">
                  <Globe
                    className="absolute left-3 top-3 text-gray-400"
                    size={20}
                  />
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) =>
                      handleInputChange("website", e.target.value)
                    }
                    className={`w-full pl-12 pr-4 py-3 text-gray-800 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent ${websiteValidation.type === "error" && showWebsiteError
                      ? "border-red-300"
                      : websiteValidation.type === "success" &&
                        showWebsiteError
                        ? "border-green-300"
                        : "border-gray-300"
                      }`}
                    placeholder="https://yourbusiness.com"
                    required
                  />
                  {websiteValidation.type === "success" && showWebsiteError && (
                    <CheckCircle
                      className="absolute right-3 top-3 text-green-500"
                      size={20}
                    />
                  )}
                </div>
                <ValidationMessage
                  validation={websiteValidation}
                  show={showWebsiteError}
                />
              </div>

              <NavigationButtons
                onNext={handleSubmit}
                onBack={goToPrevStep}
                canContinue={websiteValidation.isValid}
              />
            </form>
          </div>
        );

      case "business-instagram":
        return (
          <div className="w-full max-w-md">
            <div className="text-left mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Business Instagram
              </h1>

            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <div className="relative">
                  <Instagram
                    className="absolute left-3 top-3 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    value={formData.instagram}
                    onChange={(e) =>
                      handleInputChange("instagram", e.target.value)
                    }
                    className="w-full pl-12 pr-4 py-3 text-gray-800 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="@yourbusiness"
                    required
                  />
                  {formData.instagramAccountId && (
                    <div className="absolute right-3 top-3">
                      <CheckCircle className="text-green-500" size={20} />
                    </div>
                  )}
                </div>
                {formData.instagramAccountId && (
                  <p className="mt-2 text-sm text-green-600">
                    ✓ Connected to Instagram
                  </p>
                )}
              </div>

              <NavigationButtons
                onNext={() => handleSubmit(event)}
                onBack={goToPrevStep}
                canContinue={formData.instagram.trim().length > 0}
              />
            </form>
          </div>
        );

      case "creative-domain":
        const domains = [
          { id: "photography", name: "Photographer", icon: Camera },
          { id: "videography", name: "Videographer", icon: Camera },
          { id: "florist", name: "Florist", icon: User },
          { id: "planner", name: "Planner", icon: User },
        ];

        const selectedCount = formData.creativeDomain.length;

        return (
          <div className="w-full max-w-md">
            <div className="text-left mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Creative Domain
              </h1>
            </div>

            <div className="gap-3 grid grid-cols-2 mb-8">
              {domains.map((domain) => {
                const isSelected = formData.creativeDomain.includes(domain.id);
                const isDisabled = !isSelected && selectedCount >= 2;

                return (
                  <button
                    key={domain.id}
                    onClick={() => handleDomainSelection(domain.id)}
                    disabled={isDisabled}
                    className={`w-full p-4 rounded-full border-2 transition-colors flex flex-col items-center gap-2 ${isSelected
                      ? "border-black bg-black text-white"
                      : isDisabled
                        ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "border-gray-300 hover:border-gray-400 text-gray-700"
                      }`}
                  >
                    <span className="font-medium text-sm">{domain.name}</span>
                  </button>
                );
              })}
            </div>

            <NavigationButtons
              onNext={() => handleSubmit(event)}
              onBack={goToPrevStep}
              canContinue={formData.creativeDomain.length > 0}
            />
          </div>
        );

      case "reset-password":
        return (
          <div className="w-full max-w-md flex flex-col items-center justify-between min-h-[90dvh]">
            <div className="my-3"></div>
            <div className="w-full mt-12">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                  Reset Password
                </h1>
                <p className="text-gray-600 mt-2">
                  Enter your email address and we'll send you a link to reset
                  your password
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={formData.resetEmail || ""}
                      onChange={(e) =>
                        handleInputChange("resetEmail", e.target.value)
                      }
                      disabled={isLoading}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent ${isLoading
                        ? "bg-gray-100 cursor-not-allowed"
                        : "border-gray-300"
                        }`}
                      placeholder="your@business.com"
                      required
                    />
                    <Mail
                      className="absolute right-3 top-3 text-gray-400"
                      size={20}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    type="submit"
                    disabled={isLoading || !formData.resetEmail}
                    className={`w-full py-4 px-6 rounded-full font-semibold transition-colors ${isLoading || !formData.resetEmail
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-black text-white hover:bg-gray-800"
                      }`}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Sending Reset Link...
                      </div>
                    ) : (
                      "Send Reset Link"
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep("email-login");
                    }}
                    className="w-full py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            </div>

            <div className="text-center mx-4">
              <p className="mt-3 text-[12px] text-gray-600">
                Remember your password?
                <button
                  onClick={() => {
                    setCurrentStep("email-login");
                    router.push(
                      "/login?flow=creative&step=login-choice&mode=login"
                    );
                  }}
                  className="text-blue-600 hover:text-blue-800 ml-1"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

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

      <LoadingFallback />
      <LoadingOverlay />

      {!initializing && (
        <AuthLayout
          showLogout={
            ![
              "landing",
              "login-choice",
              "email-login",
              "email-choice",
              "reset-password",
              "email-verification",
            ].includes(currentStep)
          }
        >
          {renderStepContent()}
        </AuthLayout>
      )}
    </>
  );
};

export default page;
