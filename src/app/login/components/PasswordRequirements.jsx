import React from 'react';
import { CheckCircle } from 'lucide-react';

/**
 * Displays password strength requirements with visual indicators
 * @param {Object} requirements - Password requirements status
 * @param {boolean} requirements.length - At least 8 characters
 * @param {boolean} requirements.uppercase - Contains uppercase letter
 * @param {boolean} requirements.lowercase - Contains lowercase letter
 * @param {boolean} requirements.number - Contains number
 * @param {boolean} show - Whether to show the requirements
 * @param {string} authMode - 'login' or 'signup' (only show in signup)
 */
const PasswordRequirements = ({ requirements, show, authMode = 'signup' }) => {
  // Don't show in login mode
  if (!show || authMode === 'login') return null;

  const requirementsList = [
    {
      key: 'length',
      text: 'At least 8 characters',
      met: requirements.length,
    },
    {
      key: 'uppercase',
      text: 'One uppercase letter',
      met: requirements.uppercase,
    },
    {
      key: 'lowercase',
      text: 'One lowercase letter',
      met: requirements.lowercase,
    },
    {
      key: 'number',
      text: 'One number',
      met: requirements.number,
    },
  ];

  return (
    <div className="mt-3 p-3 bg-gray-50 rounded-lg shadow-sm">
      <p className="text-sm font-medium text-gray-700 mb-2">
        Password must contain:
      </p>
      <div className="space-y-1">
        {requirementsList.map((req) => (
          <div key={req.key} className="flex items-center gap-2 text-sm">
            {req.met ? (
              <CheckCircle size={14} className="text-green-500" />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full border border-gray-300" />
            )}
            <span className={req.met ? 'text-green-600' : 'text-gray-600'}>
              {req.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordRequirements;