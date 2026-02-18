import React from 'react';
import TermsFooter from './TermsFooter';

/**
 * Reusable layout for auth pages
 * @param {string} title - Page title
 * @param {React.ReactNode} children - Page content
 * @param {Function} onTermsClick - Terms click handler
 * @param {Function} onPolicyClick - Policy click handler
 * @param {boolean} showTerms - Whether to show terms footer
 * @param {string} minHeight - Minimum height class
 */
const AuthPageLayout = ({
  title,
  children,
  onTermsClick,
  onPolicyClick,
  showTerms = true,
  minHeight = 'min-h-[90dvh]',
}) => {
  return (
    <div className={`w-full max-w-md flex flex-col items-center justify-between ${minHeight}`}>
      <div></div>
      
      <div className="w-full">
        <div className="text-center">
          {title && (
            <h1 className="text-3xl font-bold text-gray-900 mb-8 font-nunito">
              {title}
            </h1>
          )}
          {children}
        </div>
      </div>

      {showTerms && (
        <TermsFooter onTermsClick={onTermsClick} onPolicyClick={onPolicyClick} />
      )}
    </div>
  );
};

export default AuthPageLayout;