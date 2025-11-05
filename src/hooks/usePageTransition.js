import { useState, useCallback } from 'react';

export const usePageTransition = () => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState('forward');

  const startTransition = useCallback((newDirection = 'forward') => {
    setDirection(newDirection);
    setIsTransitioning(true);
  }, []);

  const endTransition = useCallback(() => {
    setIsTransitioning(false);
  }, []);

  return {
    isTransitioning,
    direction,
    startTransition,
    endTransition,
  };
};

