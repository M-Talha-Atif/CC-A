// components/LoginPromptModal.js
"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import Portal from "@/components/Portal";

export const LoginPromptModal = ({ onClose }) => {
  const router = useRouter();
  const scrollYRef = useRef(0);

  useEffect(() => {
    // Store the current scroll position
    scrollYRef.current = window.scrollY;

    // Get the computed style to check if body already has position fixed
    const body = document.body;
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    
    // Apply scroll lock
    body.style.position = 'fixed';
    body.style.top = `-${scrollYRef.current}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.overflow = 'hidden';
    body.style.width = '100%';
    
    // Compensate for scrollbar gap to prevent layout shift
    if (scrollBarWidth > 0) {
      body.style.paddingRight = `${scrollBarWidth}px`;
    }

    // Prevent touch move events on the document
    const preventTouchMove = (e) => {
      // Allow touch moves only on non-scrollable elements or the modal itself
      const isModalContent = e.target.closest('[data-modal-content]');
      if (!isModalContent) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchmove', preventTouchMove, { passive: false });

    // Cleanup: restore scrolling when modal closes
    return () => {
      document.removeEventListener('touchmove', preventTouchMove);
      
      const body = document.body;
      const scrollY = parseInt(body.style.top || '0');
      
      // Restore styles
      body.style.position = '';
      body.style.top = '';
      body.style.left = '';
      body.style.right = '';
      body.style.overflow = '';
      body.style.width = '';
      body.style.paddingRight = '';
      
      // Restore scroll position
      window.scrollTo(0, Math.abs(scrollY) || scrollYRef.current);
    };
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <Portal>
      <div className="fixed inset-0 bg-[#00000090] bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div 
          className="bg-white rounded-2xl max-w-md w-full px-6 py-8 relative"
          data-modal-content // This allows touch scrolling within the modal if needed
        >
          <button
            onClick={onClose}
            className="absolute top-2 right-3 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>

          <div className="text-center mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
              Join the Conversation
            </h2>
            <p className="text-sm text-gray-600">
              You need to log in to interact with posts.
            </p>
          </div>

          <div className="flex flex-col space-y-3">
            <button
              onClick={() =>
                router.push("/login?flow=creative&step=login-choice&mode=login")
              }
              className="w-full px-4 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
            >
              Log In
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};