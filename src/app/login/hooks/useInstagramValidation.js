import { useState, useRef, useEffect } from 'react';
import { checkInstagramExists } from '@root/action';

/**
 * Instagram handle validation hook
 * @param {number} debounceMs - Debounce delay (default: 800ms)
 */
export const useInstagramValidation = (debounceMs = 800) => {
  const [instagramValidation, setInstagramValidation] = useState({
    isValid: false,
    message: '',
    type: '',
  });
  const [showError, setShowError] = useState(false);
  const typingTimer = useRef(null);
  const requestIdRef = useRef(0);

  const validateInstagram = async (input) => {
    const clean = input;

    if (!clean) {
      setInstagramValidation({
        isValid: false,
        message: '',
        type: '',
      });
      return;
    }

    const requestId = ++requestIdRef.current;

    try {
      setInstagramValidation({
        isValid: false,
        message: '',
        type: 'loading',
      });

      const response = await checkInstagramExists(clean);

      // Ignore old responses
      if (requestId !== requestIdRef.current) return;

      if (!response.success) {
        setInstagramValidation({
          isValid: false,
          message: response.message,
          type: 'error',
        });
        return;
      }

      if (response.exists) {
        setInstagramValidation({
          isValid: false,
          message: 'Instagram already in use',
          type: 'error',
        });
      } else {
        setInstagramValidation({
          isValid: true,
          message: 'Instagram handle available',
          type: 'success',
        });
      }
    } catch (err) {
      setInstagramValidation({
        isValid: false,
        message: 'Error checking Instagram',
        type: 'error',
      });
    }
  };

  const handleInstagramChange = (input) => {
    setShowError(false);
    if (typingTimer.current) clearTimeout(typingTimer.current);

    typingTimer.current = setTimeout(() => {
      validateInstagram(input);
      setShowError(true);
    }, debounceMs);
  };

  const validateImmediately = async (input) => {
    if (typingTimer.current) clearTimeout(typingTimer.current);
    await validateInstagram(input);
    setShowError(true);
  };

  const resetValidation = () => {
    setInstagramValidation({
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
    instagramValidation,
    showError,
    handleInstagramChange,
    validateImmediately,
    resetValidation,
  };
};