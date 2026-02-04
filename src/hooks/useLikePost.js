import { useCallback, useRef } from 'react';
import { likePost as likePostAPI } from '../../action';
import { toast } from 'sonner';

/**
 * Facebook-style like hook - instant, no blocking
 */
export const useLikePost = ({
  isAuthenticated,
  allPosts,
  setAllPosts,
  likedPosts,
  setLikedPosts,
  selectedCategory,
  setShowLoginPrompt,
}) => {
  // Track in-flight requests (don't block, just track)
  const inflightRequestsRef = useRef(new Map());

  const handleLike = useCallback(
    async (postId) => {
      // ============================================
      // STEP 1: Auth Check
      // ============================================
      if (!isAuthenticated) {
        setShowLoginPrompt(true);
        return;
      }

      // ============================================
      // STEP 2: Get Current State
      // ============================================
      const currentPost = allPosts.find((post) => post.id === postId);
      
      if (!currentPost) {
        console.error('❌ Post not found');
        return;
      }

      const isCurrentlyLiked = likedPosts.has(postId);
      const newLikeCount = isCurrentlyLiked
        ? Math.max(0, currentPost.likes - 1) // Never go below 0
        : currentPost.likes + 1;

      const willMeetThreshold =
        !isCurrentlyLiked && !currentPost.thresholdMet && newLikeCount >= 1;
      
      const wouldLoseThreshold =
        isCurrentlyLiked && currentPost.thresholdMet && newLikeCount < 1;

      console.log(`🔄 ${isCurrentlyLiked ? 'Unlike' : 'Like'} → Count: ${currentPost.likes} → ${newLikeCount}`);

      // ============================================
      // STEP 3: INSTANT UI Update (0ms delay)
      // ============================================
      // Update liked state
      setLikedPosts((prev) => {
        const newSet = new Set(prev);
        if (isCurrentlyLiked) {
          newSet.delete(postId);
        } else {
          newSet.add(postId);
        }
        return newSet;
      });

      // Update post data
      setAllPosts((prevPosts) =>
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
        )
      );

      // ============================================
      // STEP 4: Background API Sync (non-blocking)
      // ============================================
      
      // Cancel previous request for this post if exists
      if (inflightRequestsRef.current.has(postId)) {
        console.log(`⚡ Canceling previous request for post ${postId}`);
      }

      // Mark new request as in-flight
      const requestId = Date.now();
      inflightRequestsRef.current.set(postId, requestId);

      try {
        const response = await likePostAPI({ postId });
        
        // Check if this request was superseded
        if (inflightRequestsRef.current.get(postId) !== requestId) {
          console.log(`⏭️ Request superseded for post ${postId}`);
          return;
        }

        if (!response || !response.success) {
          throw new Error(response?.error || 'Like operation failed');
        }

        // ✅ FIX: Access correct nested data
        // Your console shows: response.data.data.likes
        const serverData = response.data.data || response.data;
        
        console.log('✅ Server synced:', {
          likes: serverData.likes,
          liked: serverData.liked,
          thresholdMet: serverData.thresholdMet
        });

        // Sync with server (only if data differs)
        setAllPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  likes: serverData.likes ?? newLikeCount,
                  isLiked: serverData.liked ?? !isCurrentlyLiked,
                  thresholdMet:
                    serverData.thresholdMet !== undefined
                      ? serverData.thresholdMet
                      : post.thresholdMet,
                  commentsEnabled:
                    serverData.commentsEnabled !== undefined
                      ? serverData.commentsEnabled
                      : post.commentsEnabled,
                }
              : post
          )
        );

        // Remove from feed if threshold changed
        if (willMeetThreshold && selectedCategory === 'New') {
          setTimeout(() => {
            setAllPosts((prevPosts) =>
              prevPosts.filter((post) => post.id !== postId)
            );
          }, 800);
        }

        if (wouldLoseThreshold && selectedCategory !== 'New') {
          setTimeout(() => {
            setAllPosts((prevPosts) =>
              prevPosts.filter((post) => post.id !== postId)
            );
          }, 800);
        }

      } catch (error) {
        console.error('❌ Like failed, rolling back:', error);

        // Rollback on error
        setLikedPosts((prev) => {
          const newSet = new Set(prev);
          if (isCurrentlyLiked) {
            newSet.add(postId);
          } else {
            newSet.delete(postId);
          }
          return newSet;
        });

        setAllPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  likes: currentPost.likes,
                  isLiked: isCurrentlyLiked,
                  thresholdMet: currentPost.thresholdMet,
                  commentsEnabled: currentPost.commentsEnabled,
                  commentsEnabledAt: currentPost.commentsEnabledAt,
                }
              : post
          )
        );

        // Show error toast
        if (error.message?.includes('Cannot unlike')) {
          toast.error(error.message);
        } else if (error.message?.includes('already liked')) {
          toast.error('You have already liked this post');
        } else {
          toast.error(
            isCurrentlyLiked
              ? 'Failed to unlike post'
              : 'Failed to like post'
          );
        }
      } finally {
        // Cleanup
        if (inflightRequestsRef.current.get(postId) === requestId) {
          inflightRequestsRef.current.delete(postId);
        }
      }
    },
    [
      isAuthenticated,
      likedPosts,
      allPosts,
      selectedCategory,
      setAllPosts,
      setLikedPosts,
      setShowLoginPrompt,
    ]
  );

  return { handleLike };
};