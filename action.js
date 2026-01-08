"use server";

import axios from "axios";
import { cookies } from "next/headers";
import axiosInstance from "./src/utils/axiosInstance";

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Server-side token refresh using cookies
 */

export const refreshTokenServer = async () => {
  try {
    const cookieStore = await cookies();
    console.log("this is called")

    const { data } = await axios.post(
      `${process.env.NEXT_PUBLIC_BASE_URL}api/auth/refresh-token`,
      {},
      {
        withCredentials: true,
        headers: {
          Cookie: cookieStore.toString(),
        },
      }
    );

    // Store new cookies on server side
    if (data.success && data.data.accessToken && data.data.refreshToken) {
      cookieStore.set("token", data.data.accessToken, {
        httpOnly: false, // Must be false to allow client access
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60,
        path: "/",
      });

      cookieStore.set("refreshToken", data.data.refreshToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 90 * 24 * 60 * 60,
        path: "/",
      });
    }

    return {
      success: true,
      data: data.data,
      message: "Token refreshed successfully",
    };
  } catch (error) {
    console.error("Server token refresh error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Token refresh failed",
    };
  }
};

const makeAuthenticatedRequest = async (url, options = {}) => {
  const cookieStore = await cookies();

  const sendRequest = async (accessToken) => {
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

    // Attach cookies for server-side requests
    headers.Cookie = cookieStore.toString();

    return axiosInstance({
      url,
      method: options.method || "GET",
      data: options.data || {},
      headers,
      timeout: 30000,
      withCredentials: true,
      ...options,
    });
  };

  try {
    const response = await sendRequest();
    return { success: true, data: response.data };
  } catch (error) {
    // Retry on 401
    if (error.response?.status === 401 && !options._retry) {
      console.log("Token expired, attempting refresh...");

      const refreshResult = await refreshTokenServer();
      if (refreshResult?.success && refreshResult.data?.accessToken) {
        options._retry = true;
        const retryResponse = await sendRequest(refreshResult.data.accessToken);
        return { success: true, data: retryResponse.data };
      }
    }

    // If still failing, throw error
    throw error;
  }
};


