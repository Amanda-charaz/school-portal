/**
 * Central export point for all backend utilities.
 */
export * from './controllerHelpers.js';

/**
 * Validates password complexity requirements.
 * Returns an error message string, or null if valid.
 */
export const validatePasswordComplexity = (password) => {
  if (!password || password.length < 4) {
    return 'Password must be at least 4 characters long.';
  }
  return null;
};
