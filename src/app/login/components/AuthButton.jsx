import React from 'react';

/**
 * Reusable authentication button
 * @param {Function} onClick - Click handler
 * @param {React.ReactNode} icon - Icon component (optional)
 * @param {string} children - Button text
 * @param {boolean} disabled - Whether button is disabled
 * @param {string} variant - 'primary' or 'secondary' or 'outline'
 * @param {string} className - Additional CSS classes
 */
const AuthButton = ({
  onClick,
  icon,
  children,
  disabled = false,
  variant = 'outline',
  className = '',
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-black text-white hover:bg-gray-800 border-black';
      case 'secondary':
        return 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300';
      case 'outline':
      default:
        return 'border-gray-300 text-gray-700 hover:border-gray-400';
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full border-2 py-4 px-6 rounded-full font-semibold transition-colors flex items-center justify-center gap-3 ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${getVariantClasses()} ${className}`}
    >
      {icon}
      {children}
    </button>
  );
};

export default AuthButton;