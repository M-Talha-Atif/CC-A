import { useState, useRef, useEffect } from 'react';

/**
 * Confirm password validation hook
 * @param {number} debounceMs - Debounce delay (default: 800ms)
 */
export const useConfirmPasswordValidation = (debounceMs = 800) => {
  const [confirmPasswordValidation, setConfirmPasswordValidation] = useState({
    isValid: false,
    message: '',
    type: '',
  });
  const [showError, setShowError] = useState(false);
  const typingTimer = useRef(null);

  const validateConfirmPassword = (password, confirmPassword) => {
    if (!confirmPassword) {
      setConfirmPasswordValidation({
        isValid: false,
        message: '',
        type: '',
      });
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordValidation({
        isValid: false,
        message: 'Passwords do not match',
        type: 'error',
      });
      return;
    }

    setConfirmPasswordValidation({
      isValid: true,
      message: 'Passwords match',
      type: 'success',
    });
  };

  const handleConfirmPasswordChange = (password, confirmPassword) => {
    setShowError(false);
    if (typingTimer.current) clearTimeout(typingTimer.current);

    typingTimer.current = setTimeout(() => {
      validateConfirmPassword(password, confirmPassword);
      setShowError(true);
    }, debounceMs);
  };

  const validateImmediately = (password, confirmPassword) => {
    if (typingTimer.current) clearTimeout(typingTimer.current);
    validateConfirmPassword(password, confirmPassword);
    setShowError(true);
  };

  const resetValidation = () => {
    setConfirmPasswordValidation({
      isValid: false,
      message: '',
      type: '',
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
    confirmPasswordValidation,
    showError,
    handleConfirmPasswordChange,
    validateImmediately,
    resetValidation,
  };
};