export const login = async ({ email, password }) => {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_BASE_URL}api/auth/login`,
      { email, password },
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );

    const { accessToken, refreshToken, user } = response.data.data;

    if (accessToken && refreshToken) {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      console.log("✅ Tokens stored in localStorage");
    }

    return {
      success: true,
      data: response.data.data,
      message: response.data.message || "Login successful",
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Login failed",
    };
  }
};
// export const login = async ({ email, password }) => {
//   try {
//        const response = await axios.post(
//       `${process.env.NEXT_PUBLIC_BASE_URL}api/auth/login`,
//       { email, password },
//       {
//         headers: {
//           "Content-Type": "application/json",
//         },
//         withCredentials: true,
//       }
//     );

//     console.log(response.data.data)

//     // Check if tokens are in response body (for mobile/fallback)
//     const { accessToken, refreshToken } = response.data.data;

//     // If tokens are in response body, set them in localStorage as fallback
//     if (typeof window !== "undefined" && accessToken && refreshToken) {
//       localStorage.setItem('accessToken', accessToken);
//       localStorage.setItem('refreshToken', refreshToken);
//       console.log(" Tokens stored in localStorage as fallback");
//     }

//     return {
//       success: true,
//       data: data.data,
//       message: data.message || "Login successful",
//     };
//   } catch (error) {
//     return {
//       success: false,
//       message: error.response?.data?.message || "Login failed",
//     };
//   }
// };

export const logout = async () => {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("token");
    cookieStore.delete("refreshToken");

    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return { success: false };
  }
};

export const register = async ({ email, password, userType }) => {
  try {
    const { data } = await axios.post(
      `${process.env.NEXT_PUBLIC_BASE_URL}api/auth/register`,
      { email, password, userType },
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );

    // Store cookies on server side
    if (data.success && data.data.accessToken && data.data.refreshToken) {
      const cookieStore = await cookies();
      const accessToken = data.data.accessToken;
      const refreshToken = data.data.refreshToken;

      // ✅ Only run on client (browser)
      if (typeof window !== "undefined" && accessToken && refreshToken) {
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        console.log("✅ Tokens stored in localStorage");
      }

      cookieStore.set("token", data.data.accessToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60,
        path: "/",
      });

      cookieStore.set("refreshToken", data.data.refreshToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 90 * 24 * 60 * 60,
        path: "/",
      });
    }

    return {
      success: true,
      data: data.data,
      message: data.message || "Registration successful!",
    };
  } catch (error) {
    console.log(error)
    return {
      success: false,
      message: error.response?.data?.message || "Registration failed",
    };
  }
};

export const googleLoginCreative = async (googleToken, userType) => {
  try {
    const { data } = await axios.post(
      `${process.env.NEXT_PUBLIC_BASE_URL}api/auth/google/creative`,
      { googleToken, userType },
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error.response?.data?.message || "Google login failed",
        errorCode: error.response?.data?.errorCode,
      },
    };
  }
};

export const googleLoginCouple = async (googleToken, userType) => {
  try {
    const { data } = await axios.post(
      `${process.env.NEXT_PUBLIC_BASE_URL}api/auth/google-login-couple`,
      { googleToken, userType },
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error.response?.data?.message || "Google login failed",
        errorCode: error.response?.data?.errorCode || "API_ERROR",
      },
    };
  }
};

export const checkEmailExists = async (email) => {
  try {
    const { data } = await axios.post(
      `${process.env.NEXT_PUBLIC_BASE_URL}api/auth/check-email`,
      { email },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log(data)

    return {
      success: true,
      exists: data.data.exists,   
       reason: data.data.reason,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to check email",
    };
  }
};

export const verifyReferralCode = async ({ referralCode }) => {
  const result = await makeAuthenticatedRequest(
    `${process.env.NEXT_PUBLIC_BASE_URL}api/auth/verify-referral`,
    {
      method: "POST",
      data: { referralCode },
    }
  );

  if (result.success) {
    return result.data;
  }

  throw new Error("Failed to verify referral code");
};

export const storePhoneNumber = async ({ phone }) => {
  const result = await makeAuthenticatedRequest(
    `${process.env.NEXT_PUBLIC_BASE_URL}api/auth/store-phone`,
    {
      method: "POST",
      data: { phone },
    }
  );

  if (result.success) {
    return result.data;
  }

  throw new Error("Failed to store phone number");
};

export const verifyOTP = async ({ phone, otpCode }) => {
  const result = await makeAuthenticatedRequest(
    `${process.env.NEXT_PUBLIC_BASE_URL}api/auth/verify-otp`,
    {
      method: "POST",
      data: { phone, otpCode },
    }
  );

  if (result.success) {
    return result.data;
  }

  throw new Error("Failed to verify OTP");
};

export const completeProfile = async ({
  businessName,
  website,
  instagram,
  creativeDomains,
  referralCode,
}) => {
  const result = await makeAuthenticatedRequest(
    `${process.env.NEXT_PUBLIC_BASE_URL}api/auth/complete-profile`,
    {
      method: "POST",
      data: { businessName, website, instagram, creativeDomains, referralCode },
    }
  );

  if (result.success) {
    return result.data;
  }

  throw new Error("Failed to complete profile");
};

export const forgotPassword = async ({ email }) => {
  try {
    const { data } = await axios.post(
      `${process.env.NEXT_PUBLIC_BASE_URL}api/auth/forgot-password`,
      { email },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return {
      success: true,
      data: data.data,
      message: data.message || "Password reset link sent",
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to send reset link",
    };
  }
};

export const resetPassword = async ({ token, password }) => {
  try {
    const { data } = await axios.post(
      `${process.env.NEXT_PUBLIC_BASE_URL}api/auth/reset-password`,
      { token, password },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return {
      success: true,
      data: data.data,
      message: data.message || "Password reset successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to reset password",
    };
  }
};

// ==========================================
// EMAIL VERIFICATION
// ==========================================

export const sendVerificationEmail = async (email, userId) => {
  try {
    const { data } = await axios.post(
      `${process.env.NEXT_PUBLIC_BASE_URL}api/auth/send-verification-email`,
      { email, userId },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return {
      success: true,
      data: data.data,
      message: data.message || "Verification email sent!",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to send verification email",
    };
  }
};

export const verifyEmailToken = async (token) => {
  try {
    const { data } = await axios.get(
      `${process.env.NEXT_PUBLIC_BASE_URL}api/auth/verify-email/${token}`
    );

    return {
      success: true,
      data,
      message: "Email verified successfully!",
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to verify email.",
    };
  }
};

export const checkEmailVerificationStatus = async () => {
  const result = await makeAuthenticatedRequest(
    `${process.env.NEXT_PUBLIC_BASE_URL}api/auth/check-email-verification`,
    {
      method: "GET",
    }
  );

  if (result.success) {
    return {
      success: true,
      data: result.data.data,
      message: result.data.message,
    };
  }

  return {
    success: false,
    message: "Failed to check email verification status",
  };
};

export const resendVerificationEmail = async ({ email }) => {
  try {
    const { data } = await axios.post(
      `${process.env.NEXT_PUBLIC_BASE_URL}api/auth/resend-verification-email`,
      { email },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return {
      success: true,
      data: data.data,
      message: data.message || "Verification email resent!",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to resend verification email",
    };
  }
};

// ==========================================
// ONBOARDING
// ==========================================

export const getOnboardingProgress = async () => {
  const result = await makeAuthenticatedRequest(
    `${process.env.NEXT_PUBLIC_BASE_URL}api/auth/onboarding/progress`,
    {
      method: "GET",
    }
  );

  if (result.success) {
    return result.data;
  }

  throw new Error("Failed to get onboarding progress");
};

export const updateOnboardingProgress = async (
  currentStep,
  formData,
  stepCompleted = null
) => {
  const result = await makeAuthenticatedRequest(
    `${process.env.NEXT_PUBLIC_BASE_URL}api/auth/onboarding/update-progress`,
    {
      method: "POST",
      data: { currentStep, formData, stepCompleted },
    }
  );

  if (result.success) {
    return result.data;
  }

  throw new Error("Failed to update onboarding progress");
};

export const getNextStep = async () => {
  const result = await makeAuthenticatedRequest(
    `${process.env.NEXT_PUBLIC_BASE_URL}api/auth/onboarding/next-step`,
    {
      method: "GET",
    }
  );

  if (result.success) {
    return result.data;
  }

  throw new Error("Failed to get next step");
};

export const checkUserStatus = async () => {
  const result = await makeAuthenticatedRequest(
    `${process.env.NEXT_PUBLIC_BASE_URL}api/auth/check-status`,
    {
      method: "GET",
    }
  );

  if (result.success) {
    return result.data;
  }

  throw new Error("Failed to check user status");
};

// ==========================================
// USER DATA
// ==========================================

export const getRank = async () => {
  const result = await makeAuthenticatedRequest(
    `${process.env.NEXT_PUBLIC_BASE_URL}api/users/rank`,
    {
      method: "GET",
    }
  );

  if (result.success) {
    return result.data;
  }

  throw new Error("Failed to get rank");
};

export const getPoints = async () => {
  const result = await makeAuthenticatedRequest(
    `${process.env.NEXT_PUBLIC_BASE_URL}api/users/points`,
    {
      method: "GET",
    }
  );

  if (result.success) {
    return result.data;
  }

  throw new Error("Failed to get points");
};

export const getReferralCode = async () => {
  const result = await makeAuthenticatedRequest(
    `${process.env.NEXT_PUBLIC_BASE_URL}api/users/referral-code`,
    {
      method: "GET",
    }
  );

  if (result.success) {
    return result.data;
  }

  throw new Error("Failed to get referral code");
};

// ==========================================
// POSTS & FEED
// ==========================================

export const getFeed = async (
  category = "New",
  page = 1,
  limit = 10,
  search = "",
  sortBy = "newest"
) => {
  try {

    // Check if accessing protected category without auth
    const protectedCategories = ["New", "Bookmark", "My Posts", "Chatrooms"];

    if (protectedCategories.includes(category)) {
      const cookieStore = await cookies();
      const token = cookieStore.get("token");

      if (!token) {
        console.log(`getFeed: Blocked unauthenticated access to ${category}`);
        return {
          success: false,
          posts: [],
          pagination: { hasMore: false },
          error: "Authentication required",
          requiresAuth: true, // FLAG for auth
          redirect: "/feed/popular", //  redirect
        };
      }
    }
    const params = {
      category: String(category || "New"),
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      search: String(search || ""),
      sortBy: String(sortBy || "newest"),
    };

    const result = await makeAuthenticatedRequest(
      `${process.env.NEXT_PUBLIC_BASE_URL}api/post/feed`,
      {
        method: "GET",
        params,
      }
    );

    if (result.success) {
      return {
        success: true,
        posts: result.data.posts || [],
        pagination: result.data.pagination || { hasMore: false },
        error: null,
      };
    }

    throw new Error("Request failed");
  } catch (error) {
    console.error("getFeed Server Action Error:", error);

    let errorMessage = "Failed to fetch feed";

    if (error.response?.status === 401) {
      errorMessage = "Authentication required";
    } else if (error.response?.status === 403) {
      errorMessage = "Access forbidden";
    } else if (error.code === "ECONNABORTED") {
      errorMessage = "Request timeout";
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      posts: [],
      pagination: { hasMore: false },
      error: errorMessage,
    };
  }
};

export const getCoupleFeed = async (
  page = 1,
  limit = 10,
  search = "",
  sortBy = "newest"
) => {
  try {
    const params = {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      search: String(search || ""),
      sortBy: String(sortBy || "newest"),
    };

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const { data } = await axios.get(
      `${process.env.NEXT_PUBLIC_BASE_URL}api/post/feed/public/couples`,
      {
        params,
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          "Content-Type": "application/json",
        },
        timeout: 30000,
        withCredentials: true,
      }
    );

    return {
      success: true,
      posts: data.posts || [],
      pagination: data.pagination || { hasMore: false },
      error: null,
    };
  } catch (error) {
    console.error("getCoupleFeed Server Action Error:", error);

    return {
      success: false,
      posts: [],
      pagination: { hasMore: false },
      error: error.response?.data?.message || "Failed to fetch couple feed",
    };
  }
};

export const globalSearch = async (
  query,
  page = 1,
  limit = 10,
  sortBy = "newest",
  categories = ""
) => {
  const result = await makeAuthenticatedRequest(
    `${process.env.NEXT_PUBLIC_BASE_URL}api/post/global`,
    {
      method: "GET",
      params: { query, page, limit, sortBy, categories },
    }
  );

  if (result.success) {
    return result.data;
  }

  throw new Error("Failed to perform global search");
};

export const createPost = async (payload) => {
  try {
    const result = await makeAuthenticatedRequest(
      `${process.env.NEXT_PUBLIC_BASE_URL}api/post/`,
      {
        method: "POST",
        data: payload,
      }
    );

    if (result.success) {
      return { success: true, data: result.data };
    }

    // If result has an error property, return it
    if (result.error) {
      return {
        success: false,
        error: {
          message: result.error,
          status: result.status,
          errorCode: result.errorCode || "API_ERROR",
        },
      };
    }

    throw new Error("Failed to create post");
  } catch (error) {
    // Check if error response has the rate limit message
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      "Failed to create post";

    return {
      success: false,
      error: {
        message: errorMessage,
        status: error.response?.status,
        errorCode: error.response?.data?.errorCode || "API_ERROR",
        retryAfter: error.response?.data?.retryAfter, // Include retryAfter if present
      },
    };
  }
};

export const checkPostingEligibility = async () => {
  try {
    const result = await makeAuthenticatedRequest(
      `${process.env.NEXT_PUBLIC_BASE_URL}api/post/check-posting-eligibility`,
      {
        method: "GET",
      }
    );

    if (result.success) {
      return {
        success: true,
        data: result.data,
        error: null,
      };
    }

    throw new Error("Failed to check eligibility");
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error.response?.data?.message || "Failed to check eligibility",
    };
  }
};

export const likePost = async ({ postId }) => {
  try {
    const result = await makeAuthenticatedRequest(
      `${process.env.NEXT_PUBLIC_BASE_URL}api/post/${postId}/like`,
      {
        method: "POST",
        data: {},
      }
    );

    if (result.success) {
      return {
        success: true,
        data: result.data,
        error: null,
      };
    }

    throw new Error("Failed to like post");
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error.response?.data?.message || "Failed to like post",
      canUnlike: error.response?.data?.canUnlike !== false,
      statusCode: error.response?.status,
    };
  }
};

export const savePost = async ({ postId }) => {
  const result = await makeAuthenticatedRequest(
    `${process.env.NEXT_PUBLIC_BASE_URL}api/post/${postId}/save`,
    {
      method: "POST",
      data: {},
    }
  );

  if (result.success) {
    return result.data;
  }

  throw new Error("Failed to save post");
};

export const votePoll = async (postId, optionIndex, isEdit = false) => {
  const result = await makeAuthenticatedRequest(
    `${process.env.NEXT_PUBLIC_BASE_URL}api/post/${postId}/vote`,
    {
      method: "POST",
      data: { optionIndex, isEdit },
    }
  );

  if (result.success) {
    return result.data;
  }

  throw new Error("Failed to vote on poll");
};

export const getPost = async (postId) => {
  const result = await makeAuthenticatedRequest(
    `${process.env.NEXT_PUBLIC_BASE_URL}api/post/${postId}`,
    {
      method: "GET",
    }
  );

  if (result.success) {
    return result.data;
  }

  throw new Error("Failed to get post");
};

export const getPublicPost = async (postId) => {
  try {
    const { data } = await axios.get(
      `${process.env.NEXT_PUBLIC_BASE_URL}api/post/public/${postId}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return data;
  } catch (error) {
    throw new Error("Failed to get public post");
  }
};

