// components/LoginPromptModal.js
"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useEffect } from "react";
import Portal from "@/components/Portal";

export const LoginPromptModal = ({ onClose }) => {
  const router = useRouter();

  useEffect(() => {
    // Prevent scrolling when modal is open
    document.body.style.overflow = "hidden";

    // Cleanup: restore scrolling when modal closes
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <Portal>
      <div className="fixed inset-0 bg-[#00000090] bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full px-6 py-8 relative">
          <button
            onClick={onClose}
            className="absolute top-2 right-3 text-gray-400 hover:text-gray-600 transition-colors"
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
