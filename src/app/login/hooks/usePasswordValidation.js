import { useState, useRef, useEffect } from 'react';

/**
 * Password validation hook with strength requirements
 * @param {number} debounceMs - Debounce delay (default: 800ms)
 */
export const usePasswordValidation = (debounceMs = 800) => {
  const [passwordValidation, setPasswordValidation] = useState({
    isValid: false,
    message: '',
    requirements: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
    },
  });
  const [showError, setShowError] = useState(false);
  const typingTimer = useRef(null);

  const validatePassword = (password) => {
    if (!password) {
      setPasswordValidation({
        isValid: false,
        message: '',
        requirements: {
          length: false,
          uppercase: false,
          lowercase: false,
          number: false,
        },
      });
      return;
    }

    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
    };

    const isValid = Object.values(requirements).every((req) => req);

    setPasswordValidation({
      isValid,
      message: isValid
        ? ''
        : '',
      requirements,
    });
  };

  const handlePasswordChange = (password) => {
    setShowError(false);
    if (typingTimer.current) clearTimeout(typingTimer.current);

    typingTimer.current = setTimeout(() => {
      validatePassword(password);
      setShowError(true);
    }, debounceMs);
  };

  const validateImmediately = (password) => {
    if (typingTimer.current) clearTimeout(typingTimer.current);
    validatePassword(password);
    setShowError(true);
  };

  const resetValidation = () => {
    setPasswordValidation({
      isValid: false,
      message: '',
      requirements: {
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
      },
    });
    setShowError(false);
    if (typingTimer.current) clearTimeout(typingTimer.current);
  };

  useEffect(() => {
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, []);

  return {
    passwordValidation,
    showError,
    handlePasswordChange,
    validateImmediately,
    resetValidation,
  };
};