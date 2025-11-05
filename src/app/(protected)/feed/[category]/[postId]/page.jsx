import React from 'react';
import FeedPage from '../../components/FeedPage';
import axios from 'axios';

export async function generateMetadata({ params }) {
  const { postId, category } = await params;

  try {
    console.log('Generating metadata for postId:', postId);
    
    const apiUrl = `${process.env.NEXT_PUBLIC_BASE_URL}api/post/public/${postId}`;
    console.log('API URL:', apiUrl);
    
    const { data } = await axios.get(apiUrl, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    console.log('API Response:', data);

    const postData = data.post;

    if (!postData || !postData.subject) {
      console.log('Post data not found or missing subject');
      return {
        title: "Post not found",
        description: "The requested post could not be found.",
        openGraph: {
          title: "Post not found - Cuno Covo",
          description: "The requested post could not be found.",
          url: `https://cunocovo.com/feed/${category}/${postId}`,
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
      };
    }

    // Generate preview image URL for the post
    const previewImageUrl = `https://cunocovo.com/api/og/post/${postId}`;
    const postUrl = `https://cunocovo.com/feed/${category}/${postId}`;

    const title = postData.subject;
    const contentText = postData.content || "";

    let description = contentText.replace(/\s+/g, " ").trim();
    if (description.length > 160) {
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

    if (!description && postData.categories?.length) {
      description = `Discussion in ${postData.categories.join(", ")}`;
    }

    if (!description) {
      description = "Join the conversation on Cuno Covo";
    }

    console.log('Generated metadata:', { title, description, postUrl });

    const metadata = {
      title,
      description,
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
        ],
        locale: "en_US",
        type: "article",
        publishedTime: postData.createdAt,
        modifiedTime: postData.updatedAt || postData.createdAt,
        section: postData.categories?.[0] || "General",
        tags: postData.categories || [],
        authors: [`@${postData.userDisplayName}`],
      },
      twitter: {
        card: "summary_large_image",
        title: postData.subject,
        description,
        images: [previewImageUrl],
        creator: `@${postData.userDisplayName}`,
      },
      other: {
        "og:image:width": "1200",
        "og:image:height": "630",
        "theme-color": "#000000",
        "og:image:secure_url": previewImageUrl,
        "og:image:type": "image/png",
      },
      alternates: {
        canonical: postUrl,
      },
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

    return metadata;
  } catch (error) {
    console.error("Failed to generate metadata:", error);

    const fallbackUrl = `https://cunocovo.com/feed/${category}/${postId}`;

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
    };
  }
}

const SinglePostPage = ({ params }) => {
  return (
    <FeedPage params={params} singlePostMode={true} postId={params.postId} />
  );
};

export default SinglePostPage;