import React from "react";
import FeedPage from "../../feed/components/FeedPage";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";

const FeedLayoutPage = async ({ params }) => {
  const { category } = await params;
  //  useProtectedRoute();

  return (
    <FeedPage params={{ category }} singlePostMode={false} postId={null} />
  );
};

export default FeedLayoutPage;
