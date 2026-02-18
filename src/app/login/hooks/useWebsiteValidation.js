import { useState, useRef, useEffect } from 'react';

const PERSONAL_EMAIL_PROVIDERS = [
  'gmail.com', 'yahoo.com', 'yahoo.co.uk', 'yahoo.ca', 'hotmail.com',
  'hotmail.co.uk', 'outlook.com', 'outlook.co.uk', 'aol.com', 'icloud.com',
  'me.com', 'mac.com', 'live.com', 'live.co.uk', 'msn.com', 'ymail.com',
  'rocketmail.com', 'protonmail.com', 'proton.me', 'tutanota.com', 'zoho.com',
  'mail.com', 'gmx.com', 'rediffmail.com', 'fastmail.com', 'mailfence.com',
  'guerrillamail.com', '10minutemail.com', 'tempmail.org', 'mailinator.com',
];



/**
 * Website validation hook with domain matching
 * @param {string} userEmail - User's email for domain matching
 * @param {number} debounceMs - Debounce delay (default: 800ms)
 */
export const useWebsiteValidation = (userEmail = '', debounceMs = 800) => {
  const [websiteValidation, setWebsiteValidation] = useState({
    isValid: false,
    message: '',
    type: '',
  });
  const [showError, setShowError] = useState(false);
  const typingTimer = useRef(null);
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateWebsite = (url, showMessage = true) => {
    if (!url) {
      setWebsiteValidation({ isValid: false, message: '', type: '' });
      return;
    }

    const trimmed = url.trim();

    // HARD BLOCK: email entered instead of website
    if (EMAIL_REGEX.test(trimmed)) {
      setWebsiteValidation({
        isValid: false,
        message: showMessage
          ? 'Please enter a website URL, not an email address'
          : '',
        type: 'error',
      });
      return;
    }

    let formattedUrl = trimmed;
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    try {
      const urlObj = new URL(formattedUrl);
      const hostname = urlObj.hostname;

      if (!hostname || !hostname.includes('.') || hostname.length < 3) {
        throw new Error('Invalid hostname');
      }

      if (!userEmail) {
        setWebsiteValidation({
          isValid: false,
          message: showMessage
            ? 'Please complete email verification first'
            : '',
          type: 'error',
        });
        return;
      }

      const websiteDomain = hostname.replace(/^www\./, '').toLowerCase();
      const emailDomain = userEmail.split('@')[1]?.toLowerCase();

      if (!emailDomain) {
        setWebsiteValidation({
          isValid: false,
          message: showMessage ? 'Invalid email format' : '',
          type: 'error',
        });
        return;
      }

      // Personal email → any valid website allowed
      if (PERSONAL_EMAIL_PROVIDERS.includes(emailDomain)) {
        setWebsiteValidation({
          isValid: true,
          message: showMessage ? 'Website format is valid' : '',
          type: 'success',
        });
        return;
      }

      // Business email → domain must match
      if (websiteDomain === emailDomain) {
        setWebsiteValidation({
          isValid: true,
          message: showMessage ? 'Website matches your email domain' : '',
          type: 'success',
        });
      } else {
        setWebsiteValidation({
          isValid: false,
          message: showMessage
            ? `Website domain must match your email domain`
            : '',
          type: 'error',
        });
      }
    } catch {
      setWebsiteValidation({
        isValid: false,
        message: showMessage ? 'Please enter a valid website URL' : '',
        type: 'error',
      });
    }
  };


  const handleWebsiteChange = (url) => {
    setShowError(false);
    if (typingTimer.current) clearTimeout(typingTimer.current);

    typingTimer.current = setTimeout(() => {
      validateWebsite(url, true);
      setShowError(true);
    }, debounceMs);
  };

  const validateImmediately = (url) => {
    if (typingTimer.current) clearTimeout(typingTimer.current);
    validateWebsite(url, true);
    setShowError(true);
  };

  const resetValidation = () => {
    setWebsiteValidation({ isValid: false, message: '', type: '' });
    setShowError(false);
    if (typingTimer.current) clearTimeout(typingTimer.current);
  };

  useEffect(() => {
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, []);

  return {
    websiteValidation,
    showError,
    handleWebsiteChange,
    validateImmediately,
    resetValidation,
  };
};