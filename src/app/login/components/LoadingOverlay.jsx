import React from 'react';

/**
 * Full-screen loading overlay with spinner and message
 * @param {boolean} isLoading - Whether loading state is active
 * @param {boolean} initializing - Whether app is initializing
 * @param {string} loadingMessage - Message to display
 */
const LoadingOverlay = ({ 
  isLoading = false, 
  initializing = false, 
  loadingMessage = '' 
}) => {
  if (!isLoading && !initializing) return null;

  const message = loadingMessage || (initializing ? 'Initializing onboarding...' : 'Loading...');

  return (
    <div className="fixed inset-0 bg-[#000000b0] bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
        <p className="text-gray-700 font-medium">{message}</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;