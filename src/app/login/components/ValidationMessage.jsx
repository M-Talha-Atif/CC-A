import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

/**
 * Displays validation messages with appropriate icons and colors
 * @param {Object} validation - Validation state object
 * @param {boolean} validation.isValid - Whether validation passed
 * @param {string} validation.message - Validation message to display
 * @param {string} validation.type - Type: 'success', 'warning', 'error', 'loading'
 * @param {boolean} show - Whether to show the message
 */
const ValidationMessage = ({ validation, show = true }) => {
  if (!validation?.message || !show) return null;

  const getIcon = () => {
    switch (validation.type) {
      case 'success':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'warning':
        return <AlertCircle size={16} className="text-yellow-500" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-500" />;
      case 'loading':
        return (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400" />
        );
      default:
        return null;
    }
  };

  const getTextColor = () => {
    switch (validation.type) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      case 'loading':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className={`flex items-center gap-2 mt-2 text-sm ${getTextColor()}`}>
      {getIcon()}
      <span>{validation.message}</span>
    </div>
  );
};

export default ValidationMessage;