export const deletePost = async (postId) => {
  const result = await makeAuthenticatedRequest(
    `${process.env.NEXT_PUBLIC_BASE_URL}api/post/${postId}`,
    {
      method: "DELETE",
    }
  );

  if (result.success) {
    return result.data;
  }

  throw new Error("Failed to delete post");
};

export const getSavedPosts = async (query = {}) => {
  const queryString = new URLSearchParams(query).toString();

  const result = await makeAuthenticatedRequest(
    `${process.env.NEXT_PUBLIC_BASE_URL}api/post/saved${queryString ? `?${queryString}` : ""
    }`,
    {
      method: "GET",
    }
  );

  if (result.success) {
    return result.data;
  }

  throw new Error("Failed to get saved posts");
};

// ==========================================
// COMMENTS
// ==========================================

export const fetchComments = async (postId, page = 1, limit = 20) => {
  try {
    const result = await makeAuthenticatedRequest(
      `${process.env.NEXT_PUBLIC_BASE_URL}api/post/comment/${postId}`,
      {
        method: "GET",
        params: { page, limit },
      }
    );

    if (result.success) {
      return result.data;
    }

    throw new Error("Failed to fetch comments");
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error("Unauthorized. Please log in.");
    } else {
      throw new Error(
        error.response?.data?.message || "Failed to fetch comments."
      );
    }
  }
};

