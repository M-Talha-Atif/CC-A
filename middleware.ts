import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip Next.js internal files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap.xml")
  ) {
    return NextResponse.next();
  }

  // 2. Skip public routes
  const publicPaths = ["/login", "/api/auth/login"];

  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 3. Handle feed routing conflicts BEFORE authentication check
  // This prevents feed URLs from being interpreted as chatroom URLs
  if (pathname.startsWith("/feed/")) {
    const pathParts = pathname.split("/").filter(Boolean);
    
    // Check if this is a feed URL with a post ID (3 parts: feed, category, postId)
    if (pathParts.length === 3 && pathParts[0] === "feed") {
      const [, category, postId] = pathParts;
      
      // Validate that the third part looks like a post ID (UUID format)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (uuidRegex.test(postId)) {
        // This is a single post view in the feed - redirect to the correct feed route
        // The FeedPage component will handle singlePostMode
        const url = request.nextUrl.clone();
        url.pathname = `/feed/${category}`;
        url.searchParams.set("postId", postId);
        url.searchParams.set("singlePost", "true");
        
        return NextResponse.redirect(url);
      }
    }
  }

  // 4. Check token for all other pages
  const token = request.cookies.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}