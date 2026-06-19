import { describe, it, expect } from '@jest/globals';
import { validatePasswordComplexity } from '../src/utils/index.js';

describe('validatePasswordComplexity', () => {
  it('should return error for null/undefined password', () => {
    expect(validatePasswordComplexity(null)).toBe('Password must be at least 6 characters long.');
    expect(validatePasswordComplexity(undefined)).toBe('Password must be at least 6 characters long.');
  });

  it('should return error for empty string', () => {
    expect(validatePasswordComplexity('')).toBe('Password must be at least 6 characters long.');
  });

  it('should return error for password shorter than 6 characters', () => {
    expect(validatePasswordComplexity('abc')).toBe('Password must be at least 6 characters long.');
    expect(validatePasswordComplexity('12345')).toBe('Password must be at least 6 characters long.');
  });

  it('should return null for valid password (6+ characters)', () => {
    expect(validatePasswordComplexity('123456')).toBeNull();
    expect(validatePasswordComplexity('strongPassword!')).toBeNull();
  });
});
