import React from "react";

const PostingIcon = ({ size = 52 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 52 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="52" height="52" rx="26" fill="black" />

      <path
        d="M18.7363 26H32.3203"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M26 18.5V32.084"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default PostingIcon;
