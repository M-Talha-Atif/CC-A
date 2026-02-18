import React from "react";

const ShareIconFilled = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="16"
        width="16"
        viewBox="0 0 24 24"
        fill="#000"
        x="0"
        y="0"
        opacity="100%"
      >
        <path d="M0 0h24v24H0z" fill="none"></path>
        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"></path>
      </svg>
      <defs>
        <filter
          id="filter_dshadow_10_0_2_0000001a"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood floodOpacity="0" result="bg-fix"></feFlood>
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="alpha"
          ></feColorMatrix>
          <feOffset dx="0" dy="2"></feOffset>
          <feGaussianBlur stdDeviation="5"></feGaussianBlur>
          <feComposite in2="alpha" operator="out"></feComposite>
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"
          ></feColorMatrix>
          <feBlend
            mode="normal"
            in2="bg-fix"
            result="bg-fix-filter_dshadow_10_0_2_0000001a"
          ></feBlend>
          <feBlend
            in="SourceGraphic"
            in2="bg-fix-filter_dshadow_10_0_2_0000001a"
            result="shape"
          ></feBlend>
        </filter>
      </defs>
    </svg>
  );
};

export default ShareIconFilled;
