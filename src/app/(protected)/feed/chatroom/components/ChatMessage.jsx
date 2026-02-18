"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Reply,
  Heart,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Edit2,
  Trash2,
  X,
  Check,
} from "lucide-react";
import useUserStore from "../../../../../store/userStore";
import { toast, Toaster } from "sonner";
import InfoIcon from "@/components/InfoIcon";
import ChatIcon from "@/components/ChatIcon";
import { reportComment, checkUserCommentReport } from "../../../../../../action";
import ReportButton from "./ReportButton";

const ChatMessage = ({
  message,
  onReply,
  onLike,
  onUpdateComment,
  onDeleteComment,
  isCommentsDisabled,
  isLikingDisabled,
  isReadOnly,
  onReportComment
}) => {
  const [expandedReplies, setExpandedReplies] = useState(new Set());
  const [showOptionsMenu, setShowOptionsMenu] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingComment, setDeletingComment] = useState(null);
  const [showReportModal, setShowReportModal] = useState(null);
  const editTextareaRef = useRef(null);
  const [visibleReplies, setVisibleReplies] = useState({});
  const [isReportingComment, setIsReportingComment] = useState(false);

  const { user, isAuthenticated } = useUserStore();
  const [commentReports, setCommentReports] = useState({});

  // Check report status for all comments in the thread
  useEffect(() => {
    const checkAllCommentReports = async () => {
      if (isAuthenticated) {
        const allCommentIds = [message.id];

        // Collect all reply IDs
        const collectReplyIds = (replies) => {
          if (!replies) return;
          for (const reply of replies) {
            allCommentIds.push(reply.id);
            collectReplyIds(reply.replies);
          }
        };
        collectReplyIds(message.replies || []);

        // Check each comment
        for (const commentId of allCommentIds) {
          try {
            const response = await checkUserCommentReport(commentId);
            if (response.success) {
              setCommentReports(prev => ({
                ...prev,
                [commentId]: {
                  hasReported: response.data.hasReported,
                  isOwnComment: response.data.isOwnComment || false
                }
              }));
            }
          } catch (error) {
            console.error(`Failed to check comment ${commentId} report status:`, error);
          }
        }
      }
    };

    checkAllCommentReports();
  }, [message.id, isAuthenticated]);

  const isCoupleUser = () => {
    return user?.userType === "couple";
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showOptionsMenu && !event.target.closest(".options-menu-container")) {
        setShowOptionsMenu(null);
      }
      // Removed report modal click outside handling - now handled by backdrop
    };

    if (showOptionsMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showOptionsMenu]);

  const toggleReplies = (commentId, totalReplies) => {
    setExpandedReplies((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
        setVisibleReplies((v) => ({ ...v, [commentId]: 10 }));
      }
      return newSet;
    });
  };

  const loadMoreReplies = (commentId, totalReplies) => {
    setVisibleReplies((prev) => {
      const next = Math.min((prev[commentId] || 10) + 10, totalReplies);
      return { ...prev, [commentId]: next };
    });
  };

  const flattenReplies = (replies, depth = 1, visibleCount = 10) => {
    const result = [];
    const shown = replies.slice(0, visibleCount);

    for (const reply of shown) {
      result.push({
        ...reply,
        depth,
      });
      if (reply.replies && reply.replies.length > 0) {
        result.push(...flattenReplies(reply.replies, depth + 1, visibleCount));
      }
    }

    if (visibleCount < replies.length) {
      result.push({
        id: `more-replies-${depth}-${visibleCount}`,
        isMoreReplies: true,
        remaining: replies.length - visibleCount,
        depth,
      });
    }

    return result;
  };

  const isCurrentUser = message.userId === user.id;

  const handleEditClick = (comment) => {
    if (isReadOnly) return;
    setEditingComment(comment.id);
    setEditContent(comment.content);
    setShowOptionsMenu(null);
    setTimeout(() => {
      editTextareaRef.current?.focus();
    }, 0);
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditContent("");
  };

  const handleSaveEdit = async (commentId) => {
    if (!editContent.trim() || isUpdating || isReadOnly) return;

    setIsUpdating(true);
    try {
      await onUpdateComment(commentId, editContent.trim());
      setEditingComment(null);
      setEditContent("");
      setShowOptionsMenu(null);
    } catch (error) {
      console.error("Failed to update comment:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClick = async (commentId) => {
    if (isReadOnly) return;

    setDeletingComment(commentId);
    try {
      await onDeleteComment(commentId);
      setShowOptionsMenu(null);
    } catch (error) {
      console.error("Failed to delete comment:", error);
    } finally {
      setDeletingComment(null);
    }
  };

  const handleReportClick = (commentId) => {
    console.log("=== REPORT CLICK DEBUG ===");
    console.log("Comment ID:", commentId);
    console.log("Is Authenticated:", isAuthenticated);
    setShowReportModal(commentId);
  };

  const handleReportSubmit = async (commentId) => {
    console.log("=== handleReportSubmit START ===");
    console.log("Comment ID:", commentId);
    console.log("Current reports state:", commentReports[commentId]);

    // Prevent double submission
    if (isReportingComment) {
      console.log("Already reporting, preventing duplicate submission");
      return;
    }

    setIsReportingComment(true);

    try {
      // Check local state first
      const currentReportStatus = commentReports[commentId];
      if (currentReportStatus) {
        if (currentReportStatus.isOwnComment) {
          toast.error("You cannot report your own comment");
          setShowReportModal(null);
          setIsReportingComment(false);
          return;
        }
        if (currentReportStatus.hasReported) {
          toast.error("You have already reported this comment");
          setShowReportModal(null);
          setIsReportingComment(false);
          return;
        }
      }

      // Double-check with API
      console.log("Checking report status from API...");
      const checkResult = await checkUserCommentReport(commentId);
      console.log("Check result:", checkResult);

      if (checkResult.success) {
        const isOwn = checkResult.data.isOwnComment || false;
        const hasReported = checkResult.data.hasReported || false;

        // Update local state
        setCommentReports(prev => ({
          ...prev,
          [commentId]: {
            hasReported,
            isOwnComment: isOwn
          }
        }));

        if (isOwn) {
          toast.error("You cannot report your own comment");
          setShowReportModal(null);
          setIsReportingComment(false);
          return;
        }

        if (hasReported) {
          toast.error("You have already reported this comment");
          setShowReportModal(null);
          setIsReportingComment(false);
          return;
        }
      }

      // Proceed with actual report submission
      console.log("Calling reportComment API...");
      const response = await reportComment(commentId);
      console.log("Report response:", response);

      if (response.success) {
        // Update the specific comment's report status
        setCommentReports(prev => ({
          ...prev,
          [commentId]: {
            ...prev[commentId],
            hasReported: true
          }
        }));
        toast.success("Comment reported successfully");
      } else {
        if (response.error === "You cannot report your own comment") {
          setCommentReports(prev => ({
            ...prev,
            [commentId]: {
              ...prev[commentId],
              isOwnComment: true
            }
          }));
          toast.error("You cannot report your own comment");
        } else if (response.error === "You have already reported this comment") {
          setCommentReports(prev => ({
            ...prev,
            [commentId]: {
              ...prev[commentId],
              hasReported: true
            }
          }));
          toast.error("You have already reported this comment");
        } else {
          toast.error(response.error || "Failed to report comment");
        }
      }
    } catch (error) {
      console.error("Report submission failed:", error);
      toast.error("Failed to report comment");
    } finally {
      setIsReportingComment(false);
      setShowReportModal(null);
    }
  };

  const findCommentContentById = (id) => {
    if (message.id === id) return message.content;
    const flat = flattenReplies(message.replies || []);
    const found = flat.find((r) => r.id === id);
    return found?.content || "";
  };

  function countAllReplies(replies) {
    if (!replies || replies.length === 0) return 0;
    let total = 0;
    for (const reply of replies) {
      total += 1;
      total += countAllReplies(reply.replies);
    }
    return total;
  }

  const OwnerOptionsMenu = ({ commentId, onClose }) => (
    <div className="options-menu-container absolute top-0 -right-2 mt-6 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
      <button
        onClick={() =>
          handleEditClick({
            id: commentId,
            content: findCommentContentById(commentId),
          })
        }
        disabled={isReadOnly}
        className={`w-full px-4 py-2 text-left text-sm flex items-center space-x-2 ${isReadOnly
          ? "text-gray-600 cursor-not-allowed"
          : "text-gray-700 hover:bg-gray-50"
          }`}
      >
        <Edit2 size={14} />
        <span>Edit</span>
      </button>
      <button
        onClick={() => handleDeleteClick(commentId)}
        disabled={deletingComment === commentId || isReadOnly}
        className={`w-full px-4 py-2 text-left text-sm flex items-center space-x-2 ${deletingComment === commentId || isReadOnly
          ? "text-gray-600 cursor-not-allowed"
          : "text-red-600 hover:bg-red-50"
          }`}
      >
        {deletingComment === commentId ? (
          <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <Trash2 size={14} />
        )}
        <span>Delete</span>
      </button>
    </div>
  );

  const CharacterCounter = ({ text, maxLength = 250 }) => {
    const remaining = maxLength - text.length;
    const isOverLimit = remaining < 0;

    return (
      <div
        className={`text-xs ${isOverLimit
          ? "text-red-500"
          : remaining < 20
            ? "text-orange-500"
            : "text-gray-500"
          }`}
      >
        {remaining < 0
          ? `${Math.abs(remaining)} characters over limit`
          : `${remaining} characters remaining`}
      </div>
    );
  };

  const renderEditForm = (commentId, content) => (
    <div className="space-y-2 w-[79vw]">
      <textarea
        ref={editTextareaRef}
        value={editContent}
        onChange={(e) => setEditContent(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-transparent"
        rows={2}
        maxLength={250}
        placeholder="Edit your comment..."
        disabled={isReadOnly}
      />
      <div className="flex items-center justify-between w-full">
        <CharacterCounter text={editContent} />
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCancelEdit}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <X size={16} />
          </button>
          <button
            onClick={() => handleSaveEdit(commentId)}
            disabled={
              !editContent.trim() ||
              editContent.length > 250 ||
              isUpdating ||
              isReadOnly
            }
            className={`px-3 py-1 text-sm rounded transition-colors ${editContent.trim() &&
              editContent.length <= 250 &&
              !isUpdating &&
              !isReadOnly
              ? "text-blue-600 hover:text-blue-800"
              : "text-gray-400 cursor-not-allowed"
              }`}
          >
            {isUpdating ? (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check size={16} />
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const LoadingSpinner = () => (
    <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
  );

  const replyCount = countAllReplies(message.replies || []);

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
        className={`mb-4 mr-8 ${deletingComment === message.id ? "opacity-60" : ""
          }`}
      >
        <div className={`flex "justify-start`}>
          <div className={`max-w-[80%] order-1`}>
            <div className={`flex items-center mb-1 justify-start`}>
              <span className="text-xs font-medium text-gray-600">
                {message.userDisplayName}
              </span>
              <span className="text-xs text-gray-400 ml-2">
                {message.timeAgo}
              </span>
              {deletingComment === message.id && (
                <div className="ml-2 flex items-center space-x-1">
                  <LoadingSpinner />
                  <span className="text-xs text-gray-500">Deleting...</span>
                </div>
              )}
            </div>

            <div className="relative p-3 rounded-2xl bg-white text-gray-800">
              {message.replyTo && (
                <div className="text-xs mb-2 opacity-75 text-gray-500">
                  <span className="font-medium">
                    @{message.replyTo.username}
                  </span>
                  <span className="ml-1">{message.replyTo.preview}</span>
                </div>
              )}

              {editingComment === message.id ? (
                renderEditForm(message.id, message.content)
              ) : (
                <p className="text-sm leading-relaxed">{message.content}</p>
              )}

              {editingComment !== message.id && (
                <div className="flex items-center justify-between text-gray-500 w-[79vw]">
                  <div className="flex items-center space-x-4">
                    {!isCoupleUser() ? (
                      <button
                        onClick={() => onLike(message.id)}
                        disabled={deletingComment === message.id}
                        className="hover:opacity-70 transition-opacity flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Heart
                          size={16}
                          className={
                            message.isLiked ? "fill-red-500 text-red-500" : "text-gray-500"
                          }
                        />
                        {message.likes > 0 && (
                          <span className="text-xs text-gray-800">{message.likes}</span>
                        )}
                      </button>
                    ) : (
                      message.likes > 0 && (
                        <div className="flex items-center space-x-1 text-gray-500">
                          <span className="text-xs text-gray-800">
                            {message.likes}{" "}
                            {message.likes === 1 ? "like" : "likes"}
                          </span>
                        </div>
                      )
                    )}

                    {/* Read-only mode */}
                    {isReadOnly ? (
                      !isCurrentUser && (
                        <ReportButton
                          commentId={message.id}
                          isOwnComment={commentReports[message.id]?.isOwnComment || false}
                          hasReported={commentReports[message.id]?.hasReported || false}
                          isReporting={isReportingComment}
                          showModal={showReportModal}
                          onOpenModal={handleReportClick}
                          onCloseModal={() => setShowReportModal(null)}
                          onReport={handleReportSubmit}
                          position="left"
                        />
                      )
                    ) : (
                      /* Active mode */
                      <>
                        {!isCoupleUser() && (
                          <button
                            onClick={() => onReply(message)}
                            disabled={deletingComment === message.id}
                            className="hover:opacity-70 transition-opacity disabled:opacity-50 text-gray-500 disabled:cursor-not-allowed flex items-center space-x-1"
                          >
                            <ChatIcon size={16} className="text-gray-500" />
                            {replyCount > 0 && (
                              <span className="text-xs text-gray-800">{replyCount}</span>
                            )}
                          </button>
                        )}

                        {!isCurrentUser && (
                          <ReportButton
                            commentId={message.id}
                            isOwnComment={commentReports[message.id]?.isOwnComment || false}
                            hasReported={commentReports[message.id]?.hasReported || false}
                            isReporting={isReportingComment}
                            showModal={showReportModal}
                            onOpenModal={handleReportClick}
                            onCloseModal={() => setShowReportModal(null)}
                            onReport={handleReportSubmit}
                            position="right"
                          />
                        )}
                      </>
                    )}
                  </div>

                  {/* Owner options menu */}
                  <div className="flex items-center space-x-2">
                    {isCurrentUser && !isReadOnly && (
                      <div className="options-menu-container relative">
                        <button
                          onClick={() =>
                            setShowOptionsMenu(
                              showOptionsMenu === message.id ? null : message.id
                            )
                          }
                          disabled={deletingComment === message.id}
                          className="hover:opacity-70 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <MoreHorizontal size={14} />
                        </button>
                        {showOptionsMenu === message.id && (
                          <OwnerOptionsMenu
                            commentId={message.id}
                            onClose={() => setShowOptionsMenu(null)}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* REPLIES SECTION */}
            {message.replies && message.replies.length > 0 && (
              <div className="mt-3 ml-4">
                <button
                  onClick={() => toggleReplies(message.id)}
                  disabled={deletingComment === message.id}
                  className="flex items-center space-x-2 text-sm text-gray-400 hover:text-gray-700 mb-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>
                    {expandedReplies.has(message.id)
                      ? `Hide ${replyCount === 1 ? "reply" : "replies"}`
                      : replyCount === 1
                        ? `Show reply`
                        : replyCount <= 10
                          ? `Show replies`
                          : `Show replies`}
                  </span>
                </button>

                {expandedReplies.has(message.id) && (
                  <div className="">
                    {flattenReplies(
                      message.replies,
                      1,
                      visibleReplies[message.id] || 10
                    ).map((reply, index) => {
                      if (reply.isMoreReplies) {
                        return (
                          <div key={reply.id} className="py-2 ml-4">
                            <button
                              onClick={() =>
                                loadMoreReplies(
                                  message.id,
                                  message.replies.length
                                )
                              }
                              className="text-sm text-gray-400 hover:text-gray-700"
                            >
                              More replies
                            </button>
                          </div>
                        );
                      }

                      const isReplyOwner = reply.userId === user.id;

                      return (
                        <div
                          key={reply.id}
                          className={`py-2 ml-4 w-[80%] order-1 ${deletingComment === reply.id ? "opacity-60" : ""
                            }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-medium text-gray-600">
                                {reply.userDisplayName}
                              </span>
                              <span className="text-xs text-gray-400">
                                {reply.timeAgo}
                              </span>
                              {deletingComment === reply.id && (
                                <div className="flex items-center space-x-1">
                                  <LoadingSpinner />
                                  <span className="text-xs text-gray-500">
                                    Deleting...
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="relative p-3 rounded-2xl bg-white text-gray-800">
                            {reply.replyTo && (
                              <div className="text-xs mb-2 opacity-75 text-gray-500">
                                <span className="font-medium">
                                  @{reply.replyTo.username}
                                </span>
                                <span className="ml-1">
                                  {reply.replyTo.preview}
                                </span>
                              </div>
                            )}

                            {editingComment === reply.id ? (
                              renderEditForm(reply.id, reply.content)
                            ) : (
                              <p className="text-sm leading-relaxed">
                                {reply.content}
                              </p>
                            )}

                            <div className="flex items-center justify-between text-gray-500 w-[70vw] mt-2">
                              <div className="flex items-center space-x-4">
                                {!isCoupleUser() ? (
                                  <button
                                    onClick={() =>
                                      onLike(reply.id, true, message.id)
                                    }
                                    disabled={deletingComment === reply.id}
                                    className="hover:opacity-70 transition-opacity flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <Heart
                                      size={16}
                                      className={
                                        reply.isLiked
                                          ? "fill-red-500 text-red-500"
                                          : ""
                                      }
                                    />
                                    {reply.likes > 0 && (
                                      <span className="text-xs text-gray-800">
                                        {reply.likes}
                                      </span>
                                    )}
                                  </button>
                                ) : (
                                  reply.likes > 0 && (
                                    <div className="flex items-center space-x-1 text-gray-500">
                                      <span className="text-xs text-gray-800">
                                        {reply.likes}{" "}
                                        {reply.likes === 1 ? "like" : "likes"}
                                      </span>
                                    </div>
                                  )
                                )}

                                {/* Reply read-only mode */}
                                {isReadOnly ? (
                                  !isReplyOwner && (
                                    <ReportButton
                                      commentId={reply.id}
                                      isOwnComment={commentReports[reply.id]?.isOwnComment || false}
                                      hasReported={commentReports[reply.id]?.hasReported || false}
                                      isReporting={isReportingComment}
                                      showModal={showReportModal}
                                      onOpenModal={handleReportClick}
                                      onCloseModal={() => setShowReportModal(null)}
                                      onReport={handleReportSubmit}
                                      position="right"
                                    />
                                  )
                                ) : (
                                  /* Reply active mode */
                                  <>
                                    {!isCoupleUser() && (
                                      <button
                                        onClick={() => onReply(reply)}
                                        disabled={deletingComment === reply.id}
                                        className="hover:opacity-70 transition-opacity disabled:opacity-50 text-gray-500 disabled:cursor-not-allowed flex items-center space-x-1"
                                      >
                                        <ChatIcon size={16} className="text-gray-500 text-gray-800" />
                                      </button>
                                    )}

                                    {!isReplyOwner && (
                                      <ReportButton
                                        commentId={reply.id}
                                        isOwnComment={commentReports[reply.id]?.isOwnComment || false}
                                        hasReported={commentReports[reply.id]?.hasReported || false}
                                        isReporting={isReportingComment}
                                        showModal={showReportModal}
                                        onOpenModal={handleReportClick}
                                        onCloseModal={() => setShowReportModal(null)}
                                        onReport={handleReportSubmit}
                                        position="right"
                                      />
                                    )}
                                  </>
                                )}
                              </div>

                              {/* Reply owner options */}
                              <div className="flex items-center space-x-2">
                                {isReplyOwner && !isReadOnly && (
                                  <div className="options-menu-container relative">
                                    <button
                                      onClick={() =>
                                        setShowOptionsMenu(
                                          showOptionsMenu === reply.id
                                            ? null
                                            : reply.id
                                        )
                                      }
                                      disabled={deletingComment === reply.id}
                                      className="hover:opacity-70 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <MoreHorizontal size={14} />
                                    </button>
                                    {showOptionsMenu === reply.id && (
                                      <OwnerOptionsMenu
                                        commentId={reply.id}
                                        onClose={() => setShowOptionsMenu(null)}
                                      />
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatMessage;