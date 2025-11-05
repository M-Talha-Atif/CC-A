import { useState, useEffect, useRef } from 'react';

export const useScrollVisibility = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const updateScrollDirection = () => {
      const scrollY = window.scrollY;

      setIsAtTop(scrollY < 50);

      if (Math.abs(scrollY - lastScrollY.current) < 5) { // Changed from 10 to 5 for more responsiveness
        ticking.current = false;
        return;
      }

      // Show when scrolling up OR near top
      if (scrollY < lastScrollY.current || scrollY < 50) { // Changed from 100 to 50
        setIsVisible(true);
      }
      // Hide when scrolling down and not near top
      else if (scrollY > lastScrollY.current && scrollY > 50) { // Changed from 100 to 50
        setIsVisible(false);
      }

      lastScrollY.current = scrollY;
      ticking.current = false;
    };

    const onScroll = () => {
      if (!ticking.current) {
        requestAnimationFrame(updateScrollDirection);
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return { isVisible, isAtTop };
};