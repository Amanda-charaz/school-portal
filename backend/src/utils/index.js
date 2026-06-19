/**
 * Validates password complexity requirements.
 * @param {string} password - The password to validate
 * @returns {string|null} Error message if invalid, null if valid
 */
export function validatePasswordComplexity(password) {
  if (!password || password.length < 6) {
    return 'Password must be at least 6 characters long.';
  }
  return null;
}
