"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import useUserStore from "../../../store/userStore";
import { useSocket } from "../../../hooks/useSockets";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getPostCommentCount,
  getPost,
} from "../../../../action";

const NotificationsPage = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useUserStore();
  const { onNewNotification, offNewNotification } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Check authentication - redirect if not authenticated
  useEffect(() => {
    const checkAuth = () => {
      const userIsAuthenticated =
        isAuthenticated || (user && (user.id || user.email));

      if (!userIsAuthenticated) {
        router.replace("/feed/popular");
      }
    };

    const timeoutId = setTimeout(checkAuth, 100);
    return () => clearTimeout(timeoutId);
  }, [isAuthenticated, user, router]);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      const data = await getNotifications(50, 0);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchNotifications();
    }
  }, [isAuthenticated, user?.id, fetchNotifications]);

  // Listen for real-time notifications
  useEffect(() => {
    const handleNewNotification = (notification) => {
      console.log("New notification received:", notification);

      setNotifications((prev) => [
        {
          id: notification.id,
          type: notification.type,
          message: notification.message,
          metadata: notification.metadata,
          isRead: notification.isRead,
          createdAt: notification.createdAt,
          postId: notification.postId,
          commentId: notification.commentId,
          actorId: notification.actorId,
          actorFirstName: notification.actor?.firstName || null,
          actorLastName: notification.actor?.lastName || null,
          actorProfilePicture: notification.actor?.profilePicture || null,
        },
        ...prev,
      ]);

      setUnreadCount((prev) => prev + 1);
    };

    onNewNotification(handleNewNotification);

    return () => {
      offNewNotification(handleNewNotification);
    };
  }, [onNewNotification, offNewNotification]);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMinutes < 1) return "just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.isRead) {
        await markNotificationAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notification.id ? { ...notif, isRead: true } : notif
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      // Navigate based on notification type and post ID
      if (notification.postId) {
        await handlePostRedirect(notification);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handlePostRedirect = async (notification) => {
    try {
      // Fetch the actual post data to get accurate categories and details
      const postData = await getPost(notification.postId);

      if (!postData || !postData.post) {
        throw new Error("Post not found");
      }

      const post = postData.post;

      // Generate slug from post subject
      const generateSlug = (text) => {
        return text
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/--+/g, "-")
          .trim();
      };

      const slug = generateSlug(post.subject);

      // Generate categories path
      const categoriesPath = post.categories
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

      // Check if post has comments using the comment count API
      const commentCountData = await getPostCommentCount({
        postId: notification.postId,
      });
      const hasComments = commentCountData && commentCountData.commentCount > 0;

      // Navigate based on whether the post has comments
      if (hasComments) {
        // Post has comments - navigate to chatroom
        const chatroomUrl = `/chatroom/${categoriesPath}/${slug}/${notification.postId}`;
        await router.push(chatroomUrl);
      } else {
        // Post has no comments - navigate to feed page
        const feedUrl = `/feed/${categoriesPath}/${notification.postId}`;
        await router.push(feedUrl);
      }
    } catch (error) {
      console.error("Error in handlePostRedirect:", error);

      // Fallback: Try to use metadata if available, otherwise go to generic route
      try {
        const postCategories = notification.metadata?.postCategories || [];

        if (postCategories.length > 0) {
          const categoriesPath = postCategories
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

          const feedUrl = `/feed/${categoriesPath}/${notification.postId}`;
          await router.push(feedUrl);
        } else {
          // Last resort: redirect to home/feed
          await router.push("/feed");
        }
      } catch (navError) {
        console.error("Navigation fallback failed:", navError);
        // Force redirect to feed as absolute last resort
        window.location.href = "/feed";
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const getActorName = (notification) => {
    // For comment-related notifications, use chatroom username if available
    if (notification.chatroomUsername) {
      return notification.chatroomUsername;
    }

    return "Someone";
  };

  if (!isAuthenticated && !user) {
    return null;
  }

  return (
    <div
      className="min-h-dvh bg-white"
      style={{ fontFamily: "Nunito Sans, sans-serif" }}
    >
      <div className="max-w-2xl mx-auto px-6 pb-4">
        <div className="flex items-center justify-between mb-6 fixed top-7 left-16 right-6">
          <h1 className="text-2xl font-bold">Notifications</h1>
          {/* {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Mark all as read
            </button>
          )} */}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-0 mt-7">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`py-4 px-4 -mx-4 cursor-pointer transition-colors duration-200 hover:bg-gray-50 border-b border-gray-100 ${
                  !notification.isRead ? "" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p
                      className={`text-base text-black ${
                        !notification.isRead ? "font-semibold" : ""
                      }`}
                    >
                      <span className="font-semibold">
                        {getActorName(notification)}
                      </span>{" "}
                      {notification.message}
                    </p>
                    {notification.metadata?.commentPreview && (
                      <p className="text-sm text-gray-600 mt-1">
                        "{notification.metadata.commentPreview}"
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      {formatTimestamp(notification.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
