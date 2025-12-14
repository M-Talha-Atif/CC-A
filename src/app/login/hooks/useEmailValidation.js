import { useState, useRef, useEffect } from 'react';
import { checkEmailExists } from '@root/action';

const PERSONAL_EMAIL_PROVIDERS = [
  'gmail.com', 'yahoo.com', 'yahoo.co.uk', 'yahoo.ca', 'hotmail.com',
  'hotmail.co.uk', 'outlook.com', 'outlook.co.uk', 'aol.com', 'icloud.com',
  'me.com', 'mac.com', 'live.com', 'live.co.uk', 'msn.com', 'ymail.com',
  'rocketmail.com', 'protonmail.com', 'proton.me', 'tutanota.com', 'zoho.com',
  'mail.com', 'gmx.com', 'rediffmail.com', 'fastmail.com', 'mailfence.com',
  'guerrillamail.com', '10minutemail.com', 'tempmail.org', 'mailinator.com',
];

/**
 * Email validation hook with business email enforcement
 * @param {string} authMode - 'login' or 'signup'
 * @param {number} debounceMs - Debounce delay (default: 800ms)
 */
export const useEmailValidation = (authMode = 'signup', debounceMs = 800) => {
  const [emailValidation, setEmailValidation] = useState({
    isValid: false,
    message: '',
    type: '',
  });
  const [showError, setShowError] = useState(false);
  const typingTimer = useRef(null);

  const validateEmail = async (email) => {
    if (!email) {
      setEmailValidation({ isValid: false, message: '', type: '' });
      return;
    }

    // Basic format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailValidation({
        isValid: false,
        message: 'Please enter a valid email address',
        type: 'error',
      });
      return;
    }

    // Check email existence
    try {
      const response = await checkEmailExists(email);

      if (authMode === 'signup') {
        if (response.success && response.exists) {
          setEmailValidation({
            isValid: false,
            message: 'This email is already in use. Try to login.',
            type: 'error',
          });
          return;
        }
      } else if (authMode === 'login') {
        if (response.success && !response.exists) {
          setEmailValidation({
            isValid: false,
            message: 'Please sign up.',
            type: 'error',
          });
          return;
        }
      }
    } catch (error) {
      console.error('Email check failed:', error);
    }

    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) {
      setEmailValidation({
        isValid: false,
        message: 'Please enter a valid email address',
        type: 'error',
      });
      return;
    }

    // Block personal emails
    if (PERSONAL_EMAIL_PROVIDERS.includes(domain)) {
      setEmailValidation({
        isValid: false,
        message: 'Personal email addresses are not allowed. Please use your business/work email.',
        type: 'error',
      });
      return;
    }

    // Validate business domain
    const businessIndicators = ['.co', '.com', '.org', '.biz', '.info', '.pro', '.edu', '.gov'];
    const hasBusinessTLD = businessIndicators.some((tld) => domain.endsWith(tld));
    const isCustomDomain = domain.includes('.') && domain.split('.').length >= 2;

    if (isCustomDomain && hasBusinessTLD) {
      setEmailValidation({
        isValid: true,
        message: 'Business email verified',
        type: 'success',
      });
    } else {
      setEmailValidation({
        isValid: false,
        message: 'Please use a valid business/work email address',
        type: 'error',
      });
    }
  };

  const handleEmailChange = (email) => {
    setShowError(false);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    
    typingTimer.current = setTimeout(() => {
      validateEmail(email);
      setShowError(true);
    }, debounceMs);
  };

  const validateImmediately = async (email) => {
    if (typingTimer.current) clearTimeout(typingTimer.current);
    await validateEmail(email);
    setShowError(true);
  };

  const resetValidation = () => {
    setEmailValidation({ isValid: false, message: '', type: '' });
    setShowError(false);
    if (typingTimer.current) clearTimeout(typingTimer.current);
  };

  useEffect(() => {
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, []);

  useEffect(() => {
    resetValidation();
  }, [authMode]);

  return {
    emailValidation,
    showError,
    handleEmailChange,
    validateImmediately,
    resetValidation,
  };
};