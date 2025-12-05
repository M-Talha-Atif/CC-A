"use client";

import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  Heart,
  Bookmark,
  Share2,
  Info,
  Edit,
  ChevronDown,
  Edit2,
  MessageCircle,
  Users,
  Clock,
  Filter,
  List,
  AlignLeft,
  Search,
  X,
  Plus,
  ArrowUpRight,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import {
  checkPostingEligibility,
  getCoupleFeed,
  getFeed,
  getPostCommentCount,
  getPublicPost,
  globalSearch,
  likePost,
  openChatroom,
  savePost,
  votePoll,
} from "../../../../../action";
import Loader from "../../../../components/Loader";
import { toast, Toaster } from "sonner";
import ChatroomModal from "../chatroom/components/ChatroomModal";
import Post from "./Post";
import useUserStore from "../../../../store/userStore";
import { generateSlug } from "../../../../utils/slug";
import { LoginPromptModal } from "./LoginPromptModal";
import SmoothScrollHeader from "./SmoothScrollHeader";
import { motion } from "framer-motion";
import PostingIcon from "../../../../components/icons/PostingIcon";
// Main filter icons
import NewFeedIcon from "../../../../components/icons/FilterIcons/NewFeedIcons";
import CreativesFeedIcon from "../../../../components/icons/FilterIcons/CreativesFeedIcon";
import PopularFeedIcon from "../../../../components/icons/FilterIcons/PopularFeedIcon";
import CouplesFeedIcon from "../../../../components/icons/FilterIcons/CouplesFeedIcon";
import BookmarkFeedIcon from "../../../../components/icons/FilterIcons/BookmarkFeedIcon";
import MyPostFeedIcon from "../../../../components/icons/FilterIcons/MyPostFeedIcon";
import ChatroomFeedIcon from "../../../../components/icons/FilterIcons/ChatroomFeedIcon";
// Sub Filter icons
import PhotograherIcon from "../../../../components/icons/FilterIcons/PhotograherIcon";
import VideographerIcon from "../../../../components/icons/FilterIcons/VideographerIcon";
import FloristIcon from "../../../../components/icons/FilterIcons/FloristIcon";
import PlannerIcon from "../../../../components/icons/FilterIcons/PlannerIcon";
import SeeAllIcon from "../../../../components/icons/FilterIcons/SeeAllIcon";
import Portal from "../../../../components/Portal";
import { useScrollVisibility } from "@/hooks/useScrollVisibilityContext";

