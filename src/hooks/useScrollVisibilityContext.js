"use client";
import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";

const ScrollVisibilityContext = createContext();

export function ScrollVisibilityProvider({ children }) {
  const [isVisible, setIsVisible] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const hasInitialized = useRef(false);
  const pathname = usePathname();

  const getScrollValues = () => {
    // Use iOS-safe fallbacks
    const scrollY =
      window.scrollY ||
      document.scrollingElement?.scrollTop ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;

    const scrollHeight =
      document.scrollingElement?.scrollHeight ||
      document.documentElement.scrollHeight ||
      document.body.scrollHeight ||
      0;

    const clientHeight =
      document.scrollingElement?.clientHeight ||
      document.documentElement.clientHeight ||
      window.innerHeight ||
      0;

    return { scrollY, scrollHeight, clientHeight };
  };

  const updateScrollDirection = useCallback(() => {
    const { scrollY, scrollHeight, clientHeight } = getScrollValues();

    // Skip invalid or "rubber band" scroll positions on iOS
    if (scrollY < 0 || scrollY > scrollHeight - clientHeight + 200) {
      ticking.current = false;
      return;
    }

    const bottomThreshold = Math.max(100, window.innerHeight * 0.1);
    const isAtBottom = scrollY + clientHeight >= scrollHeight - bottomThreshold;

    // Update top state
    const newIsAtTop = scrollY < 20;
    setIsAtTop(newIsAtTop);

    // First-time initialization
    if (!hasInitialized.current) {
      lastScrollY.current = scrollY;
      hasInitialized.current = true;
      setIsVisible(scrollY <= 50);
      return;
    }

    // Handle visibility logic
    if (isAtBottom && lastScrollY.current > 0) {
      setIsVisible(false);
    } else if (scrollY < lastScrollY.current || scrollY < 50) {
      setIsVisible(true);
    } else if (scrollY > lastScrollY.current && scrollY > 50) {
      setIsVisible(false);
    }

    lastScrollY.current = scrollY;
    ticking.current = false;
  }, []);

  const onScroll = useCallback(() => {
    if (!ticking.current) {
      requestAnimationFrame(updateScrollDirection);
      ticking.current = true;
    }
  }, [updateScrollDirection]);

  // Scroll + resize (Safari address bar change) listeners
  useEffect(() => {
    updateScrollDirection();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchmove", onScroll, { passive: true });
    window.addEventListener("resize", updateScrollDirection, { passive: true });

    const delayedCheck = setTimeout(() => updateScrollDirection(), 100);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchmove", onScroll);
      window.removeEventListener("resize", updateScrollDirection);
      clearTimeout(delayedCheck);
    };
  }, [onScroll, updateScrollDirection]);

  // Force scroll recheck on route change
  useEffect(() => {
    hasInitialized.current = false;
    const timer = setTimeout(() => {
      updateScrollDirection();
      window.dispatchEvent(new Event("scroll"));
      setTimeout(() => window.dispatchEvent(new Event("scroll")), 80);
    }, 150);
    return () => clearTimeout(timer);
  }, [pathname, updateScrollDirection]);

  return (
    <ScrollVisibilityContext.Provider value={{ isVisible, isAtTop }}>
      {children}
    </ScrollVisibilityContext.Provider>
  );
}

export const useScrollVisibility = () => {
  const ctx = useContext(ScrollVisibilityContext);
  if (!ctx) throw new Error("useScrollVisibility must be used within ScrollVisibilityProvider");
  return ctx;
};
