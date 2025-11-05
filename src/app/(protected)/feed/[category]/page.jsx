import React from "react";
import FeedPage from "../../feed/components/FeedPage";

const FeedLayoutPage = async ({ params }) => {
  const { category } = await params;

  return (
    <FeedPage params={{ category }} singlePostMode={false} postId={null} />
  );
};

export default FeedLayoutPage;
