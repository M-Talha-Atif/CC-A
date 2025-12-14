import React from 'react';

/**
 * Fallback loading screen for initial page load
 * @param {boolean} initializing - Whether app is initializing
 */
const LoadingFallback = ({ initializing = false }) => {
  if (!initializing) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[9999] overflow-hidden">
      <div className="flex flex-col items-center space-y-6 p-8">
        <div className="relative">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
        </div>
      </div>
    </div>
  );
};

export default LoadingFallback;