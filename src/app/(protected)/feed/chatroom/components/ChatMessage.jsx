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


  const { user } = useUserStore();

  const isCoupleUser = () => {
    return user?.userType === "couple";
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showOptionsMenu && !event.target.closest(".options-menu-container")) {
        setShowOptionsMenu(null);
      }
      if (showReportModal && !event.target.closest(".report-modal-container")) {
        setShowReportModal(null);
      }
    };

    if (showOptionsMenu || showReportModal) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showOptionsMenu, showReportModal]);

  const toggleReplies = (commentId, totalReplies) => {
    setExpandedReplies((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
        setVisibleReplies((v) => ({ ...v, [commentId]: 10 })); // start with 10
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
        // Nested replies should ALSO start capped at 10 (or whatever rule you want)
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
    // FIXED: Prevent editing in read-only mode
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
    // FIXED: Prevent saving edits in read-only mode
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
    // FIXED: Prevent deletion in read-only mode
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
    setShowReportModal(commentId);
  };

  const handleReportSubmit = async (commentId) => {
    try {
      if (onReportComment) {
        await onReportComment(commentId);
      }
      toast.error("Comment reported successfully");
      setShowReportModal(null);
    } catch (error) {
      console.error("Failed to report comment:", error);
      toast.error("Failed to report comment");
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

  // FIXED: Separate options menu for owners vs report button for non-owners
  const OwnerOptionsMenu = ({ commentId, onClose }) => (
    <div className="options-menu-container absolute top-0 -right-2 mt-6 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
      <button
        onClick={() =>
          handleEditClick({
            id: commentId,
            content: findCommentContentById(commentId),
          })
        }
        disabled={isReadOnly} // FIXED: Disable edit in read-only mode
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
        disabled={deletingComment === commentId || isReadOnly} // FIXED: Disable delete in read-only mode
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

  const ReportModal = ({ commentId, onClose }) => (
    <div className="report-modal-container fixed inset-0 bg-[#0000007c] bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-[280px] sm:w-[250px] p-4 relative border border-gray-400">
        <button
          onClick={onClose}
          className="absolute cursor-pointer top-2 right-4 text-gray-400 hover:text-gray-600 transition-colors touch-manipulation"
        >
          <X size={24} />
        </button>

        <div className="text-center">
          <p className="text-gray-600 text-xs my-3">
            Report this comment for containing abuse, harassment, or spam.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => handleReportSubmit(commentId)}
              className="w-full bg-black text-white py-3 px-3 rounded-3xl hover:bg-gray-600 transition-colors font-medium touch-manipulation"
            >
              Report
            </button>
          </div>
        </div>
      </div>
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
        disabled={isReadOnly} // FIXED: Disable textarea in read-only mode
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
              isReadOnly // FIXED: Disable save in read-only mode
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
                        disabled={
                          deletingComment === message.id
                        }
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


                    {/* Conditional rendering based on read-only mode */}
                    {isReadOnly ? (
                      // Read-only mode: Only show the Report button for non-current-user comments
                      !isCurrentUser && (
                        <div className="relative">
                          <button
                            onClick={() => handleReportClick(message.id)}
                            className="hover:opacity-70 transition-opacity text-gray-500 hover:text-gray-700"
                          >
                            <InfoIcon size={16} className="text-gray-500 mt-1" />
                          </button>

                          {showReportModal === message.id && (
                            <>
                              {/* Backdrop */}
                              <div
                                className="fixed inset-0 bg-transparent z-[9998]"
                                onClick={() => setShowReportModal(null)}
                              />

                              {/* Modal positioned below the info icon */}
                              <div
                                className="absolute top-6 -right-48 bg-white rounded-2xl w-[230px] p-3 py-2 border border-gray-400 shadow-xl z-[9999]"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="text-center">
                                  <p className="text-gray-600 text-xs mb-3">
                                    Report this comment for containing abuse, harassment, or spam.
                                  </p>
                                  <div className="space-y-3">
                                    <button
                                      onClick={() => handleReportSubmit(message.id)}
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
                      )
                    ) : (
                      // Active mode: Show Chat button and Report button (non-current-user only)
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

                        {/* Show Report button for non-current-user comments */}
                        {!isCurrentUser && (
                          <div className="relative">
                            <button
                              onClick={() => handleReportClick(message.id)}
                              className="hover:opacity-70 transition-opacity text-gray-500 hover:text-gray-700"
                            >
                              <InfoIcon size={16} className="text-gray-500 mt-1" />
                            </button>

                            {showReportModal === message.id && (
                              <>
                                {/* Backdrop */}
                                <div
                                  className="fixed inset-0 bg-transparent z-[9998]"
                                  onClick={() => setShowReportModal(null)}
                                />

                                {/* Modal positioned below the info icon */}
                                <div
                                  className="absolute top-6 -right-48 bg-white rounded-2xl w-[230px] p-3 py-2 border border-gray-400 shadow-xl z-[9999]"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="text-center">
                                    <p className="text-gray-600 text-xs mb-3">
                                      Report this comment for containing abuse, harassment, or spam.
                                    </p>
                                    <div className="space-y-3">
                                      <button
                                        onClick={() => handleReportSubmit(message.id)}
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
                      </>
                    )}
                  </div>

                  {/* FIXED: Separate owner options and report button */}
                  <div className="flex items-center space-x-2">
                    {/* Report button for non-owners (always visible for authenticated users) */}

                    {/* Options menu only for owners */}
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

            {message.replies && message.replies.length > 0 && (
              <div className="mt-3 ml-4">
                <button
                  onClick={() => toggleReplies(message.id)}
                  disabled={deletingComment === message.id}
                  className="flex items-center space-x-2 text-sm text-gray-400 hover:text-gray-700 mb-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  { }
                  <span>
                    { }
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
                      visibleReplies[message.id] || 10 // use dynamic visible count here
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
                                    disabled={
                                      deletingComment === reply.id
                                    }
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

                                {/* Check if the chatroom is read-only */}
                                {isReadOnly ? (
                                  // Read-only: Show Report button in place of Chat button (if not the owner)
                                  !isReplyOwner && (
                                    <div className="relative">
                                      <button
                                        onClick={() => handleReportClick(reply.id)}
                                        className="hover:opacity-70 transition-opacity text-gray-500 hover:text-gray-700 mt-2"
                                      >
                                        <InfoIcon size={16} />
                                      </button>

                                      {showReportModal === reply.id && (
                                        <>
                                          {/* Backdrop */}
                                          <div
                                            className="fixed inset-0 bg-transparent z-[9998]"
                                            onClick={() => setShowReportModal(null)}
                                          />

                                          {/* Modal positioned below the info icon */}
                                          <div
                                            className="absolute top-6 -right-44 bg-white rounded-2xl w-[230px] p-3 py-2 border border-gray-400 shadow-xl z-[9999]"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <div className="text-center">
                                              <p className="text-gray-600 text-xs mb-3">
                                                Report this comment for containing abuse, harassment, or spam.
                                              </p>
                                              <div className="space-y-3">
                                                <button
                                                  onClick={() => handleReportSubmit(reply.id)}
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
                                  )
                                ) : (
                                  // Active mode: Show Chat button and conditionally show Report button
                                  <>
                                    {/* Chat button */}
                                    {!isCoupleUser() && (
                                      <button
                                        onClick={() => onReply(reply)}
                                        disabled={deletingComment === reply.id}
                                        className="hover:opacity-70 transition-opacity disabled:opacity-50 text-gray-500 disabled:cursor-not-allowed flex items-center space-x-1"
                                      >
                                        <ChatIcon size={16} className="text-gray-500 text-gray-800" />
                                      </button>
                                    )}

                                    {/* Report button only if not the reply owner */}
                                    {!isReplyOwner && (
                                      <div className="relative">
                                        <button
                                          onClick={() => handleReportClick(reply.id)}
                                          className="hover:opacity-70 transition-opacity text-gray-500 hover:text-gray-700 mt-2"
                                        >
                                          <InfoIcon size={16} />
                                        </button>

                                        {showReportModal === reply.id && (
                                          <>
                                            {/* Backdrop */}
                                            <div
                                              className="fixed inset-0 bg-transparent z-[9998]"
                                              onClick={() => setShowReportModal(null)}
                                            />

                                            {/* Modal positioned below the info icon */}
                                            <div
                                              className="absolute top-6 -right-44 bg-white rounded-2xl w-[230px] p-3 py-2 border border-gray-400 shadow-xl z-[9999]"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <div className="text-center">
                                                <p className="text-gray-600 text-xs mb-3">
                                                  Report this comment for containing abuse, harassment, or spam.
                                                </p>
                                                <div className="space-y-3">
                                                  <button
                                                    onClick={() => handleReportSubmit(reply.id)}
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
                                  </>
                                )}
                              </div>

                              {/* FIXED: Separate owner options and report for replies */}
                              <div className="flex items-center space-x-2">
                                {isReplyOwner && (
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

      {/* {showReportModal && (
        <ReportModal
          commentId={showReportModal}
          onClose={() => setShowReportModal(null)}
        />
      )} */}
    </>
  );
};

export default ChatMessage;
