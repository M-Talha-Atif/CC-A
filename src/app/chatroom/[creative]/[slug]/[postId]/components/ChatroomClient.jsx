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
  votePoll,
} from "../../../../../../../action.js";
import { toast, Toaster } from "sonner";
import ChatMessage from "../../../../../(protected)/feed/chatroom/components/ChatMessage.jsx";
import ChatInput from "../../../../../(protected)/feed/chatroom/components/ChatInput.jsx";
import useUserStore from "../../../../../../store/userStore.js";
import SharePreview from "@/app/(protected)/feed/components/SharePreview.jsx";
import {
  getTimeAgo,
  LinkifyText,
  ThresholdCountdown,
} from "@/app/(protected)/feed/components/Post.jsx";
import ChatroomTimer from "../../../../../(protected)/feed/chatroom/components/ChatroomTimer.jsx";

import QuoteNewIcon from "@/components/QuoteNewIcon";
import ShareIcon from "@/components/ShareIcon";
import ChatIcon from "@/components/ChatIcon";
import HeartIcon from "@/components/HeartIcon";
import SaveIcon from "@/components/SaveIcon";
import InfoIcon from "@/components/InfoIcon";

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
  const { creative, slug, postId } = useParams();
  const router = useRouter();
  const inputRef = useRef(null);
  const { user, isAuthenticated } = useUserStore();
  const pageTopRef = useRef(null);

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
  const [firstCommenterUsername, setFirstCommenterUsername] = useState(null);

  // Add these new states for missing functionality
  const [showSharePreview, setShowSharePreview] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingCommentId, setReportingCommentId] = useState(null); // NEW: Track which comment is being reported
  const [voting, setVoting] = useState({});
  const [fetchError, setFetchError] = useState(null);

  // NEW: Add states for vote editing window (30 seconds like feed page)
  const [editableVotes, setEditableVotes] = useState(new Set());
  const [voteTimestamps, setVoteTimestamps] = useState({});

  const isCoupleUser = () => {
    return user?.userType === "couple";
  };

  const isCurrentUserPost = () => {
    return isAuthenticated && user && post && user.id === post.userId;
  };

  // Auto-scroll to top when component mounts or postId changes - mobile optimized
  useEffect(() => {
    const scrollToTop = () => {
      // Multiple fallback approaches for maximum mobile compatibility
      try {
        // Method 1: Try scrollIntoView first (most reliable on modern browsers)
        if (pageTopRef.current) {
          pageTopRef.current.scrollIntoView({
            behavior: "auto", // Use 'auto' instead of 'smooth' for better mobile support
            block: "start",
            inline: "nearest",
          });
          return;
        }
      } catch (e) {
        console.warn("scrollIntoView failed:", e);
      }

      // Method 2: Fallback to window.scrollTo with multiple options
      try {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: "auto", // 'auto' is more compatible than 'smooth' on older phones
        });
      } catch (e) {
        // Method 3: Final fallback for very old browsers
        try {
          window.scrollTo(0, 0);
        } catch (finalError) {
          // Method 4: Last resort - set scroll properties directly
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }
      }
    };

    // Use setTimeout to ensure DOM is fully rendered before scrolling
    const timeoutId = setTimeout(scrollToTop, 10);

    return () => clearTimeout(timeoutId);
  }, [postId]);

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
    const intervals = [];

    // Check if voteTimestamps has entries and handle both Map and object structures
    const timestampEntries =
      voteTimestamps instanceof Map
        ? Array.from(voteTimestamps.entries())
        : Object.entries(voteTimestamps || {});

    if (timestampEntries.length > 0) {
      timestampEntries.forEach(([postId, timestamp]) => {
        const timeElapsed = Date.now() - timestamp;
        const remainingTime = 30000 - timeElapsed; // 30 seconds

        console.log(`Vote timer check for post ${postId}:`, {
          timestamp,
          timeElapsed,
          remainingTime,
          isStillEditable: remainingTime > 0,
        });

        if (remainingTime > 0) {
          const timeoutId = setTimeout(() => {
            console.log(`Vote edit window expired for post ${postId}`);
            setEditableVotes((prev) => {
              const newSet = new Set(prev);
              newSet.delete(postId);
              return newSet;
            });
            setVoteTimestamps((prev) => {
              if (prev instanceof Map) {
                const newMap = new Map(prev);
                newMap.delete(postId);
                return newMap;
              } else {
                const newObj = { ...prev };
                delete newObj[postId];
                return newObj;
              }
            });
          }, remainingTime);

          intervals.push(timeoutId);
        } else {
          // Time has already expired, clean up immediately
          setEditableVotes((prev) => {
            const newSet = new Set(prev);
            newSet.delete(postId);
            return newSet;
          });
          setVoteTimestamps((prev) => {
            if (prev instanceof Map) {
              const newMap = new Map(prev);
              newMap.delete(postId);
              return newMap;
            } else {
              const newObj = { ...prev };
              delete newObj[postId];
              return newObj;
            }
          });
        }
      });
    }

    return () => {
      intervals.forEach(clearTimeout);
    };
  }, [voteTimestamps]);

  // NEW FUNCTION: Extract first commenter username from comments
  const extractFirstCommenterUsername = (commentsData) => {
    if (
      !commentsData ||
      !commentsData.comments ||
      commentsData.comments.length === 0
    ) {
      return null;
    }

    // Find the earliest comment recursively
    const getAllCommentsFlat = (comments) => {
      let allComments = [];
      comments.forEach((comment) => {
        allComments.push(comment);
        if (comment.replies && comment.replies.length > 0) {
          allComments = allComments.concat(getAllCommentsFlat(comment.replies));
        }
      });
      return allComments;
    };

    const allComments = getAllCommentsFlat(commentsData.comments);

    if (allComments.length === 0) return null;

    // Sort by creation date to find the first comment
    const sortedComments = allComments.sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );

    return (
      sortedComments[0].chatroomUsername ||
      sortedComments[0].userDisplayName ||
      sortedComments[0].username
    );
  };

  useEffect(() => {
    const initializePage = async () => {
      if (!postId) {
        console.error("Missing postId parameter");
        setFetchError("Post ID is required");
        setIsLoading(false);
        return;
      }

      let retryCount = 0;
      const maxRetries = 3;

      const fetchWithRetry = async () => {
        try {
          setFetchError(null);

          // Always try public fetch first for better compatibility
          let postData, commentsData, username;

          try {
            // First attempt: fetch public data (works for both authenticated and unauthenticated)
            console.log("Fetching public post data for postId:", postId);
            postData = await getPublicPost(postId);

            if (!postData || !postData.post) {
              throw new Error("No post data received");
            }

            // FIXED: Set complete post data including vote information
            setPost({
              ...postData.post,
              // Ensure poll data is preserved from backend
              hasVoted: postData.post.hasVoted || false,
              pollOptions: postData.post.pollOptions || [],
              totalVotes: postData.post.totalVotes || 0,
            });

            // FIXED: Only fetch comments for authenticated users
            if (isAuthenticated) {
              console.log("Fetching public comments for postId:", postId);
              commentsData = await fetchPublicComments(postId);
              setComments(commentsData?.comments || []);

              // Extract first commenter username
              const firstCommenter =
                extractFirstCommenterUsername(commentsData);
              setFirstCommenterUsername(firstCommenter);
            } else {
              // For unauthenticated users, don't fetch comments
              setComments([]);
              setFirstCommenterUsername(null);
            }

            // If user is authenticated, try to get additional data
            if (isAuthenticated) {
              try {
                // Try to get authenticated data to enhance the experience
                console.log("User is authenticated, fetching enhanced data");

                // Get username for chatroom
                const usernameResult = await getUsernameForChatroom(postId);
                if (usernameResult?.chatroomUsername) {
                  setRandomUsername(usernameResult.chatroomUsername);
                }

                const authenticatedPostData = await getPost(postId);
                if (authenticatedPostData?.post) {
                  console.log(
                    "Authenticated post data received:",
                    authenticatedPostData.post
                  );

                  const deriveHasVoted = (pollOptions) => {
                    if (!pollOptions || !Array.isArray(pollOptions))
                      return false;
                    return pollOptions.some(
                      (option) => option.isUserChoice === true
                    );
                  };

                  const calculateTotalVotes = (pollOptions) => {
                    if (!pollOptions || !Array.isArray(pollOptions)) return 0;
                    return pollOptions.reduce(
                      (total, option) => total + (option.votes || 0),
                      0
                    );
                  };

                  setPost((prevPost) => {
                    const derivedHasVoted = deriveHasVoted(
                      authenticatedPostData.post.pollOptions
                    );
                    const derivedTotalVotes = calculateTotalVotes(
                      authenticatedPostData.post.pollOptions
                    );

                    const updatedPost = {
                      ...prevPost,
                      ...authenticatedPostData.post,
                      hasVoted: derivedHasVoted,
                      pollOptions:
                        authenticatedPostData.post.pollOptions ||
                        prevPost.pollOptions ||
                        [],
                      totalVotes: derivedTotalVotes,
                    };

                    console.log("Final post state being set:", {
                      hasVoted: updatedPost.hasVoted,
                      derivedFromOptions: derivedHasVoted,
                      userChoice: updatedPost.pollOptions?.find(
                        (opt) => opt.isUserChoice
                      ),
                      totalVotes: updatedPost.totalVotes,
                      voteTimestamp: updatedPost.voteTimestamp, // NEW: Log vote timestamp
                    });

                    return updatedPost;
                  });

                  // CRITICAL FIX: Set up vote editing window if user has voted and timestamp is available
                  if (
                    authenticatedPostData.post.hasVoted &&
                    authenticatedPostData.post.voteTimestamp
                  ) {
                    const now = Date.now();
                    const voteTime = authenticatedPostData.post.voteTimestamp;
                    const timeElapsed = now - voteTime;

                    console.log("Vote timing info:", {
                      voteTime,
                      now,
                      timeElapsed,
                      isWithin30s: timeElapsed < 30000,
                    });

                    // Only set as editable if within 30 second window
                    if (timeElapsed < 30000) {
                      console.log(
                        "Vote is still editable, setting up edit states"
                      );
                      setEditableVotes(
                        new Set([authenticatedPostData.post.id])
                      );
                      setVoteTimestamps(
                        new Map([[authenticatedPostData.post.id, voteTime]])
                      );

                      // Set up automatic removal after remaining time
                      const remainingTime = 30000 - timeElapsed;
                      setTimeout(() => {
                        console.log(
                          "Vote edit window expired, removing editable state"
                        );
                        setEditableVotes((prev) => {
                          const newSet = new Set(prev);
                          newSet.delete(authenticatedPostData.post.id);
                          return newSet;
                        });
                        setVoteTimestamps((prev) => {
                          const newMap = new Map(prev);
                          newMap.delete(authenticatedPostData.post.id);
                          return newMap;
                        });
                      }, remainingTime);
                    } else {
                      console.log("Vote edit window has expired");
                    }
                  }
                }

                // Try to get full authenticated comments
                const authenticatedCommentsData = await fetchComments(postId);
                if (authenticatedCommentsData?.comments) {
                  setComments(authenticatedCommentsData.comments);

                  // Update first commenter username with authenticated data
                  const firstCommenter = extractFirstCommenterUsername(
                    authenticatedCommentsData
                  );
                  setFirstCommenterUsername(firstCommenter);

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

                  const likedIds = getAllCommentIds(
                    authenticatedCommentsData.comments
                  );
                  setLikedComments(new Set(likedIds));
                }

                // Set liked and saved states for authenticated users
                if (authenticatedPostData?.post?.isLiked) {
                  setLikedPosts(new Set([authenticatedPostData.post.id]));
                }
                if (authenticatedPostData?.post?.isSaved) {
                  setSavedPosts(new Set([authenticatedPostData.post.id]));
                }
              } catch (authError) {
                console.warn(
                  "Failed to fetch authenticated data, using public data:",
                  authError
                );
                // Continue with public data - don't throw error
              }
            }

            setIsLoading(false);
            return; // Success!
          } catch (publicError) {
            console.error("Public fetch failed:", publicError);

            // If public fetch fails and user is authenticated, try authenticated fetch as fallback
            if (isAuthenticated) {
              try {
                console.log("Falling back to authenticated fetch");
                postData = await getPost(postId);

                if (!postData || !postData.post) {
                  throw new Error(
                    "No post data received from authenticated fetch"
                  );
                }

                // CRITICAL FIX: Set complete post data including vote information from fallback
                setPost({
                  ...postData.post,
                  // Ensure poll data is preserved from backend fallback
                  hasVoted: postData.post.hasVoted || false,
                  pollOptions: postData.post.pollOptions || [],
                  totalVotes: postData.post.totalVotes || 0,
                });

                const usernameResult = await getUsernameForChatroom(postId);
                if (usernameResult?.chatroomUsername) {
                  setRandomUsername(usernameResult.chatroomUsername);
                }

                commentsData = await fetchComments(postId);
                setComments(commentsData?.comments || []);

                // Extract first commenter username from fallback data
                const firstCommenter =
                  extractFirstCommenterUsername(commentsData);
                setFirstCommenterUsername(firstCommenter);

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

                const likedIds = getAllCommentIds(commentsData?.comments || []);
                setLikedComments(new Set(likedIds));

                if (postData.post.isLiked) {
                  setLikedPosts(new Set([postData.post.id]));
                }
                if (postData.post.isSaved) {
                  setSavedPosts(new Set([postData.post.id]));
                }

                // CRITICAL: Initialize vote states from fallback data with proper timing
                if (
                  postData.post.hasVoted &&
                  postData.post.voteTimestamp &&
                  postData.post.pollOptions
                ) {
                  const now = Date.now();
                  const voteTime = postData.post.voteTimestamp;
                  const timeElapsed = now - voteTime;

                  console.log("Fallback vote timing info:", {
                    voteTime,
                    now,
                    timeElapsed,
                    isWithin30s: timeElapsed < 30000,
                  });

                  if (timeElapsed < 30000) {
                    console.log("Fallback: Vote is still editable");
                    setEditableVotes(new Set([postData.post.id]));
                    setVoteTimestamps(new Map([[postData.post.id, voteTime]]));

                    // Set up automatic removal after remaining time
                    const remainingTime = 30000 - timeElapsed;
                    setTimeout(() => {
                      console.log("Fallback: Vote edit window expired");
                      setEditableVotes((prev) => {
                        const newSet = new Set(prev);
                        newSet.delete(postData.post.id);
                        return newSet;
                      });
                      setVoteTimestamps((prev) => {
                        const newMap = new Map(prev);
                        newMap.delete(postData.post.id);
                        return newMap;
                      });
                    }, remainingTime);
                  }
                }

                setIsLoading(false);
                return; // Success!
              } catch (authFallbackError) {
                console.error(
                  "Authenticated fallback also failed:",
                  authFallbackError
                );
                throw authFallbackError; // Re-throw to trigger retry logic
              }
            } else {
              throw publicError; // Re-throw to trigger retry logic
            }
          }
        } catch (error) {
          console.error(`Fetch attempt ${retryCount + 1} failed:`, error);

          retryCount++;

          if (retryCount < maxRetries) {
            console.log(`Retrying... attempt ${retryCount + 1}/${maxRetries}`);
            // Exponential backoff: wait 1s, then 2s, then 4s
            const delay = Math.pow(2, retryCount - 1) * 1000;
            await new Promise((resolve) => setTimeout(resolve, delay));
            return fetchWithRetry();
          } else {
            console.error("All fetch attempts failed:", error);
            setFetchError(
              error.message ||
                "Failed to load post. Please check your connection and try again."
            );
            setIsLoading(false);
          }
        }
      };

      await fetchWithRetry();
    };

    initializePage();
  }, [postId, isAuthenticated]);

  // Helper function to add comment to the tree structure
  const addCommentToTree = (comments, newComment) => {
    if (!newComment.parentCommentId) {
      // It's a top-level comment
      return [...comments, newComment];
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

  const handleQuoteBoxClick = (quotedPost) => {
    // Generate slug from the quoted post subject
    const generateSlug = (text) => {
      return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "") // Remove special chars
        .replace(/\s+/g, "-") // Replace spaces with -
        .replace(/--+/g, "-") // Replace multiple - with single -
        .trim();
    };

    // Create the URL path
    const slug = generateSlug(quotedPost.subject);
    const categoriesPath = quotedPost.categories
      .map((category) =>
        category
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "") // Remove special characters except spaces and hyphens
          .replace(/\s+/g, "-") // Convert spaces to hyphens
          .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
          .trim()
      )
      .filter((category) => category.length > 0) // Remove empty categories
      .join("-");

    // Navigate to the quoted post's chatroom
    const url = `/${categoriesPath}/${slug}/${quotedPost.id}`;
    router.push(url);
  };

  const handlePollVote = requireAuth(async (postId, optionIndex) => {
    try {
      setVoting((prev) => ({ ...prev, [postId]: true }));

      const result = await votePoll(postId, optionIndex);

      // CRITICAL: Use the complete response from backend
      setPost((prevPost) => ({
        ...prevPost,
        hasVoted: result.hasVoted || true,
        pollOptions: result.pollOptions || prevPost.pollOptions,
        totalVotes: result.totalVotes || prevPost.totalVotes,
      }));

      // Set up 30-second edit window with the returned timestamp
      const voteTime = result.voteTimestamp || Date.now();
      console.log("Setting up vote edit window with timestamp:", voteTime);

      setEditableVotes((prev) => new Set([...prev, postId]));
      setVoteTimestamps((prev) => {
        const currentMap = prev instanceof Map ? prev : new Map();
        return new Map([...currentMap, [postId, voteTime]]);
      });

      // Auto-remove from editable votes after 30 seconds
      setTimeout(() => {
        console.log("Vote edit window expired for post:", postId);
        setEditableVotes((prev) => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
        setVoteTimestamps((prev) => {
          const currentMap = prev instanceof Map ? prev : new Map();
          const newMap = new Map(currentMap);
          newMap.delete(postId);
          return newMap;
        });
      }, 30000);

      toast.success("Vote recorded successfully");
    } catch (error) {
      console.error("Failed to vote on poll:", error);
      toast.error("Failed to record vote");
    } finally {
      setVoting((prev) => ({ ...prev, [postId]: false }));
    }
  });

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
      const updatedComments = addCommentToTree(comments, result.comment);
      setComments(updatedComments);

      // NEW: If this was the first comment, update the first commenter username
      if (comments.length === 0 && !firstCommenterUsername) {
        setFirstCommenterUsername(
          result.comment.chatroomUsername ||
            result.comment.userDisplayName ||
            result.comment.username
        );
      }

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
    } catch (error) {
      console.error("Failed to post comment:", error);
      toast.error("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  });

  const handleCancelReply = () => {
    setReplyTo(null);
    // NEW: Clear reply text when canceling (auto-inputs @username)
    if (replyTo) {
      setCommentText("");
    }
  };

  const handleUpdateComment = requireAuth(async (commentId, newContent) => {
    try {
      const result = await updateComment(commentId, newContent);

      setComments((prevComments) =>
        updateCommentInTree(prevComments, commentId, (comment) => ({
          ...comment,
          content: newContent,
          isEdited: true,
        }))
      );

      toast.success(result.message || "Comment updated successfully");
    } catch (error) {
      console.error("Failed to update comment:", error);
      toast.error("Failed to update comment");
    }
  });

  const handleDeleteComment = requireAuth(async (commentId) => {
    try {
      await deleteComment(commentId);

      setComments((prevComments) =>
        removeCommentFromTree(prevComments, commentId)
      );
      toast.error("Comment deleted successfully");
    } catch (error) {
      console.error("Failed to delete comment:", error);
      toast.error("Failed to delete comment");
    }
  });

  const handleReportComment = requireAuth(async (commentId) => {
    try {
      setReportingCommentId(commentId);
      setShowReportModal(true);
    } catch (error) {
      console.error("Failed to report comment:", error);
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
      toast.error("Failed to like comment");
    }
  });

  // UPDATED: Reply handler that auto-inputs @username
  const handleReply = requireAuth((comment) => {
    setReplyTo(comment);
    // NEW: Auto-input @username for reply (as mentioned in requirements)
    const username = comment.userDisplayName || comment.username;
    setCommentText(`@${username} `);
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
    const currentPost = post;

    if (!currentPost) {
      console.error("Post not found");
      return;
    }

    // Calculate what would happen after the like/unlike
    const newLikeCount = isCurrentlyLiked
      ? currentPost.likes - 1
      : currentPost.likes + 1;

    const wouldLoseThreshold =
      isCurrentlyLiked && currentPost.thresholdMet && newLikeCount < 1;

    // Optimistic UI update
    setLikedPosts((prev) => {
      const newSet = new Set(prev);
      if (isCurrentlyLiked) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });

    setPost((prevPost) => ({
      ...prevPost,
      likes: newLikeCount,
      isLiked: !isCurrentlyLiked,
    }));

    try {
      const result = await likePost({ postId });

      // Check if the API call was successful
      if (result.success) {
        // SUCCESS: Backend accepted the like/unlike
        console.log("Like operation successful:", result);

        // Update with actual values from backend
        setLikedPosts((prev) => {
          const newSet = new Set(prev);
          if (result.liked) {
            newSet.add(postId);
          } else {
            newSet.delete(postId);
          }
          return newSet;
        });

        setPost((prevPost) => ({
          ...prevPost,
          likes: result.likes,
          isLiked: result.liked,
        }));
      } else {
        // API returned success: false, treat as error
        throw new Error(result.error || "Like operation failed");
      }
    } catch (error) {
      console.error("Failed to like post:", error);

      // Check if it's the threshold protection error
      if (
        error.message &&
        (error.message.includes("Cannot unlike") ||
          error.message.includes("threshold"))
      ) {
        toast.error(error.message);
      } else if (
        error.response?.status === 400 &&
        error.response?.data?.canUnlike === false
      ) {
        toast.error(
          error.response.data.message ||
            error.response.data.error ||
            "Cannot unlike - this like maintains the post's threshold status"
        );
      } else {
        // General error
        if (isCurrentlyLiked) {
          toast.error("Failed to unlike post.");
        } else {
          toast.error("Failed to like post.");
        }
      }

      // REVERT optimistic update for ANY error
      setLikedPosts((prev) => {
        const newSet = new Set(prev);
        // Restore original state
        if (isCurrentlyLiked) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });

      setPost((prevPost) => ({
        ...prevPost,
        likes: currentPost.likes, // Restore original count
        isLiked: isCurrentlyLiked, // Restore original liked state
      }));
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

  const handleQuoteClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isCoupleUser() && isAuthenticated) {
      router.push(`/feed/create-post?quote=${post.id}`);
    }
  };

  const handleShareClick = requireAuth((e) => {
    e.stopPropagation();
    e.preventDefault();
    setShowSharePreview(true);
  });

  const handleInfoClick = requireAuth((e) => {
    e.stopPropagation();
    e.preventDefault();
    setReportingCommentId(null); // Reset to report the post itself
    setShowReportModal(true);
  });

  const handleReportModalClose = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setShowReportModal(false);
    setReportingCommentId(null);
  };

  const handleReportSubmit = requireAuth(() => {
    const isReportingComment = reportingCommentId !== null;
    toast(`${isReportingComment ? "Comment" : "Post"} reported successfully`);
    setShowReportModal(false);
    setReportingCommentId(null);
  });

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

  const isCommentsDisabled = () => {
    const chatroomState = getChatroomState();
    return chatroomState.disabled;
  };

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

  const getChatroomState = () => {
    if (!post?.thresholdMet) {
      return { disabled: true, reason: "threshold" };
    }

    if (post?.commentsDisabledAt) {
      const disabledTime = new Date(post.commentsDisabledAt);
      const now = new Date();
      if (disabledTime <= now) {
        return { disabled: true, reason: "closed", readOnly: true };
      }
    }

    if (
      post?.chatroomData?.timerStarted &&
      post?.chatroomData?.timeRemaining > 0
    ) {
      return {
        disabled: false,
        reason: "countdown",
        timeRemaining: post.chatroomData.timeRemaining,
      };
    }

    if (
      post?.chatroomData?.timerStarted &&
      post?.chatroomData?.timeRemaining <= 0
    ) {
      return { disabled: true, reason: "expired", readOnly: true };
    }

    return { disabled: false, reason: "active" };
  };

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

  if (fetchError || !post) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-gray-600 mb-4">
            {fetchError || "Post not found or unavailable"}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setIsLoading(true);
                setFetchError(null);
                window.location.reload();
              }}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-600 transition-colors mr-2"
            >
              Try Again
            </button>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div ref={pageTopRef}></div>
      <Toaster
        position="bottom-center"
        toastOptions={{
          className: "shadow-none",
          style: {
            boxShadow: "none",
          },
        }}
      />
      <div className="max-w-4xl mx-auto">
        {isAuthenticated && !isCoupleUser() && firstCommenterUsername && (
          <>
            <div className="px-4 sm:px-6 py-2 flex items-start space-x-2">
              <span className="text-xs sm:text-[12px] font-medium text-gray-900">
                "{firstCommenterUsername}"
              </span>
              <span className="text-xs sm:text-[12px] text-gray-600">
                opened this chatroom
              </span>
            </div>
            <div className="mt-2 w-[90%] h-px bg-gray-200 mx-4"></div>
          </>
        )}

        <div className="bg-white">
          <div className="px-4 sm:px-6 pb-4 pt-2">
            <div className="flex gap-2 text-[16px] text-gray-900">
              <h3
                className="text-gray-900 cursor-pointer 
               transition-colors break-words mb-2  font-bold  max-w-[90vw]"
              >
                {post.subject}
              </h3>
            </div>
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

            <div className="text-gray-700 mb-3 leading-relaxed text-xs sm:text-[12px] break-words">
              <LinkifyText text={post?.content} onContentClick={() => {}} />
            </div>

            {/* UPDATED: Poll with 30-second edit window like feed page */}
            {post.type === "poll" && post.pollOptions && (
              <div className="sm:p-4 rounded-lg mb-4">
                {post.pollOptions.map((option, index) => {
                  const hasVoted = post.hasVoted;
                  const isUserChoice = option.isUserChoice;
                  const canEdit = editableVotes.has(post.id);
                  const isClickable = !hasVoted || canEdit;

                  return (
                    <div
                      key={index}
                      className={`w-full flex items-center justify-center gap-1 mb-2 ${
                        (hasVoted && !canEdit) || isCoupleUser()
                          ? "cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          if (!hasVoted || canEdit) {
                            if (!isCoupleUser() && isAuthenticated) {
                              handlePollVote(post.id, index);
                            }
                          }
                        }}
                        disabled={
                          voting[post.id] ||
                          (hasVoted && !canEdit) ||
                          isCoupleUser()
                        }
                        className=" flex justify-center touch-manipulation"
                        style={{ WebkitTapHighlightColor: "transparent" }}
                      >
                        <span
                          className={`text-sm text-gray-700 py-1 px-3 w-[200px] text-center rounded-full ease-in-out transition-all ${
                            hasVoted
                              ? isUserChoice
                                ? canEdit
                                  ? "bg-blue-200 text-blue-800 font-semibold border-2 border-blue-400 hover:bg-blue-300"
                                  : "bg-blue-200 text-blue-800 font-semibold"
                                : "bg-gray-200 opacity-75"
                              : isCoupleUser() || !isAuthenticated
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

                      <span className="w-[50px] mr-8 text-xs text-left text-gray-500 font-medium ">
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
                  e.stopPropagation();
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

                <p className="text-xs sm:text-sm text-gray-700 mb-2 break-words">
                  {post.quotedPostSnapshot.content}
                </p>

                {post.quotedPostSnapshot.type === "poll" &&
                  post.quotedPostSnapshot.pollOptions && (
                    <div className="sm:p-4 rounded-lg mt-3">
                      {post.quotedPostSnapshot.pollOptions.map(
                        (option, index) => {
                          return (
                            <div
                              key={index}
                              className="w-full flex items-center justify-between mb-2 cursor-not-allowed"
                            >
                              <div className="flex-1 flex justify-center">
                                <span
                                  className={`text-sm text-gray-700 py-1 w-[200px] text-center rounded-full ease-in-out transition-all ${
                                    post.quotedPostSnapshot.hasVoted
                                      ? option.isUserChoice
                                        ? "bg-blue-200 text-blue-800 font-semibold"
                                        : "bg-gray-200 opacity-75"
                                      : "bg-gray-200 opacity-75"
                                  }`}
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
                        }
                      )}
                    </div>
                  )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center justify-between">
                <div
                  className={`flex items-center ${
                    isCoupleUser() ? "space-x-0" : "space-x-3"
                  } sm:space-x-3`}
                >
                  {isCoupleUser() ? (
                    <div className="flex items-center space-x-1 text-gray-600">
                      <span className="text-sm">{post.likes} likes</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handlePostLike(post.id)}
                      className={`flex items-center space-x-1 transition-colors duration-300 cursor-pointer
        text-gray-600`}
                    >
                      <HeartIcon
                        className={
                          post.isLiked ? "fill-red-600 text-red-600" : ""
                        }
                      />
                      <span className="text-sm">
                        {post.likes > 0 && post.likes}
                      </span>
                    </button>
                  )}

                  {isCoupleUser() ? (
                    <div className="flex items-center space-x-1 ml-3 text-gray-600">
                      <span className="text-sm">{post.saves} saves</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handlePostSave(post.id)}
                      className={`flex items-center space-x-1 transition-colors text-gray-600
         duration-300 cursor-pointer `}
                    >
                      <SaveIcon
                        className={
                          post.isSaved ? "fill-blue-600 text-blue-600" : ""
                        }
                      />
                      <span className="text-sm">
                        {post.saves > 0 && post.saves}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleQuoteClick}
                  className="text-gray-600 hover:text-gray-800 transition-colors 
                flex text-sm items-center gap-1 cursor-pointer "
                >
                  {!isCoupleUser() && (
                    <QuoteNewIcon
                      size={18}
                      className="w-6 h-6 quote-logo-crisp "
                    />
                  )}

                  <span className={`ml-1 ${isCoupleUser && ""}`}>
                    {post.quotesCount > 0 && post.quotesCount}
                  </span>
                  {isCoupleUser() && "quotes"}
                </button>
                <button
                  onClick={handleShareClick}
                  className="text-gray-600 hover:text-gray-800 transition-colors cursor-pointer mx-2"
                >
                  <ShareIcon size={20} />
                </button>
                {!isCurrentUserPost() && ( // Keep this condition
                  <div className="relative">
                    <button
                      onClick={handleInfoClick}
                      className="text-gray-600 hover:text-gray-800 transition-colors 
flex text-sm items-center gap-1 cursor-pointer ml-2"
                    >
                      <InfoIcon
                        size={20}
                        className="quote-logo-crisp "
                      />
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

                        {/* Modal positioned relative to info icon */}
                        <div
                          className="absolute top-8 right-0 bg-white rounded-2xl w-[210px] p-3 py-2 border border-gray-400 shadow-xl z-[9999]"
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
                              Report this{" "}
                              {reportingCommentId ? "comment" : "post"} for
                              containing abuse, harassment, or spam.
                            </p>

                            <div className="space-y-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  handleReportSubmit();
                                }}
                                className="w-full bg-black text-white py-1 px-3 rounded-3xl hover:bg-gray-600 transition-colors font-medium touch-manipulation"
                                style={{
                                  WebkitTapHighlightColor: "transparent",
                                }}
                              >
                                Report
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="text-[9px] text-gray-600 mt-2 ">
              {formatThresholdMetTimeAgo()}
            </div>
          </div>
        </div>

        <div className="w-[90%] h-px bg-gray-200 mx-4"></div>

        {isAuthenticated && !isCoupleUser() && (
          <div className="mt-4 mx-4 text-xs flex items-center space-x-2">
            {(() => {
              const chatroomState = getChatroomState();

              if (
                chatroomState.reason === "closed" ||
                chatroomState.reason === "expired"
              ) {
                return (
                  <span className="text-gray-600 italic">
                    Replies closed{" "}
                    <span className="font-semibold">(read only)</span>
                  </span>
                );
              }

              if (chatroomState.reason === "countdown") {
                return (
                  <span className="text-red-600">
                    Replies close in{" "}
                    <span className="font-semibold">
                      {formatTimeRemaining(chatroomState.timeRemaining)}
                    </span>{" "}
                    to read-only
                  </span>
                );
              }

              return null;
            })()}
          </div>
        )}

        <div className="bg-white pb-20 sm:pb-24">
          <div className="bg-white">
            <div className="px-4 sm:px-6 pb-4">
              {!isAuthenticated ? (
                <div className="text-center py-12">
                  <MessageCircle
                    size={48}
                    className="mx-auto text-gray-300 mb-4"
                  />
                  <p className="text-gray-500 text-sm mb-4">
                    Sign in to view and participate in discussions
                  </p>
                  <button
                    onClick={redirectToLogin}
                    className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Sign In
                  </button>
                </div>
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
                      onReportComment={handleReportComment}
                      expandedReplies={expandedReplies}
                      onToggleReplies={toggleReplies}
                      isAuthenticated={isAuthenticated}
                      isLikingDisabled={(() => {
                        const chatroomState = getChatroomState();
                        return (
                          chatroomState.reason === "closed" ||
                          chatroomState.reason === "expired"
                        );
                      })()}
                      isCommentsDisabled={isCommentsDisabled}
                      isReadOnly={(() => {
                        const chatroomState = getChatroomState();
                        return chatroomState.readOnly || false;
                      })()}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {isAuthenticated && !isCoupleUser() && !isCommentsDisabled() && (
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
              inputRef={inputRef}
              isModalOpen={showReportModal || showSharePreview}
            />
          )}
        </div>
      </div>

      {/* {isAuthenticated && showReportModal && (
        <>
          <div
            className="fixed inset-0 bg-transparent z-[9998]"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleReportModalClose();
            }}
          />

          <div
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl w-[210px] p-3 py-2 border border-gray-400 shadow-xl z-[9999]"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <div className="text-center">
              <p className="text-gray-600 text-xs mb-3">
                Report this {reportingCommentId ? "comment" : "post"} for
                containing abuse, harassment, or spam.
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
      )} */}

      {isAuthenticated && showSharePreview && (
        <SharePreview post={post} onClose={handleSharePreviewClose} />
      )}
    </div>
  );
};

export default ChatroomClient;
