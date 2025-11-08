// hooks/useRouteAwareScroll.js
"use client";
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export const useRouteAwareScroll = () => {
  const pathname = usePathname();

  useEffect(() => {
    console.log('🔄 Route changed, triggering scroll check:', pathname);
    
    // Method 1: Direct scroll check
    const triggerScrollCheck = () => {
      if (typeof window !== 'undefined') {
        // Force update by dispatching scroll event
        window.dispatchEvent(new Event('scroll'));
        
        // Also do a direct check after a small delay
        setTimeout(() => {
          window.dispatchEvent(new Event('scroll'));
        }, 100);
      }
    };

    // Small delay to ensure page is rendered
    const timer = setTimeout(triggerScrollCheck, 50);
    
    return () => clearTimeout(timer);
  }, [pathname]);
};