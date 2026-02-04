"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  ChevronRight,
  Camera,
  Globe,
  Instagram,
  Mail,
  User,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  checkUserStatus,
  completeProfile,
  forgotPassword,
  getOnboardingProgress,
  handleGoogleToken,
  register,
  storePhoneNumber,
  updateOnboardingProgress,
  verifyReferralCode,
  sendVerificationEmail,
  resendVerificationEmail,
  checkEmailVerificationStatus,
} from "../../../action";
import useUserStore from "@/store/userStore";
import { toast, Toaster } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import {
  loadFromStorage,
  STORAGE_KEYS,
  saveToStorage,
} from "../../utils/saveToLocal";
import AuthLayout from "./components/AuthLayout";
import useHelpCenterStore from "@/hooks/useHelpCenter";
import { useEmailValidation } from './hooks/useEmailValidation';
import { usePasswordValidation } from './hooks/usePasswordValidation';
import { useConfirmPasswordValidation } from './hooks/useConfirmPasswordValidation';
import { useWebsiteValidation } from './hooks/useWebsiteValidation';
import { useInstagramValidation } from './hooks/useInstagramValidation';
import NavigationButtons from './components/NavigationButtons';
import PasswordRequirements from './components/PasswordRequirements';
import LoadingOverlay from './components/LoadingOverlay';
import LoadingFallback from './components/LoadingFallback';
import TermsFooter from './components/TermsFooter';
import InputField from './components/InputField';


