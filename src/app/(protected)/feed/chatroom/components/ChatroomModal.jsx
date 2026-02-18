// "use client";

// import React, { useEffect, useState } from "react";
// import { X } from "lucide-react";
// import { openChatroom, getPostCommentCount } from "../../../../../../action";
// import { toast } from "sonner";
// import Portal from "@/components/Portal";

// const ChatroomModal = ({ post, onClose, onEnter }) => {
//   const [isEntering, setIsEntering] = useState(false);
//   const [commentCount, setCommentCount] = useState(0);
//   const [isLoadingCommentCount, setIsLoadingCommentCount] = useState(true);

//   // CRITICAL FIX: Don't render modal at all if post hasn't met threshold
//   if (!post.thresholdMet) {
//     return null;
//   }

//   // Prevent body scroll when modal is open
//   useEffect(() => {
//     // Save current scroll position
//     const scrollY = window.scrollY;

//     // Prevent body scroll
//     document.body.style.overflow = "hidden";
//     document.body.style.position = "fixed";
//     document.body.style.top = `-${scrollY}px`;
//     document.body.style.width = "100%";

//     return () => {
//       // Restore body scroll and position
//       document.body.style.overflow = "";
//       document.body.style.position = "";
//       document.body.style.top = "";
//       document.body.style.width = "";

//       // Restore scroll position
//       window.scrollTo(0, scrollY);
//     };
//   }, []);

//   // Fetch comment count when modal opens (only for threshold met posts)
//   useEffect(() => {
//     const fetchCommentCount = async () => {
//       try {
//         setIsLoadingCommentCount(true);
//         const response = await getPostCommentCount({ postId: post.id });
//         setCommentCount(response.commentCount);

//         // If post has comments, close modal automatically
//         if (response.hasComments) {
//           onClose();
//           return;
//         }
//       } catch (error) {
//         console.error("Failed to fetch comment count:", error);
//         // Still allow user to proceed if API fails
//       } finally {
//         setIsLoadingCommentCount(false);
//       }
//     };

//     fetchCommentCount();
//   }, [post.id, onClose]);

//   const handleEnter = async () => {
//     setIsEntering(true);
//     try {
//       // Double-check comment count before entering
//       const commentCheckResponse = await getPostCommentCount({
//         postId: post.id,
//       });

//       if (commentCheckResponse.hasComments) {
//         toast.info("This post now has comments. Modal closed.");
//         onClose();
//         return;
//       }

//       // Call the openChatroom API
//       const response = await openChatroom({ postId: post.id });

//       // Enter chatroom with the response data
//       onEnter(response.chatroomInfo);
//     } catch (error) {
//       console.error("Failed to enter chatroom:", error);
//       toast.error(error.message || "Failed to enter chatroom");
//     } finally {
//       setIsEntering(false);
//     }
//   };

//   const handleBackdropClick = (e) => {
//     // Only close if clicking on the backdrop itself, not on the modal content
//     if (e.target === e.currentTarget) {
//       onClose();
//     }
//   };

//   // Don't render modal if post has comments
//   if (commentCount > 0) {
//     return null;
//   }

//   // Show loading state while checking comment count
//   if (isLoadingCommentCount) {
//     return (
//       <Portal>
//         <div
//           className="fixed inset-0 bg-[#000000a8] bg-opacity-50 flex items-center justify-center z-50 p-8"
//           onClick={handleBackdropClick}
//         >
//           <div className="bg-white rounded-2xl max-w-md w-full px-6 py-8 relative">
//             <div className="text-center">
//               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
//               <p className="mt-2 text-gray-600">Loading...</p>
//             </div>
//           </div>
//         </div>
//       </Portal>
//     );
//   }

//   // Only show the enter chatroom modal for posts with no comments
//   return (
//     <Portal>
//       <div
//         className="fixed inset-0 bg-[#000000a8] bg-opacity-50 flex items-center justify-center z-50 p-8"
//         onClick={handleBackdropClick}
//       >
//         <div className="bg-white rounded-2xl max-w-md w-full px-6 py-8 relative">
//           {/* Close Button */}
//           <button
//             onClick={onClose}
//             className="absolute top-2 right-3 text-gray-400 hover:text-gray-600 transition-colors touch-manipulation"
//             style={{ WebkitTapHighlightColor: "transparent" }}
//           >
//             <X size={24} />
//           </button>

