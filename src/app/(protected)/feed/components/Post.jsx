import React, { useState, useEffect } from "react";
import {
  Heart,
  Bookmark,
  Share2,
  Info,
  MessageCircle,
  Users,
  Clock,
  X,
  Trash2,
  MoreVertical,
  Quote,
} from "lucide-react";

import { useRouter } from "next/navigation";
import Toast from "../../../../components/Toast";
import ChatroomTimer from "../chatroom/components/ChatroomTimer";
import SharePreview from "./SharePreview";
import useUserStore from "../../../../store/userStore";
import { deletePost, fetchComments } from "../../../../../action";
import Image from "next/image";
import TimerIcon from "@/components/icons/TimerIcon";
import QuoteNewIcon from "@/components/QuoteNewIcon";
import ShareIcon from "@/components/ShareIcon";
import ChatIcon from "@/components/ChatIcon";
import HeartIcon from "@/components/HeartIcon";
import SaveIcon from "@/components/SaveIcon";
import InfoIcon from "@/components/InfoIcon";
import { toast, Toaster } from "sonner";

export const formatTimestamp = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;

  // Handle invalid dates
  if (isNaN(date.getTime()) || diffMs < 0) {
    return "Invalid date";
  }

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  // Within seconds/minutes
  if (minutes < 1) {
    return "Just now";
  } else if (minutes < 60) {
    return `${minutes}m`;
  }

  // Within hours
  else if (hours < 24) {
    return `${hours}h`;
  }

  // Within days (1-6 days)
  else if (days <= 6) {
    return `${days}d`;
  }

  // Check if it's within the same year
  const currentYear = now.getFullYear();
  const postYear = date.getFullYear();

  if (postYear === currentYear) {
    // Same year: show "Month Day"
    const options = { month: "long", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
  }

  // Different year: show "Month Day, Year"
  const options = { month: "long", day: "numeric", year: "numeric" };
  return date.toLocaleDateString("en-US", options);
};

export const LinkifyText = ({ text, onContentClick }) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  const renderTextWithLinks = (text) => {
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline break-all"
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering the content click
            }}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div
      onClick={onContentClick}
      className="text-gray-700 -mt-3 text-sm mb-2 leading-relaxed  transition-colors max-w-full overflow-hidden"
    >
      <p className="break-words whitespace-pre-wrap">
        {renderTextWithLinks(text)}
      </p>
    </div>
  );
};

export const ThresholdCountdown = ({
  post,
  formatTimeRemaining,
  currentCategory,
}) => {
  const { thresholdData } = post;

  if (!thresholdData || thresholdData.thresholdMet || !thresholdData.isActive) {
    return null;
  }

  const likesNeeded = thresholdData.requiredLikes - thresholdData.currentLikes;
  const progressPercentage =
    (thresholdData.currentLikes / thresholdData.requiredLikes) * 100;

  // Format time remaining specifically for threshold (milliseconds to readable format)
  const formatThresholdTime = (milliseconds) => {
    const totalMinutes = Math.floor(milliseconds / (1000 * 60));
    const totalHours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (totalHours > 0) {
      return `${totalHours}:${minutes} `;
    } else {
      return `${minutes} mins`;
    }
  };

  const formatThresholdTimeFoNewCategory = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex w-full justify-start mt-1 "> {/* Changed from justify-end to justify-start */}
      {currentCategory === "New" ? (
        <span className="text-[10px] flex items-center gap-0.5 text-red-600"> {/* Added text-red-600 */}
          <TimerIcon size={10} className="text-red-600" /> {/* Added className="text-red-600" */}
          {formatThresholdTimeFoNewCategory(thresholdData.timeRemaining)}
        </span>
      ) : (
        <span className="text-[10px] text-red-600">
          {formatThresholdTime(thresholdData.timeRemaining)} to meet threshold
        </span>
      )}
    </div>
  );
};

