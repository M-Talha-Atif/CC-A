"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Users,
  Mail,
  Plus,
  Send,
  X,
  LoaderIcon,
  ArrowLeft,
  FileText,
  Vote,
  Heart,
  MessageCircle,
  Bookmark,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createPost, getPost } from "../../../../../action";
import { toast, Toaster } from "sonner";
import { LinkifyText } from "../components/Post";
import useUserStore from "@/store/userStore";
import { motion, AnimatePresence } from "framer-motion";
import SendIcon from "../../../../components/icons/SendIcon";

const CreatePage = () => {
  const router = useRouter();
  const [quotedPost, setQuotedPost] = useState(null);
  const [isQuotePost, setIsQuotePost] = useState(false);
  const [loadingQuotedPost, setLoadingQuotedPost] = useState(false);

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [type, setType] = useState("text");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [loading, setLoading] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // iOS-safe refs
  const textareaRef = useRef(null);
  const textareaSubjectRef = useRef(null);
  const lastHeightRef = useRef({});
  const isUpdatingRef = useRef(false);
  const dropdownRef = useRef(null);
  const popstateHandlerRef = useRef(null);
  const isIOSRef = useRef(false);
  const hasUnsavedContentRef = useRef(false);

  const { isAuthenticated, hasHydrated } = useUserStore();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.body.style.height = "100%";

    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.height = "";
    };
  }, []);

  // Authentication check - add this at the very beginning
  useEffect(() => {
    // Wait for store hydration
    if (!hasHydrated) return;

    // If user is not authenticated, redirect to login
    if (!isAuthenticated) {
      router.replace("/login?flow=creative&step=login-choice&mode=login");
      return;
    }
  }, [isAuthenticated, hasHydrated, router]);

  // Show loading while hydrating or if not authenticated
  if (!hasHydrated || !isAuthenticated) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Detect iOS
  useEffect(() => {
    isIOSRef.current =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }, []);

  // // iOS-safe height update function
  // const updateTextareaHeight = useCallback((textarea, maxHeight) => {
  //   if (!textarea || isUpdatingRef.current) return;

  //   const key = textarea === textareaRef.current ? "content" : "subject";

  //   try {
  //     isUpdatingRef.current = true;

  //     // Only update if height actually changed
  //     const currentScrollHeight = textarea.scrollHeight;
  //     const newHeight = Math.min(currentScrollHeight, maxHeight);

  //     if (lastHeightRef.current[key] !== newHeight) {
  //       textarea.style.height = `${newHeight}px`;
  //       lastHeightRef.current[key] = newHeight;
  //     }
  //   } catch (error) {
  //     console.warn("Textarea resize failed:", error);
  //   } finally {
  //     isUpdatingRef.current = false;
  //   }
  // }, []);

  // // iOS-safe content change handler
  const handleContentChange = useCallback(
    (e) => {
      const text = e.target.value;
      if (text.length <= 500) {
        setContent(text);

        // Immediately update height for content textarea
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
          const maxHeight = type === "poll" ? 200 : 500;
          textareaRef.current.style.height =
            Math.min(textareaRef.current.scrollHeight, maxHeight) + "px";
        }
      }
    },
    [type]
  );

  const subjectTimeoutRef = useRef(null);

  useEffect(() => {
    const textarea = textareaSubjectRef.current;
    if (!textarea) return;

    // Debounce the height adjustment
    if (subjectTimeoutRef.current) {
      clearTimeout(subjectTimeoutRef.current);
    }

    subjectTimeoutRef.current = setTimeout(() => {
      requestAnimationFrame(() => {
        textarea.style.height = 'auto';
        const newHeight = Math.min(textarea.scrollHeight, 120);
        textarea.style.height = newHeight + 'px';
        textarea.style.overflowY = newHeight >= 120 ? 'auto' : 'hidden';
      });
    }, 90); // Increased debounce time

    return () => {
      if (subjectTimeoutRef.current) {
        clearTimeout(subjectTimeoutRef.current);
      }
    };
  }, [subject]);

  // Update the handleSubjectChange to include debouncing
  const subjectToastTimeoutRef = useRef(null);

  const handleSubjectChange = useCallback((e) => {
    try {
      const text = e.target.value;

      if (text.length > 150) {
        return;
      }

      if (containsUrl(text)) {
        // Debounce the toast message
        if (subjectToastTimeoutRef.current) {
          clearTimeout(subjectToastTimeoutRef.current);
        }

        subjectToastTimeoutRef.current = setTimeout(() => {
          toast.error(
            "Links are not allowed in the subject. Only text and emoji are permitted.",
            { duration: 2000 }
          );
        }, 500);

        return;
      }

      setSubject(text);
    } catch (error) {
      console.error('Subject change error:', error);
    }
  }, []);



  useEffect(() => {
    if (type === "poll") {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        const textareas = document.querySelectorAll(
          'textarea[placeholder*="Option"]'
        );
        textareas.forEach((textarea) => {
          if (textarea.value) {
            textarea.style.height = "auto";
            textarea.style.height = Math.min(textarea.scrollHeight, 80) + "px";
          }
        });
      }, 100);
    }
  }, [pollOptions, type]);

  // Effect to handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
    };

    if (showCategoryDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showCategoryDropdown]);

  // Effect to handle body scroll when category dropdown is open
  useEffect(() => {
    if (showCategoryDropdown) {
      const scrollY = window.scrollY;

      if (isIOSRef.current) {
        document.body.style.position = "fixed";
        document.body.style.top = `-${scrollY}px`;
        document.body.style.left = "0";
        document.body.style.right = "0";
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "hidden";
        document.body.style.position = "fixed";
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = "100%";
      }
    } else {
      const scrollY = document.body.style.top;
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";

      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";
    };
  }, [showCategoryDropdown]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const quoteId = urlParams.get("quote");

    if (quoteId) {
      fetchPostForQuote(quoteId);
    }
  }, []);

  const fetchPostForQuote = async (postId) => {
    try {
      setLoadingQuotedPost(true);
      const postData = await getPost(postId);
      setQuotedPost(postData.post);
      setIsQuotePost(true);
    } catch (error) {
      console.error("Error fetching quoted post:", error);
      toast.error("Failed to load quoted post");
    } finally {
      setLoadingQuotedPost(false);
    }
  };

  const vendorCategories = [
    "Photographer",
    "Videographer",
    "Florist",
    "Planner",
    "Couples",
  ];

  const hasUnsavedContent = () => {
    return (
      subject.trim() !== "" ||
      content.trim() !== "" ||
      selectedCategories.length > 0 ||
      isQuotePost ||
      (type === "poll" && pollOptions.some((option) => option.trim() !== ""))
    );
  };



  // Update the ref when content changes, but don't trigger effects
  useEffect(() => {
    hasUnsavedContentRef.current = hasUnsavedContent();
  }, [subject, content, selectedCategories, type, pollOptions]);

  // Effect to handle body scroll when modal is open
  useEffect(() => {
    if (showExitConfirm) {
      const scrollY = window.scrollY;

      if (isIOSRef.current) {
        document.body.style.position = "fixed";
        document.body.style.top = `-${scrollY}px`;
        document.body.style.left = "0";
        document.body.style.right = "0";
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "hidden";
        document.body.style.position = "fixed";
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = "100%";
      }
    } else {
      const scrollY = document.body.style.top;
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";

      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";
    };
  }, [showExitConfirm]);

  // Override browser back button and layout back button
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedContentRef.current) {  // Use ref instead of function call
        e.preventDefault();
        e.returnValue = "";
      }
    };

    const handlePopState = (e) => {
      if (hasUnsavedContentRef.current) {  // Use ref instead of function call
        e.preventDefault();
        setShowExitConfirm(true);
        try {
          window.history.pushState(null, "", window.location.href);
        } catch (error) {
          console.warn("History manipulation failed:", error);
        }
      }
    };

    popstateHandlerRef.current = handlePopState;
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    // Only push state once on mount
    try {
      window.history.pushState(null, "", window.location.href);
    } catch (error) {
      console.warn("Initial history push failed:", error);
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []); // Empty dependency array - only runs once

  const handleBackClick = () => {
    if (hasUnsavedContentRef.current) {
      setShowExitConfirm(true);
    } else {
      handleSmoothExit();
    }
  };


  const handleSmoothExit = () => {
    setIsExiting(true);
    // Wait for animation to complete before navigating
    setTimeout(() => {
      router.push("/feed/new");
    }, 300);
  };

  useEffect(() => {
    window.handleCreatePageBack = () => {
      if (hasUnsavedContentRef.current) {
        setShowExitConfirm(true);
      } else {
        handleSmoothExit();
      }
    };

    return () => {
      delete window.handleCreatePageBack;
    };
  }, []); // Changed to empty array!

  const handleConfirmExit = () => {
    setShowExitConfirm(false);
    if (popstateHandlerRef.current) {
      window.removeEventListener("popstate", popstateHandlerRef.current);
    }
    handleSmoothExit();
  };

  const handleCancelExit = () => {
    setShowExitConfirm(false);
  };

  const addCategory = (category) => {
    if (!selectedCategories.includes(category)) {
      setSelectedCategories([...selectedCategories, category]);
    }
    setShowCategoryDropdown(false);
  };

  const removeCategory = (categoryToRemove) => {
    setSelectedCategories(
      selectedCategories.filter((cat) => cat !== categoryToRemove)
    );
  };







  const handlePollOptionChange = (value, index) => {
    // console.log("handlePollOptionChange called with:", JSON.stringify(value));

    // keep the newline EXACTLY as it comes from onChange
    let total = value.replace(/\n/g, "");

    // hard limit total characters
    total = total.slice(0, 50);

    // split exactly into 26 + 26
    const first = total.slice(0, 25);
    const second = total.slice(25);

    const final = second ? `${first}\n${second}` : first;

    const updated = [...pollOptions];
    updated[index] = final;
    setPollOptions(updated);

    // let lines = value.split("\n");
    // console.log("Initial lines count:", lines.length, lines);

    // lines = lines.slice(0, 2).filter(line => line.length > 0);
    // console.log("After filtering:", lines.length, lines);

    // const formattedValue = lines.join("\n");
    // console.log("Final formatted value:", JSON.stringify(formattedValue));

    // const updated = [...pollOptions];
    // updated[index] = formattedValue;
    // // console.log("Updated pollOptions:", updated);

    // setPollOptions(updated);
  };


  const addPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, ""]);
    }
  };

  const removePollOption = (index) => {
    setPollOptions(pollOptions.filter((_, i) => i !== index));
  };

  const containsUrl = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[^\s]+\.[a-z]{2,})/i;
    return urlRegex.test(text);
  };

  const handleAvatarClick = () => {
    if (isCouplesSelected) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(["Couples"]);
    }
    setShowCategoryDropdown(false);
    setType("text");
  };

  const isCouplesSelected = selectedCategories.includes("Couples");

  const handleSubmit = async () => {
    try {
      setLoading(true);

      if (subject.trim() === "") {
        toast.error("Subject is required.");
        setLoading(false);
        return;
      }
      if (content.trim() === "") {
        toast.error("Need to input body text");
        setLoading(false);
        return;
      }

      if (selectedCategories.length < 0) {
        toast.error("Creative is required");
        setLoading(false);
        return;
      }

      if (containsUrl(subject)) {
        toast.error("Links are not allowed in the subject.");
        setLoading(false);
        return;
      }

      const payload = {
        subject,
        content,
        categories: selectedCategories,
        type,
      };

      if (isQuotePost && quotedPost) {
        payload.quotedPostId = quotedPost.id;
      }

      if (type === "poll") {
        const nonEmptyOptions = pollOptions.filter((opt) => opt.trim() !== "");
        if (nonEmptyOptions.length < 2) {
          toast.error("A poll requires at least two options.");
          setLoading(false);
          return;
        }
        payload.pollOptions = nonEmptyOptions;
      }

      const result = await createPost(payload);

      if (result.success) {
        delete window.handleCreatePageBack;
        toast.success("Post created successfully!");
        router.push("/feed");
      } else {
        // Handle rate limit error specifically
        if (result.error.status === 429) {
          toast.error(
            result.error.message ||
            "You have hit the limit allowed for this hour. Please try again later",
            {
              duration: 5000,
            }
          );
        } else {
          toast.error(result.error.message);
        }
      }
    } catch (error) {
      console.error("Unexpected error creating post:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const QuotedPostLoadingSkeleton = () => {
    return (
      <div className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50 animate-pulse">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-4 w-8 bg-gray-300 rounded"></div>
          <div className="h-4 w-32 bg-gray-300 rounded"></div>
        </div>

        <div className="h-4 w-3/4 bg-gray-300 rounded mb-3"></div>

        <div className="space-y-2 mb-3">
          <div className="h-4 w-full bg-gray-300 rounded"></div>
          <div className="h-4 w-5/6 bg-gray-300 rounded"></div>
        </div>

        <div className="flex justify-between">
          <div className="flex gap-4">
            <div className="h-4 w-12 bg-gray-300 rounded"></div>
            <div className="h-4 w-12 bg-gray-300 rounded"></div>
            <div className="h-4 w-12 bg-gray-300 rounded"></div>
          </div>
          <div className="h-4 w-24 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  };

  const QuotedPostPreview = ({ isLoading, post }) => {
    if (isLoading) return <QuotedPostLoadingSkeleton />;
    if (!post) return null;

    return (
      <div className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50 w-full">
        <div className="flex gap-2  text-[16px] text-gray-600 break-words max-w-[95%]">
          <span className="break-words w-full">{post.subject}</span>
        </div>
        <div className="flex items-center gap-1 mb-4  text-gray-600 flex-wrap">
          <span className="">cc:</span>
          {post.categories.map((category, i) => (
            <span
              key={i}
              className="border border-gray-600 px-2  rounded-full whitespace-nowrap"
              style={{
                fontSize: "12px",
              }}
            >
              {category}
            </span>
          ))}
        </div>

        <LinkifyText onContentClick={() => { }} text={post.content} />
        {post.type === "poll" && post.pollOptions && (
          <div className="sm:p-4 rounded-lg mt-3">
            {post.pollOptions.map((option, index) => {
              return (
                <div
                  key={index}
                  className="w-full flex items-center justify-between mb-2 cursor-not-allowed"
                >
                  <div className="flex-1 flex justify-center">

                    <span
                      className={`text-sm text-gray-700 py-1 px-3 w-[200px] text-center rounded-full ease-in-out transition-all break-words whitespace-normal min-h-[32px] flex items-center justify-center ${post.hasVoted
                        ? option.isUserChoice
                          ? "bg-blue-200 text-blue-800 font-semibold"
                          : "bg-gray-200 opacity-75"
                        : "bg-gray-200 opacity-75"
                        }`}
                      style={{
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                        lineHeight: "1.2",
                      }}
                    >
                      {option.text}
                    </span>
                  </div>

                  <span className="w-[50px] -ml-4 mr-8 text-xs text-left text-gray-500 font-medium">
                    {post.hasVoted && option.percentage !== null
                      ? `${option.percentage}%`
                      : ""}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="overflow-hidden ">
      <Toaster
        position="bottom-center"
        toastOptions={{
          className: "shadow-none",
          style: {
            boxShadow: "none",
          },
        }}
      />

      <AnimatePresence>
        <motion.div
          key="create-post"
          initial={{ x: 0, opacity: 1 }}
          animate={{
            x: isExiting ? "100%" : 0,
            opacity: isExiting ? 0 : 1,
          }}
          transition={{
            duration: 0.3,
            ease: "easeInOut",
            type: "tween",
          }}
          className="min-h-[85dvh] "
        >
          <div className="relative">
            <div className="fixed top-[18px] left-5 right-9 z-[100] flex items-center justify-between">
              <button
                onClick={handleBackClick}
                className="p-2 rounded-lg transition-all duration-300 text-black cursor-pointer hover:bg-gray-100"
              >
                <ArrowLeft size={24} />
              </button>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() =>
                    setType((prev) => (prev === "text" ? "poll" : "text"))
                  }
                  disabled={isCouplesSelected}
                  className={`p-3 rounded-full transition-colors ${isCouplesSelected
                    ? "text-gray-300 cursor-not-allowed"
                    : type === "poll"
                      ? "text-gray-900"
                      : "text-gray-600"
                    }`}
                  title={type === "poll" ? "Disable poll" : "Create a poll"}
                >
                  <Vote size={24} />
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="p-3 text-black rounded-full hover:text-gray-800 transition-colors"
                >
                  {loading ? (
                    <LoaderIcon
                      size={24}
                      className={loading ? "animate-spin" : ""}
                    />
                  ) : (
                    <SendIcon size={28} />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Create Form */}
          <div className="max-w-auto md:max-w-2xl mx-3 sm:mx-4 py-4 h-[90dvh] overflow-y-auto">
            <div className="md:p-6">
              {/* Category Selection */}
              <div className="mb-1 flex items-start gap-3">
                <label className="min-w-[42px] pt-1 text-sm font-medium text-gray-700">
                  cc :
                </label>

                {isCouplesSelected ? (
                  <div className="flex items-center gap-2 justify-between flex-1">
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full border flex items-center space-x-2">
                      <span>Couples</span>
                      <div
                        onClick={handleAvatarClick}
                        className="text-gray-500 hover:text-gray-700 cursor-pointer"
                      >
                        ×
                      </div>
                    </span>
                  </div>
                ) : (
                  <div className="relative flex-1 min-w-0" ref={dropdownRef}>
                    {selectedCategories.length === 0 ? (
                      <div className="flex items-center">
                        <button
                          onClick={() =>
                            setShowCategoryDropdown(!showCategoryDropdown)
                          }
                          className="text-gray-700 px-4 border border-gray-300 rounded-2xl hover:border-gray-400"
                        >
                          Select
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setShowCategoryDropdown(!showCategoryDropdown)
                          }
                          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                        >
                          <Plus size={16} className="text-gray-500" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap xs:flex-nowrap items-center gap-1 xs:overflow-x-auto scrollbar-hide pb-1">
                        {selectedCategories.map((category, index) => {
                          // Calculate dynamic sizing based on number of categories AND screen size
                          const categoryCount = selectedCategories.length;
                          let fontSize = "text-sm";
                          let padding = "px-3 py-1";

                          // Responsive sizing
                          if (categoryCount >= 4) {
                            fontSize =
                              "text-[7px] [@media(min-width:360px)]:text-[8px] [@media(min-width:390px)]:text-[9px] [@media(min-width:430px)]:text-[11px] [@media(min-width:768px)]:text-sm";

                            padding =
                              "px-1 [@media(min-width:360px)]:px-2 py-0.5 xs:px-1.5 xs:py-0.5 sm:px-2 sm:py-0.5";
                          } else if (categoryCount === 3) {
                            fontSize =
                              "text-[8px] [@media(min-width:360px)]:text-[9px] [@media(min-width:390px)]:text-[11px] [@media(min-width:430px)]:text-[12px] [@media(min-width:768px)]:text-sm";
                            padding =
                              "px-1 [@media(min-width:360px)]:px-2 py-0.5 xs:px-2 xs:py-0.5 sm:px-2.5 sm:py-1";
                          } else if (categoryCount === 2) {
                            fontSize = "text-xs sm:text-sm";
                            padding = "px-2.5 py-1 sm:px-3 sm:py-1";
                          }

                          return (
                            <span
                              key={index}
                              className={`${padding} bg-gray-100 text-gray-700 ${fontSize} rounded-full border flex items-center gap-1 sm:gap-1.5 whitespace-nowrap flex-shrink-0`}
                            >
                              <span>{category}</span>
                              <div
                                onClick={() => removeCategory(category)}
                                className="text-gray-500 hover:text-gray-700 cursor-pointer text-[9px] [@media(min-width:310px)]:text-sm"
                              >
                                ×
                              </div>
                            </span>
                          );
                        })}

                        {/* Only show + button if not all 4 creatives are selected */}
                        {selectedCategories.length < 4 && (
                          <button
                            type="button"
                            onClick={() =>
                              setShowCategoryDropdown(!showCategoryDropdown)
                            }
                            className="p-1 rounded-full hover:bg-gray-100 border transition-colors flex-shrink-0"
                          >
                            <Plus
                              size={14}
                              className="text-gray-500 sm:w-4 sm:h-4"
                            />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Dropdown */}
                    {showCategoryDropdown && (
                      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48 max-w-[calc(100vw-6rem)]">
                        {vendorCategories.map((category) => (
                          <button
                            key={category}
                            onClick={() => addCategory(category)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                            disabled={selectedCategories.includes(category)}
                          >
                            <span
                              className={
                                selectedCategories.includes(category)
                                  ? "text-gray-400"
                                  : "text-gray-700"
                              }
                            >
                              {category}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Subject */}
              <div className="mb-1 flex items-center md:gap-3">
                <label className="block text-sm font-medium text-gray-700 mt-[2px]">
                  Subject
                </label>
                <div className="w-full">
                  <textarea
                    ref={textareaSubjectRef}
                    value={subject}
                    onChange={handleSubjectChange}
                    placeholder="What's the main topic of your post?"
                    className="w-full px-4 rounded-lg focus:ring-0 focus:outline-none resize-none py-2 text-[10px] [@media(min-width:340px)]:text-[12px] [@media(min-width:375px)]:text-[14px] [@media(min-width:390px)]:text-base scrollbar-hide"
                    maxLength={150}
                    style={{
                      minHeight: "40px",
                      maxHeight: "120px",
                      lineHeight: "1.5",
                      overflowY: "auto",
                      wordWrap: "break-word",
                      whiteSpace: "pre-wrap",
                    }}
                    rows={1}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                    autoCapitalize="sentences"
                  />
                </div>
              </div>
              <div className="mb-4 w-full h-px bg-gray-300 mx-auto"></div>

              {/* Content */}
              <div className="">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={handleContentChange}
                  placeholder="Share your thoughts, tips, or experiences..."
                  className="w-full px-4 py-3 rounded-lg focus:ring-0 focus:outline-none resize-none"
                  style={{
                    minHeight: type === "poll" ? "60px" : "100px",
                    maxHeight: type === "poll" ? "200px" : "500px",
                    lineHeight: "1.5",
                    WebkitAppearance: "none",
                    WebkitUserSelect: "text",
                    WebkitTouchCallout: "none",
                    WebkitOverflowScrolling: "touch",
                    touchAction: "pan-y",
                    overflowY: "auto",
                    wordWrap: "break-word",
                    whiteSpace: "pre-wrap",
                    WebkitTransform: "translateZ(0)", // Hardware acceleration
                    transform: "translateZ(0)",
                  }}
                  maxLength={500}
                  rows={type === "poll" ? 2 : 4}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  autoCapitalize="sentences"
                  onInput={(e) => {
                    // iOS immediate height adjustment
                    const target = e.target;
                    const maxHeight = type === "poll" ? 200 : 500;
                    target.style.height = 'auto';
                    const newHeight = Math.min(target.scrollHeight, maxHeight);
                    target.style.height = newHeight + 'px';
                    target.style.overflowY = newHeight >= maxHeight ? 'auto' : 'hidden';
                  }}
                />
              </div>
              {type === "poll" && (
                <div className="mb-6 mt-2">
                  <div className="space-y-3 flex flex-col items-start ml-2 w-full relative">
                    {pollOptions.map((option, index) => {
                      const isLast = index === pollOptions.length - 1;
                      return (
                        <div
                          key={index}
                          className="relative w-full max-w-sm sm:max-w-md pr-8"
                        >
                          <div className="flex items-start bg-gray-200 opacity-75 rounded-4xl gap-2 px-6 w-full min-h-[44px] overflow-hidden">

                            <textarea
                              value={option}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/\r/g, "");
                                handlePollOptionChange(raw, index);
                                // const raw = String(e.target.value || "");
                                // const noNewlines = raw.replace(/\r/g, "").replace(/\n/g, "");
                                // const capped = noNewlines.slice(0, 52); // total = 25 * 2 lines

                                // // split into two lines of 20 chars each
                                // const first = capped.slice(0, 26);
                                // const second = capped.length > 26 ? capped.slice(26) : "";
                                // const formatted = second ? `${first}\n${second}` : first;

                                // console.log("first.length:", first.length, "second.length:", second.length);
                                // console.log("formatted:", JSON.stringify(formatted));

                                // handlePollOptionChange(formatted, index);
                              }}
                              onPaste={(e) => {
                                e.preventDefault();
                                const pasted = (e.clipboardData || window.clipboardData).getData("text");
                                const cleaned = pasted.replace(/\r/g, "").replace(/\n/g, "").slice(0, 50);
                                const formatted =
                                  cleaned.length > 26
                                    ? `${cleaned.slice(0, 26)}\n${cleaned.slice(26)}`
                                    : cleaned;
                                handlePollOptionChange(formatted, index);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") e.preventDefault();
                              }}
                              placeholder={`Option ${index + 1}`}
                              className="w-full px-2 py-2 mt-2 text-left bg-transparent focus:outline-none resize-none overflow-hidden"
                              rows={2}
                              maxLength={52}
                              spellCheck="false"
                              style={{
                                height: "44px",
                                lineHeight: "22px",
                                whiteSpace: "pre",
                                overflow: "hidden",
                                resize: "none",

                              }}
                            />

                            <button
                              type="button"
                              onClick={() => removePollOption(index)}
                              className="text-gray-500 hover:text-gray-700 cursor-pointer mt-4"
                              disabled={pollOptions.length <= 2}
                            >
                              <X size={18} />
                            </button>
                          </div>

                          {isLast && pollOptions.length < 4 && (
                            <button
                              type="button"
                              onClick={addPollOption}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-700 hover:text-black"
                            >
                              <Plus size={20} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {isQuotePost && (
                <QuotedPostPreview
                  post={quotedPost}
                  isLoading={loadingQuotedPost}
                />
              )}
              <div className="flex flex-col justify-start items-start mt-2">
                <div className="text-xs text-gray-500">
                  {content.length}/500
                </div>
              </div>
            </div>
          </div>

          {/* Exit Confirmation Modal */}
          {showExitConfirm && (
            <div
              onClick={handleCancelExit}
              className="fixed inset-0 bg-[#00000063] bg-opacity-50 flex items-center overscroll-none justify-center z-50"
            >
              <div
                className="bg-white rounded-lg p-6 max-w-sm mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold mb-4">Are you sure?</h3>
                <p className="text-gray-600 mb-6">
                  You have an unfinished post
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={handleCancelExit}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-3xl hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmExit}
                    className="flex-1 px-4 py-2 bg-black text-white rounded-3xl hover:bg-gray-600"
                  >
                    Leave
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default CreatePage;
