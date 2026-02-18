"use client";
import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Users,
  Clock,
  Settings,
  Volume2,
  VolumeX,
  Heart,
  Bookmark,
  Share2,
  Info,
  MessageCircle,
  Send,
  X,
  Reply,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  createComment,
  deleteComment,
  fetchComments,
  fetchPublicComments,
  getPost,
  getPublicPost,
  getUsernameForChatroom,
  likeComment,
  likePost,
  savePost,
  searchUsersForMentions,
  updateComment,
} from "./../../../../../../../../action.js";
import Toast from "./../../../../../../../components/Toast.jsx";
import ChatMessage from "../../../../../feed/chatroom/components/ChatMessage.jsx";
import ChatInput from "../../../../../feed/chatroom/components/ChatInput.jsx";
import useUserStore from "./../../../../../../../store/userStore.js";
import SharePreview from "@/app/(protected)/feed/components/SharePreview.jsx";
import {
  getTimeAgo,
  ThresholdCountdown,
} from "@/app/(protected)/feed/components/Post.jsx";
import ChatroomTimer from "../../../../../feed/chatroom/components/ChatroomTimer.jsx";

const formatTimeRemaining = (milliseconds) => {
  if (milliseconds <= 0) return "0s";

  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};

const ChatroomClient = () => {
  const { slug, postId } = useParams();
  const router = useRouter();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { user, isAuthenticated } = useUserStore();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [savedPosts, setSavedPosts] = useState(new Set());
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [randomUsername, setRandomUsername] = useState("");
  const [mentionUsers, setMentionUsers] = useState([]);
  const [selectedMentions, setSelectedMentions] = useState([]);
  const [mentionQuery, setMentionQuery] = useState("");
  const [likedComments, setLikedComments] = useState(new Set());
  const [expandedReplies, setExpandedReplies] = useState(new Set());
  const [toast, setToast] = useState(null);

  // Add these new states for missing functionality
  const [showSharePreview, setShowSharePreview] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [voting, setVoting] = useState({});



  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };

  // Helper function to redirect unauthenticated users
  const redirectToLogin = () => {
    router.push("/login?flow=creative&step=login-choice&mode=login");
  };

  // Check if user is authenticated before allowing interactions
  const requireAuth = (callback) => {
    return (...args) => {
      if (!isAuthenticated) {
        redirectToLogin();
        return;
      }
      return callback(...args);
    };
  };

  useEffect(() => {
    const initializePage = async () => {
      if (!postId) {
        showToast("Post ID is required");
        setIsLoading(false);
        return;
      }

      try {
        if (!isAuthenticated) {
          // For unauthenticated users, fetch both post and comments (public data)
          const postData = await getPublicPost(postId);
          setPost(postData.post);

          // FIXED: Also fetch public comments for unauthenticated users
          const commentsData = await fetchPublicComments(postId);
          setComments(commentsData.comments || []);

          setIsLoading(false);
          return;
        }

        // For authenticated users, fetch full data
        const postData = await getPost(postId);

        if (
          postData.posts &&
          postData.posts.some((post) => post.categories.includes("Couples"))
        ) {
          postData.posts.sort(
            (a, b) => (a.couplesRanking || 0) - (b.couplesRanking || 0)
          );
        }

        setPost(postData.post);

        const username = await getUsernameForChatroom(postId);
        setRandomUsername(username.chatroomUsername);

        const commentsData = await fetchComments(postId);
        setComments(commentsData.comments);

        // Initialize liked comments recursively
        const getAllCommentIds = (comments) => {
          let ids = [];
          comments.forEach((comment) => {
            if (comment.isLiked) ids.push(comment.id);
            if (comment.replies && comment.replies.length > 0) {
              ids = [...ids, ...getAllCommentIds(comment.replies)];
            }
          });
          return ids;
        };

        const likedIds = getAllCommentIds(commentsData.comments);
        setLikedComments(new Set(likedIds));

        if (postData.post.isLiked) {
          setLikedPosts(new Set([postData.post.id]));
        }
        if (postData.post.isSaved) {
          setSavedPosts(new Set([postData.post.id]));
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Failed to initialize page:", error);
        showToast(error.message || "Failed to load post details", "error");
        setIsLoading(false);
      }
    };

    initializePage();
  }, [postId, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments, isAuthenticated]);

  // Helper function to add comment to the tree structure
  const addCommentToTree = (comments, newComment) => {
    if (!newComment.parentCommentId) {
      // It's a top-level comment
      return [newComment, ...comments];
    }

    // It's a reply - find the parent and add it
    const addReplyRecursively = (commentList) => {
      return commentList.map((comment) => {
        if (comment.id === newComment.parentCommentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), newComment],
          };
        }
        if (comment.replies && comment.replies.length > 0) {
          return {
            ...comment,
            replies: addReplyRecursively(comment.replies),
          };
        }
        return comment;
      });
    };

    return addReplyRecursively(comments);
  };

  // Helper function to update comment in tree structure
  const updateCommentInTree = (comments, commentId, updateFn) => {
    return comments.map((comment) => {
      if (comment.id === commentId) {
        return updateFn(comment);
      }
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateCommentInTree(comment.replies, commentId, updateFn),
        };
      }
      return comment;
    });
  };

  // Helper function to remove comment from tree structure
  const removeCommentFromTree = (comments, commentId) => {
    return comments.filter((comment) => {
      if (comment.id === commentId) {
        return false;
      }
      if (comment.replies && comment.replies.length > 0) {
        comment.replies = removeCommentFromTree(comment.replies, commentId);
      }
      return true;
    });
  };

  const handleSubmitComment = requireAuth(async () => {
    if (!commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await createComment(
        postId,
        commentText.trim(),
        replyTo?.id || null,
        selectedMentions
      );

      // Add the new comment to the tree structure
      setComments((prevComments) =>
        addCommentToTree(prevComments, result.comment)
      );

      // FIXED: If timer just started, update the post with timer info
      if (result.chatroomInfo?.timerStarted) {
        setPost((prevPost) => ({
          ...prevPost,
          chatroomData: {
            ...prevPost.chatroomData,
            timeRemaining: 60 * 60 * 1000, // Convert minutes to milliseconds
            timerStarted: true,
            isActive: true,
          },
        }));
      }

      setCommentText("");
      setReplyTo(null);
      setSelectedMentions([]);
      setShowMentions(false);

      console.log("Commented is posted")
    } catch (error) {
      console.error("Failed to post comment:", error);
      showToast("Failed to post comment", "error");
    } finally {
      setIsSubmitting(false);
    }
  });

  const handleCancelReply = () => {
    setReplyTo(null);
  };

  const handleUpdateComment = requireAuth(async (commentId, newContent) => {
    try {
      const result = await updateComment(commentId, newContent);

      setComments((prevComments) =>
        updateCommentInTree(prevComments, commentId, (comment) => ({
          ...comment,
          content: newContent,
        }))
      );

      showToast("Comment updated successfully", "success");
    } catch (error) {
      console.error("Failed to update comment:", error);
      showToast("Failed to update comment", "error");
    }
  });

  const handleDeleteComment = requireAuth(async (commentId) => {
    try {
      await deleteComment(commentId);

      setComments((prevComments) =>
        removeCommentFromTree(prevComments, commentId)
      );
      showToast("Comment deleted successfully", "success");
    } catch (error) {
      console.error("Failed to delete comment:", error);
      showToast("Failed to delete comment", "error");
    }
  });

  const handleLikeComment = requireAuth(async (commentId) => {
    try {
      const result = await likeComment(commentId);

      setLikedComments((prev) => {
        const newSet = new Set(prev);
        if (result.liked) {
          newSet.add(commentId);
        } else {
          newSet.delete(commentId);
        }
        return newSet;
      });

      // Update comment likes count in the tree structure
      setComments((prevComments) =>
        updateCommentInTree(prevComments, commentId, (comment) => ({
          ...comment,
          likes: result.liked ? comment.likes + 1 : comment.likes - 1,
          isLiked: result.liked,
        }))
      );
    } catch (error) {
      console.error("Failed to like comment:", error);
      showToast("Failed to like comment", "error");
    }
  });

  const handleReply = requireAuth((comment) => {
    setReplyTo(comment);
    setCommentText(`@${comment.userDisplayName} `);
    inputRef.current?.focus();
  });

  const handleMentionSearch = requireAuth(async (query) => {
    if (query.length < 2) {
      setMentionUsers([]);
      return;
    }

    try {
      const result = await searchUsersForMentions(query, postId);
      setMentionUsers(result.users);
    } catch (error) {
      console.error("Failed to search users:", error);
      setMentionUsers([]);
    }
  });

  const handleMentionSelect = requireAuth((user) => {
    setSelectedMentions((prev) => [...prev, user]);
    setCommentText((prev) =>
      prev.replace(`@${mentionQuery}`, `@${user.displayName} `)
    );
    setShowMentions(false);
    setMentionQuery("");
    inputRef.current?.focus();
  });

  const handleInputChange = requireAuth((e) => {
    const value = e.target.value;
    setCommentText(value);

    const mentionMatch = value.match(/@(\w*)$/);
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowMentions(true);
      handleMentionSearch(mentionMatch[1]);
    } else {
      setShowMentions(false);
      setMentionQuery("");
    }
  });

  const toggleReplies = requireAuth((commentId) => {
    setExpandedReplies((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  });

  const handlePostLike = requireAuth(async (postId) => {
    const isCurrentlyLiked = likedPosts.has(postId);
    const currentLikes = Number(post?.likes || 0);

    console.log("Current like status:", {
      isCurrentlyLiked,
      currentLikes,
      postId,
      likedPosts: Array.from(likedPosts) // Log for debugging
    });

    // Optimistic update - update both likedPosts Set AND post state
    setLikedPosts((prev) => {
      const s = new Set(prev);
      if (isCurrentlyLiked) {
        s.delete(postId);
      } else {
        s.add(postId);
      }
      return s;
    });

    setPost((prev) => ({
      ...prev,
      likes: isCurrentlyLiked ? currentLikes - 1 : currentLikes + 1,
      isLiked: !isCurrentlyLiked,
    }));

    try {
      const result = await likePost({ postId });
      console.log("Full API response:", result);
      console.log("result.data:", result.data);

      if (!result.success) {
        console.error("API returned success false:", result.error);
        throw new Error(result.error || "Like failed");
      }

      // CRITICAL FIX: The backend response is in result.data directly
      // Your backend returns: { liked: true, likes: 5, message: "Post liked" }
      // So result.data contains { liked, likes, message } NOT result.data.data
      const apiData = result.data;

      console.log("API data destructured:", {
        likes: apiData.likes,
        liked: apiData.liked,
        message: apiData.message
      });

      // Update with actual API response
      setPost((prev) => ({
        ...prev,
        likes: apiData.likes || (isCurrentlyLiked ? currentLikes - 1 : currentLikes + 1),
        isLiked: apiData.liked !== undefined ? apiData.liked : !isCurrentlyLiked,
      }));

      // Also update likedPosts Set to match API response
      setLikedPosts((prev) => {
        const s = new Set(prev);
        if (apiData.liked) {
          s.add(postId);
        } else {
          s.delete(postId);
        }
        return s;
      });

      console.log("After update - likedPosts:", Array.from(likedPosts));

    } catch (err) {
      console.error("Like operation failed:", err.message || err);

      // Revert on failure
      setLikedPosts((prev) => {
        const s = new Set(prev);
        // Revert to original state
        if (isCurrentlyLiked) {
          s.add(postId);
        } else {
          s.delete(postId);
        }
        return s;
      });

      setPost((prev) => ({
        ...prev,
        likes: currentLikes,
        isLiked: isCurrentlyLiked,
      }));

      showToast(err.message || "Failed to update like", "error");
    }
  });


  // UPDATED: handlePostSave with proper state reflection
  const handlePostSave = requireAuth(async (postId) => {
    const isCurrentlySaved = savedPosts.has(postId);
    const currentSaveCount = post.saves || 0;

    // Optimistic update
    setSavedPosts((prev) => {
      const newSet = new Set(prev);
      if (isCurrentlySaved) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });

    // CRITICAL FIX: Update post state immediately for consistency
    setPost((prevPost) => ({
      ...prevPost,
      saves: isCurrentlySaved
        ? Math.max(0, currentSaveCount - 1)
        : currentSaveCount + 1,
      isSaved: !isCurrentlySaved,
    }));

    try {
      const result = await savePost({ postId });

      // Sync with API response if different
      if (result.saves !== undefined) {
        setPost((prevPost) => ({
          ...prevPost,
          saves: result.saves,
          isSaved: result.saved,
        }));
      }

      setSavedPosts((prev) => {
        const newSet = new Set(prev);
        if (result.saved) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });
    } catch (error) {
      console.error("Failed to save post:", error);

      // Revert optimistic update
      setSavedPosts((prev) => {
        const newSet = new Set(prev);
        if (isCurrentlySaved) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });

      setPost((prevPost) => ({
        ...prevPost,
        saves: currentSaveCount,
        isSaved: isCurrentlySaved,
      }));

      toast.error("Failed to save post");
    }
  });


  // Add missing handlers for share and report functionality
  const handleShareClick = requireAuth((e) => {
    e.stopPropagation();
    e.preventDefault();
    setShowSharePreview(true);
  });

  const handleInfoClick = requireAuth((e) => {
    e.stopPropagation();
    e.preventDefault();
    setShowReportModal(true);
  });

  const handleReportSubmit = requireAuth(() => {
    showToast("Post Reported");
    setShowReportModal(false);
  });

  const handleReportModalClose = () => {
    setShowReportModal(false);
  };

  const handleSharePreviewClose = () => {
    setShowSharePreview(false);
  };

  useEffect(() => {
    let interval;

    if (isAuthenticated && post?.chatroomData?.timeRemaining > 0) {
      interval = setInterval(() => {
        setPost((prevPost) => {
          if (!prevPost?.chatroomData?.timeRemaining) return prevPost;

          const newTimeRemaining = Math.max(
            0,
            prevPost.chatroomData.timeRemaining - 1000
          );

          return {
            ...prevPost,
            chatroomData: {
              ...prevPost.chatroomData,
              timeRemaining: newTimeRemaining,
              isActive: newTimeRemaining > 0,
            },
          };
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [post?.chatroomData?.timeRemaining, isAuthenticated]);

  const formatTimeRemaining = (milliseconds) => {
    if (milliseconds <= 0) return "0s";

    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Add formatThresholdMetTimeAgo function
  const formatThresholdMetTimeAgo = () => {
    if (!post.thresholdMetAt) return null;
    return getTimeAgo(post.thresholdMetAt);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-600">Post not found</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-4xl mx-auto">
        {/* Only show username assignment for authenticated users */}
        {isAuthenticated && (
          <>
            <div className="px-4 sm:px-6">
              <div className="flex items-start space-x-2">
                <span className="text-xs sm:text-[12px] font-medium text-gray-900">
                  "{randomUsername || "Anonymous"}"
                </span>
                <span className="text-xs sm:text-[12px] text-gray-600">
                  is your assigned username
                </span>
              </div>
            </div>

            <div className="mt-4 w-[90%] h-px bg-gray-200 mx-4"></div>
          </>
        )}

        <div className="bg-white">
          {/* Only show chatroom opener info for authenticated users */}
          {isAuthenticated && post?.openedByUsername && (
            <div className="px-4 sm:px-6 py-2 flex items-start space-x-2">
              <span className="text-xs sm:text-[12px] font-medium text-gray-900">
                "{post.openedByUsername}"
              </span>
              <span className="text-xs sm:text-[12px] text-gray-600">
                opened this chatroom
              </span>
            </div>
          )}

          <div className="px-4 sm:px-6 pb-4 pt-2">
            <div className="flex gap-2 text-sm sm:text-[14px] text-gray-900">
              <span className="flex-shrink-0">cc:</span>
              <span className="break-words">
                {post.categories
                  .map((category, i) => {
                    const isLast = i === post.categories.length - 1;
                    return `${category}${isLast ? "" : ", "}`;
                  })
                  .join("")}
              </span>
            </div>

            <div className="flex gap-2 mb-2 text-sm sm:text-[14px] text-gray-900">
              <h3 className="text-gray-900 cursor-pointer hover:text-gray-600 transition-colors flex-shrink-0">
                subject:
              </h3>
              <h3 className="text-gray-900 cursor-pointer hover:text-gray-600 transition-colors break-words">
                {post.subject}
              </h3>
            </div>

            <p className="text-gray-700 mb-3 leading-relaxed text-xs sm:text-[12px] break-words">
              {post?.content}
            </p>

            {/* Add quoted post section with proper timer display */}
            {post.isQuotePost && post.quotedPostSnapshot && (
              <div className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
                {/* Quoted post categories */}
                <div className="flex items-start gap-2 mb-1 text-xs sm:text-sm text-gray-600">
                  <span className="flex-shrink-0">cc:</span>
                  <span className="break-words">
                    {post.quotedPostSnapshot.categories?.join(", ")}
                  </span>
                </div>

                {/* Quoted post subject */}
                <div className="flex gap-2 mb-1 text-xs sm:text-sm text-gray-600">
                  <span className="flex-shrink-0">subject:</span>
                  <span className="break-words">
                    {post.quotedPostSnapshot.subject}
                  </span>
                </div>

                {/* Quoted post content */}
                <p className="text-xs sm:text-sm text-gray-700 mb-2 break-words">
                  {post.quotedPostSnapshot.content}
                </p>

                {/* Quoted post stats and user info */}
                <div className="flex items-center justify-between text-xs text-gray-500 gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Heart size={12} />
                      {post.quotedPostSnapshot.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle size={12} />
                      {post.quotedPostSnapshot.commentsCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bookmark size={12} />
                      {post.quotedPostSnapshot.saves}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span>@{post.quotedPostSnapshot.userDisplayName}</span>
                    <span>·</span>
                    <span>{post.quotedPostSnapshot.timeAgo}</span>
                  </div>
                </div>

                {/* Add threshold/chatroom timer for quoted post - FIXED */}
                <div className="mt-2 pt-2 border-t border-gray-200">
                  {post.quotedPostSnapshot.thresholdMet ? (
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{formatThresholdMetTimeAgo()}</span>
                      <ChatroomTimer
                        post={post.quotedPostSnapshot}
                        formatTimeRemaining={formatTimeRemaining}
                      // Don't pass onJoinChatroom since this is just a preview
                      />
                    </div>
                  ) : (
                    <ThresholdCountdown
                      post={post.quotedPostSnapshot}
                      formatTimeRemaining={formatTimeRemaining}
                    />
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              {user.userType === "couple" ? (
                <div className="flex items-center space-x-4 sm:space-x-6">
                  <button
                    onClick={() => handlePostLike(post.id)}
                    className={`flex items-center space-x-2 transition-colors duration-300 cursor-pointer ${isAuthenticated && likedPosts.has(post.id)
                      ? "text-red-600"
                      : "text-gray-600 hover:text-red-600"
                      }`}
                  >
                    <span className="text-sm">{post.likes} Likes</span>
                  </button>

                  <button
                    onClick={() => handlePostSave(post.id)}
                    className={`flex items-center space-x-2 transition-colors duration-300 cursor-pointer ${isAuthenticated && savedPosts.has(post.id)
                      ? "text-blue-600"
                      : "text-gray-600 hover:text-blue-600"
                      }`}
                  >
                    <span className="text-sm">{post.saves} Saves</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4 sm:space-x-6">
                  <button
                    onClick={() => handlePostLike(post.id)}
                    className={`flex items-center space-x-2 transition-colors duration-300 cursor-pointer ${isAuthenticated && likedPosts.has(post.id)
                      ? "text-red-600"
                      : "text-gray-600 hover:text-red-600"
                      }`}
                  >
                    <Heart
                      size={16}
                      className={
                        isAuthenticated && likedPosts.has(post.id)
                          ? "fill-red-600 text-red-600"
                          : ""
                      }
                    />
                    <span className="text-sm">{post.likes}</span>
                  </button>

                  <button
                    onClick={() => handlePostSave(post.id)}
                    className={`flex items-center space-x-2 transition-colors duration-300 cursor-pointer ${isAuthenticated && savedPosts.has(post.id)
                      ? "text-blue-600"
                      : "text-gray-600 hover:text-blue-600"
                      }`}
                  >
                    <Bookmark
                      size={16}
                      className={
                        isAuthenticated && savedPosts.has(post.id)
                          ? "fill-blue-600 text-blue-600"
                          : ""
                      }
                    />
                    <span className="text-sm">{post.saves}</span>
                  </button>
                </div>
              )}

              <div className="flex items-center space-x-4">
                <button
                  onClick={handleShareClick}
                  className="text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
                >
                  <Share2 size={16} />
                </button>
                <button
                  onClick={handleInfoClick}
                  className="text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
                >
                  <Info size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="w-[90%] h-px bg-gray-200 mx-4"></div>

        {/* Only show timer warning for authenticated users */}
        {isAuthenticated &&
          post?.commentsEnabled &&
          post?.chatroomData?.timeRemaining != null && (
            <div className="mt-4 mx-4 text-xs flex items-center space-x-2">
              <Clock size={16} className="flex-shrink-0" />
              {post?.chatroomData?.timeRemaining > 0 ? (
                <span className="text-red-600">
                  Replies close in{" "}
                  <span className="font-semibold">
                    {formatTimeRemaining(post.chatroomData.timeRemaining)}
                  </span>{" "}
                  to read-only
                </span>
              ) : (
                <span className="text-gray-600">
                  This chatroom is now{" "}
                  <span className="font-semibold">read-only</span>
                </span>
              )}
            </div>
          )}

        <div className="bg-white pb-20 sm:pb-24">
          <div className="bg-white">
            <div className="px-4 sm:px-6 py-4">
              {/* Show different messages for authenticated vs unauthenticated users */}
              {!isAuthenticated ? (
                // FIXED: Show comments for unauthenticated users, but with sign-in prompt at bottom
                comments.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle
                      size={48}
                      className="mx-auto text-gray-300 mb-4"
                    />
                    <p className="text-gray-500 text-sm mb-4">
                      No comments yet.
                    </p>
                    <p className="text-gray-500 text-sm mb-4">
                      Sign in to participate in discussions
                    </p>
                    <button
                      onClick={redirectToLogin}
                      className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Sign In
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-6">
                      {comments.map((message) => (
                        <ChatMessage
                          key={message.id}
                          message={message}
                          onReply={handleReply}
                          onLike={handleLikeComment}
                          onUpdateComment={handleUpdateComment}
                          onDeleteComment={handleDeleteComment}
                          expandedReplies={expandedReplies}
                          onToggleReplies={toggleReplies}
                          isAuthenticated={isAuthenticated}
                        />
                      ))}
                    </div>
                  </>
                )
              ) : comments.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle
                    size={48}
                    className="mx-auto text-gray-300 mb-4"
                  />
                  <p className="text-gray-500 text-sm">
                    No comments yet. Be the first to share your thoughts!
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {comments.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      onReply={handleReply}
                      onLike={handleLikeComment}
                      onUpdateComment={handleUpdateComment}
                      onDeleteComment={handleDeleteComment}
                      expandedReplies={expandedReplies}
                      onToggleReplies={toggleReplies}
                      isAuthenticated={isAuthenticated}
                    />
                  ))}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Only show chat input for authenticated users */}
          {isAuthenticated &&
            post?.commentsEnabled &&
            // Only disable if timer has started AND expired
            (post?.chatroomData?.timeRemaining == null ||
              post?.chatroomData?.timeRemaining > 0) && (
              <ChatInput
                commentText={commentText}
                onChangeCommentText={handleInputChange}
                onSendMessage={handleSubmitComment}
                isSubmitting={isSubmitting}
                replyTo={replyTo}
                onCancelReply={handleCancelReply}
                mentionUsers={mentionUsers}
                showMentions={showMentions}
                onMentionSelect={handleMentionSelect}
              />
            )}
        </div>
      </div>

      {/* Only show modals for authenticated users */}
      {isAuthenticated && showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-[280px] sm:w-[250px] p-4 relative border border-gray-400">
            <button
              onClick={handleReportModalClose}
              className="absolute cursor-pointer top-2 right-4 text-gray-400 hover:text-gray-600 transition-colors touch-manipulation"
            >
              <X size={24} />
            </button>

            <div className="text-center">
              <p className="text-gray-600 text-xs my-3">
                Report this post for containing abuse, harassment, or spam.
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleReportSubmit}
                  className="w-full bg-black text-white py-3 px-3 rounded-3xl hover:bg-gray-600 transition-colors font-medium touch-manipulation"
                >
                  Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Only show share preview for authenticated users */}
      {isAuthenticated && showSharePreview && (
        <SharePreview post={post} onClose={handleSharePreviewClose} />
      )}
    </div>
  );
};

export default ChatroomClient;