export const fetchPublicComments = async (postId, page = 1, limit = 20) => {
  try {
    const { data } = await axios.get(
      `${process.env.NEXT_PUBLIC_BASE_URL}api/post/public/comment/${postId}`,
      {
        params: { page, limit },
      }
    );

    return data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch comments."
    );
  }
};

export const createComment = async (
  postId,
  content,
  parentCommentId = null,
  mentions = []
) => {
  const result = await makeAuthenticatedRequest(
    `${process.env.NEXT_PUBLIC_BASE_URL}api/post/comment/`,
    {
      method: "POST",
      data: { postId, content, parentCommentId, mentions },
    }
  );

  if (result.success) {
    return result.data;
  }

  throw new Error("Failed to create comment");
};

export const updateComment = async (commentId, content) => {
  const result = await makeAuthenticatedRequest(
    `${process.env.NEXT_PUBLIC_BASE_URL}api/post/comments/${commentId}`,
    {
      method: "PUT",
      data: { content },
    }
  );

  if (result.success) {
    return result.data;
  }

  throw new Error("Failed to update comment");
};

export const deleteComment = async (commentId) => {
  const result = await makeAuthenticatedRequest(
    `${process.env.NEXT_PUBLIC_BASE_URL}api/post/comments/${commentId}`,
    {
      method: "DELETE",
    }
  );

  if (result.success) {
    return result.data;
  }

  throw new Error("Failed to delete comment");
};

