import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Navigation buttons for multi-step forms
 * @param {Function} onNext - Handler for next button click
 * @param {Function} onBack - Handler for back button click
 * @param {boolean} canContinue - Whether the next button should be enabled
 * @param {boolean} showBack - Whether to show the back button
 * @param {boolean} isLoading - Whether a loading state is active
 * @param {string} disabledTooltip - Tooltip text when button is disabled
 */
const NavigationButtons = ({
  onNext,
  onBack,
  canContinue = true,
  showBack = true,
  isLoading = false,
  disabledTooltip = 'Please complete all required fields',
}) => {
  return (
    <div className="flex items-center justify-between">
      {/* Back Button */}
      {showBack ? (
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className={`transition-colors p-2 ${
            isLoading
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-black hover:text-gray-800 cursor-pointer'
          }`}
          aria-label="Go back"
        >
          <ChevronLeft size={24} />
        </button>
      ) : (
        <div />
      )}

      {/* Next/Continue Button */}
      <button
        type="submit"
        onClick={onNext}
        disabled={!canContinue || isLoading}
        className={`transition-colors p-2 relative group ${
          canContinue && !isLoading
            ? 'text-black hover:text-gray-800 cursor-pointer'
            : 'text-gray-400 cursor-not-allowed'
        }`}
        title={!canContinue && !isLoading ? disabledTooltip : ''}
        aria-label="Continue"
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400" />
        ) : (
          <ChevronRight size={24} />
        )}
      </button>
    </div>
  );
};

export default NavigationButtons;