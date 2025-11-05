"use client";
import React, { useRef, useEffect, useState } from "react";
import { Send, X } from "lucide-react";

const ChatInput = ({
  commentText,
  onChangeCommentText,
  onSendMessage,
  isSubmitting,
  replyTo,
  onCancelReply,
  mentionUsers,
  showMentions,
  onMentionSelect,
  isModalOpen = false,
}) => {
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const maxLength = 250;
  const [isIOS, setIsIOS] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detect iOS devices
    const detectIOS = () => {
      return (
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
      );
    };

    const isIOSDevice = detectIOS();
    setIsIOS(isIOSDevice);

    // Helper function to detect if an edit form is currently active
    const isEditFormActive = () => {
      const editTextarea = document.querySelector(
        'textarea[placeholder="Edit your comment..."]'
      );
      return editTextarea && document.activeElement === editTextarea;
    };

    if (!isIOSDevice) {
      // Android/Desktop logic - keep your existing working logic
      const adjustPositionAndroid = () => {
        if (!containerRef.current) return;

        // If an edit form is active, hide the ChatInput completely
        if (isEditFormActive()) {
          containerRef.current.style.display = "none";
          return;
        } else {
          containerRef.current.style.display = "block";
        }

        if (window.visualViewport) {
          const { height, offsetTop } = window.visualViewport;
          const windowHeight = window.innerHeight;

          const keyboardHeight = windowHeight - height;
          const scrollOffset = offsetTop;

          containerRef.current.style.transform = `translateY(${scrollOffset}px)`;
          containerRef.current.style.bottom = `${keyboardHeight}px`;
          containerRef.current.style.position = "fixed";
          containerRef.current.style.left = "0";
          containerRef.current.style.right = "0";
          containerRef.current.style.top = "auto";
        }
      };

      if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", adjustPositionAndroid);
        window.visualViewport.addEventListener("scroll", adjustPositionAndroid);
        adjustPositionAndroid();
      }

      // Listen for focus changes to detect edit form activation/deactivation
      const handleGlobalFocusChange = () => {
        setTimeout(adjustPositionAndroid, 50);
      };

      document.addEventListener("focusin", handleGlobalFocusChange);
      document.addEventListener("focusout", handleGlobalFocusChange);

      return () => {
        if (window.visualViewport) {
          window.visualViewport.removeEventListener(
            "resize",
            adjustPositionAndroid
          );
          window.visualViewport.removeEventListener(
            "scroll",
            adjustPositionAndroid
          );
        }
        document.removeEventListener("focusin", handleGlobalFocusChange);
        document.removeEventListener("focusout", handleGlobalFocusChange);
      };
    }

    // iOS-specific logic - FIXED
    let initialViewportHeight = window.innerHeight;
    let keyboardOpenHeight = 0;

    const adjustPositionIOS = () => {
      if (!containerRef.current) return;

      // If an edit form is active, hide the ChatInput completely
      if (isEditFormActive()) {
        containerRef.current.style.display = "none";
        return;
      } else {
        containerRef.current.style.display = "block";
      }

      const currentViewportHeight = window.visualViewport
        ? window.visualViewport.height
        : window.innerHeight;
      const heightDiff = initialViewportHeight - currentViewportHeight;

      // More reliable iOS keyboard detection
      const isKeyboardVisible = heightDiff > 150; // Threshold for keyboard detection

      setIsKeyboardOpen(isKeyboardVisible);

      if (isKeyboardVisible) {
        // Keyboard is open - position input at the bottom of visible viewport
        keyboardOpenHeight = heightDiff;
        setKeyboardHeight(keyboardOpenHeight);

        containerRef.current.style.position = "fixed";
        containerRef.current.style.left = "0";
        containerRef.current.style.right = "0";
        containerRef.current.style.bottom = `${keyboardOpenHeight}px`;
        containerRef.current.style.top = "auto";
        containerRef.current.style.transform = "none";

        // Ensure proper z-index
        containerRef.current.style.zIndex = "9999";
      } else {
        // Keyboard is closed - reset to normal bottom position
        setKeyboardHeight(0);

        containerRef.current.style.position = "fixed";
        containerRef.current.style.left = "0";
        containerRef.current.style.right = "0";
        containerRef.current.style.bottom = "0px";
        containerRef.current.style.top = "auto";
        containerRef.current.style.transform = "none";
        containerRef.current.style.zIndex = "9999";
      }
    };

    // Handle viewport changes for iOS
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", adjustPositionIOS);
    } else {
      // Fallback for older iOS versions
      window.addEventListener("resize", adjustPositionIOS);
    }

    // iOS-specific input focus handling
    const handleInputFocus = () => {
      if (inputRef.current) {
        // Small delay to allow iOS to adjust viewport
        setTimeout(() => {
          adjustPositionIOS();
          // Prevent scroll to input on iOS
          if (window.scrollTo) {
            window.scrollTo(0, 0);
          }
        }, 100);
      }
    };

    const handleInputBlur = () => {
      // Reset initial height reference when input loses focus
      setTimeout(() => {
        initialViewportHeight = window.innerHeight;
        adjustPositionIOS();
      }, 100);
    };

    // Add event listeners to input
    if (inputRef.current) {
      inputRef.current.addEventListener("focus", handleInputFocus);
      inputRef.current.addEventListener("blur", handleInputBlur);
    }

    // Listen for focus changes to detect edit form activation/deactivation
    const handleGlobalFocusChange = () => {
      setTimeout(adjustPositionIOS, 50);
    };

    document.addEventListener("focusin", handleGlobalFocusChange);
    document.addEventListener("focusout", handleGlobalFocusChange);

    // Handle orientation changes
    const handleOrientationChange = () => {
      // Update initial viewport height on orientation change
      setTimeout(() => {
        initialViewportHeight = window.innerHeight;
        adjustPositionIOS();
      }, 500);
    };

    window.addEventListener("orientationchange", handleOrientationChange);

    // Prevent iOS body scroll when keyboard is open
    const originalBodyStyle = document.body.style.cssText;

    const preventScroll = (e) => {
      if (isKeyboardOpen && !e.target.closest(".chat-input-container")) {
        e.preventDefault();
        return false;
      }
    };

    // Use touchmove to prevent iOS scroll bouncing
    document.addEventListener("touchmove", preventScroll, { passive: false });

    // Initial positioning
    setTimeout(adjustPositionIOS, 100);

    // iOS cleanup
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", adjustPositionIOS);
      } else {
        window.removeEventListener("resize", adjustPositionIOS);
      }

      if (inputRef.current) {
        inputRef.current.removeEventListener("focus", handleInputFocus);
        inputRef.current.removeEventListener("blur", handleInputBlur);
      }

      document.removeEventListener("focusin", handleGlobalFocusChange);
      document.removeEventListener("focusout", handleGlobalFocusChange);
      window.removeEventListener("orientationchange", handleOrientationChange);
      document.removeEventListener("touchmove", preventScroll);

      // Restore body style
      document.body.style.cssText = originalBodyStyle;
    };
  }, [isKeyboardOpen]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!commentText.trim() || isSubmitting || commentText.length > maxLength)
      return;
    onSendMessage();
  };

  const CharacterCounter = ({ text, maxLength = 250 }) => {
    const remaining = maxLength - text.length;
    const isOverLimit = remaining < 0;

    return (
      <div
        className={`text-xs ${
          isOverLimit
            ? "text-red-500"
            : remaining < 20
            ? "text-orange-500"
            : "text-gray-500"
        }`}
      >
        {remaining < 0
          ? `${Math.abs(remaining)} over limit`
          : `${remaining} remaining`}
      </div>
    );
  };

  if (isModalOpen) {
    return null;
  }

  return (
    <>
      {/* Spacer to prevent content from being hidden behind input */}
      <div className="h-20 sm:h-24"></div>

      {/* Input container with platform-specific handling */}
      <div
        ref={containerRef}
        className={`chat-input-container left-0 right-0 bg-white shadow-lg`}
        style={{
          // Default fixed positioning - will be adjusted by JS
          position: "fixed",
          bottom: "0px",
          zIndex: 9999,
          // Optimize for smooth repositioning
          willChange: "transform, bottom",
          // Use CSS transitions for smooth movement on iOS
          transition: isIOS ? "bottom 0.25s ease-out" : "none",
        }}
      >
        <div className="p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
          <div className="flex flex-col justify-center items-center w-full max-w-3xl mx-auto">
            {/* Reply indicator */}
            {replyTo && (
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg mb-3 w-full">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">
                    Replying to{" "}
                    <span className="font-medium">
                      @{replyTo.userDisplayName || replyTo.username}
                    </span>
                  </p>
                  <p className="text-sm text-gray-700 truncate">
                    {replyTo.content}
                  </p>
                </div>
                <button
                  onClick={onCancelReply}
                  className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
                  type="button"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Mention dropdown */}
            {showMentions && mentionUsers.length > 0 && (
              <div className="w-full bg-white border border-gray-200 rounded-lg shadow-lg mb-2 max-h-40 overflow-y-auto">
                {mentionUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => onMentionSelect(user)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2"
                    type="button"
                  >
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium">
                        {user.displayName.charAt(0)}
                      </span>
                    </div>
                    <span className="text-sm">{user.displayName}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Input form */}
            <div className="relative flex items-start gap-2 w-full">
              <div className="flex-1">
                <textarea
                  ref={inputRef}
                  value={commentText}
                  onChange={(e) => onChangeCommentText(e)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a comment..."
                  className="w-full h-[50px] p-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent text-base"
                  rows={3}
                  maxLength={maxLength}
                  disabled={isSubmitting}
                  style={{
                    minHeight: "50px",
                    fontSize: "16px", // Prevent iOS zoom
                    // iOS-specific input styles
                    ...(isIOS && {
                      WebkitAppearance: "none",
                      borderRadius: "12px",
                      WebkitTapHighlightColor: "transparent",
                    }),
                  }}
                />

                {/* Character counter */}
                <div className="flex justify-end mt-1 px-1">
                  <CharacterCounter text={commentText} />
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={
                  !commentText.trim() ||
                  isSubmitting ||
                  commentText.length > maxLength
                }
                className={`px-3 md:px-6 py-3 rounded-lg font-medium transition-colors flex-shrink-0 ${
                  commentText.trim() &&
                  !isSubmitting &&
                  commentText.length <= maxLength
                    ? "text-black cursor-pointer"
                    : "text-gray-500 cursor-not-allowed"
                }`}
                type="button"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatInput;
// "use client";
// import React, { useRef } from "react";
// import { Send, X, Smile, Paperclip } from "lucide-react";

// const ChatInput = ({
//   commentText,
//   onChangeCommentText,
//   onSendMessage,
//   isSubmitting,
//   replyTo,
//   onCancelReply,
//   mentionUsers,
//   showMentions,
//   onMentionSelect,
// }) => {
//   const inputRef = useRef(null);
//   const maxLength = 250;

//   const handleKeyPress = (e) => {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault();
//       handleSubmit();
//     }
//   };

//   const handleSubmit = () => {
//     if (!commentText.trim() || isSubmitting || commentText.length > maxLength)
//       return;
//     onSendMessage();
//   };

//   const CharacterCounter = ({ text, maxLength = 250 }) => {
//     const remaining = maxLength - text.length;
//     const isOverLimit = remaining < 0;

//     return (
//       <div
//         className={`text-xs ${
//           isOverLimit
//             ? "text-red-500"
//             : remaining < 20
//             ? "text-orange-500"
//             : "text-gray-500"
//         }`}
//       >
//         {remaining < 0
//           ? `${Math.abs(remaining)} over limit`
//           : `${remaining} remaining`}
//       </div>
//     );
//   };

//   return (
//     <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4">
//       <div className="flex flex-col justify-center items-center w-full max-w-3xl mx-auto">
//         {/* Reply indicator */}
//         {replyTo && (
//           <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg mb-3 w-full">
//             <div className="flex-1">
//               <p className="text-xs text-gray-500 mb-1">
//                 Replying to{" "}
//                 <span className="font-medium">
//                   @{replyTo.userDisplayName || replyTo.username}
//                 </span>
//               </p>
//               <p className="text-sm text-gray-700 truncate">
//                 {replyTo.content}
//               </p>
//             </div>
//             <button
//               onClick={onCancelReply}
//               className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
//             >
//               <X size={16} />
//             </button>
//           </div>
//         )}

//         {/* Input form */}
//         <div className="relative flex items-start gap-2 w-full">
//           <div className="flex-1">
//             <textarea
//               ref={inputRef}
//               value={commentText}
//               onChange={(e) => onChangeCommentText(e)}
//               onKeyPress={handleKeyPress}
//               placeholder="Add a comment..."
//               className="w-full h-[50px] p-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent"
//               rows={3}
//               maxLength={maxLength}
//               disabled={isSubmitting}
//             />

//             {/* Character counter */}
//             <div className="flex justify-end mt-1 px-1">
//               <CharacterCounter text={commentText} />
//             </div>
//           </div>

//           {/* Mention dropdown */}
//           {showMentions && mentionUsers.length > 0 && (
//             <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-40 overflow-y-auto">
//               {mentionUsers.map((user) => (
//                 <button
//                   key={user.id}
//                   onClick={() => onMentionSelect(user)}
//                   className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2"
//                 >
//                   <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
//                     <span className="text-xs font-medium">
//                       {user.displayName.charAt(0)}
//                     </span>
//                   </div>
//                   <span className="text-sm">{user.displayName}</span>
//                 </button>
//               ))}
//             </div>
//           )}

//           <button
//             onClick={handleSubmit}
//             disabled={
//               !commentText.trim() ||
//               isSubmitting ||
//               commentText.length > maxLength
//             }
//             className={`px-3 md:px-6 py-3 rounded-lg font-medium transition-colors ${
//               commentText.trim() &&
//               !isSubmitting &&
//               commentText.length <= maxLength
//                 ? "text-black cursor-pointer"
//                 : "text-gray-500 cursor-not-allowed"
//             }`}
//           >
//             {isSubmitting ? (
//               <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
//             ) : (
//               <Send size={20} />
//             )}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ChatInput;