export const likeComment = async (commentId) => {
  const result = await makeAuthenticatedRequest(
    `${process.env.NEXT_PUBLIC_BASE_URL}api/post/comment/${commentId}/like`,
    {
      method: "POST",
      data: {},
    }
  );

  if (result.success) {
    return result.data;
  }

  throw new Error("Failed to like comment");
};

export const searchUsersForMentions = async (query, postId) => {
  const result = await makeAuthenticatedRequest(
    `${process.env.NEXT_PUBLIC_BASE_URL}api/post/comment/search-users`,
    {
      method: "GET",
      params: { query, postId },
    }
  );

  if (result.success) {
    return result.data;
  }

  throw new Error("Failed to search users");
};

export const getUsernameForChatroom = async (postId) => {
  const result = await makeAuthenticatedRequest(
    `${process.env.NEXT_PUBLIC_BASE_URL}api/post/comment/get-username`,
    {
      method: "GET",
      params: { postId },
    }
  );

  if (result.success) {
    return result.data;
  }

  throw new Error("Failed to get username");
};

export const openChatroom = async ({ postId }) => {
  const result = await makeAuthenticatedRequest(
    `${process.env.NEXT_PUBLIC_BASE_URL}api/post/enter-chatroom`,
    {
      method: "POST",
      data: { postId },
    }
  );

  if (result.success) {
    return result.data;
  }

  throw new Error("Failed to open chatroom");
};

