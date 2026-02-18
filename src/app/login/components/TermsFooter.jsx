import React from 'react';

/**
 * Terms and policy footer for authentication pages
 * @param {Function} onTermsClick - Handler for terms link click
 * @param {Function} onPolicyClick - Handler for policy link click
 */
const TermsFooter = ({ onTermsClick, onPolicyClick }) => {
  return (
    <div className="text-center mx-[-20px]">
      <p className="text-[8px] [@media(min-width:360px)]:text-[10px] text-gray-600">
        You acknowledge that you understand and agree to the{' '}
        <span onClick={onTermsClick} className="underline cursor-pointer">
          Terms
        </span>{' '}
        and{' '}
        <span onClick={onPolicyClick} className="underline cursor-pointer">
          Policy
        </span>
      </p>
    </div>
  );
};

export default TermsFooter;