const FeedPage = ({ params = {}, singlePostMode = false, postId = null }) => {
  const router = useRouter();
  const routeParams = useParams();
  const observerRef = useRef(null);
  const loadingRef = useRef(false);
  const searchTimeoutRef = useRef(null);
  const initialLoadRef = useRef(true);
  const mountedRef = useRef(true);
  const abortControllerRef = useRef(null);
  const [voteTimestamps, setVoteTimestamps] = useState({});
  const [editableVotes, setEditableVotes] = useState(new Set());
  const { user, isAuthenticated, setCurrentFeedCategory, hasHydrated } =
    useUserStore();

  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  const [isGlobalSearching, setIsGlobalSearching] = useState(false);
  const [globalSearchError, setGlobalSearchError] = useState(null);
  // Get category from URL params
  const urlCategory = routeParams.category;

  // Updated static mappings - move outside component or memoize to prevent recreation
  const categoryMappings = useMemo(
    () => ({
      new: "New",
      popular: "Popular",
      creatives: "Creatives",
      couples: "Couples",
      photography: "Photographer",
      videography: "Videographer",
      florist: "Florist",
      planner: "Planner",
      "my-posts": "My Posts", // Changed from "posts-replies"
      bookmark: "Bookmark",
      chatrooms: "Chatrooms",
    }),
    []
  );

  // 2. Update urlMappings in useMemo
  const urlMappings = useMemo(
    () => ({
      New: "new",
      Popular: "popular",
      Creatives: "creatives",
      Couples: "couples",
      Photography: "photographer",
      Videography: "videographer",
      Florist: "florist",
      Planner: "planner",
      "My Posts": "my-posts", // Changed from "Posts & Replies"
      Bookmark: "bookmark",
      Chatrooms: "chatrooms",
    }),
    []
  );

  const mainCategoryIcons = {
    New: NewFeedIcon,
    Popular: PopularFeedIcon,
    Creatives: CreativesFeedIcon,
    Couples: CouplesFeedIcon,
    Chatrooms: ChatroomFeedIcon,
    "My Posts": MyPostFeedIcon,
    Bookmark: BookmarkFeedIcon,
  };

  // Icon mappings for sub-filters
  const subFilterIcons = {
    Photographer: PhotograherIcon,
    Videographer: VideographerIcon,
    Florist: FloristIcon,
    Planner: PlannerIcon,
    all: SeeAllIcon,
  };


  // Handle single post mode - redirect on refresh/re-entry to reset feed
  useEffect(() => {
    if (!singlePostMode || !postId) return;

    const storageKey = `seen_${postId}`;
    const hasSeenPost = sessionStorage.getItem(storageKey);

    console.log("🔍 Single post mode check:", {
      postId,
      hasSeenPost,
      singlePostMode
    });

    if (hasSeenPost) {
      // Already seen this post, redirect to creatives feed to reset
      console.log("🔄 Post already viewed, redirecting to /feed/creatives to reset feed");
      sessionStorage.removeItem(storageKey); // Clean up
      router.replace("/feed/creatives");
      return;
    }

    // First time seeing this post, mark it as seen
    sessionStorage.setItem(storageKey, "true");
    console.log("✅ First view of post, marking as seen");

  }, [singlePostMode, postId, router]);

  // Optional: Clean up on unmount (allows revisit after navigating away)
  useEffect(() => {
    return () => {
      if (postId && singlePostMode) {
        // Clear the flag when component unmounts
        // This allows the user to visit the post again if they navigate away first
        sessionStorage.removeItem(`seen_${postId}`);
      }
    };
  }, [postId, singlePostMode]);

  useEffect(() => {
    if (!hasHydrated) return;

    const urlCategory = routeParams.category;
    const protectedCategories = ["new", "bookmark", "my-posts", "chatrooms"];

    if (protectedCategories.includes(urlCategory) && !isAuthenticated) {
      console.log(`⚠️ FeedPage: Unauthorized access to ${urlCategory}, redirecting to popular`);
      router.replace("/feed/popular");
    }
  }, [hasHydrated, isAuthenticated, routeParams.category, router]);





  // 3. Update getCategoriesForUser array
  const getCategoriesForUser = useMemo(() => {
    if (!isAuthenticated) {
      return ["Popular", "Creatives", "Couples"];
    }

    if (user?.userType === "couple") {
      return ["Popular", "Creatives", "Couples"];
    }

    return [
      "New",
      "Popular",
      "Creatives",
      "Couples",
      "Chatrooms",
      "My Posts", // Changed from "Posts & Replies"
      "Bookmark",
    ];
  }, [isAuthenticated, user?.userType]);

  const getCurrentCategory = useMemo(() => {
    if (!urlCategory) return "Couples";

    // Handle multi-category URLs by extracting the first category
    const firstCategory = urlCategory.split("-")[0];

    // Updated mappings to match new names
    const categoryMap = {
      photographer: "Photographer",
      videographer: "Videographer",
      florist: "Florist",
      planner: "Planner",
      photography: "Photographer", // Legacy support
      videography: "Videographer", // Legacy support
    };

    // Try to map the first category
    const mappedCategory =
      categoryMappings[firstCategory] || categoryMap[firstCategory];

    if (mappedCategory) {
      return mappedCategory;
    }

    // Fallback to full URL category mapping
    const fullMappedCategory = categoryMappings[urlCategory];
    if (fullMappedCategory) {
      return fullMappedCategory;
    }

    return "Couples";
  }, [urlCategory, categoryMappings]);

  // Memoize validation function
  const isValidCategory = useCallback(
    (category) => {
      if (!isAuthenticated) {
        return category === "Couples";
      }
      return getCategoriesForUser.includes(category);
    },
    [isAuthenticated, getCategoriesForUser]
  );

  const [selectedCategory, setSelectedCategory] = useState(
    () => getCurrentCategory
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [creativesSubFilter, setCreativesSubFilter] = useState("all"); // New state for creatives sub-filter
  const [posts, setPosts] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [savedPosts, setSavedPosts] = useState(new Set());
  const [voting, setVoting] = useState({});

  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [chatroomModal, setChatroomModal] = useState({
    isOpen: false,
    post: null,
  });

  const { isVisible, isAtTop } = useScrollVisibility();

  const [showCreateButton, setShowCreateButton] = useState(isVisible);
  const lastScrollYRef = useRef(0);
  const tickingRef = useRef(false);
  const [fetchError, setFetchError] = useState(null);
  const [singlePost, setSinglePost] = useState(null);
  const [singlePostLoading, setSinglePostLoading] = useState(false);
  const [singlePostError, setSinglePostError] = useState(null);

  const POSTS_PER_PAGE = 10;
  //   let rafId;

  //   const handleScroll = () => {
  //     if (rafId) return;

  //     rafId = requestAnimationFrame(() => {
  //       const scrollY = window.scrollY;

  //       if (scrollY <= 100) {
  //         setShowCreateButton(true);
  //       } else {
  //         setShowCreateButton(scrollY < lastScrollYRef.current);
  //       }

  //       lastScrollYRef.current = scrollY;
  //       rafId = null;
  //     });
  //   };

  //   window.addEventListener("scroll", handleScroll, { passive: true });
  //   return () => {
  //     window.removeEventListener("scroll", handleScroll);
  //     if (rafId) cancelAnimationFrame(rafId);
  //   };
  // }, []);

  const fetchSinglePost = useCallback(async (postId) => {
    if (!postId || !mountedRef.current) {
      console.log(
        "❌ fetchSinglePost called without postId or component unmounted"
      );
      return;
    }

    console.log("🔄 fetchSinglePost called with postId:", postId);

    setSinglePostLoading(true);
    setSinglePostError(null);
    setSinglePost(null); // Reset previous post

    try {
      const data = await getPublicPost(postId);
      console.log("📊 Single post response:", data);

      if (!mountedRef.current) {
        console.log("🚫 Component unmounted during fetch");
        return;
      }

      // FIX: Check if we have a post object in the response
      if (!data || !data.post) {
        const errorMessage = data?.error || "Failed to load post";
        console.error("❌ Single post error:", errorMessage);
        setSinglePostError(errorMessage);
        return;
      }

      const post = data.post;

      console.log("✅ Single post loaded successfully:", post);

      // Set the post and initialize like/save states
      setSinglePost(post);
      setAllPosts([post]);

      if (post.hasOwnProperty("isLiked")) {
        setLikedPosts(new Set(post.isLiked ? [post.id] : []));
        setSavedPosts(new Set(post.isSaved ? [post.id] : []));
      }
    } catch (error) {
      console.error("Failed to load single post:", error);
      if (mountedRef.current) {
        setSinglePostError(error.message || "Failed to load post");
      }
    } finally {
      if (mountedRef.current) {
        setSinglePostLoading(false);
      }
    }
  }, []);

  const fetchPosts = useCallback(
    async (page = 1, category = selectedCategory, reset = false) => {
      if (loadingRef.current && !reset) return;
      if (!mountedRef.current || !hasHydrated) return;

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      loadingRef.current = true;
      setFetchError(null);
      setGlobalSearchError(null);

      try {
        if (reset) {
          setLoading(true);
          setCurrentPage(1);
          setHasMore(true);
          setAllPosts([]); // Clear posts immediately on reset
          setGlobalSearchResults([]); // Clear global search results
        } else {
          setLoadingMore(true);
        }

        // Check if we should use global search
        const shouldUseGlobalSearch = searchTerm.trim().length >= 2;

        let data;
        if (shouldUseGlobalSearch) {
          setIsGlobalSearching(true);

          // Use global search endpoint
          const categoryFilter =
            category !== "Couples" &&
              category !== "Bookmark" &&
              creativesSubFilter !== "all"
              ? creativesSubFilter
              : category === "Creatives"
                ? "Photographer,Videographer,Florist,Planner"
                : "";

          data = await globalSearch(
            searchTerm.trim(),
            page,
            POSTS_PER_PAGE,
            sortBy,
            categoryFilter
          );

          // Transform the response to match existing structure
          data = {
            success: true,
            posts: data.posts || [],
            pagination: {
              hasMore: data.pagination?.hasMore || false,
            },
          };

          // Store global search results separately
          if (reset) {
            setGlobalSearchResults(data.posts);
          } else {
            setGlobalSearchResults((prev) => [...prev, ...data.posts]);
          }
        } else {
          setIsGlobalSearching(false);

          // Use regular feed endpoint
          let backendCategory = category;

          // Only apply sub-filter category change if NOT on "New" or "My Posts" feed
          if (
            category !== "Couples" &&
            category !== "Bookmark" &&
            category !== "New" && // ADD THIS LINE
            category !== "My Posts" && // ADD THIS LINE
            creativesSubFilter !== "all"
          ) {
            backendCategory = creativesSubFilter;
          }

          data = await Promise.race([
            getFeed(backendCategory, page, POSTS_PER_PAGE, "", sortBy),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Request timeout")), 30000)
            ),
          ]);
        }

        if (!mountedRef.current) return;

        if (!data.success) {
          throw new Error(data.error || "Failed to load posts");
        }

        const posts = data?.posts || [];
        const pagination = data?.pagination || { hasMore: false };

        // Only update allPosts if not using global search
        if (!shouldUseGlobalSearch) {
          if (reset) {
            setAllPosts(posts);
            setCurrentPage(2);
          } else {
            setAllPosts((prev) => [...prev, ...posts]);
            setCurrentPage((prev) => prev + 1);
          }
        } else {
          // For global search, just update the page counter
          setCurrentPage(reset ? 2 : (prev) => prev + 1);
        }

        // Update interaction states
        if (posts.length > 0 && posts[0].hasOwnProperty("isLiked")) {
          const likedPostIds = posts.filter((p) => p.isLiked).map((p) => p.id);
          const savedPostIds = posts.filter((p) => p.isSaved).map((p) => p.id);

          if (reset) {
            setLikedPosts(new Set(likedPostIds));
            setSavedPosts(new Set(savedPostIds));
          } else {
            setLikedPosts((prev) => new Set([...prev, ...likedPostIds]));
            setSavedPosts((prev) => new Set([...prev, ...savedPostIds]));
          }
        }

        setHasMore(pagination.hasMore || false);
      } catch (error) {
        if (error.name === "AbortError" || !mountedRef.current) return;

        console.error("Feed/Search fetch error:", error);

        if (searchTerm.trim().length >= 2) {
          setGlobalSearchError(error.message);
        } else {
          setFetchError(error.message);
        }

        toast.error("Failed to load posts");

        // Auto-retry for network errors
        if (
          error.message.includes("timeout") ||
          error.message.includes("Network")
        ) {
          setTimeout(() => {
            if (mountedRef.current && !loadingRef.current) {
              fetchPosts(page, category, reset);
            }
          }, 3000);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setLoadingMore(false);
          setIsGlobalSearching(false);
        }
        loadingRef.current = false;
        abortControllerRef.current = null;
      }
    },
    [searchTerm, sortBy, hasHydrated, selectedCategory, creativesSubFilter]
  );

  const filteredAndSortedPosts = useMemo(() => {
    // If we have a search term, use global search results
    if (searchTerm.trim().length >= 2) {
      return globalSearchResults; // This is correctly paginated from the backend
    }

    // Otherwise use the existing local filtering logic
    let filteredPosts = allPosts;

    // Apply sub-category filtering only for relevant categories
    if (
      selectedCategory !== "Couples" &&
      selectedCategory !== "Bookmark" &&
      selectedCategory !== "My Posts" && // Add this condition
      creativesSubFilter !== "all"
    ) {
      filteredPosts = allPosts.filter((post) => {
        const categories = post.categories || [];
        return categories.some(
          (cat) => cat.toLowerCase() === creativesSubFilter.toLowerCase()
        );
      });
    }

    // Apply sorting
    const sortedPosts = [...filteredPosts];

    if (selectedCategory === "Bookmark") {
      sortedPosts.sort((a, b) => {
        const aDate = a.savedAt ? new Date(a.savedAt) : new Date(a.createdAt);
        const bDate = b.savedAt ? new Date(b.savedAt) : new Date(b.createdAt);
        return bDate - aDate;
      });
    } else if (
      [
        "Creatives",
        "Photographer",
        "Videographer",
        "Florist",
        "Planner",
      ].includes(selectedCategory) ||
      (selectedCategory !== "Couples" &&
        selectedCategory !== "Bookmark" &&
        creativesSubFilter !== "all")
    ) {
      switch (sortBy) {
        case "oldest":
          sortedPosts.sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
          );
          break;
        case "likes":
          sortedPosts.sort((a, b) => (b.likes || 0) - (a.likes || 0));
          break;
        case "saves":
          sortedPosts.sort((a, b) => (b.saves || 0) - (a.saves || 0));
          break;
        case "newest":
        default:
          sortedPosts.sort((a, b) => {
            const aThreshold = a.thresholdMetAt
              ? new Date(a.thresholdMetAt)
              : new Date(0);
            const bThreshold = b.thresholdMetAt
              ? new Date(b.thresholdMetAt)
              : new Date(0);
            return bThreshold - aThreshold;
          });
          break;
      }
    } else {
      switch (sortBy) {
        case "oldest":
          sortedPosts.sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
          );
          break;
        case "likes":
          sortedPosts.sort((a, b) => (b.likes || 0) - (a.likes || 0));
          break;
        case "saves":
          sortedPosts.sort((a, b) => (b.saves || 0) - (a.saves || 0));
          break;
        case "newest":
        default:
          sortedPosts.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          break;
      }
    }

    return sortedPosts;
  }, [
    allPosts,
    globalSearchResults,
    searchTerm,
    sortBy,
    selectedCategory,
    creativesSubFilter,
  ]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // If search term is empty, fetch regular feed
    if (!searchTerm.trim()) {
      fetchPosts(1, selectedCategory, true);
      return;
    }

    // If search term is too short, don't search
    if (searchTerm.trim().length < 2) {
      return;
    }

    // Debounce the search
    searchTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        fetchPosts(1, selectedCategory, true);
      }
    }, 300); // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, selectedCategory, sortBy, creativesSubFilter]);

  useEffect(() => {
    const currentObserverRef = observerRef.current;
    if (!currentObserverRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (
          entry.isIntersecting &&
          hasMore &&
          !loadingRef.current &&
          !loading &&
          !loadingMore &&
          mountedRef.current &&
          !fetchError &&
          !globalSearchError &&
          !isGlobalSearching // Add this check
        ) {
          const currentPageValue = currentPage;
          const currentCategoryValue = selectedCategory;

          fetchPosts(currentPageValue, currentCategoryValue, false);
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    observer.observe(currentObserverRef);
    return () => observer.disconnect();
  }, [
    hasMore,
    loading,
    loadingMore,
    fetchError,
    globalSearchError,
    isGlobalSearching,
  ]); // Add isGlobalSearching to dependencies


  // prevent scrolling when drop down is opened
  useEffect(() => {
    if (isDropdownOpen || isFilterOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isDropdownOpen, isFilterOpen]);

  // Add this to your FeedPage.js - runs once on mount
  useEffect(() => {
    // Ensure body is scrollable on initial load
    document.body.style.overflow = "unset";
    document.documentElement.style.overflow = "unset";
  }, []); // ← Empty dependency array = runs once on mount

  // Update posts when filtered results change
  useEffect(() => {
    setPosts(filteredAndSortedPosts);
  }, [filteredAndSortedPosts]);

  useEffect(() => {
    if (!hasHydrated) return;

    const currentCategory = getCurrentCategory;
    setCurrentFeedCategory(urlCategory);

    if (currentCategory !== selectedCategory || initialLoadRef.current) {
      setSelectedCategory(currentCategory);

      // UPDATED: Reset creative sub-filter when changing to categories that don't support it
      if (
        currentCategory === "Couples" ||
        currentCategory === "Bookmark"
        // REMOVED: || currentCategory === "My Posts" // Remove this line
      ) {
        setCreativesSubFilter("all");
      }

      if (singlePostMode && postId) {
        fetchSinglePost(postId);
      }

      fetchPosts(1, currentCategory, true);
      initialLoadRef.current = false;
    }
  }, [urlCategory, hasHydrated, postId, singlePostMode]);

  useEffect(() => {
    const currentObserverRef = observerRef.current;
    if (!currentObserverRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (
          entry.isIntersecting &&
          hasMore &&
          !loadingRef.current &&
          !searchTerm.trim() &&
          !loading &&
          !loadingMore &&
          mountedRef.current &&
          !fetchError
        ) {
          // Use current values, not stale closures
          const currentPageValue = currentPage;
          const currentCategoryValue = selectedCategory;

          fetchPosts(currentPageValue, currentCategoryValue, false);
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    observer.observe(currentObserverRef);
    return () => observer.disconnect();
  }, [hasMore, searchTerm, loading, loadingMore, fetchError]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && mountedRef.current) {
        // Re-establish connection after background
        if (fetchError || allPosts.length === 0) {
          console.log("App resumed, refreshing feed...");
          setFetchError(null);
          fetchPosts(1, selectedCategory, true);
        }
      } else if (document.visibilityState === "hidden") {
        // Cancel ongoing requests when going to background
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }
    };

    const handlePageHide = () => {
      // Cancel all requests when page is being hidden/unloaded
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [selectedCategory, fetchError]); // Minimal dependencies

  const handleManualLoadMore = useCallback(() => {
    if (
      !hasMore ||
      loading ||
      loadingMore ||
      loadingRef.current ||
      fetchError ||
      globalSearchError ||
      isGlobalSearching
    ) {
      console.log("Load more blocked:", {
        hasMore,
        loading,
        loadingMore,
        loadingRef: loadingRef.current,
        fetchError,
        globalSearchError,
        isGlobalSearching,
      });
      return;
    }

    console.log("Manually loading more posts...", {
      currentPage,
      selectedCategory,
    });

    fetchPosts(currentPage, selectedCategory, false);
  }, [
    hasMore,
    loading,
    loadingMore,
    fetchError,
    globalSearchError,
    isGlobalSearching,
    fetchPosts,
    currentPage,
    selectedCategory,
  ]);

  const handleCategoryChange = useCallback(
    (category) => {
      const urlCategory = urlMappings[category];
      if (singlePostMode) {
        // In single post mode, navigate to regular feed
        router.push(`/feed/${urlCategory}`);
      } else {
        router.push(`/feed/${urlCategory}`);
      }
      setIsDropdownOpen(false);
    },
    [router, urlMappings, singlePostMode]
  );


  // New handler for creative sub-filter changes
  const handleCreativesSubFilterChange = useCallback(
    (subFilter) => {
      setCreativesSubFilter(subFilter);
      setIsFilterOpen(false);
      // Trigger a refetch with the new sub-filter
      fetchPosts(1, selectedCategory, true);
    },
    [fetchPosts, selectedCategory]
  );

  const clearSearch = useCallback(() => {
    setSearchTerm("");
  }, []);

  // Enhanced retry function for failed requests
  const handleRetry = useCallback(() => {
    if (loadingRef.current) return;
    setFetchError(null);
    setGlobalSearchError(null);
    fetchPosts(1, selectedCategory, true);
  }, [fetchPosts, selectedCategory]);

  const handleLike = useCallback(
    async (postId) => {
      if (!isAuthenticated) {
        setShowLoginPrompt(true);
        return;
      }

      const isCurrentlyLiked = likedPosts.has(postId);
      const currentPost = allPosts.find((post) => post.id === postId);

      if (!currentPost) {
        console.error("Post not found in allPosts");
        return;
      }

      // Calculate what would happen after the like/unlike
      const newLikeCount = isCurrentlyLiked
        ? currentPost.likes - 1
        : currentPost.likes + 1;

      const willMeetThreshold =
        !isCurrentlyLiked && !currentPost.thresholdMet && newLikeCount >= 1;

      const wouldLoseThreshold =
        isCurrentlyLiked && currentPost.thresholdMet && newLikeCount < 1;

      // Optimistic UI update
      setLikedPosts((prev) => {
        const newSet = new Set(prev);
        newSet.has(postId) ? newSet.delete(postId) : newSet.add(postId);
        return newSet;
      });

      const updatePostLike = (prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
              ...post,
              likes: newLikeCount,
              isLiked: !isCurrentlyLiked,
              thresholdMet: willMeetThreshold
                ? true
                : wouldLoseThreshold
                  ? false
                  : post.thresholdMet,
              commentsEnabled: willMeetThreshold
                ? true
                : wouldLoseThreshold
                  ? false
                  : post.commentsEnabled,
              commentsEnabledAt: willMeetThreshold
                ? new Date().toISOString()
                : wouldLoseThreshold
                  ? null
                  : post.commentsEnabledAt,
            }
            : post
        );

      setAllPosts(updatePostLike);

      // Only remove from "New" feed if threshold is met (not if it would be lost due to unlike)
      if (willMeetThreshold && selectedCategory === "New") {
        setTimeout(() => {
          setAllPosts((prevPosts) =>
            prevPosts.filter((post) => post.id !== postId)
          );
        }, 1000);
      }

      try {
        const response = await likePost({ postId });

        // Check if the API call was successful
        if (response.success) {
          // SUCCESS: Backend accepted the like/unlike
          console.log("Like operation successful:", response.data);

          // If the post just lost threshold and we're NOT in "New" category,
          // remove it from current feed (it should go back to "New")
          if (wouldLoseThreshold && selectedCategory !== "New") {
            setTimeout(() => {
              setAllPosts((prevPosts) =>
                prevPosts.filter((post) => post.id !== postId)
              );
            }, 1000);
          }
        } else {
          // API returned success: false, treat as error
          throw new Error(response.error || "Like operation failed");
        }
      } catch (error) {
        console.error("Like failed:", error);

        // First check if it's our custom API response with success: false
        if (error.message && !error.response) {
          // This is from our API wrapper
          if (
            error.message.includes("Cannot unlike") ||
            error.message.includes("threshold")
          ) {
            toast.error(error.message);
          } else {
            // General API error
            if (isCurrentlyLiked) {
              toast.error("Action not permitted.");
            } else {
              toast.error("Failed to like post.");
            }
          }
        } else if (error.response) {
          // Direct axios error (backup case)
          if (
            error.response.status === 400 &&
            error.response.data?.canUnlike === false
          ) {
            toast.error(
              error.response.data.message ||
              error.response.data.error ||
              "Cannot unlike - this like maintains the post's threshold status"
            );
          } else {
            const errorMsg =
              error.response.data?.message || error.response.data?.error;
            if (errorMsg) {
              toast.error(errorMsg);
            } else {
              if (isCurrentlyLiked) {
                toast.error("Action not permitted.");
              } else {
                toast.error("Failed to like post.");
              }
            }
          }
        } else {
          // Network or other error
          if (isCurrentlyLiked) {
            toast.error("Action not permitted.");
          } else {
            toast.error("Failed to like post.");
          }
        }

        // Revert the optimistic UI update for ANY error
        setLikedPosts((prev) => {
          const newSet = new Set(prev);
          // Restore the original liked state
          isCurrentlyLiked ? newSet.add(postId) : newSet.delete(postId);
          return newSet;
        });

        // Revert the post state to original for ANY error
        const revertPostLike = (prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId
              ? {
                ...post,
                likes: currentPost.likes, // Restore original like count
                isLiked: isCurrentlyLiked, // Restore original liked state
                thresholdMet: currentPost.thresholdMet, // Restore original threshold
                commentsEnabled: currentPost.commentsEnabled,
                commentsEnabledAt: currentPost.commentsEnabledAt,
              }
              : post
          );

        setAllPosts(revertPostLike);
      }
    },
    [isAuthenticated, likedPosts, allPosts, selectedCategory]
  );

  const handleSave = useCallback(
    async (postId) => {
      if (!isAuthenticated) {
        setShowLoginPrompt(true);
        return;
      }

      const currentPost = allPosts.find((post) => post.id === postId);

      if (!currentPost?.thresholdMet) {
        toast.error(
          "Bookmarking is unavailable as this post hasn't reached the threshold"
        );
        return;
      }

      const isCurrentlySaved = savedPosts.has(postId);

      setSavedPosts((prev) => {
        const newSet = new Set(prev);
        newSet.has(postId) ? newSet.delete(postId) : newSet.add(postId);
        return newSet;
      });

      const updatePostSave = (prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
              ...post,
              saves: isCurrentlySaved ? post.saves - 1 : post.saves + 1,
              isSaved: !isCurrentlySaved,
            }
            : post
        );

      setAllPosts(updatePostSave);

      try {
        await savePost({ postId });
      } catch (error) {
        console.error("Save failed:", error);
        toast.error("Failed to save post.");

        setSavedPosts((prev) => {
          const newSet = new Set(prev);
          isCurrentlySaved ? newSet.add(postId) : newSet.delete(postId);
          return newSet;
        });

        const revertPostSave = (prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId
              ? {
                ...post,
                saves: isCurrentlySaved ? post.saves + 1 : post.saves - 1,
                isSaved: isCurrentlySaved,
              }
              : post
          );

        setAllPosts(revertPostSave);
      }
    },
    [isAuthenticated, allPosts, savedPosts]
  );

  const handleVote = useCallback(
    async (postId, optionIndex) => {
      if (!isAuthenticated) {
        setShowLoginPrompt(true);
        return;
      }

      if (voting[postId]) return;

      const currentPost = allPosts.find((post) => post.id === postId);
      const hasVoted = currentPost?.hasVoted;
      const now = Date.now();

      // Check if this is an edit within 30 seconds
      const voteTimestamp = voteTimestamps[postId];
      const isWithinEditWindow = voteTimestamp && now - voteTimestamp <= 30000;
      const isEdit =
        hasVoted && isWithinEditWindow && editableVotes.has(postId);

      if (hasVoted && !isEdit) {
        toast.error("You have already voted on this poll");
        return;
      }

      // Optimistic UI update
      setVoting((prev) => ({ ...prev, [postId]: true }));

      // Store the previous state for rollback
      const previousPollOptions = [...currentPost.pollOptions];
      const previousTotalVotes = currentPost.totalVotes || 0;

      try {
        // Update UI optimistically
        const updatePostVote = (prevPosts) =>
          prevPosts.map((post) => {
            if (post.id === postId) {
              const updatedPollOptions = post.pollOptions.map(
                (option, index) => {
                  let newVotes = option.votes || 0;

                  if (isEdit) {
                    // Remove vote from previous selection
                    if (option.isUserChoice) {
                      newVotes = Math.max(0, newVotes - 1);
                    }
                    // Add vote to new selection
                    if (index === optionIndex) {
                      newVotes += 1;
                    }
                  } else {
                    // New vote
                    if (index === optionIndex) {
                      newVotes += 1;
                    }
                  }

                  return {
                    ...option,
                    votes: newVotes,
                    isUserChoice: index === optionIndex,
                  };
                }
              );

              const totalVotes = updatedPollOptions.reduce(
                (sum, option) => sum + option.votes,
                0
              );

              const finalPollOptions = updatedPollOptions.map((option) => ({
                ...option,
                percentage:
                  totalVotes > 0
                    ? Math.round((option.votes / totalVotes) * 100)
                    : 0,
              }));

              return {
                ...post,
                hasVoted: true,
                pollOptions: finalPollOptions,
                totalVotes: totalVotes,
              };
            }
            return post;
          });

        setAllPosts(updatePostVote);

        // Call API
        const response = await votePoll(postId, optionIndex, isEdit);

        // Update timestamps and editable votes
        setVoteTimestamps((prev) => ({ ...prev, [postId]: now }));
        setEditableVotes((prev) => new Set(prev).add(postId));

        // Set timeout to remove edit capability after 30 seconds
        setTimeout(() => {
          setEditableVotes((prev) => {
            const newSet = new Set(prev);
            newSet.delete(postId);
            return newSet;
          });
        }, 30000);

        if (isEdit) {
          toast.success("Vote updated successfully!");
        } else {
          toast.success("Vote recorded successfully!");
        }
      } catch (error) {
        console.error("Vote failed:", error);
        toast.error(isEdit ? "Failed to update vote" : "Failed to vote");

        // Rollback optimistic update
        const revertPostVote = (prevPosts) =>
          prevPosts.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                hasVoted: hasVoted,
                pollOptions: previousPollOptions,
                totalVotes: previousTotalVotes,
              };
            }
            return post;
          });

        setAllPosts(revertPostVote);
      } finally {
        setVoting((prev) => ({ ...prev, [postId]: false }));
      }
    },
    [isAuthenticated, voting, allPosts, editableVotes, voteTimestamps]
  );

  const handlePostDeleted = useCallback((deletedPostId) => {
    // Remove from all relevant state arrays
    setAllPosts((prev) => prev.filter((p) => p.id !== deletedPostId));
    setPosts((prev) => prev.filter((p) => p.id !== deletedPostId));
    setSinglePost((prev) => (prev?.id === deletedPostId ? null : prev));

    // Remove from interaction states
    setLikedPosts((prev) => {
      const newSet = new Set(prev);
      newSet.delete(deletedPostId);
      return newSet;
    });

    setSavedPosts((prev) => {
      const newSet = new Set(prev);
      newSet.delete(deletedPostId);
      return newSet;
    });

    // Remove from voting states
    setVoting((prev) => {
      const newVoting = { ...prev };
      delete newVoting[deletedPostId];
      return newVoting;
    });

    setEditableVotes((prev) => {
      const newSet = new Set(prev);
      newSet.delete(deletedPostId);
      return newSet;
    });

    setVoteTimestamps((prev) => {
      const newTimestamps = { ...prev };
      delete newTimestamps[deletedPostId];
      return newTimestamps;
    });

    console.log(`Post ${deletedPostId} removed from frontend state`);
  }, []);

  useEffect(() => {
    return () => {
      // Clear all timers when component unmounts
      setEditableVotes(new Set());
      setVoteTimestamps({});
    };
  }, []);

  const handleChatroomClick = useCallback(
    async (post) => {
      if (!isAuthenticated) {
        setShowLoginPrompt(true);
        return;
      }

      // CRITICAL FIX: For posts that haven't met threshold, don't allow any chatroom access
      if (!post.thresholdMet) {
        // Show a toast message instead of modal for threshold not met
        toast.error(
          "Chatroom access is unavailable as this post hasn't reached the threshold"
        );
        return;
      }

      try {
        // First, check if post has comments
        const commentCountResponse = await getPostCommentCount({
          postId: post.id,
        });

        // If post has comments, navigate directly to chatroom (no modal)
        if (commentCountResponse.hasComments) {
          console.log("Post has comments, navigating directly to chatroom");

          const response = await openChatroom({ postId: post.id });

          const slug = generateSlug(post.subject);
          const categoriesPath = post.categories
            .map((category) => category.toLowerCase().replace(/\s+/g, "-"))
            .join("-");

          router.push(`/chatroom/${categoriesPath}/${slug}/${post.id}`);
          return;
        }

        // If post has no comments, show modal for user to decide
        setChatroomModal({ isOpen: true, post });
      } catch (error) {
        console.error(
          "Failed to check comment count or chatroom status:",
          error
        );
        // On error, default to showing the modal only if threshold is met
        if (post.thresholdMet) {
          setChatroomModal({ isOpen: true, post });
        } else {
          toast.error(
            "Chatroom access is unavailable as this post hasn't reached the threshold"
          );
        }
      }
    },
    [isAuthenticated, router]
  );

  const handleEnterChatroom = useCallback(() => {
    setChatroomModal({ isOpen: false, post: null });

    const post = chatroomModal.post;
    const slug = generateSlug(post.subject);

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

    router.push(`/chatroom/${categoriesPath}/${slug}/${post.id}`);
  }, [chatroomModal.post, router]);

  const handleCloseChatroomModal = useCallback(() => {
    setChatroomModal({ isOpen: false, post: null });
  }, []);

  const formatTimeRemaining = useCallback((minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }, []);

  const handleCreatePost = useCallback(async () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }

    // Check if user is eligible to post
    const eligibilityResponse = await checkPostingEligibility();

    if (!eligibilityResponse.success) {
      toast.error("Failed to check posting eligibility");
      return;
    }

    const { canPost, likesRemaining } = eligibilityResponse.data;

    if (!canPost) {
      toast.error(
        `Like ${likesRemaining} post${likesRemaining !== 1 ? "s" : ""
        } to unlock posting`,
        {
          duration: 3000,
        }
      );
      return;
    }

    // User is eligible, proceed to create post
    router.push("/feed/create-post");
  }, [isAuthenticated, router]);

  // Add this before the return statement, after all your other logic
  const displayCategory = useMemo(() => {
    if (
      singlePostMode &&
      ["Photographer", "Videographer", "Florist", "Planner"].includes(
        selectedCategory
      )
    ) {
      return "Creative";
    }
    return selectedCategory;
  }, [singlePostMode, selectedCategory]);

  // Don't render anything until hydration is complete
  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Toaster
        position="bottom-center"
        toastOptions={{
          className: "shadow-none",
          style: {
            boxShadow: "none",
          },
        }}
      />
      {showLoginPrompt && (
        <LoginPromptModal onClose={() => setShowLoginPrompt(false)} />
      )}

      {/* New Smooth Header Component */}
      <SmoothScrollHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategory={displayCategory}
        setIsDropdownOpen={setIsDropdownOpen}
        setIsFilterOpen={setIsFilterOpen}
        clearSearch={clearSearch}
        singlePostMode={singlePostMode}
        creativesSubFilter={creativesSubFilter}
      />

      {/* Category Dropdown Modal */}
      {isDropdownOpen && (
        <>
          <Portal>
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsDropdownOpen(false)}
            />
            <div className="fixed bottom-0 left-0 right-0 z-50 transform transition-transform duration-300 ease-out">
              <div
                className="w-full bg-white rounded-t-2xl p-4 max-h-[75vh] scrollbar-hide shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {getCategoriesForUser.map((category) => {
                  const IconComponent = mainCategoryIcons[category];
                  return (
                    <button
                      key={category}
                      onClick={() => handleCategoryChange(category)}
                      className={`w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-3 ${selectedCategory === category
                        ? "bg-gray-100 font-semibold"
                        : ""
                        }`}
                    >
                      {IconComponent && (
                        <IconComponent className="w-5 h-5 flex-shrink-0" />
                      )}
                      <span>{category}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Portal>
        </>
      )}

      {/* Filter/Sort Modal */}
      {isFilterOpen && (
        <>
          <Portal>
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsFilterOpen(false)}
            />
            <div className="fixed bottom-0 left-0 right-0 z-50 transform transition-transform duration-300 ease-out">
              <div
                className="w-full bg-white rounded-t-2xl p-4 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {selectedCategory !== "Couples" &&
                  selectedCategory !== "Bookmark" && (
                    <div className="mb-4">
                      {[
                        { key: "Photographer", label: "Photographer" },
                        { key: "Videographer", label: "Videographer" },
                        { key: "Florist", label: "Florist" },
                        { key: "Planner", label: "Planner" },
                        { key: "all", label: "See All" },
                      ].map((option) => {
                        const IconComponent = subFilterIcons[option.key];
                        return (
                          <button
                            key={option.key}
                            onClick={() =>
                              handleCreativesSubFilterChange(option.key)
                            }
                            className={`w-full text-left py-2 px-4 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-3 ${creativesSubFilter === option.key
                              ? "bg-gray-100 font-semibold"
                              : ""
                              }`}
                          >
                            {IconComponent && (
                              <IconComponent className="w-5 h-5 flex-shrink-0" />
                            )}
                            <span>{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
              </div>
            </div>
          </Portal>
        </>
      )}

      {/* Feed Content */}
      <div
        className={`max-w-[400px] md:max-w-2xl mx-auto px-4 pb-0 ${(selectedCategory === "New" || (selectedCategory === "Popular" && isAuthenticated)) ? "pt-[140px]" : "pt-[90px]" // Increased padding to account for headers
          }`}
      >
        {singlePostMode ? (
          // Single post mode rendering
          <>
            {singlePostLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader />
              </div>
            ) : singlePostError ? (
              <div className="text-center pt-16">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-600 mb-2">Failed to load post</p>
                  <p className="text-red-500 text-sm mb-3">{singlePostError}</p>
                  <button
                    onClick={() => {
                      fetchSinglePost(postId);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : singlePost ? (
              <div className="space-y-4">
                {/* Render the single post first */}
                <Post
                  key={singlePost.id}
                  post={singlePost}
                  handleVote={handleVote}
                  voting={voting}
                  handleLike={handleLike}
                  likedPosts={likedPosts}
                  handleSave={handleSave}
                  savedPosts={savedPosts}
                  handleChatroomClick={handleChatroomClick}
                  formatTimeRemaining={formatTimeRemaining}
                  isAuthenticated={isAuthenticated}
                  currentCategory={selectedCategory}
                  editableVotes={editableVotes}
                  voteTimestamps={voteTimestamps}
                />

                {posts
                  .filter((post) => post.id !== singlePost.id) // Exclude the single post we already showed
                  .map((post) => (
                    <Post
                      key={post.id}
                      post={post}
                      handleVote={handleVote}
                      voting={voting}
                      handleLike={handleLike}
                      likedPosts={likedPosts}
                      handleSave={handleSave}
                      savedPosts={savedPosts}
                      handleChatroomClick={handleChatroomClick}
                      formatTimeRemaining={formatTimeRemaining}
                      isAuthenticated={isAuthenticated}
                      currentCategory={selectedCategory}
                      editableVotes={editableVotes}
                      voteTimestamps={voteTimestamps}
                      onPostDeleted={handlePostDeleted}
                    />
                  ))}

                {hasMore && !fetchError && !globalSearchError && (
                  <div className="space-y-4">
                    <div
                      ref={observerRef}
                      className="h-20 flex items-center justify-center"
                    >
                      {loadingMore || isGlobalSearching ? <Loader /> : null}
                    </div>

                    {/* Show manual load button when not loading and has more content */}
                    {!loadingMore && !isGlobalSearching && hasMore && (
                      <div className="flex justify-center pb-4">
                        <button
                          onClick={handleManualLoadMore}
                          className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors flex items-center gap-2"
                          disabled={
                            loading ||
                            loadingMore ||
                            isGlobalSearching ||
                            !hasMore
                          }
                        >
                          <Plus size={16} />
                          See More
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center pt-16">
                <p className="text-gray-500">Post not found.</p>
              </div>
            )}
          </>
        ) : (
          <>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader />
              </div>
            ) : fetchError ? (
              <div className="text-center pt-16">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-600 mb-2">Failed to load posts</p>
                  <p className="text-red-500 text-sm mb-3">{fetchError}</p>
                  <button
                    onClick={handleRetry}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center pt-16">
                <p className="text-gray-500">
                  {searchTerm
                    ? `No posts found matching "${searchTerm}"`
                    : "No posts found."}
                </p>
                {!isAuthenticated && (
                  <p className="text-gray-400 text-sm mt-2">
                    Login to see more content and interact with posts
                  </p>
                )}
              </div>
            ) : (
              <>
                {posts.map((post) => (
                  <Post
                    key={post.id}
                    post={post}
                    handleVote={handleVote}
                    voting={voting}
                    handleLike={handleLike}
                    likedPosts={likedPosts}
                    handleSave={handleSave}
                    savedPosts={savedPosts}
                    handleChatroomClick={handleChatroomClick}
                    formatTimeRemaining={formatTimeRemaining}
                    isAuthenticated={isAuthenticated}
                    currentCategory={selectedCategory}
                    editableVotes={editableVotes}
                    voteTimestamps={voteTimestamps}
                    onPostDeleted={handlePostDeleted}
                  />
                ))}

                {hasMore && !searchTerm.trim() && !fetchError && (
                  <div className="space-y-4">
                    <div
                      ref={observerRef}
                      className="h-20 flex items-center justify-center"
                    >
                      {loadingMore ? <Loader /> : <></>}
                    </div>

                    {/* Fallback manual load button */}
                    {!loadingMore && (
                      <div className="flex justify-center pb-4">
                        <button
                          onClick={handleManualLoadMore}
                          className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors flex items-center gap-2"
                          disabled={loading || loadingMore || !hasMore}
                        >
                          <Plus size={16} />
                          See More
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Search results info */}
                {searchTerm.trim() && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm">
                      {posts.length} post{posts.length !== 1 ? "s" : ""} found
                      matching "{searchTerm}"
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {user?.userType !== "couple" && isAuthenticated && (
        <motion.button
          onClick={handleCreatePost}
          initial={{ y: 0, opacity: 0 }}
          animate={{
            // y: isVisible ? 0 : 0,
            opacity: isVisible ? 1 : 0,
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 40,
            mass: 0.5,
          }}
          style={{
            pointerEvents: isVisible ? "auto" : "none",
          }}
          className="fixed cursor-pointer bottom-6 right-6 w-14 h-14 flex items-center justify-center shadow-lg rounded-4xl"
        >
          <PostingIcon size={56} />
        </motion.button>
      )}

      {/* Chatroom Modal */}
      {chatroomModal.isOpen && (
        <ChatroomModal
          post={chatroomModal.post}
          onClose={handleCloseChatroomModal}
          onEnter={handleEnterChatroom}
        />
      )}
    </div>
  );
};

export default FeedPage;