export const getPostCommentCount = async ({ postId }) => {
  const result = await makeAuthenticatedRequest(
    `${process.env.NEXT_PUBLIC_BASE_URL}api/post/comment-count/${postId}`,
    {
      method: "GET",
    }
  );

  if (result.success) {
    return result.data;
  }

  throw new Error("Failed to get comment count");
};

// ==========================================
// ANONYMOUS MODE
// ==========================================

export const activateAnonymousMode = async () => {
  try {
    const result = await makeAuthenticatedRequest(
      `${process.env.NEXT_PUBLIC_BASE_URL}api/anon/activate`,
      {
        method: "POST",
        data: {},
      }
    );

    if (result.success) {
      return { success: true, data: result.data };
    }

    throw new Error("Failed to activate anonymous mode");
  } catch (error) {
    return {
      success: false,
      error: {
        message:
          error.response?.data?.error || "Failed to activate anonymous mode",
        status: error.response?.status,
        errorCode:
          error.response?.data?.error === "User is already in anonymous mode"
            ? "ALREADY_ANONYMOUS"
            : "API_ERROR",
      },
    };
  }
};

export const deactivateAnonymousMode = async () => {
  try {
    const result = await makeAuthenticatedRequest(
      `${process.env.NEXT_PUBLIC_BASE_URL}api/anon/deactivate`,
      {
        method: "POST",
        data: {},
      }
    );

    if (result.success) {
      return { success: true, data: result.data };
    }

    throw new Error("Failed to deactivate anonymous mode");
  } catch (error) {
    return {
      success: false,
      error: {
        message:
          error.response?.data?.error || "Failed to deactivate anonymous mode",
        status: error.response?.status,
        errorCode: error.response?.data?.errorCode || "API_ERROR",
      },
    };
  }
};

export const getAnonymousStatus = async () => {
  try {
    const result = await makeAuthenticatedRequest(
      `${process.env.NEXT_PUBLIC_BASE_URL}api/anon/status`,
      {
        method: "GET",
      }
    );

    if (result.success) {
      return { success: true, data: result.data };
    }

    throw new Error("Failed to get anonymous status");
  } catch (error) {
    return {
      success: false,
      error: {
        message:
          error.response?.data?.error || "Failed to get anonymous status",
        status: error.response?.status,
        errorCode: error.response?.data?.errorCode || "API_ERROR",
      },
    };
  }
};

// ==========================================
// CREATIVE INQUIRIES
// ==========================================

export const createCreativeInquiry = async (payload) => {
  try {
    const result = await makeAuthenticatedRequest(
      `${process.env.NEXT_PUBLIC_BASE_URL}api/creative-inquiries/create`,
      {
        method: "POST",
        data: payload,
      }
    );

    if (result.success) {
      return { success: true, data: result.data };
    }

    throw new Error("Failed to create creative inquiry");
  } catch (error) {
    return {
      success: false,
      error: {
        message:
          error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to create creative inquiry",
        status: error.response?.status,
        errorCode: error.response?.data?.errorCode || "API_ERROR",
      },
    };
  }
};

export const createPaymentSession = async (payload) => {
  try {
    const result = await makeAuthenticatedRequest(
      `${process.env.NEXT_PUBLIC_BASE_URL}api/creative-inquiries/payment`,
      {
        method: "POST",
        data: payload,
      }
    );

    if (result.success) {
      return { success: true, data: result.data };
    }

    throw new Error("Failed to create payment session");
  } catch (error) {
    return {
      success: false,
      error: {
        message:
          error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to create payment session",
        status: error.response?.status,
        errorCode: error.response?.data?.errorCode || "API_ERROR",
      },
    };
  }
};

