"use client";

export const STORAGE_KEYS = {
  CURRENT_STEP: "registration_current_step",
  FORM_DATA: "registration_form_data",
  REFERRAL_COMPLETED: "referral_completed",
};

export const saveToStorage = (key, value) => {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (error) {
    console.error("Failed to save to localStorage:", error);
  }
};

export const loadFromStorage = (key, defaultValue = null) => {
  try {
    if (typeof window === "undefined") return defaultValue;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.error("Failed to load from localStorage:", error);
    return defaultValue;
  }
};

export const clearRegistrationStorage = () => {
  try {
    if (typeof window !== "undefined") {
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
    }
  } catch (error) {
    console.error("Failed to clear localStorage:", error);
  }
};
