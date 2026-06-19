/**
 * Validates that a password meets minimum complexity requirements.
 * @param {string} password
 * @returns {string|null} Error message if invalid, null if valid.
 */
export function validatePasswordComplexity(password) {
  if (!password || typeof password !== 'string') {
    return 'Password is required.';
  }
  if (password.length < 6) {
    return 'Password must be at least 6 characters long.';
  }
  if (!/[A-Za-z]/.test(password)) {
    return 'Password must contain at least one letter.';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number.';
  }
  return null;
}
