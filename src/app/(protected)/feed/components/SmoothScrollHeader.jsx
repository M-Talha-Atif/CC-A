import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useScrollVisibility } from "@/hooks/useScrollVisibilityContext";
import { ChevronDown, AlignLeft, X } from "lucide-react";
import PhotograherIcon from "../../../../components/icons/FilterIcons/PhotograherIcon";
import VideographerIcon from "../../../../components/icons/FilterIcons/VideographerIcon";
import FloristIcon from "../../../../components/icons/FilterIcons/FloristIcon";
import PlannerIcon from "../../../../components/icons/FilterIcons/PlannerIcon";
import SeeAllIcon from "../../../../components/icons/FilterIcons/SeeAllIcon";
import useUserStore from "../../../../store/userStore";

const SmoothScrollHeader = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setIsDropdownOpen,
  setIsFilterOpen,
  clearSearch,
  singlePostMode = false,
  creativesSubFilter = "all",
  onSearch,
}) => {
  const { isVisible, isAtTop } = useScrollVisibility();
  const { isAuthenticated } =
    useUserStore();

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchTerm.trim().length >= 2) {
      onSearch(); // Trigger search on Enter
    }
  };

  // // Override visibility when no posts
  // const isVisible = postsLength === 0 ? true : originalIsVisible;
  // const isAtTop = posts.length === 0 ? true : originalIsAtTop;

  const getFilterIcon = () => {
    const iconMap = {
      Photographer: PhotograherIcon,
      Videographer: VideographerIcon,
      Florist: FloristIcon,
      Planner: PlannerIcon,
      all: SeeAllIcon,
    };

    return iconMap[creativesSubFilter] || SeeAllIcon;
  };
  // const check = () => {
  //  setIsDropdownOpen(true)
  // }

  const FilterIcon = getFilterIcon();

  // Show filter button for Creatives category (excluding Couples as per requirement)
  const showFilterButton =
    selectedCategory === "Creatives" ||
    (selectedCategory !== "Couples" && selectedCategory !== "Bookmark");

  const bannerTextNew = "Posts need a minimum of 5 likes within 24hrs to be published";
  const bannerTextPopular = "Posts need a minimum of 10 likes to be featured.";


  const bannerText = selectedCategory === "Popular"
    ? bannerTextPopular
    : bannerTextNew;



  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{
        y: isVisible ? 0 : -200, // Increased to fully hide including banner
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 40,
        mass: 0.5,
      }}
      className={`fixed left-0 right-0 z-[15] bg-white 
    ${isAtTop ? "top-[72px]" : "top-[72px] shadow-sm"}`} // Keep consistent top position
    >
      <div className="px-2 py-2">
        {/* Search Bar */}
        <div className="max-w-[380px] md:max-w-2xl mx-auto">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onKeyDown={handleKeyDown}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search posts..."
              className="w-full px-4 py-2.5 pr-10 bg-white border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-0 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Category and Filter Controls */}
        <div className="max-w-[380px] md:max-w-2xl mx-auto">
          <div className="flex gap-2">
            {/* Category Dropdown Button */}
            <button
              onClick={() => {
                console.log('🎪 Dropdown button clicked - current scroll:', window.scrollY);
                setIsDropdownOpen(true);

                // Debug: Check scroll state before and after
                const beforeScroll = window.scrollY;
                setTimeout(() => {
                  const afterScroll = window.scrollY;
                  console.log('📊 Scroll before/after click:', { beforeScroll, afterScroll });
                }, 10);
              }}
              className="flex-1 px-2 py-2.5 rounded-xl flex items-center transition-colors"
            >
              <span className="text-gray-700 font-medium">
                {selectedCategory}
              </span>
              <ChevronDown size={18} className="text-gray-500" />
            </button>

            {showFilterButton && (
              <button
                onClick={() => setIsFilterOpen(true)}
                className="p-2.5 rounded-xl transition-colors flex items-center justify-center"
              >
                <FilterIcon size={20} className="text-gray-500" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Banner for "New" category - only show when selectedCategory is "New" */}
      {(selectedCategory === "New" || (selectedCategory === "Popular" && isAuthenticated)) && (
        <div className="w-full bg-black text-white py-2 overflow-hidden relative">
          <style jsx>{`
            @keyframes scroll {
              0% {
                transform: translateX(0);
              }
              100% {
                transform: translateX(-50%);
              }
            }
          `}</style>
          <div className="flex whitespace-nowrap">
            <div
              className="flex whitespace-nowrap"
              style={{
                animation: "scroll 30s linear infinite",
              }}
            >
              {/* First set of text */}
              {[...Array(5)].map((_, index) => (
                <span
                  key={`first-${index}`}
                  className="inline-block px-8 text-[10px] italic font-medium"
                >
                  {bannerText}
                </span>
              ))}
              {/* Duplicate set for seamless loop */}
              {[...Array(5)].map((_, index) => (
                <span
                  key={`second-${index}`}
                  className="inline-block px-8 text-[10px] italic font-medium"
                >
                  {bannerText}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default SmoothScrollHeader;
