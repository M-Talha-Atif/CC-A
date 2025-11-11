"use client";
import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

const ScrollVisibilityContext = createContext();

export function ScrollVisibilityProvider({ children }) {
  const [isVisible, setIsVisible] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);

  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const hasInitialized = useRef(false);
  const pathname = usePathname();

  const updateScrollDirection = useCallback(() => {
    const scrollY = window.scrollY;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;

    // Check if we're at the bottom of the page
    // const isAtBottom = scrollY + clientHeight >= scrollHeight - 100; // 100px threshold

    const bottomThreshold = Math.max(100, window.innerHeight * 0.1); // 10% of screen height or 100px min
    const isAtBottom = scrollY + clientHeight >= scrollHeight - bottomThreshold;


    console.log('🔄 updateScrollDirection called', {
      scrollY,
      lastScrollY: lastScrollY.current,
      scrollHeight,
      clientHeight,
      isAtBottom
    });

    // Always update isAtTop
    const newIsAtTop = scrollY < 50;
    setIsAtTop(newIsAtTop);

    if (!hasInitialized.current) {
      console.log('🎯 First initialization, setting lastScrollY:', scrollY);
      lastScrollY.current = scrollY;
      hasInitialized.current = true;

      if (scrollY > 50) {
        console.log('📄 Page loaded with scroll position > 50, hiding headers');
        setIsVisible(false);
      } else {
        console.log('📄 Page loaded at top, showing headers');
        setIsVisible(true);
      }
      return;
    }

    // CRITICAL FIX: Don't show header when at bottom of page
    if (isAtBottom && lastScrollY.current > 0) {
      console.log('🔚 At bottom of page → visible: false');
      setIsVisible(false);
    }
    // Show header when scrolling up or near top
    else if (scrollY < lastScrollY.current || scrollY < 50) {
      console.log('👆 Scrolling up or near top → visible: true');
      setIsVisible(true);
    }
    // Hide header when scrolling down and not near top
    else if (scrollY > lastScrollY.current && scrollY > 50) {
      console.log('👇 Scrolling down and not near top → visible: false');
      setIsVisible(false);
    }

    lastScrollY.current = scrollY;
    ticking.current = false;
  }, []);

  const onScroll = useCallback(() => {
    if (!ticking.current) {
      console.log('🎪 Scroll event detected, requesting animation frame');
      requestAnimationFrame(updateScrollDirection);
      ticking.current = true;
    }
  }, [updateScrollDirection]);

  useEffect(() => {
    console.log('🚀 ScrollVisibilityProvider mounted');

    // Initial check
    updateScrollDirection();

    // Add scroll listener
    window.addEventListener('scroll', onScroll, { passive: true });

    // Delayed check for DOM readiness
    const delayedCheck = setTimeout(() => {
      console.log('⏰ Delayed scroll check');
      updateScrollDirection();
    }, 100);

    return () => {
      console.log('🧹 ScrollVisibilityProvider cleanup');
      window.removeEventListener('scroll', onScroll);
      clearTimeout(delayedCheck);
    };
  }, [onScroll, updateScrollDirection]);

  // Force scroll check on route changes
  useEffect(() => {
    console.log('📍 Route changed:', pathname);

    // Reset initialization to force fresh check on route change
    hasInitialized.current = false;

    // Force scroll check after route change
    const timer = setTimeout(() => {
      console.log('🔄 Forcing scroll check after route change');
      updateScrollDirection();

      // Also trigger multiple scroll events to ensure detection
      window.dispatchEvent(new Event('scroll'));
      setTimeout(() => window.dispatchEvent(new Event('scroll')), 50);
      setTimeout(() => window.dispatchEvent(new Event('scroll')), 100);
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
  const context = useContext(ScrollVisibilityContext);
  if (!context) {
    throw new Error('useScrollVisibility must be used within ScrollVisibilityProvider');
  }
  return context;
};