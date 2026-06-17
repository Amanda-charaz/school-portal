/**
 * Validates that a password meets the required complexity standards.
 */
export const validatePasswordComplexity = (password) => {
  const minLength = 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|^-_+=|<>]/.test(password);

  if (password.length < minLength) return `Password must be at least ${minLength} characters long.`;
  if (!hasUppercase) return 'Password must contain at least one uppercase letter.';
  if (!hasLowercase) return 'Password must contain at least one lowercase letter.';
  if (!hasNumber) return 'Password must contain at least one number.';
  if (!hasSpecialChar) return 'Password must contain at least one special character (!@#$%^&*(),.?":{}|^-_+=|<>).';
  return null; // Password is valid
};