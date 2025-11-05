// app/api/og/post/[postId]/route.js
import axios from "axios";
import { ImageResponse } from "next/og";

export const runtime = "edge";

// Helper function to truncate text to fit within character limits
function truncateText(text, maxLength) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

export async function GET(request, { params }) {
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

    const post = data.post;

    if (!post) {
      return new Response("Post not found", { status: 404 });
    }

    // Extract data with better truncation limits
    const categoriesText = truncateText(post.categories.join(", "), 80);
    const postSubject = truncateText(post.subject, 100); // Limit subject length
    const contentPreview = truncateText(post.content, 180); // Slightly reduced for better fit

    // Check if we have a quoted post
    const hasQuotedPost = post.isQuotePost && post.quotedPostSnapshot;
    const quotedCategories = hasQuotedPost 
      ? truncateText(post.quotedPostSnapshot.categories?.join(", ") || "", 60)
      : "";
    const quotedSubject = hasQuotedPost 
      ? truncateText(post.quotedPostSnapshot.subject || "", 80)
      : "";
    const quotedContent = hasQuotedPost && post.quotedPostSnapshot.content
      ? truncateText(post.quotedPostSnapshot.content, 100)
      : "";

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px",
            backgroundColor: "#f9fafb",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "40px",
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
              overflow: "hidden", // Prevent any overflow
            }}
          >
            {/* Header */}
            <div style={{ 
              display: "flex", 
              flexDirection: "column", 
              marginBottom: "24px",
              width: "100%"
            }}>
              <div style={{ 
                fontSize: "16px", 
                color: "#6b7280", 
                marginBottom: "8px",
                display: "flex",
                width: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}>
                cc: {categoriesText}
              </div>
              <div style={{ 
                fontSize: "20px", 
                color: "#111827", 
                fontWeight: "600",
                display: "flex",
                width: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                lineHeight: "1.2"
              }}>
                {postSubject}
              </div>
            </div>

            {/* Main Content */}
            <div style={{ 
              flex: 1, 
              display: "flex", 
              flexDirection: "column",
              width: "100%",
              overflow: "hidden"
            }}>
              <div style={{
                fontSize: "18px",
                color: "#374151",
                lineHeight: 1.5,
                marginBottom: hasQuotedPost ? "24px" : "32px",
                display: "flex",
                width: "100%",
                wordWrap: "break-word",
                overflowWrap: "break-word",
                hyphens: "auto"
              }}>
                {contentPreview}
              </div>

              {/* Quote Box */}
              {hasQuotedPost && (
                <div style={{
                  border: "2px solid #e5e7eb",
                  borderRadius: "12px",
                  backgroundColor: "#f9fafb",
                  padding: "20px",
                  marginBottom: "24px",
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                  overflow: "hidden"
                }}>
                  <div style={{ 
                    fontSize: "14px", 
                    color: "#6b7280", 
                    marginBottom: "8px",
                    display: "flex",
                    width: "100%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}>
                    cc: {quotedCategories}
                  </div>
                  <div style={{ 
                    fontSize: "16px", 
                    color: "#111827", 
                    fontWeight: "500", 
                    marginBottom: "12px",
                    display: "flex",
                    width: "100%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}>
                    {quotedSubject}
                  </div>
                  <div style={{
                    fontSize: "14px",
                    color: "#4b5563",
                    lineHeight: 1.4,
                    margin: 0,
                    display: "flex",
                    width: "100%",
                    wordWrap: "break-word",
                    overflowWrap: "break-word"
                  }}>
                    {quotedContent}
                  </div>
                </div>
              )}

              {/* Poll Options */}
              {post.type === "poll" && post.pollOptions?.length > 0 && (
                <div style={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: "8px", 
                  marginBottom: "24px",
                  width: "100%"
                }}>
                  {post.pollOptions.slice(0, 3).map((option, index) => (
                    <div key={index} style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: "#f3f4f6",
                      padding: "12px 20px",
                      borderRadius: "24px",
                      fontSize: "14px",
                      width: "100%",
                      overflow: "hidden"
                    }}>
                      <span style={{ 
                        display: "flex",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flex: 1,
                        marginRight: "12px"
                      }}>
                        {truncateText(option.text, 40)}
                      </span>
                      {post.hasVoted && option.percentage !== null && (
                        <span style={{ 
                          color: "#6b7280", 
                          fontWeight: "500",
                          display: "flex",
                          flexShrink: 0
                        }}>
                          {option.percentage}%
                        </span>
                      )}
                    </div>
                  ))}
                  {post.pollOptions.length > 3 && (
                    <div style={{ 
                      fontSize: "12px", 
                      color: "#9ca3af", 
                      textAlign: "center",
                      display: "flex",
                      justifyContent: "center",
                      width: "100%"
                    }}>
                      +{post.pollOptions.length - 3} more options...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Stats */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: "20px",
              fontSize: "14px",
              color: "#6b7280",
              width: "100%",
              overflow: "hidden"
            }}>
              <div style={{ 
                display: "flex", 
                gap: "20px",
                overflow: "hidden"
              }}>
                <span style={{ display: "flex", whiteSpace: "nowrap" }}>
                  {post.likes || 0} likes
                </span>
                <span style={{ display: "flex", whiteSpace: "nowrap" }}>
                  {post.commentsCount || 0} replies
                </span>
              </div>
              <div style={{ 
                display: "flex", 
                gap: "20px",
                overflow: "hidden"
              }}>
                <span style={{ display: "flex", whiteSpace: "nowrap" }}>
                  {post.quotesCount || 0} quotes
                </span>
                <span style={{ display: "flex", whiteSpace: "nowrap" }}>
                  {truncateText(post.timeAgo || "just now", 15)}
                </span>
              </div>
            </div>
          </div>
        </div>
      ),
      { 
        width: 1200, 
        height: 630,
        headers: {
          'Cache-Control': 'public, max-age=3600',
        },
      }
    );
  } catch (error) {
    console.error("Error generating OG image:", error);
    
    // Simple fallback image
    return new ImageResponse(
      (
        <div style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f3f4f6",
        }}>
          <div style={{
            background: "white",
            padding: "40px",
            borderRadius: "16px",
            fontSize: "24px",
            color: "#111827",
            display: "flex"
          }}>
            Post Preview Unavailable
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }
}