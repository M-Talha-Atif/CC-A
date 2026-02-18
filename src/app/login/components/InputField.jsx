import React from 'react';
import { CheckCircle } from 'lucide-react';
import ValidationMessage from './ValidationMessage';

/**
 * Reusable input field with validation states
 * @param {string} type - Input type (text, email, password, etc.)
 * @param {string} value - Input value
 * @param {Function} onChange - Change handler
 * @param {Function} onFocus - Focus handler (optional)
 * @param {Function} onBlur - Blur handler (optional)
 * @param {string} placeholder - Placeholder text
 * @param {string} label - Input label
 * @param {boolean} required - Whether field is required
 * @param {boolean} disabled - Whether field is disabled
 * @param {Object} validation - Validation state object
 * @param {boolean} showValidation - Whether to show validation
 * @param {React.ReactNode} icon - Icon component to display (optional)
 * @param {React.ReactNode} rightElement - Element to display on right (optional)
 * @param {string} className - Additional CSS classes
 */
const InputField = ({
  type = 'text',
  value,
  onChange,
  onFocus,
  onBlur,
  placeholder = '',
  label = '',
  required = false,
  disabled = false,
  validation = null,
  showValidation = false,
  icon = null,
  rightElement = null,
  className = '',
}) => {
  // Determine border color based on validation state
  const getBorderColor = () => {
    if (!validation || !showValidation) return 'border-gray-300';
    
    switch (validation.type) {
      case 'error':
        return 'border-red-300';
      case 'warning':
        return 'border-yellow-300';
      case 'success':
        return 'border-green-300';
      default:
        return 'border-gray-300';
    }
  };

  return (
    <div className={className}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {icon && (
          <div className="absolute left-3 top-3 text-gray-400">
            {icon}
          </div>
        )}

        {/* Input Field */}
        <input
          type={type}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent ${
            icon ? 'pl-12' : ''
          } ${rightElement ? 'pr-12' : ''} ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : ''
          } ${getBorderColor()}`}
        />

        {/* Success Checkmark */}
        {validation?.type === 'success' && showValidation && !rightElement && (
          <CheckCircle
            className="absolute right-3 top-3 text-green-500"
            size={20}
          />
        )}

        {/* Right Element (e.g., password toggle) */}
        {rightElement && (
          <div className="absolute right-3 top-3">
            {rightElement}
          </div>
        )}
      </div>

      {/* Validation Message */}
      {validation && (
        <ValidationMessage validation={validation} show={showValidation} />
      )}
    </div>
  );
};

export default InputField;