//           {/* Header */}
//           <div className="text-center mb-6">
//             <h2 className="text-lg md:text-2xl font-bold text-gray-800 mb-2">
//               {post.openedBy
//                 ? "Join chatroom for this post"
//                 : "Open a chatroom for this post"}
//             </h2>
//             <p className="text-sm text-gray-600 truncate">"{post.subject}"</p>
//           </div>

//           {/* Enter Chatroom Button */}
//           <div className="flex space-x-3 my-4">
//             <button
//               onClick={handleEnter}
//               disabled={isEntering}
//               className="flex-1 px-4 py-3 border border-black text-black rounded-full transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black hover:text-white touch-manipulation"
//               style={{ WebkitTapHighlightColor: "transparent" }}
//             >
//               {isEntering
//                 ? "Entering..."
//                 : post.openedBy
//                 ? "Join Chatroom"
//                 : "Enter Chatroom"}
//             </button>
//           </div>

//           {/* Info Text */}
//           <div>
//             <p className="text-xs text-gray-700 mb-3">
//               You'll be assigned a randomly generated username
//             </p>
//             <p className="text-xs text-gray-700">
//               Replies will close after 48 hours
//             </p>
//           </div>
//         </div>
//       </div>
//     </Portal>
//   );
// };
// export default ChatroomModal;
"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { openChatroom } from "../../../../../../action"; // Remove getPostCommentCount
import { toast } from "sonner";
import Portal from "@/components/Portal";

const ChatroomModal = ({ post, onClose, onEnter }) => {
  const [isEntering, setIsEntering] = useState(false);

  // CRITICAL FIX: Don't render modal at all if post hasn't met threshold
  if (!post.thresholdMet) {
    return null;
  }

  // Prevent body scroll when modal is open
  useEffect(() => {
    // Save current scroll position
    const scrollY = window.scrollY;

    // Prevent body scroll
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      // Restore body scroll and position
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";

      // Restore scroll position
      window.scrollTo(0, scrollY);
    };
  }, []);

  const handleEnter = async () => {
    setIsEntering(true);
    try {
      // Only call openChatroom API - backend should handle comment checks
      const response = await openChatroom({ postId: post.id });

      // The backend should return appropriate error if post already has comments
      if (!response.success) {
        if (response.error?.includes("comments") || response.error?.includes("already")) {
          toast.info("This post now has comments. Modal closed.");
          onClose();
          return;
        }
        throw new Error(response.error || "Failed to enter chatroom");
      }

      // Enter chatroom with the response data
      onEnter(response.chatroomInfo);
    } catch (error) {
      console.error("Failed to enter chatroom:", error);
      
      // Handle specific errors from backend
      if (error.message.includes("already has comments") || 
          error.message.includes("comment count")) {
        toast.info("This post now has comments. Modal closed.");
        onClose();
        return;
      }
      
      toast.error(error.message || "Failed to enter chatroom");
    } finally {
      setIsEntering(false);
    }
  };

  const handleBackdropClick = (e) => {
    // Only close if clicking on the backdrop itself, not on the modal content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Don't render modal if post already has comments (this should be checked in parent)
  // This check is now handled in the FeedPage parent component
  if (post.commentsCount > 0) {
    return null;
  }

  return (
    <Portal>
      <div
        className="fixed inset-0 bg-[#000000a8] bg-opacity-50 flex items-center justify-center z-50 p-8"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-2xl max-w-md w-full px-6 py-8 relative">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-2 right-3 text-gray-400 hover:text-gray-600 transition-colors touch-manipulation"
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            <X size={24} />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-lg md:text-2xl font-bold text-gray-800 mb-2">
              {post.openedBy
                ? "Join chatroom for this post"
                : "Open a chatroom for this post"}
            </h2>
            <p className="text-sm text-gray-600 truncate">"{post.subject}"</p>
          </div>

          {/* Enter Chatroom Button */}
          <div className="flex space-x-3 my-4">
            <button
              onClick={handleEnter}
              disabled={isEntering}
              className="flex-1 px-4 py-3 border border-black text-black rounded-full transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black hover:text-white touch-manipulation"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              {isEntering
                ? "Entering..."
                : post.openedBy
                ? "Join Chatroom"
                : "Enter Chatroom"}
            </button>
          </div>

          {/* Info Text */}
          <div>
            <p className="text-xs text-gray-700 mb-3">
              You'll be assigned a randomly generated username
            </p>
            <p className="text-xs text-gray-700">
              Replies will close after 48 hours
            </p>
          </div>
        </div>
      </div>
    </Portal>
  );
};
export default ChatroomModal;