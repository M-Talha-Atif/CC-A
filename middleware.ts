import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ADD THIS LOG TO SEE IF MIDDLEWARE RUNS
  console.log(`🔍 MIDDLEWARE HIT: ${pathname}`);

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


  // 3.5. Block /feed/new and other protected feed routes if not authenticated
  const token = request.cookies.get("token");

  console.log("in the middleware - checking auth for:", pathname);

  // Protected feed categories that require authentication
  const protectedFeedCategories = [
    "/feed/new",
    "/feed/bookmark",
    "/feed/my-posts",
    "/feed/chatrooms"
  ];

  if (protectedFeedCategories.some(path => pathname.startsWith(path))) {
    console.log("Protected route detected:", pathname);

    if (!token) {
      console.log("No token found, redirecting to /feed/couples");
      // Redirect to couples feed (public feed) instead of login
      return NextResponse.redirect(new URL("/feed/couples", request.url));
    }

    console.log("Token found, allowing access");
  }

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}api/auth/check-status`,
      {
        method: "GET",
        headers: {
          cookie: request.headers.get("cookie") || "",
        },
      }
    );

    if (res.ok) {
      const json = await res.json();

      const status = json?.data?.status;

      if ((status === "pending" || status === "rejected") && pathname !== "/waiting") {
        console.log("Redirected to the waiting page")
        return NextResponse.redirect(new URL("/waiting", request.url));
      }
    }
  } catch (err) {
    console.log("Status check failed in middleware:", err);
  }

  return NextResponse.next();
}