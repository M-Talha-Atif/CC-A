"use server";

import axios from "axios";
import React from "react";
import { Metadata } from "next";
import ChatroomClient from "./components/ChatroomClient";

export async function generateMetadata({ params }) {
  const { postId } = await params;

  try {
    const { data } = await axios.get(
      `${process.env.NEXT_PUBLIC_BASE_URL}api/post/public/${postId}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // Access the post data through the post property
    const postData = data.post;

    if (!postData || !postData.subject) {
      return {
        title: "Post not found",
        description: "The requested post could not be found.",
        openGraph: {
          title: "Post not found - Cuno Covo",
          description: "The requested post could not be found.",
          url: `https://cunocovo.com/feed/chatroom/comment/${postId}`,
          siteName: "Cuno Covo",
          type: "website",
          images: [
            {
              url: "https://cunocovo.com/api/og/default",
              width: 1200,
              height: 630,
              alt: "Cuno Covo",
            },
          ],
        },
        twitter: {
          card: "summary_large_image",
          title: "Post not found - Cuno Covo",
          description: "The requested post could not be found.",
          images: ["https://cunocovo.com/api/og/default"],
        },
        // Add Apple-specific meta tags
        appleWebApp: {
          capable: true,
          title: "Post not found - Cuno Covo",
        },
      };
    }

    // Generate preview image URL for the post
    const previewImageUrl = `https://cunocovo.com/api/og/post/${postId}`;
    const postUrl = `https://cunocovo.com/feed/chatroom/comment/${postId}`;

    // Create dynamic title and description with better formatting
    const title = postData.subject;
    const contentText = postData.content || "";

    // Improve description formatting - remove extra whitespace and ensure proper length
    let description = contentText.replace(/\s+/g, " ").trim();
    if (description.length > 160) {
      // Find the last complete sentence or word within 160 chars
      const truncated = description.substring(0, 160);
      const lastPeriod = truncated.lastIndexOf(".");
      const lastSpace = truncated.lastIndexOf(" ");

      if (lastPeriod > 120) {
        description = truncated.substring(0, lastPeriod + 1);
      } else if (lastSpace > 120) {
        description = truncated.substring(0, lastSpace) + "...";
      } else {
        description = truncated + "...";
      }
    }

    // If no content, use categories as description
    if (!description && postData.categories?.length) {
      description = `Discussion in ${postData.categories.join(", ")}`;
    }

    // Fallback description
    if (!description) {
      description = "Join the conversation on Cuno Covo";
    }

    const metadata = {
      title, // This will use the template from layout: "Post Title - Cuno Covo"
      description,

      // Enhanced Open Graph for better cross-platform compatibility
      openGraph: {
        title: postData.subject,
        description,
        url: postUrl,
        siteName: "Cuno Covo",
        images: [
          {
            url: previewImageUrl,
            width: 1200,
            height: 630,
            alt: `${postData.subject} - Cuno Covo Post`,
            type: "image/png",
          },
          // Add multiple image sizes for better compatibility
          {
            url: previewImageUrl + "?size=large",
            width: 1200,
            height: 630,
            alt: `${postData.subject} - Cuno Covo Post`,
            type: "image/png",
          },
          {
            url: previewImageUrl + "?size=medium",
            width: 600,
            height: 315,
            alt: `${postData.subject} - Cuno Covo Post`,
            type: "image/png",
          },
        ],
        locale: "en_US",
        type: "article", // Use 'article' for better rich preview support

        // Add additional Open Graph properties for better compatibility
        publishedTime: postData.createdAt,
        modifiedTime: postData.updatedAt || postData.createdAt,
        section: postData.categories?.[0] || "General",
        tags: postData.categories || [],
        authors: [`@${postData.userDisplayName}`],
      },

      // Enhanced Twitter metadata
      twitter: {
        card: "summary_large_image",
        title: postData.subject,
        description,
        images: [previewImageUrl],
        creator: `@${postData.userDisplayName}`,
        // site and creator will be inherited from layout
      },

      // Add Apple-specific meta tags for iOS sharing
      appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: postData.subject,
      },

      // Add additional meta tags for broader compatibility
      other: {
        // WhatsApp and Telegram specific
        "og:image:width": "1200",
        "og:image:height": "630",

        // Discord specific
        "theme-color": "#000000",

        // General social media
        "article:author": `@${postData.userDisplayName}`,
        "article:published_time": postData.createdAt,
        "article:section": postData.categories?.[0] || "General",

        // Additional image meta for better compatibility
        "og:image:secure_url": previewImageUrl,
        "og:image:type": "image/png",

        // Slack and other platforms
        "twitter:image:src": previewImageUrl,
        "twitter:domain": "cunocovo.com",
        "twitter:url": postUrl,

        // LinkedIn specific
        "article:tag": postData.categories?.join(",") || "",

        // Facebook specific optimizations
        "fb:app_id": process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || "",

        // Ensure proper encoding
        "Content-Type": "text/html; charset=utf-8",
      },

      keywords: ["cuno covo", "chat", "post", "social platform", "discussion"],

      // Add canonical URL for this specific post
      alternates: {
        canonical: postUrl,
      },

      // Add robots meta for proper indexing
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      },
    };

    // Add categories to keywords if available
    if (postData.categories?.length) {
      metadata.keywords.push(...postData.categories);
    }

    return metadata;
  } catch (error) {
    console.error("Failed to generate metadata:", error);

    // Enhanced error fallback with proper metadata
    const fallbackUrl = `https://cunocovo.com/feed/chatroom/comment/${postId}`;

    return {
      title: "Error loading post",
      description: "There was an error loading this post.",
      openGraph: {
        title: "Error loading post - Cuno Covo",
        description: "There was an error loading this post.",
        url: fallbackUrl,
        siteName: "Cuno Covo",
        type: "website",
        images: [
          {
            url: "https://cunocovo.com/api/og/error",
            width: 1200,
            height: 630,
            alt: "Cuno Covo - Error",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "Error loading post - Cuno Covo",
        description: "There was an error loading this post.",
        images: ["https://cunocovo.com/api/og/error"],
      },
      appleWebApp: {
        capable: true,
        title: "Error loading post - Cuno Covo",
      },
      other: {
        "og:image:width": "1200",
        "og:image:height": "630",
        "theme-color": "#000000",
      },
    };
  }
}

// Server component that renders the client component
const ChatroomPage = ({ params }) => {
  return <ChatroomClient params={params} />;
};

export default ChatroomPage;