export const getTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1,
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return interval === 1
        ? `${interval} ${unit} ago`
        : `${interval} ${unit}s ago`;
    }
  }

  return "just now";
};

const Post = ({
  post,
  likedPosts,
  savedPosts,
  voting,
  handleLike,
  handleSave,
  handleVote,
  handleChatroomClick,
  formatTimeRemaining,
  handleDeletePost,
  currentCategory,
  editableVotes = new Set(),
  voteTimestamps = {},
  onPostDeleted,
}) => {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showSharePreview, setShowSharePreview] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showThresholdModal, setShowThresholdModal] = useState(false); // NEW: Threshold modal
  const [thresholdModalType, setThresholdModalType] = useState(""); // NEW: Track which action triggered modal
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [canDelete, setCanDelete] = useState(false);
  const { user, isAuthenticated } = useUserStore();

  // Check if user is couple type
  const isCouple = user?.userType === "couple";

  // Check if replies should be hidden - ONLY when current category is "Couples"
  const shouldHideReplies = currentCategory === "Couples";

  // NEW: Check if sharing/quoting should be disabled
  const shouldDisableSharing = currentCategory === "New" && !post.thresholdMet;
  const shouldDisableQuoting = currentCategory === "New" && !post.thresholdMet;

  useEffect(() => {
    setCurrentUserId(user.id);
  }, [user]);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const postCreatedAt = new Date(post.createdAt);
      const now = new Date();
      const oneHour = 1 * 60 * 60 * 1000;
      const timePassed = now - postCreatedAt;
      const remaining = oneHour - timePassed;

      if (remaining > 0) {
        setTimeRemaining(remaining);
        setCanDelete(true);
      } else {
        setTimeRemaining(0);
        setCanDelete(false);
      }
    };

    // Only calculate if user owns the post
    if (post.userId === currentUserId) {
      calculateTimeRemaining();

      // Update every minute
      const interval = setInterval(calculateTimeRemaining, 60000);
      return () => clearInterval(interval);
    }
  }, [post.createdAt, post.userId, currentUserId]);

  // FIXED: Body scroll management for modals (exclude report modal)
  useEffect(() => {
    const shouldPreventScroll = showSharePreview || showDeleteModal; // REMOVED: || showThresholdModal

    if (shouldPreventScroll) {
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
    }
  }, [showSharePreview, showDeleteModal]);

  // FIXED: Close modals on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (showReportModal) {
        setShowReportModal(false);
      }
      if (showOptionsMenu) {
        setShowOptionsMenu(false);
      }
    };

    if (showReportModal || showOptionsMenu) {
      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [showReportModal, showOptionsMenu]);

  const handleQuoteBoxClick = async (quotedPost) => {
    // Prevent multiple rapid clicks
    if (router.isReady === false) return;

    try {
      // Generate URL components once
      const generateSlug = (text) => {
        return text
          .toLowerCase()
          .replace(/[^\w\s-]/g, "") // Remove special chars
          .replace(/\s+/g, "-") // Replace spaces with -
          .replace(/--+/g, "-") // Replace multiple - with single -
          .trim();
      };

      const categoriesPath = quotedPost.categories
        .map((category) =>
          category
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .trim()
        )
        .filter((category) => category.length > 0)
        .join("-");

      const slug = generateSlug(quotedPost.subject);
      const feedUrl = `/feed/${categoriesPath}/${quotedPost.id}`;

      // Check if user is authenticated - if not, always go to feed page
      if (!isAuthenticated) {
        await router.push(feedUrl);
        return;
      }

      // Fetch comments with timeout to prevent hanging
      const fetchCommentsWithTimeout = (postId, timeout = 5000) => {
        return Promise.race([
          fetchComments(postId),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Comments fetch timeout")),
              timeout
            )
          ),
        ]);
      };

      const commentsData = await fetchCommentsWithTimeout(quotedPost.id);
      const hasComments =
        commentsData &&
        commentsData.success !== false &&
        commentsData.comments &&
        commentsData.comments.length > 0;

      // Navigate based on whether the post has comments
      if (hasComments) {
        // Post has replies - navigate to chatroom
        const chatroomUrl = `/chatroom/${categoriesPath}/${slug}/${quotedPost.id}`;
        await router.push(chatroomUrl);
      } else {
        // Post has no replies - navigate to feed page
        await router.push(feedUrl);
      }
    } catch (error) {
      console.error("Error in handleQuoteBoxClick:", error);

      // Fallback: Always redirect to feed page on any error
      const generateSlug = (text) => {
        return text
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/--+/g, "-")
          .trim();
      };

      const categoriesPath = quotedPost.categories
        .map((category) =>
          category
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .trim()
        )
        .filter((category) => category.length > 0)
        .join("-");

      const slug = generateSlug(quotedPost.subject);
      const feedUrl = `/feed/${categoriesPath}/${quotedPost.id}`;

      // Ensure navigation happens even on error
      try {
        await router.push(feedUrl);
      } catch (navError) {
        console.error("Navigation fallback failed:", navError);
        // Force page reload as last resort
        window.location.href = feedUrl;
      }
    }
  };

  const formatDeleteTimeRemaining = (milliseconds) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleContentClick = () => {
    // Only hide chatroom access when current category is Couples
    if (shouldHideReplies) {
      return null;
    }

    // CRITICAL FIX: Check if post has met threshold before allowing chatroom access
    if (!post.thresholdMet) {
      // Show error message instead of allowing click
      toast.error(
        "Chatroom access is unavailable as this post hasn't reached the threshold"
      );
      return;
    }

    if (handleChatroomClick) {
      handleChatroomClick(post);
    }
  };

  const handleActionClick = (e, action) => {
    e.stopPropagation();
    e.preventDefault();
    action();
  };

  // UPDATED: Share click handler with threshold check
  const handleShareClick = (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (shouldDisableSharing) {
      toast.error(
        "Sharing is unavailable as this post hasn't reached the threshold"
      );
      return;
    }

    setShowSharePreview(true);
  };

  // 4. Replace the handleQuoteClick function:
  const handleQuoteClick = (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (shouldDisableQuoting) {
      toast.error(
        "Quoting is unavailable as this post hasn't reached the threshold"
      );
      return;
    }

    router.push(`/feed/create-post?quote=${post.id}`);
  };

  const handleOptionsClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setShowOptionsMenu(!showOptionsMenu);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setShowOptionsMenu(false);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      // Call the delete API
      await deletePost(post.id);

      // Close the modal
      setShowDeleteModal(false);

      // Immediately update the UI by calling the onPostDeleted callback
      if (onPostDeleted) {
        onPostDeleted(post.id);
      }

      // Show success message
      toast("Post deleted successfully");
    } catch (error) {
      console.error("Failed to delete post:", error);
      toast.error("Failed to delete post");
      setShowDeleteModal(false);
    }
  };

  const handleInfoClick = (e) => {
    console.log("Info click triggered"); // Debug log
    e.stopPropagation();
    e.preventDefault();
    e.nativeEvent.stopImmediatePropagation(); // ADDED: Stop ALL propagation
    setShowReportModal(true);
  };

  const handleReportModalClose = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setShowReportModal(false);
  };

  const handleReportSubmit = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    toast("Post Reported");
    setShowReportModal(false);
  };

  const handleSharePreviewClose = () => {
    setShowSharePreview(false);
  };

  const handleThresholdModalClose = () => {
    setShowThresholdModal(false);
    setThresholdModalType("");
  };

  const handleJoinChatroom = () => {
    // First check: Prevent unauthenticated users from accessing chatrooms
    if (!isAuthenticated) {
      return;
    }

    // Only prevent chatroom access when current category is Couples
    if (shouldHideReplies) {
      return;
    }

    // CRITICAL FIX: Check if post meets threshold for chatroom access
    if (!post.thresholdMet) {
      // Post doesn't meet threshold, show error message instead of modal
      toast.error(
        "Chatroom access is unavailable as this post hasn't reached the threshold"
      );
      return;
    }

    // Post meets threshold, proceed with chatroom
    if (handleChatroomClick) {
      handleChatroomClick(post);
    }
  };

  const formatThresholdMetTimeAgo = () => {
    if (!post.thresholdMetAt) return null;
    return formatTimestamp(post.thresholdMetAt);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showOptionsMenu) {
        setShowOptionsMenu(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showOptionsMenu]);

  const isLiked = likedPosts && likedPosts.has(post.id);
  const isSaved = savedPosts && savedPosts.has(post.id);

  const isOwner = post.userId === currentUserId;

  return (
    <>
      <Toaster
        position="bottom-center"
        toastOptions={{
          className: "shadow-none",
          style: {
            boxShadow: "none",
          },
        }}
      />
      <div
        key={post.id}
        className="rounded-lg pt-4 transition-shadow duration-300 max-w-full relative"
      >
        {/* Three-dot menu - Only show for post owner and non-couples */}
        {isOwner && !post.thresholdMet && !isCouple && canDelete && (
          <div className="absolute top-8 -right-5">
            <button
              onClick={handleOptionsClick}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer rounded-full hover:bg-gray-100 touch-manipulation"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <MoreVertical size={20} />
            </button>

            {/* Options dropdown menu */}
            {showOptionsMenu && canDelete && (
              <div className="absolute top-8 right-4 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[120px] z-10">
                {canDelete && (
                  <button
                    onClick={handleDeleteClick}
                    className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors touch-manipulation"
                    style={{ WebkitTapHighlightColor: "transparent" }}
                  >
                    <Trash2 size={16} className="text-red-500" />
                    <span className="text-sm">Delete</span>
                  </button>
                )}
                {!canDelete && (
                  <div className="px-4 py-2 text-xs text-gray-400">
                    Delete unavailable
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="text-[16px] text-gray-900 leading-relaxed">
          <div className="relative">
            <p
              className={`font font-semibold break-words transition-colors ${shouldHideReplies ? "" : "cursor-pointer "
                }`}
            >
              {post.subject}
            </p>
          </div>
        </div>
        {/* Categories */}
        <div className="flex items-center gap-1 mb-4 text-[14px] text-gray-900 flex-wrap">
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

        {/* Content - Clickable with proper text wrapping, max width, and clickable links */}
        <LinkifyText text={post.content} onContentClick={() => { }} />

        {/* Poll (if poll type) */}
        {post.type === "poll" && post.pollOptions && (
          <div className="sm:p-4 rounded-lg">
            {post.pollOptions.map((option, index) => {
              const hasVoted = post.hasVoted;
              const isUserChoice = option.isUserChoice;
              const canEdit = editableVotes.has(post.id);
              const isClickable = !hasVoted || canEdit;

              return (
                <div
                  key={index}
                  className={`w-full flex items-center justify-center mb-2 ${(hasVoted && !canEdit) || isCouple
                      ? "cursor-not-allowed"
                      : "cursor-pointer"
                    }`}
                >
                  <button
                    onClick={(e) =>
                      !isCouple &&
                      isClickable &&
                      handleActionClick(e, () => handleVote(post.id, index))
                    }
                    disabled={
                      voting[post.id] || (hasVoted && !canEdit) || isCouple
                    }
                    className="flex-1 flex justify-center touch-manipulation"
                    style={{ WebkitTapHighlightColor: "transparent" }}
                  >
                    <span
                      className={`text-sm text-gray-700 py-1 px-3 w-[200px] text-center rounded-full ease-in-out transition-all break-words whitespace-normal min-h-[32px] flex items-center justify-center ${hasVoted
                          ? isUserChoice
                            ? canEdit
                              ? "bg-blue-200 text-blue-800 font-semibold border-2 border-blue-400 hover:bg-blue-300"
                              : "bg-blue-200 text-blue-800 font-semibold"
                            : "bg-gray-200 opacity-75"
                          : isCouple
                            ? "bg-gray-200 opacity-75"
                            : "bg-gray-200 hover:bg-gray-400 hover:text-white"
                        }`}
                      style={{
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                        lineHeight: "1.2",
                      }}
                    >
                      {voting[post.id] && isUserChoice ? (
                        <span className="animate-pulse">Updating...</span>
                      ) : (
                        option.text
                      )}
                    </span>
                  </button>

                  <span className="w-[50px] -ml-7 mr-20 text-xs text-left text-gray-500 font-medium">
                    {hasVoted && option.percentage !== null
                      ? `${option.percentage}%`
                      : ""}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {post.isQuotePost && post.quotedPostSnapshot && (
          <div
            className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering handleContentClick
              e.preventDefault();
              handleQuoteBoxClick(post.quotedPostSnapshot);
            }}
          >
            {/* Quoted post subject */}
            <div className="flex gap-2 mb-1  text-[14px] text-gray-600 break-words">
              <span className="max-w-[80%]">
                {post.quotedPostSnapshot.subject}
              </span>
            </div>
            {/* Quoted post categories */}
            <div className="flex items-center gap-1 mb-4 text-[10px] text-gray-600 flex-wrap">
              <span className="">cc:</span>
              {post.quotedPostSnapshot.categories.map((category, i) => (
                <span
                  key={i}
                  className="border border-gray-600 px-2  rounded-full whitespace-nowrap"
                >
                  {category}
                </span>
              ))}
            </div>

            {/* Quoted post content */}
            <div className="text-sm text-gray-700 my-1 break-words">
              <LinkifyText
                text={post.quotedPostSnapshot.content}
                onContentClick={() => { }} // Pass empty function to prevent triggering chatroom
              />
            </div>
            {post.quotedPostSnapshot.type === "poll" &&
              post.quotedPostSnapshot.pollOptions && (
                <div className="sm:p-4 rounded-lg mt-3 ">
                  {post.quotedPostSnapshot.pollOptions.map((option, index) => {
                    return (
                      <div
                        key={index}
                        className="w-full flex flex-col items-center justify-between mb-2 "
                      >
                        <div className="flex-1 flex justify-center">
                          <span
                            className={`text-sm text-gray-700 px-3 py-1 w-[200px] text-center rounded-full ease-in-out transition-all ${post.quotedPostSnapshot.hasVoted
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
                          {post.quotedPostSnapshot.hasVoted &&
                            option.percentage !== null
                            ? `${option.percentage}%`
                            : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
          </div>
        )}

        {/* Actions - Conditional rendering based on user type */}
        {isCouple || !isAuthenticated ? (
          // Couple view - Only show counts, no interactive icons
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center space-x-3">
              {/* Like count only */}
              <span className="text-sm text-gray-600">{post.likes} likes</span>

              {!shouldHideReplies && post.commentsCount > 0 && (
                <span
                  className="text-sm text-gray-600"
                  onClick={handleContentClick}
                >
                  {post.commentsCount || 0} replies
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* UPDATED: Share button with threshold check for couples */}
              <button
                onClick={handleShareClick}
                className={`transition-colors cursor-pointer p-1 touch-manipulation ${shouldDisableSharing
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-600 hover:text-gray-800"
                  }`}
                style={{ WebkitTapHighlightColor: "transparent" }}
                aria-label="Share post"
              >
                <ShareIcon />
              </button>
            </div>
          </div>
        ) : (
          // Non-couple view - Full interactive experience
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center space-x-1">
              <button
                onClick={(e) => handleActionClick(e, () => handleLike(post.id))}
                className={`flex items-center space-x-1 transition-colors duration-300
                   cursor-pointer p-1 touch-manipulation ${isLiked ? "text-red-600" : "text-gray-600"
                  }`}
                disabled={voting[post.id]}
                style={{ WebkitTapHighlightColor: "transparent" }}
                aria-label={isLiked ? "Unlike post" : "Like post"}
              >
                <HeartIcon
                  className={isLiked ? "fill-red-600 text-red-600" : ""}
                />
                <span className="text-sm">{post.likes > 0 && post.likes}</span>
              </button>

              {/* Reply/Comment button - Hidden ONLY if current category is Couples */}
              {!shouldHideReplies && post.categories[0] !== "Couples" && (
                <button
                  onClick={handleContentClick} // Use handleContentClick directly
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-700 transition-colors p-1 touch-manipulation"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                  aria-label="View comments"
                >
                  <ChatIcon size={18} />
                  {post.commentsCount > 0 && (
                    <span className="text-sm">
                      {post.commentsCount > 0 && post.commentsCount}
                    </span>
                  )}
                </button>
              )}

              {/* Save button with iOS optimizations - Always visible */}
              <button
                onClick={(e) => handleActionClick(e, () => handleSave(post.id))}
                className={`flex items-center space-x-1 transition-colors duration-300 cursor-pointer 
                  p-1 touch-manipulation ${isSaved ? "text-blue-600" : "text-gray-600"
                  }`}
                disabled={voting[post.id]}
                style={{ WebkitTapHighlightColor: "transparent" }}
                aria-label={isSaved ? "Unsave post" : "Save post"}
              >
                <SaveIcon
                  className={isSaved ? "fill-blue-600 text-blue-600" : ""}
                />
                <span className="text-sm">{post.saves > 0 && post.saves}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* UPDATED: Quote icon with threshold check */}
              <button
                onClick={handleQuoteClick}
                className={`transition-colors cursor-pointer text-xs flex items-center p-1 touch-manipulation ${shouldDisableQuoting
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-600 hover:text-gray-800"
                  }`}
                style={{ WebkitTapHighlightColor: "transparent" }}
                aria-label="Quote post"
              >
                <QuoteNewIcon size={18} className="w-6 h-6 quote-logo-crisp" />
                <span className="text-sm ml-1">
                  {post.quotesCount > 0 && post.quotesCount}
                </span>
              </button>

              {/* UPDATED: Share button with threshold check */}
              <button
                onClick={handleShareClick}
                className={`transition-colors cursor-pointer p-1 touch-manipulation ${shouldDisableSharing
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-600 hover:text-gray-800"
                  }`}
                style={{ WebkitTapHighlightColor: "transparent" }}
                aria-label="Share post"
              >
                <ShareIcon />
              </button>

              <div className="relative">
                <button
                  onClick={handleInfoClick}
                  className="text-gray-600 hover:text-gray-800 transition-colors cursor-pointer p-1 touch-manipulation"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                  aria-label="Report post"
                >
                  <InfoIcon />
                </button>

                {showReportModal && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 bg-transparent z-[9998]"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleReportModalClose();
                      }}
                    />

                    {/* Modal */}
                    <div
                      className="absolute -top-24 right-0 bg-white rounded-2xl w-[210px] p-3 py-2 border border-gray-400 shadow-xl z-[9999]"
                      style={{
                        transform: "translateX(10%)",
                        right: "40%",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                    >
                      <div className="text-center">
                        <p className="text-gray-600 text-xs mb-3">
                          Report this post for containing abuse, harassment, or
                          spam.
                        </p>

                        <div className="space-y-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleReportSubmit();
                            }}
                            className="w-full bg-black text-white py-1 px-3 rounded-3xl hover:bg-gray-600 transition-colors font-medium touch-manipulation"
                            style={{ WebkitTapHighlightColor: "transparent" }}
                          >
                            Report
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Conditional rendering: Show either threshold countdown or chatroom timer */}
        {post.thresholdMet ? (
          <span className="text-[9px] flex items-center gap-1 text-gray-600 ">
            {formatThresholdMetTimeAgo()}
          </span>
        ) : // Only show threshold countdown when replies are not hidden (i.e., not on Couples filter)
          !shouldHideReplies ? (
            <>
              <ThresholdCountdown
                post={post}
                formatTimeRemaining={formatTimeRemaining}
                currentCategory={currentCategory}
              />
            </>
          ) : null}

        {/* Recent comment - Hidden ONLY if current category is Couples */}
        {/* {!shouldHideReplies && post.recentComment && (
          <div className="py-2 rounded-lg">
            <p className="text-xs flex justify-between text-gray-500 mb-1">
              <span className="font-medium text-gray-700">
                "@{post.recentComment.userDisplayName}"
              </span>
              <span className="font-medium text-gray-400">
                {post.recentComment.timeAgo}
              </span>
            </p>
            <p className="text-sm text-gray-700 break-words">
              {post.recentComment.content}
            </p>
          </div>
        )} */}

        <div className="mt-4 w-full h-px bg-gray-300 mx-auto"></div>

        {/* Delete Confirmation Modal - Only for non-couples */}
        {showDeleteModal && !isCouple && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-[#00000080] bg-opacity-60 z-40"
              onClick={() => setShowDeleteModal(false)}
            />

            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-sm p-6 relative shadow-xl">
                {/* Close Button */}
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors touch-manipulation"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  <X size={24} />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <Trash2 size={20} className="text-red-500" />
                  <h3 className="text-lg font-semibold text-black">
                    Delete Post
                  </h3>
                </div>

                {/* Body */}
                <div className="text-gray-700 text-sm mb-6">
                  <p className="mb-3">
                    Are you sure you want to delete this post? This action
                    cannot be undone.
                  </p>
                  <p className="text-xs text-gray-500">
                    Time remaining: {formatDeleteTimeRemaining(timeRemaining)}
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 border border-gray-300 text-gray-800 py-3 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation"
                    style={{ WebkitTapHighlightColor: "transparent" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="flex-1 bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors touch-manipulation"
                    style={{ WebkitTapHighlightColor: "transparent" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* NEW: Threshold Restriction Modal */}
        {showThresholdModal && (
          <div
            className="fixed inset-0 bg-[#00000065] bg-opacity-60 z-40 flex items-center justify-center p-4"
            onClick={handleThresholdModalClose} // closes when clicking outside
          >
            {/* Modal */}
            <div
              className="bg-white rounded-2xl w-full max-w-sm p-6 relative shadow-xl z-50"
              onClick={(e) => e.stopPropagation()} // 👈 stop event bubbling inside modal
            >
              {/* Close Button */}
              <button
                onClick={handleThresholdModalClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors touch-manipulation"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                <X size={24} />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                {thresholdModalType === "sharing" ? (
                  <ShareIcon size={20} className="text-orange-500" />
                ) : (
                  <QuoteNewIcon size={18} className="text-orange-500" />
                )}
                <h3 className="text-lg font-semibold text-black">
                  {thresholdModalType === "sharing"
                    ? "Sharing Unavailable"
                    : "Quoting Unavailable"}
                </h3>
              </div>

              {/* Body */}
              <div className="text-gray-700 text-sm mb-6">
                <p className="mb-3">
                  {thresholdModalType === "sharing"
                    ? "Sharing is unavailable as this post hasn't reached the threshold"
                    : "Quoting is unavailable as this post hasn't reached the threshold"}
                </p>
                <p className="text-xs text-gray-500">
                  This post needs more engagement before it can be{" "}
                  {thresholdModalType === "sharing" ? "shared" : "quoted"}.
                </p>
              </div>

              {/* Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleThresholdModalClose}
                  className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors touch-manipulation"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Share Preview Modal */}
      {showSharePreview && (
        <SharePreview post={post} onClose={handleSharePreviewClose} />
      )}
    </>
  );
};

export default Post;
