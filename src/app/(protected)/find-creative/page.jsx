"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Send, Edit3 } from "lucide-react";
import {
  checkUserCompletedInquiries,
  createCreativeInquiry,
} from "../../../../action";

const FindCreativePage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    creativeDomain: [],
    selectedService: "",
    proposalCount: 5,
  });
  const [showMinimumModal, setShowMinimumModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showReturningUserModal, setShowReturningUserModal] = useState(false);
  const [viewportHeight, setViewportHeight] = useState("100vh");
  const [isCreatingInquiry, setIsCreatingInquiry] = useState(false);

  const domains = [
    { id: "photography", name: "Photographer" },
    { id: "videography", name: "Videographer" },
    { id: "florist", name: "Florist" },
    { id: "planner", name: "Planner" },
  ];

  useEffect(() => {
    const checkCompletedInquiries = async () => {
      try {
        const response = await checkUserCompletedInquiries();

        // Fix: Access the nested data structure correctly
        const responseData = response.data?.data || response.data;

        if (response.success && responseData.hasCompletedInquiry) {
          setShowReturningUserModal(true);
          // Store the latest inquiry info for potential continuation
          sessionStorage.setItem(
            "latestCompletedInquiry",
            JSON.stringify(responseData.latestInquiry)
          );
        }
      } catch (error) {
        console.error("Error checking completed inquiries:", error);
        // Fail silently - don't prevent the user from using the page
      }
    };

    checkCompletedInquiries();
  }, []);

  const serviceOptions = {
    photography: [
      "photographer for my wedding",
      "photographer for my engagement",
      "photographer for my elopement",
      "photographer for my engagement and wedding",
      "photographer for my multi-day wedding",
    ],
    videography: [
      "videographer for my wedding",
      "videographer for my engagement",
      "videographer for my elopement",
      "videographer for my engagement and wedding",
      "videographer for my multi-day wedding",
    ],
    florist: [
      "florist for my wedding",
      "florist for my elopement",
      "florist for my multi-day wedding",
    ],
    planner: [
      "planner for my wedding",
      "planner for my elopement",
      "planner for my multi-day wedding",
    ],
  };

  const proposalOptions = [
    { count: 5, price: 8 },
    { count: 15, price: 17 },
    { count: 25, price: 28 },
  ];

  // Fixed viewport height calculation
  useEffect(() => {
    const setVH = () => {
      const height = window.visualViewport
        ? window.visualViewport.height
        : window.innerHeight;
      const vh = height * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
      setViewportHeight(`${height}px`);
    };

    setVH();

    window.addEventListener("resize", setVH);
    window.addEventListener("orientationchange", () => {
      setTimeout(setVH, 100);
    });

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", setVH);
    }

    return () => {
      window.removeEventListener("resize", setVH);
      window.removeEventListener("orientationchange", setVH);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", setVH);
      }
    };
  }, []);

  // Load saved form data on mount
  useEffect(() => {
    const savedFormData = sessionStorage.getItem("findCreativeFormData");
    if (savedFormData) {
      try {
        const parsedFormData = JSON.parse(savedFormData);
        setFormData(parsedFormData);
      } catch (error) {
        console.error("Error parsing saved form data:", error);
      }
    }
  }, []);

  // Save form data when it changes
  useEffect(() => {
    sessionStorage.setItem("findCreativeFormData", JSON.stringify(formData));
  }, [formData]);

  const handleDomainSelection = (domainId) => {
    setFormData((prev) => ({
      ...prev,
      creativeDomain: [domainId],
      selectedService: "",
    }));
  };

  const handleServiceSelection = (service) => {
    setFormData((prev) => ({ ...prev, selectedService: service }));
    setShowMinimumModal(true);
  };

  const proceedFromMinimum = () => {
    setShowMinimumModal(false);
    setShowPricingModal(true);
  };

  // const proceedToChatPage = () => {
  //   setShowPricingModal(false);

  //   // Check if we're switching to a different creative/service combination
  //   const savedChatData = sessionStorage.getItem("findCreativeChatData");
  //   let shouldClearChat = false;

  //   if (savedChatData) {
  //     try {
  //       const parsedChatData = JSON.parse(savedChatData);
  //       if (
  //         parsedChatData.creativeDomain !== formData.creativeDomain[0] ||
  //         parsedChatData.selectedService !== formData.selectedService
  //       ) {
  //         shouldClearChat = true;
  //       }
  //     } catch (error) {
  //       shouldClearChat = true;
  //     }
  //   }

  //   // Clear chat data if switching creative/service
  //   if (shouldClearChat) {
  //     sessionStorage.removeItem("findCreativeChatData");
  //   }

  //   // Save current selection for chat page
  //   sessionStorage.setItem(
  //     "findCreativeSelectionForChat",
  //     JSON.stringify({
  //       creativeDomain: formData.creativeDomain,
  //       selectedService: formData.selectedService,
  //       proposalCount: formData.proposalCount,
  //       timestamp: Date.now(),
  //     })
  //   );

  //   // Navigate to chat page
  //   router.push("/find-creative/chat");
  // };

  // Handle modal backdrop clicks

  // 1. Update the proceedToPayment function in FindCreativePage

  const proceedToPayment = async () => {
    if (isCreatingInquiry) return; // Prevent double-clicking

    setIsCreatingInquiry(true);

    try {
      // Step 1: Create initial inquiry with basic info only
      const inquiryData = {
        creativeDomain: formData.creativeDomain[0],
        selectedService: formData.selectedService,
        proposalCount: formData.proposalCount,
      };

      console.log("Sending inquiry data:", inquiryData);

      const inquiryResponse = await createCreativeInquiry(inquiryData);

      const { inquiryId, checkoutUrl } = inquiryResponse.data.data;
      console.log("Received response:", { inquiryId, checkoutUrl });

      // Save inquiry ID and selection data for after payment
      sessionStorage.setItem("currentInquiryId", inquiryId);
      sessionStorage.setItem(
        "findCreativeSelectionForChat",
        JSON.stringify({
          creativeDomain: formData.creativeDomain,
          selectedService: formData.selectedService,
          proposalCount: formData.proposalCount,
          inquiryId: inquiryId,
          timestamp: Date.now(),
        })
      );

      // Clear current form data since we're moving to payment
      sessionStorage.removeItem("findCreativeFormData");

      // Redirect to Stripe checkout
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Error proceeding to payment:", error);
      alert(
        error.message ||
          "Sorry, there was an error processing your request. Please try again."
      );
    } finally {
      setIsCreatingInquiry(false);
    }
  };

  const handleModalBackdropClick = (e, modalType) => {
    if (e.target === e.currentTarget) {
      if (modalType === "minimum") {
        setShowMinimumModal(false);
      } else if (modalType === "pricing") {
        setShowPricingModal(false);
      }
    }
  };

  const renderCreativeDomainStep = () => {
    const selectedCount = formData.creativeDomain.length;

    return (
      <div
        className="bg-white flex flex-col"
        style={{
          height: `calc(${viewportHeight} - 120px)`,
          maxHeight: `calc(${viewportHeight} - 120px)`,
          position: "fixed",
          top: "120px",
          left: 0,
          right: 0,
          bottom: 0,
          overflow: "hidden",
        }}
      >
        <div className="flex-1 flex flex-col justify-start px-4 pt-12 pb-4 min-h-0 overflow-hidden">
          <div className="text-center mb-8 flex-shrink-0">
            <h1 className="text-xl font-bold text-gray-900 leading-tight">
              Which wedding creative do you need?
            </h1>
          </div>

          <div className="gap-3 grid grid-cols-2 mb-8 max-w-sm mx-auto flex-shrink-0">
            {domains.map((domain) => {
              const isSelected = formData.creativeDomain.includes(domain.id);

              return (
                <button
                  key={domain.id}
                  onClick={() => handleDomainSelection(domain.id)}
                  className={`w-full py-2 px-5 rounded-full border-2 transition-colors flex items-center justify-center min-h-[40px] ${
                    isSelected
                      ? "border-black bg-black text-white"
                      : "border-gray-300 hover:border-gray-400 text-gray-700"
                  }`}
                >
                  <span className="font-medium text-sm text-center leading-tight">
                    {domain.name}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedCount === 0 && (
            <div className="text-black text-center px-4 flex-shrink-0">
              CUNO COVO is currently available to US based weddings, engagements
              and elopements
            </div>
          )}

          {selectedCount > 0 && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="mb-4 flex-shrink-0">
                <h3 className="text-lg font-medium text-gray-900 mb-4 text-left">
                  What specifically are you looking for?
                </h3>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
                <div className="space-y-0">
                  {formData.creativeDomain.map((domain) =>
                    serviceOptions[domain]?.map((option, index) => (
                      <button
                        key={`${domain}-${index}`}
                        onClick={() => handleServiceSelection(option)}
                        className={`w-full text-left p-3 py-1 text-gray-600 hover:text-black hover:bg-gray-50 rounded transition-colors text-sm ${
                          formData.selectedService === option
                            ? "font-bold text-black"
                            : ""
                        }`}
                      >
                        {option}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Replace the existing ReturningUserModal component with this enhanced version:

  const ReturningUserModal = () => {
    const [isCheckingCompletion, setIsCheckingCompletion] = useState(true);
    const [isProcessCompleted, setIsProcessCompleted] = useState(false);

    useEffect(() => {
      // Check if the user has completed the entire chat process
      const checkProcessCompletion = () => {
        try {
          const chatMessages = sessionStorage.getItem("chatMessages");
          const chatStep = sessionStorage.getItem("chatCurrentStep");
          const hasCompletedProcess = sessionStorage.getItem(
            "hasCompletedCreativeProcess"
          );

          if (chatMessages && chatStep) {
            const messages = JSON.parse(chatMessages);
            const isCompleted =
              chatStep === "complete" || hasCompletedProcess === "true";
            setIsProcessCompleted(isCompleted);
          }
        } catch (error) {
          console.error("Error checking process completion:", error);
          setIsProcessCompleted(false);
        } finally {
          setIsCheckingCompletion(false);
        }
      };

      checkProcessCompletion();
    }, []);

    const handleContinue = () => {
      setShowReturningUserModal(false);

      // Get the latest completed inquiry from session storage
      const latestInquiry = JSON.parse(
        sessionStorage.getItem("latestCompletedInquiry") || "{}"
      );

      // Navigate to chat page with the inquiry ID
      if (latestInquiry.id) {
        sessionStorage.setItem("currentInquiryId", latestInquiry.id);
        // Set a flag to indicate this is a returning user continuing
        sessionStorage.setItem("isReturningUserContinuing", "true");
        router.push("/find-creative/chat");
      } else {
        // Fallback: if no inquiry ID found, navigate to chat anyway
        router.push("/find-creative/chat");
      }
    };

    const handleStartOver = async () => {
      setShowReturningUserModal(false);

      try {
        // Clear ALL session data
        sessionStorage.removeItem("hasCompletedCreativeProcess");
        sessionStorage.removeItem("currentInquiryId");
        sessionStorage.removeItem("findCreativeFormData");
        sessionStorage.removeItem("findCreativeSelectionForChat");
        sessionStorage.removeItem("latestCompletedInquiry");
        sessionStorage.removeItem("isReturningUserContinuing");
        sessionStorage.removeItem("chatMessages");
        sessionStorage.removeItem("chatCurrentStep");

        // Reset form data to initial state
        setFormData({
          creativeDomain: [],
          selectedService: "",
          proposalCount: 5,
        });

        // Show success message
        if (typeof window !== "undefined" && window.showToast) {
          window.showToast(
            "Starting fresh! Please select your creative type.",
            "success"
          );
        }
      } catch (error) {
        console.error("Error starting over:", error);
        if (typeof window !== "undefined" && window.showToast) {
          window.showToast("There was an error. Please try again.", "error");
        }
      }
    };

    if (isProcessCompleted) return;

    if (isCheckingCompletion) {
      return (
        <div className="fixed inset-0 bg-[#0000006c] bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mx-auto mb-3"></div>
              <p className="text-sm text-gray-600">Checking your progress...</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 bg-[#0000006c] bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-4">
          <h2 className="text-lg font-bold mb-4 text-center">Welcome Back!</h2>

          <>
            <p className="text-gray-700 mb-6 text-sm text-center">
              You've started the creative finding process but haven't completed
              it yet. Would you like to continue where you left off or start
              over?
            </p>
            <div className="space-y-3">
              <button
                onClick={handleContinue}
                className="w-full border border-black text-black p-3 rounded-full hover:border-gray-800 transition-colors text-sm font-medium"
              >
                Continue
              </button>
              <button
                onClick={handleStartOver}
                className="w-full border border-gray-300 text-gray-700 p-3 rounded-full hover:border-gray-400 transition-colors text-sm font-medium"
              >
                Start Over
              </button>
            </div>
          </>
        </div>
      </div>
    );
  };

  // Minimum Modal Component
  const MinimumModal = () => {
    return (
      <div
        className="fixed inset-0 bg-[#0000006c] bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={(e) => handleModalBackdropClick(e, "minimum")}
      >
        <div className="bg-white rounded-lg p-6 py-3 w-full max-w-sm mx-4 max-h-[85vh] overflow-y-auto scrollbar-hide">
          <div className="text-sm text-gray-700 space-y-2">
            <p className="leading-relaxed">
              CUNO COVO caters to Creatives ranging from seasoned to
              up-and-coming, so we don't process inquiries below these minimum
              amounts:
            </p>

            <div>
              <p className="font-semibold mb-2">
                For Photographer & Videographer:
              </p>
              <ul className="ml-4 space-y-1 text-xs">
                <li>Engagement &lt; $500</li>
                <li>Elopement &lt; $1,500</li>
                <li>Wedding &lt; $3500</li>
                <li>Engagement & wedding &lt; $4000</li>
                <li>Multi-day weddings &lt; $4,500</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold mb-2">For Florist & Planner:</p>
              <p className="text-xs italic mb-1">(your overall event budget)</p>
              <ul className="ml-4 space-y-1 text-xs">
                <li>Elopements &lt; $8k</li>
                <li>Wedding &lt; $40k</li>
                <li>Multi-day weddings &lt; $50k</li>
              </ul>
            </div>

            <p className="text-xs italic leading-relaxed">
              These amounts are not guaranteed to land you a Creative; it's a
              minimum requirement to make an inquiry.
            </p>
          </div>

          <button
            onClick={proceedFromMinimum}
            className="w-full border border-black text-black p-3 rounded-full hover:border-gray-800 transition-colors text-sm font-medium mt-4"
          >
            I Understand, Continue
          </button>
        </div>
      </div>
    );
  };

  // Pricing Modal Component
  const PricingModal = () => {
    return (
      <div
        className="fixed inset-0 bg-[#0000006c] bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={(e) => handleModalBackdropClick(e, "pricing")}
      >
        <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-4 max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-lg text-center font-bold w-full">Pricing</h2>
          </div>

          <div className="mb-6">
            <p className="text-gray-700 mb-4 text-sm leading-relaxed">
              How many proposals from creatives would you like to review?
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <select
                  value={formData.proposalCount}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      proposalCount: parseInt(e.target.value),
                    }))
                  }
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black text-sm"
                >
                  {proposalOptions.map((option) => (
                    <option key={option.count} value={option.count}>
                      {option.count} creatives
                    </option>
                  ))}
                </select>

                <span className="text-lg font-bold text-black">=</span>

                <div className="flex-1 text-center">
                  <span className="text-lg font-bold text-black">
                    $
                    {
                      proposalOptions.find(
                        (opt) => opt.count === formData.proposalCount
                      )?.price
                    }{" "}
                    <span className="text-sm">one time</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={proceedToPayment}
            className="w-full border border-black text-black p-3 rounded-full hover:border-gray-800 transition-colors text-sm font-medium"
          >
            Continue to Chat
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      className="bg-white"
      style={{
        height: viewportHeight,
        maxHeight: viewportHeight,
        overflow: "hidden",
        position: "fixed",
        top: "120px",
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {renderCreativeDomainStep()}
      {showReturningUserModal && <ReturningUserModal />}
      {showMinimumModal && <MinimumModal />}
      {showPricingModal && <PricingModal />}
    </div>
  );
};

export default FindCreativePage;