export const handlePaymentSuccess = async (sessionId, inquiryId) => {
  try {
    const result = await makeAuthenticatedRequest(
      `${process.env.NEXT_PUBLIC_BASE_URL}api/creative-inquiries/payment/success?session_id=${sessionId}&inquiry_id=${inquiryId}`,
      {
        method: "GET",
      }
    );

    if (result.success) {
      return { success: true, data: result.data };
    }

    throw new Error("Failed to verify payment");
  } catch (error) {
    return {
      success: false,
      error: {
        message:
          error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to verify payment",
        status: error.response?.status,
        errorCode: error.response?.data?.errorCode || "API_ERROR",
      },
    };
  }
};

export const handlePaymentCancel = async (inquiryId) => {
  try {
    const result = await makeAuthenticatedRequest(
      `${process.env.NEXT_PUBLIC_BASE_URL}api/creative-inquiries/payment/cancel?inquiry_id=${inquiryId}`,
      {
        method: "GET",
      }
    );

    if (result.success) {
      return { success: true, data: result.data };
    }

    throw new Error("Failed to cancel payment");
  } catch (error) {
    return {
      success: false,
      error: {
        message:
          error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to cancel payment",
        status: error.response?.status,
        errorCode: error.response?.data?.errorCode || "API_ERROR",
      },
    };
  }
};

export const checkUserCompletedInquiries = async () => {
  try {
    const result = await makeAuthenticatedRequest(
      `${process.env.NEXT_PUBLIC_BASE_URL}api/creative-inquiries/check-completed`,
      {
        method: "GET",
      }
    );

    if (result.success) {
      return { success: true, data: result.data };
    }

    throw new Error("Failed to check inquiries");
  } catch (error) {
    return {
      success: false,
      error: {
        message:
          error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to fetch inquiries",
        status: error.response?.status,
        errorCode: error.response?.data?.errorCode || "API_ERROR",
      },
    };
  }
};

export const getUserInquiries = async (options = {}) => {
  try {
    const { status, limit = 20, offset = 0 } = options;
    let queryParams = `?limit=${limit}&offset=${offset}`;

    if (status) {
      queryParams += `&status=${status}`;
    }

    const result = await makeAuthenticatedRequest(
      `${process.env.NEXT_PUBLIC_BASE_URL}api/creative-inquiries/user-inquiries${queryParams}`,
      {
        method: "GET",
      }
    );

    if (result.success) {
      return { success: true, data: result.data };
    }

    throw new Error("Failed to fetch user inquiries");
  } catch (error) {
    return {
      success: false,
      error: {
        message:
          error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to fetch inquiries",
        status: error.response?.status,
        errorCode: error.response?.data?.errorCode || "API_ERROR",
      },
    };
  }
};

export const getInquiryDetails = async (inquiryId) => {
  try {
    const result = await makeAuthenticatedRequest(
      `${process.env.NEXT_PUBLIC_BASE_URL}api/creative-inquiries/${inquiryId}`,
      {
        method: "GET",
      }
    );

    if (result.success) {
      return { success: true, data: result.data };
    }

    throw new Error("Failed to fetch inquiry details");
  } catch (error) {
    return {
      success: false,
      error: {
        message:
          error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to fetch inquiry details",
        status: error.response?.status,
        errorCode: error.response?.data?.errorCode || "API_ERROR",
      },
    };
  }
};

export const storeChatData = async (payload) => {
  try {
    const result = await makeAuthenticatedRequest(
      `${process.env.NEXT_PUBLIC_BASE_URL}api/creative-inquiries/store-chat`,
      {
        method: "POST",
        data: payload,
      }
    );

    if (result.success) {
      return { success: true, data: result.data };
    }

    throw new Error("Failed to store chat data");
  } catch (error) {
    return {
      success: false,
      error: {
        message:
          error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to store chat data",
        status: error.response?.status,
        errorCode: error.response?.data?.errorCode || "API_ERROR",
      },
    };
  }
};

// ==========================================
// NOTIFICATIONS
// ==========================================

