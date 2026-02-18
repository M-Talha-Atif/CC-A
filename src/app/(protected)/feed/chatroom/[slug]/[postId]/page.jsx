"use server";

import axios from "axios";
import React from "react";
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
        },
        twitter: {
          title: "Post not found - Cuno Covo",
          description: "The requested post could not be found.",
        }
      };
    }

    // Generate preview image URL for the post
    const previewImageUrl = `https://cunocovo.com/api/og/post/${postId}`;
    const postUrl = `https://cunocovo.com/feed/chatroom/comment/${postId}`;

    // Create dynamic title and description
    const title = postData.subject;
    const contentText = postData.content || "";
    const description =
      contentText.length > 160
        ? `${contentText.substring(0, 160)}...`
        : contentText;

    const metadata = {
      title, // This will use the template from layout: "Post Title - Cuno Covo"
      description,
      openGraph: {
        title: postData.subject,
        description,
        url: postUrl,
        siteName: "Cuno Covo", // This reinforces the siteName from layout
        images: [
          {
            url: previewImageUrl,
            width: 1200,
            height: 630,
            alt: `${postData.subject} - Cuno Covo Post`,
            type: "image/png",
          },
        ],
        locale: "en_US",
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title: postData.subject,
        description,
        images: [previewImageUrl],
        // site and creator will be inherited from layout
      },
      keywords: ["cuno covo", "chat", "post", "social platform"],
      // Add canonical URL for this specific post
      alternates: {
        canonical: postUrl,
      },
    };

    if (postData.categories?.length) {
      metadata.keywords.push(...postData.categories);
    }

    return metadata;
  } catch (error) {
    console.error("Failed to generate metadata:", error);
    return {
      title: "Error loading post",
      description: "There was an error loading this post.",
      openGraph: {
        title: "Error loading post - Cuno Covo",
        description: "There was an error loading this post.",
      },
      twitter: {
        title: "Error loading post - Cuno Covo",
        description: "There was an error loading this post.",
      }
    };
  }
}

// Server component that renders the client component
const ChatroomPage = ({ params }) => {
  return <ChatroomClient params={params} />;
};

export default ChatroomPage;