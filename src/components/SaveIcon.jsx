import React from "react";

const SaveIcon = ({ size = 16, className = "", filled = false }) => (
  <svg
    width={size}
    height={size}
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
  >
    {filled ? (
      // Filled bookmark path (solid)
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    ) : (
      // Outline bookmark path
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    )}
  </svg>
);

export default SaveIcon;