export const getNotifications = async (limit = 20, offset = 0) => {
  const result = await makeAuthenticatedRequest(
    `${process.env.NEXT_PUBLIC_BASE_URL}api/notifications?limit=${limit}&offset=${offset}`,
    {
      method: "GET",
    }
  );

  if (result.success) {
    return result.data;
  }

  throw new Error("Failed to get notifications");
};

export const getUnreadCount = async () => {
  const result = await makeAuthenticatedRequest(
    `${process.env.NEXT_PUBLIC_BASE_URL}api/notifications/unread-count`,
    {
      method: "GET",
    }
  );

  if (result.success) {
    return result.data;
  }

  throw new Error("Failed to get unread count");
};

export const markNotificationAsRead = async (notificationId) => {
  const result = await makeAuthenticatedRequest(
    `${process.env.NEXT_PUBLIC_BASE_URL}api/notifications/${notificationId}/read`,
    {
      method: "PATCH",
      data: {},
    }
  );

  if (result.success) {
    return result.data;
  }

  throw new Error("Failed to mark notification as read");
};

export const markAllNotificationsAsRead = async () => {
  const result = await makeAuthenticatedRequest(
    `${process.env.NEXT_PUBLIC_BASE_URL}api/notifications/read-all`,
    {
      method: "PATCH",
      data: {},
    }
  );

  if (result.success) {
    return result.data;
  }

  throw new Error("Failed to mark all notifications as read");
};

export const deleteNotification = async (notificationId) => {
  const result = await makeAuthenticatedRequest(
    `${process.env.NEXT_PUBLIC_BASE_URL}api/notifications/${notificationId}`,
    {
      method: "DELETE",
    }
  );

  if (result.success) {
    return result.data;
  }

  throw new Error("Failed to delete notification");
};

// ==========================================
// INSTAGRAM INTEGRATION
// ==========================================

export const exchangeInstagramToken = async ({
  code,
  redirect_uri,
  accessToken,
}) => {
  try {
    const headers = {
      "Content-Type": "application/json",
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_BASE_URL}api/auth/instagram/exchange-token`,
      {
        code,
        redirect_uri,
      },
      {
        headers,
        withCredentials: true,
      }
    );

    return res.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Instagram token exchange failed"
    );
  }
};

// ==========================================
// LEGACY/DEPRECATED - Keep for backward compatibility
// ==========================================

export const handleGoogleToken = async (accessToken) => {
  try {
    const cookieStore = await cookies();
    // cookieStore.set("token", accessToken);
    return true;
  } catch (error) {
    return false;
  }
};

export const refreshUserToken = async () => {
  console.warn(
    "refreshUserToken is deprecated. Token refresh is now handled automatically."
  );
  return {
    success: true,
    message:
      "This function is deprecated. Use automatic token refresh instead.",
  };
};

export const refreshAccessToken = async () => {
  console.warn(
    "refreshAccessToken is deprecated. Token refresh is now handled automatically."
  );
  return refreshTokenServer();
};


export async function checkInstagramExists(instagram) {
  try {
    const response = await makeAuthenticatedRequest(
      "/api/auth/check-instagram",
      {
        method: "POST",
        data: { instagram },
        authRequired: true,
      }
    );

    return response.data;
  } catch (error) {
    console.error("Instagram check failed:", error);
    return {
      success: false,
      message:
        error.response?.data?.message ||
        "Failed to check Instagram availability",
    };
  }
}

// Report a post
export const reportPost = async (postId) => {
  try {
    const response = await makeAuthenticatedRequest(
      `${process.env.NEXT_PUBLIC_BASE_URL}api/post/${postId}/report`,
      {
        method: "POST",
        data: {},
      }
    );

    console.log(response)

    return {
      success: true,
      data: response.data,
      message: "Post reported successfully",
    };
  } catch (error) {
    console.error("Report post error:", error);
    return {
      success: false,
      error: error.response?.data?.error || "Failed to report post",
    };
  }
};

// Check if user has already reported a post
export const checkUserReport = async (postId) => {
  try {
    const response = await makeAuthenticatedRequest(
      `${process.env.NEXT_PUBLIC_BASE_URL}api/post/${postId}/report/check`,
      {
        method: "GET",
      }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Check report error:", error);
    return {
      success: false,
      error: error.response?.data?.error || "Failed to check report status",
    };
  }
};