const page = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authMode = searchParams.get("mode") || "login";
  const [userType, setUserType] = useState("");
  const userTypeRef = useRef(userType);
  const { openHelpCenter } = useHelpCenterStore();
  const [currentStep, setCurrentStep] = useState(null); // start as null
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

  const [referralCompleted, setReferralCompleted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const { user, isAuthenticated, setUser } = useUserStore();;

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [referralError, setReferralError] = useState("");
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState(null);

  const [initializing, setInitializing] = useState(true);

  const referralTimeoutRef = useRef(null);

  const {
    emailValidation,
    showError: showEmailError,
    handleEmailChange,
    validateImmediately: validateEmailImmediately,
    resetValidation,
  } = useEmailValidation(authMode);

  const {
    websiteValidation,
    showError: showWebsiteError,
    handleWebsiteChange,
    validateImmediately: validateWebsiteImmediately,
    resetValidation: resetWebsiteValidation,
  } = useWebsiteValidation(formData.email || user?.email);

  const {
    instagramValidation,
    showError: showInstagramError,
    handleInstagramChange,
    validateImmediately: validateInstagramImmediately,
    resetValidation: resetInstagramValidation,
  } = useInstagramValidation();

  const {
    passwordValidation,
    showError: showPasswordError,
    handlePasswordChange,
    validateImmediately: validatePasswordImmediately,
    resetValidation: resetPasswordValidation,
  } = usePasswordValidation();

  const {
    confirmPasswordValidation,
    showError: showConfirmPasswordError,
    handleConfirmPasswordChange,
    validateImmediately: validateConfirmPasswordImmediately,
    resetValidation: resetConfirmPasswordValidation,
  } = useConfirmPasswordValidation();

  useEffect(() => {
    // Reset all validation states when auth mode changes
    resetValidation()
    resetWebsiteValidation();
    resetInstagramValidation();
    resetPasswordValidation();
    resetConfirmPasswordValidation();

  }, [authMode]);

  useEffect(() => {
    if (!isHydrated) return;

    const flow = searchParams.get("flow");
    const step = searchParams.get("step");
    const mode = searchParams.get("mode");

    // Only apply URL params if user is NOT authenticated
    // This prevents URL params from overriding server progress
    if (!isAuthenticated && flow === "creative" && step === "auth" && mode) {
      setUserType("creative");
      setCurrentStep("auth");
    }

  }, [isHydrated, searchParams, isAuthenticated]);

  useEffect(() => {
    const initializeOnboarding = async () => {
      let stepToSet = "auth"; // default fallback

      try {
        if (!isAuthenticated || !user) {
          stepToSet = loadFromStorage(STORAGE_KEYS.CURRENT_STEP, "auth");
        } else {
          if (user.userType === "couple") {
            router.push("/feed/couple");
            return;
          }

          const response = await getOnboardingProgress();
          if (response.success) {
            const { nextStep, user: serverUser, progress } = response.data;

            // update user
            if (serverUser?.personalReferralCode) {
              setUser((prev) => ({
                ...prev,
                referralCode: serverUser.personalReferralCode,
                points: serverUser.points || prev.points,
                rank: serverUser.rank || prev.rank,
              }));
            }

            // redirect if onboarding completed
            if (progress.onboardingCompleted) {
              const statusResponse = await checkUserStatus();
              if (statusResponse?.data?.status === "pending") {
                router.push("/waiting");
              } else if (user.userType === "creative") {
                router.push(user.isNewUser ? "/home" : "/feed/new");
              } else {
                router.push("/feed/new");
              }
              return;
            }

            // set step from server
            stepToSet = nextStep?.step || loadFromStorage(STORAGE_KEYS.CURRENT_STEP, "auth");

            // set form data
            setFormData((prev) => ({
              email: serverUser?.email || prev.email,
              password: prev.password,
              referralCode: progress.formData?.referralCode || prev.referralCode,
              businessName: serverUser?.profile?.businessName || "",
              website: progress.formData?.website || serverUser?.profile?.website || prev.website,
              instagram: progress.formData?.instagram || serverUser?.profile?.instagram || prev.instagram,
              creativeDomain: progress.formData?.creativeDomain || serverUser?.profile?.creativeDomains || prev.creativeDomain,
              phone: progress.formData?.phone || serverUser?.profile?.phone || prev.phone,
              otpCode: prev.otpCode,
            }));
          } else {
            stepToSet = loadFromStorage(STORAGE_KEYS.CURRENT_STEP, "auth");
          }
        }
      } catch (err) {
        console.error("Onboarding init failed:", err);
        stepToSet = loadFromStorage(STORAGE_KEYS.CURRENT_STEP, "auth");
      } finally {
        setCurrentStep(stepToSet);
        setIsHydrated(true);
        setInitializing(false);
        setLoadingMessage("");
      }
    };

    initializeOnboarding();
  }, [isAuthenticated, user?.id, router]);


  const handleOnboardingBack = () => {
    const currentIndex = steps.indexOf(currentStep);

    // Safety check
    if (currentIndex === -1) {
      router.push("/");
      return;
    }

    // If user is on first step (auth)
    if (currentIndex === 0) {
      router.push("/login");
      return;
    }

    // Move to previous step
    setCurrentStep(steps[currentIndex - 1]);
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

    const isAtEntryStep = currentStep === "auth";

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

    "auth", // Single auth step (login or signup)
    "email-verification",
    "phone-number",
    "referral-code",
    "business-website",
    "business-instagram",
    "creative-domain",
  ];

  const handleInputChange = (field, value) => {
    // Normalize referral code
    const normalizedValue =
      field === "referralCode" ? value.trim().toUpperCase() : value;

    // Always update state ONCE
    setFormData((prev) => ({
      ...prev,
      [field]:
        field === "phone" ? formatPhoneNumber(normalizedValue) : normalizedValue,
    }));

    // --------------------
    // Referral Code Logic
    // --------------------
    if (field === "referralCode") {
      const normalized = value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "") // allow only alphanumeric
        .slice(0, 6); // HARD LIMIT

      setFormData((prev) => ({
        ...prev,
        referralCode: normalized,
      }));

      setReferralError("");

      if (referralTimeoutRef.current) {
        clearTimeout(referralTimeoutRef.current);
      }

      if (normalized.length === 6) {
        referralTimeoutRef.current = setTimeout(async () => {
          try {
            await verifyReferralCode({ referralCode: normalized });
            setReferralError("");
          } catch {
            setReferralError("Invalid referral code");
          }
        }, 500);
      }

      return;
    }

    // --------------------
    // Password
    // --------------------
    if (field === "password") {
      if (authMode === "signup") {
        handlePasswordChange(value);

        if (formData.confirmPassword) {
          handleConfirmPasswordChange(value, formData.confirmPassword);
        }
      }
      return;
    }

    // --------------------
    // Confirm Password
    // --------------------
    if (field === "confirmPassword") {
      handleConfirmPasswordChange(formData.password, value);
      return;
    }

    // --------------------
    // Website
    // --------------------
    if (field === "website") {
      handleWebsiteChange(value);
      return;
    }

    // --------------------
    // Instagram
    // --------------------
    if (field === "instagram") {
      let cleanValue = value.startsWith("@")
        ? value.slice(1)
        : value;

      // also remove accidental @ anywhere
      cleanValue = cleanValue.replace(/@/g, "");

      setFormData((prev) => ({
        ...prev,
        instagram: cleanValue,
      }));
      handleInstagramChange(cleanValue);
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

    if (currentIndex <= 0) return;

    const prevStep = steps[currentIndex - 1];

    if (prevStep === "referral-code") {
      return;
    }


    setCurrentStep(prevStep);
  };



  const isBackAllowed = React.useMemo(() => {
    const currentIndex = steps.indexOf(currentStep);
    const result = currentIndex > 0 && !steps.slice(0, currentIndex).includes("referral-code");
    console.log(result)
    return result;
  }, [currentStep]);

  useEffect(() => {
    if (!currentStep) return;

    saveToStorage(STORAGE_KEYS.CURRENT_STEP, currentStep);
  }, [currentStep]);




  const handleSubmit = async (e) => {
    e.preventDefault();

    switch (currentStep) {
      case "auth":
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

            if (response.status === 429) {
              toast.error("Too many login/signup attempts. Please wait a few minutes and try again.");
            } else if (response.message.includes("already exists")) {
              toast.info("An account with this email already exists. Signing you in...");
            } else {
              toast.error("Invalid email or password. Please check your credentials.");
            }
            return;
          }

          const { accessToken, refreshToken, user } = response.data;

          console.log(user)

          setUser(user);

          if (typeof window !== "undefined" && accessToken && refreshToken) {
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", refreshToken);
            console.log(" Tokens stored in localStorage");
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
            "auth",
            {
              email: formData.email,
              userType: "creative",
            },
            "auth"
          );

          // Check user's current email verification status
          console.log(user)

          if (user && user.id) {
            console.log("user exists")

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

          console.log("Proceeding 1")

          // If we reach here, email is verified or verification check failed
          // Continue with onboarding flow based on user's profile completion status

          const userProfile = user.profile || {};

          // Check onboarding completion status
          if (user.profileCompleted || userProfile.onboardingCompleted) {
            // User has completed onboarding, redirect based on user type
            setLoadingMessage("Redirecting to your dashboard...");

            console.log("Proceeding 2")

            try {
              const statusResponse = await checkUserStatus();

              console.log("Status Response")

              // Redirect based on user type and status
              if (user.userType === "couple") {
                router.push("/feed/couple");
              }
              else if (user.userType === "creative") {

                console.log(statusResponse?.data)

                // Profile Completed + approved + non anonymous -> go to home page
                if (statusResponse?.data?.status === "approved" && statusResponse?.data?.isAnonymous === false) {
                  console.log("Redirected to home page")
                  router.push("/home"); // anonymous page
                }

                // Profile completed + pending → waiting page
                else if (statusResponse?.data?.status === "pending" &&
                  statusResponse?.data?.profileCompleted === true) {
                  router.push("/waiting");
                }

                // Profile completed + approved → feed
                else if (statusResponse?.data?.canAccess &&
                  statusResponse?.data?.profileCompleted === true) {
                  // Redirect creative users to /feed/new
                  router.push("/feed/new");
                }
              }
              else {
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

          console.log("Proceeding 3")


          console.log(user.phone)

          // User needs to complete onboarding - determine next step
          setLoadingMessage("Loading your progress...");

          try {
            const progressResponse = await getOnboardingProgress();

            if (progressResponse.success) {
              const { nextStep, progress, user: serverUser } = progressResponse.data;

              // Update form data from server
              setFormData((prev) => ({
                ...prev,
                email: serverUser?.email || prev.email,
                referralCode: progress.formData?.referralCode || prev.referralCode,
                website: progress.formData?.website || serverUser?.profile?.website || prev.website,
                instagram: progress.formData?.instagram || serverUser?.profile?.instagram || prev.instagram,
                creativeDomain: progress.formData?.creativeDomain || serverUser?.profile?.creativeDomains || prev.creativeDomain,
                phone: progress.formData?.phone || serverUser?.profile?.phone || prev.phone,
              }));

              // Update user state
              setUser((prev) => ({
                ...prev,
                ...serverUser,
              }));

              // Use server's next step
              const stepToGo = nextStep?.step || "phone-number";
              console.log("Resuming from server step:", stepToGo);
              setCurrentStep(stepToGo);
            } else {
              // Fallback if progress fetch fails
              setCurrentStep("phone-number");
            }
          } catch (progressError) {
            console.error("Failed to fetch progress:", progressError);
            setCurrentStep("phone-number");
          }


          setLoadingMessage("Finalizing your account...");

          try {
            const statusResponse = await checkUserStatus();
            console.log("Checking the status of user:")
            console.log(statusResponse)

            // Redirect based on user type and status
            if (user.userType === "couple") {
              router.push("/feed/couple");
            }
            else if (user.userType === "creative") {

              // Profile Completed + approved + non anonymous -> go to home page
              if (statusResponse?.data?.status === "approved" && statusResponse?.data?.isAnonymous === false) {
                router.push("/home"); // anonymous page
              }


              else if (statusResponse?.data?.status === "pending" && statusResponse?.data?.profileCompleted === true) {
                console.log("this block code executed")
                router.push("/waiting");
              }

              else {
                // Profile Completed + approved + non anonymous -> go to home page
                if (statusResponse?.data?.status === "approved" && statusResponse?.data?.isAnonymous === false) {
                  router.push("/home"); // anonymous page
                }

                if (statusResponse?.data?.status === "pending" && statusResponse?.data?.profileCompleted === true) {
                  console.log("Waiting page")
                  router.push("/waiting");
                }

                if (statusResponse?.data?.profileCompleted === true) {
                  router.push("/feed/new");
                }

              }
            }

            else {
              // Fallback
              if (statusResponse?.data?.status === "pending" && statusResponse?.data?.profileCompleted === true) {
                router.push("/waiting");
              } else {
                if (statusResponse?.data?.profileCompleted === true) {
                  console.log("we are here")
                  router.push("/feed/new");
                }

              }
            }
          } catch (statusError) {
            console.error("Status check failed:", statusError);
            router.push("/waiting");
          }
        } catch (error) {
          
          console.error("Authentication failed:", error);
          setLoadingMessage("");

          if (err.response?.status === 429) {
            // Handle rate limiting
            toast.error(
              "Too many login/signup attempts. Please wait a few minutes and try again."
            );
          }

          else if (error.message.includes("already exists")) {
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
        if (formData.instagram.trim() && instagramValidation.isValid) {
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

          //  CRITICAL: Add a small delay to ensure Zustand store persists
          // This gives the store time to save the state before navigation
          await new Promise((resolve) => setTimeout(resolve, 150));

          setLoadingMessage("Checking account status...");

          try {
            const statusResponse = await checkUserStatus();

            if (
              statusResponse.data &&
              statusResponse.data.status === "pending" &&
              statusResponse.data.isAnonymous === false
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

  // Add this function inside your component
  const PasswordToggleButton = ({ showPassword, setShowPassword, disabled }) => (
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="text-gray-500 hover:text-gray-700 focus:outline-none"
      disabled={disabled}
    >
      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
    </button>
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
          setCurrentStep("auth");
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



  const renderStepContent = () => {
    if (initializing) return null;

    switch (currentStep) {

      case "auth":
        return (
          <div className="w-full max-w-md flex flex-col items-center justify-between min-h-[88dvh]">
            <div className="my-3"></div>
            <div className="w-full mt-7">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <div className="relative">
                    <InputField
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        handleInputChange("email", e.target.value);
                      }}
                      onFocus={() => {
                        if (formData.email) {
                          handleEmailChange(formData.email);;
                        }
                      }}
                      disabled={isLoading}
                      placeholder="your@business.com"
                      label="Business Email"
                      required
                      validation={emailValidation}
                      showValidation={showEmailError}
                      className="mb-4"
                    />
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <InputField
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      onFocus={handlePasswordFieldFocus}
                      disabled={isLoading}
                      placeholder="Enter your password"
                      label="Password"
                      required
                      validation={passwordValidation}
                      showValidation={showPasswordError}
                      rightElement={
                        <PasswordToggleButton
                          showPassword={showPassword}
                          setShowPassword={setShowPassword}
                          disabled={isLoading}
                        />
                      }
                    />
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

                      <div className="relative mt-4">
                        <InputField
                          type={showPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={(e) =>
                            handleInputChange("confirmPassword", e.target.value)
                          }
                          disabled={isLoading}
                          placeholder="Confirm your password"
                          label="Confirm Password"
                          required
                          validation={confirmPasswordValidation}
                          showValidation={showConfirmPasswordError}
                          rightElement={
                            <PasswordToggleButton
                              showPassword={showPassword}
                              setShowPassword={setShowPassword}
                              disabled={isLoading}
                            />
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>

                <NavigationButtons
                  onNext={() => handleSubmit(event)}
                  onBack={goToPrevStep}
                  canContinue={
                    emailValidation.isValid &&
                    formData.password.trim().length > 0 && // Password must not be empty for both modes
                    (authMode === "signup"
                      ? passwordValidation.isValid && confirmPasswordValidation.isValid // Signup: strong password + match
                      : true // Login: just needs non-empty password
                    )
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
                    Sign in here
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

                    }

                    }
                  >
                    Sign up here
                  </span>
                </div>
              )}
            </div>
            <TermsFooter
              onTermsClick={() => openHelpCenter("terms")}
              onPolicyClick={() => openHelpCenter("privacy")}
            />
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
                    onClick={() => router.push("/feed")}
                    className="w-full text-gray-500 py-2 px-6 font-medium hover:text-gray-700 transition-colors"
                  >
                    Skip for now
                  </button>
                </div>
              </div>
            </div>
            <TermsFooter
              onTermsClick={() => openHelpCenter("terms")}
              onPolicyClick={() => openHelpCenter("privacy")}
            />
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

                      {/* <button
                        onClick={() => {
                          // Reset auth-related form state
                          setFormData(prev => ({
                            ...prev,
                            email: "",
                            password: "",
                            confirmPassword: "",
                          }));

                          resetValidation();

                          setEmailVerificationSent(false);
                          setVerificationStatus(null);
                          

                          // Push signup mode explicitly
                          router.push("/login?flow=creative&step=login-choice&mode=signup");

                          // Move back to auth step
                          setCurrentStep("auth");
                        }}
                        className="w-full py-2 text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        Change Email Address
                      </button> */}
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

                    <InputField
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="555 123 4567"
                      required
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <NavigationButtons
                onNext={() => handleSubmit(event)}
                onBack={goToPrevStep}
                canContinue={formData.phone.length > 8}
              />
              <TermsFooter
                onTermsClick={() => openHelpCenter("terms")}
                onPolicyClick={() => openHelpCenter("privacy")}
              />

            </form>
          </div>
        );

      case "referral-code":
        const isReferralDisabled = Boolean(formData.referralCode && referralCompleted);
        return (
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <p className="text-gray-600 mt-2">
                {isReferralDisabled
                  ? "Your referral code has been verified"
                  : "Enter the referral code"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <InputField
                  type="text"
                  value={formData.referralCode}
                  onChange={(e) => handleInputChange("referralCode", e.target.value)}
                  disabled={isLoading || isReferralDisabled}
                  placeholder="000000"
                  maxLength={6}
                  required
                  className={`text-center text-lg tracking-widest ${isReferralDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                />
                {referralError && (
                  <p className="mt-2 text-sm text-red-600 text-left">
                    {referralError}
                  </p>
                )}
                {/* Success indicator */}
                {isReferralDisabled && (
                  <div className="mt-2 flex items-center gap-2 text-green-600 text-sm justify-center">
                    <CheckCircle size={16} />
                    <span>Referral code verified</span>
                  </div>
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
                Continue
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
                  <InputField
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                    placeholder="https://yourbusiness.com"
                    required
                    validation={websiteValidation}
                    showValidation={showWebsiteError}
                    icon={<Globe size={20} />}
                  />
                </div>
              </div>

              <NavigationButtons
                onNext={handleSubmit}
                onBack={goToPrevStep}
                showBack={isBackAllowed} // compute dynamically
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
                  <InputField
                    type="text"
                    value={formData.instagram}
                    onChange={(e) => handleInputChange("instagram", e.target.value)}
                    placeholder="@yourbusiness"
                    required
                    validation={instagramValidation}
                    showValidation={showInstagramError}
                    icon={<Instagram size={20} />}
                  />
                </div>
              </div>

              <NavigationButtons
                onNext={() => handleSubmit(event)}
                onBack={goToPrevStep}
                canContinue={
                  instagramValidation.type === "success" &&
                  instagramValidation.isValid === true
                }
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
              </div>

              <form onSubmit={handleResetPassword} className="space-y-6">
                <div>
                  <div className="relative">
                    <InputField
                      type="email"
                      value={formData.resetEmail || ""}
                      onChange={(e) => handleInputChange("resetEmail", e.target.value)}
                      disabled={isLoading}
                      placeholder="your@business.com"
                      label="Email Address"
                      required
                      icon={<Mail size={20} />}
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
                      setCurrentStep("auth");
                    }}
                    className="w-full py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            </div>

            <div className="text-center mx-4">
              <p className="mt-3 text-center text-sm">
                Remember your password?{" "}
                <button
                  onClick={() => {
                    setCurrentStep("auth");
                    router.push(
                      "/login?flow=creative&step=login-choice&mode=login"
                    );
                  }}
                  className="font-semibold"
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

  const handlePasswordFieldFocus = () => {
    if (formData.email) {
      handleEmailChange(formData.email);
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

      <LoadingFallback initializing={initializing} />
      <LoadingOverlay isLoading={isLoading} initializing={initializing} />

      {!initializing && (
        <AuthLayout
          showLogout={
            ![
              "login-choice",
              "auth",
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
