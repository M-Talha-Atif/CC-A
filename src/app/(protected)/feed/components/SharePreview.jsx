import React, { useEffect, useState } from "react";
import {
  X,
  Share2,
  Copy,
  Download,
  Heart,
  Bookmark,
  MessageCircle,
} from "lucide-react";
import Portal from "@/components/Portal";
import { useParams } from "next/navigation";

const SharePreview = ({ post, onClose }) => {
  const [toast, setToast] = useState(null);
  const routeParams = useParams(); //  to get current URL params

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    // Store original styles
    const originalStyle = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      width: document.body.style.width,
      height: document.body.style.height,
    };

    // Lock scroll
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.body.style.height = "100%";

    // Also lock document element
    document.documentElement.style.overflow = "hidden";

    // Cleanup function to restore original styles
    return () => {
      document.body.style.overflow = originalStyle.overflow;
      document.body.style.position = originalStyle.position;
      document.body.style.width = originalStyle.width;
      document.body.style.height = originalStyle.height;
      document.documentElement.style.overflow = "";
    };
  }, []);

  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "") // Remove special chars
      .replace(/\s+/g, "-") // Replace spaces with -
      .replace(/--+/g, "-") // Replace multiple - with single -
      .trim();
  };

  const getShareUrl = () => {
    // Use the current URL category instead of post's category
    const currentUrlCategory = routeParams.category;

    // If we have a URL category, use it directly (it's already in the correct format)
    if (currentUrlCategory) {
      return `${window.location.origin}/feed/${currentUrlCategory}/${post.id}`;
    }

    // Fallback: If no URL category (shouldn't happen), use post's first category
    const categoryToUrlMapping = {
      New: "new",
      Popular: "popular",
      Couples: "couples",
      Photography: "photographer",
      Videography: "videographer",
      Florist: "florist",
      Planner: "planner",
      "My Posts": "my-posts",
      Bookmark: "bookmark",
      Chatrooms: "chatrooms",
    };

    const primaryCategory = post.categories[0];
    const urlCategory = categoryToUrlMapping[primaryCategory] || "couples";
    return `${window.location.origin}/feed/${urlCategory}/${post.id}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      showToast("Link copied to clipboard!");
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = getShareUrl();
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      showToast("Link copied to clipboard!");
    }
  };

  const handleDownloadImage = () => {
    // Create a canvas to generate the share image
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header with "cuno covo" branding
    ctx.fillStyle = "#000000";
    ctx.font = "bold 32px Arial";
    ctx.textAlign = "center";
    ctx.fillText("cuno covo", canvas.width / 2, 60);

    // Post content box
    const boxPadding = 40;
    const boxY = 120;
    const boxHeight = canvas.height - boxY - 100;

    // Draw box border
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 2;
    ctx.strokeRect(boxPadding, boxY, canvas.width - boxPadding * 2, boxHeight);

    // Fill box background
    ctx.fillStyle = "#f9fafb";
    ctx.fillRect(
      boxPadding + 1,
      boxY + 1,
      canvas.width - boxPadding * 2 - 2,
      boxHeight - 2
    );

    // Categories
    ctx.fillStyle = "#6b7280";
    ctx.font = "16px Arial";
    ctx.textAlign = "left";
    const categoriesText = `cc: ${post.categories.join(", ")}`;
    ctx.fillText(categoriesText, boxPadding + 20, boxY + 40);

    // Subject (matching Post component format)
    ctx.fillStyle = "#111827";
    ctx.font = "bold 24px Arial";
    const subjectText = `subject: ${post.subject}`;

    // Word wrap for subject
    const words = subjectText.split(" ");
    let line = "";
    let y = boxY + 80;
    const maxWidth = canvas.width - boxPadding * 2 - 40;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, boxPadding + 20, y);
        line = words[n] + " ";
        y += 30;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, boxPadding + 20, y);

    // Content
    ctx.fillStyle = "#374151";
    ctx.font = "18px Arial";
    y += 40;

    const contentWords = post.content.split(" ");
    line = "";

    for (let n = 0; n < contentWords.length; n++) {
      const testLine = line + contentWords[n] + " ";
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, boxPadding + 20, y);
        line = contentWords[n] + " ";
        y += 25;

        // Prevent content from going outside the box
        if (y > boxY + boxHeight - 40) {
          ctx.fillText(line + "...", boxPadding + 20, y);
          break;
        }
      } else {
        line = testLine;
      }
    }
    if (y <= boxY + boxHeight - 40) {
      ctx.fillText(line, boxPadding + 20, y);
    }

    // Download the image
    const link = document.createElement("a");
    link.download = `cuno-covo-post-${post.id}.png`;
    link.href = canvas.toDataURL();
    link.click();

    showToast("Image downloaded!");
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "", // force empty
          text: "", // force empty
          url: getShareUrl(),
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Share failed:", error);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <Portal>
      <div
        className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4"
        style={{ touchAction: "none" }}
      >
        {/* Toast */}
        {toast && (
          <div
            className={`fixed top-4 right-4 px-4 py-2 rounded-lg text-white z-60 ${toast.type === "success" ? "bg-green-500" : "bg-red-500"
              }`}
          >
            {toast.message}
          </div>
        )}

        <div className="bg-white rounded-2xl w-full max-w-md mx-auto max-h-[90vh] scrollbar-hide overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-end p-4">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-4">
            <div className="border-2 border-gray-200 rounded-lg bg-gray-50 p-4 mb-6 select-none">
              <div className="text-[16px] text-gray-900  leading-relaxed">
                <div className="relative">
                  <p className=" break-words">{post.subject}</p>
                </div>
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

              {/* Content */}
              <p className="text-[14px] text-gray-900 leading-relaxed mb-4 break-words">
                {post.content}
              </p>

              {/* Poll Options - Matching Post component exactly */}
              {post.type === "poll" && post.pollOptions && (
                <div className="mb-4">
                  {post.pollOptions.map((option, index) => {
                    const hasVoted = post.hasVoted;
                    const isUserChoice = option.isUserChoice;

                    return (
                      <div
                        key={index}
                        className="w-full flex items-center justify-between mb-2"
                      >
                        {/* Capsule - matching Post component styling */}
                        <div className="flex-1 flex justify-center">
                          <span
                            className={`text-sm text-gray-700 py-1 px-3 w-[200px]
                             text-center rounded-full ${hasVoted
                                ? isUserChoice
                                  ? "bg-blue-200 text-blue-800 font-semibold"
                                  : "bg-gray-200 opacity-75"
                                : "bg-gray-200"
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

                        {/* Percentage - matching Post component */}
                        <span className="w-[50px] -ml-4 mr-8 text-xs text-left text-gray-500 font-medium">
                          {hasVoted && option.percentage !== null
                            ? `${option.percentage}%`
                            : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Quoted Post Section - Matching Post component */}
              {post.isQuotePost && post.quotedPostSnapshot && (
                <div className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
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
                  <p className="text-sm text-gray-700 mb-2 break-words">
                    {post.quotedPostSnapshot.content}
                  </p>

                  {/* Quoted post stats and user info */}
                  {/* <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Heart size={14} />
                      {post.quotedPostSnapshot.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle size={14} />
                      {post.quotedPostSnapshot.commentsCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bookmark size={14} />
                      {post.quotedPostSnapshot.saves}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{post.quotedPostSnapshot.timeAgo}</span>
                  </div>
                </div> */}
                </div>
              )}

              {/* Stats - Matching Post component */}
              {/* <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <Heart size={12} /> {post.likes}
              </span>
              <span className="flex items-center gap-2">
                <Bookmark size={12} /> {post.saves}
              </span>
              {post.commentsCount > 0 && (
                <span className="flex items-center gap-2">
                  <MessageCircle size={12} /> {post.commentsCount}
                </span>
              )}
            </div> */}
            </div>

            {/* Share Actions */}
            <div className="space-y-3">
              <button
                onClick={handleNativeShare}
                className="w-full bg-black text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <Share2 size={20} />
                Share Post
              </button>

              {/* <button
              onClick={handleCopyLink}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <Copy size={20} />
              Copy Link
            </button> */}
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default SharePreview;
