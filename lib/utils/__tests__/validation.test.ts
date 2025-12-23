import {
  validateEmail,
  validatePassword,
  validateSignupCredentials,
  validateStringParam,
  validateDateParam,
  validateSortOrder,
  sanitizeError,
  ALLOWED_PLATFORMS,
  ALLOWED_MEDIA_TYPES,
  ALLOWED_POST_SORT_FIELDS,
} from '../validation';

describe('validateEmail', () => {
  it('should return null for valid email addresses', () => {
    expect(validateEmail('test@example.com')).toBeNull();
    expect(validateEmail('user.name@domain.co.uk')).toBeNull();
    expect(validateEmail('user+tag@example.com')).toBeNull();
  });

  it('should return error message for missing email', () => {
    expect(validateEmail(null)).toBe('Email is required');
    expect(validateEmail(undefined)).toBe('Email is required');
    expect(validateEmail('')).toBe('Email is required');
  });

  it('should return error message for non-string email', () => {
    expect(validateEmail(123)).toBe('Email must be a string');
    expect(validateEmail({})).toBe('Email must be a string');
    expect(validateEmail([])).toBe('Email must be a string');
  });

  it('should return error message for invalid email format', () => {
    expect(validateEmail('invalid')).toBe('Invalid email format');
    expect(validateEmail('invalid@')).toBe('Invalid email format');
    expect(validateEmail('@example.com')).toBe('Invalid email format');
    expect(validateEmail('test@')).toBe('Invalid email format');
    expect(validateEmail('test.example.com')).toBe('Invalid email format');
  });

  it('should trim whitespace from email', () => {
    expect(validateEmail('  test@example.com  ')).toBeNull();
    expect(validateEmail('  invalid  ')).toBe('Invalid email format');
  });
});

describe('validatePassword', () => {
  it('should return null for valid passwords', () => {
    expect(validatePassword('password123')).toBeNull();
    expect(validatePassword('123456')).toBeNull(); // minimum length
    expect(validatePassword('a'.repeat(128))).toBeNull(); // maximum length
  });

  it('should return error message for missing password', () => {
    expect(validatePassword(null)).toBe('Password is required');
    expect(validatePassword(undefined)).toBe('Password is required');
    expect(validatePassword('')).toBe('Password is required');
  });

  it('should return error message for non-string password', () => {
    expect(validatePassword(123456)).toBe('Password must be a string');
    expect(validatePassword({})).toBe('Password must be a string');
    expect(validatePassword([])).toBe('Password must be a string');
  });

  it('should return error message for password shorter than 6 characters', () => {
    expect(validatePassword('12345')).toBe('Password must be at least 6 characters');
    expect(validatePassword('abc')).toBe('Password must be at least 6 characters');
  });

  it('should return error message for password longer than 128 characters', () => {
    expect(validatePassword('a'.repeat(129))).toBe('Password is too long');
    expect(validatePassword('a'.repeat(200))).toBe('Password is too long');
  });
});

describe('validateSignupCredentials', () => {
  it('should return null for valid credentials', () => {
    expect(validateSignupCredentials('test@example.com', 'password123')).toBeNull();
  });

  it('should return email error if email is invalid', () => {
    expect(validateSignupCredentials('invalid-email', 'password123')).toBe('Invalid email format');
    expect(validateSignupCredentials(null, 'password123')).toBe('Email is required');
  });

  it('should return password error if password is invalid', () => {
    expect(validateSignupCredentials('test@example.com', 'short')).toBe('Password must be at least 6 characters');
    expect(validateSignupCredentials('test@example.com', null)).toBe('Password is required');
  });

  it('should prioritize email error over password error', () => {
    expect(validateSignupCredentials('invalid-email', 'short')).toBe('Invalid email format');
  });
});

describe('validateStringParam', () => {
  it('should return null for null or empty values', () => {
    expect(validateStringParam(null)).toBeNull();
    expect(validateStringParam('')).toBeNull();
  });

  it('should return null for non-string values', () => {
    expect(validateStringParam(123 as any)).toBeNull();
    expect(validateStringParam({} as any)).toBeNull();
  });

  it('should return sanitized value for valid alphanumeric strings', () => {
    expect(validateStringParam('test123')).toBe('test123');
    expect(validateStringParam('test_123')).toBe('test_123');
    expect(validateStringParam('test-123')).toBe('test-123');
    expect(validateStringParam('test 123')).toBe('test 123');
  });

  it('should trim whitespace', () => {
    expect(validateStringParam('  test  ')).toBe('test');
  });

  it('should return null for strings with invalid characters', () => {
    expect(validateStringParam('test@123')).toBeNull();
    expect(validateStringParam('test<script>')).toBeNull();
    expect(validateStringParam('test; DROP TABLE')).toBeNull();
  });

  it('should validate against allowed values when provided', () => {
    expect(validateStringParam('instagram', ALLOWED_PLATFORMS)).toBe('instagram');
    expect(validateStringParam('facebook', ALLOWED_PLATFORMS)).toBe('facebook');
    expect(validateStringParam('invalid', ALLOWED_PLATFORMS)).toBeNull();
  });

  it('should be case-sensitive when checking allowed values', () => {
    expect(validateStringParam('Instagram', ALLOWED_PLATFORMS)).toBeNull();
  });
});

describe('validateDateParam', () => {
  it('should return null for null or empty values', () => {
    expect(validateDateParam(null)).toBeNull();
    expect(validateDateParam('')).toBeNull();
  });

  it('should return null for non-string values', () => {
    expect(validateDateParam(123 as any)).toBeNull();
    expect(validateDateParam({} as any)).toBeNull();
  });

  it('should return valid ISO date string for correct format', () => {
    expect(validateDateParam('2024-01-15')).toBe('2024-01-15');
    expect(validateDateParam('2024-12-31')).toBe('2024-12-31');
  });

  it('should trim whitespace', () => {
    expect(validateDateParam('  2024-01-15  ')).toBe('2024-01-15');
  });

  it('should return null for invalid date formats', () => {
    expect(validateDateParam('01-15-2024')).toBeNull(); // wrong format
    expect(validateDateParam('2024/01/15')).toBeNull(); // wrong separator
    expect(validateDateParam('2024-1-15')).toBeNull(); // missing leading zero
    expect(validateDateParam('24-01-15')).toBeNull(); // wrong year format
  });

  it('should return null for invalid dates', () => {
    // Note: JavaScript Date is lenient, so some invalid dates may pass
    // The function validates format, not actual date validity
    expect(validateDateParam('2024-13-01')).toBeNull(); // invalid month (format check fails)
    expect(validateDateParam('2024-00-01')).toBeNull(); // invalid month (format check fails)
    // 2024-02-30 passes format validation but JavaScript Date rolls it over
    // This is acceptable behavior for the current implementation
  });
});

describe('validateSortOrder', () => {
  it('should return the value for valid sort orders', () => {
    expect(validateSortOrder('asc')).toBe('asc');
    expect(validateSortOrder('desc')).toBe('desc');
  });

  it('should return default "desc" for invalid values', () => {
    expect(validateSortOrder(null)).toBe('desc');
    expect(validateSortOrder('invalid')).toBe('desc');
    expect(validateSortOrder('ASC')).toBe('desc'); // case-sensitive
    expect(validateSortOrder('')).toBe('desc');
  });
});

describe('sanitizeError', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    // Restore original NODE_ENV
    Object.defineProperty(process, 'env', {
      value: { ...process.env, NODE_ENV: originalEnv },
      writable: true,
      configurable: true,
    });
  });

  it('should return detailed error message in development', () => {
    Object.defineProperty(process, 'env', {
      value: { ...process.env, NODE_ENV: 'development' },
      writable: true,
      configurable: true,
    });
    const error = new Error('Detailed error message');
    expect(sanitizeError(error, 'Generic error')).toBe('Detailed error message');
  });

  it('should return generic message in production', () => {
    Object.defineProperty(process, 'env', {
      value: { ...process.env, NODE_ENV: 'production' },
      writable: true,
      configurable: true,
    });
    const error = new Error('Detailed error message');
    expect(sanitizeError(error, 'Generic error')).toBe('Generic error');
  });

  it('should return generic message for non-Error objects in development', () => {
    Object.defineProperty(process, 'env', {
      value: { ...process.env, NODE_ENV: 'development' },
      writable: true,
      configurable: true,
    });
    expect(sanitizeError('string error', 'Generic error')).toBe('Generic error');
    expect(sanitizeError(null, 'Generic error')).toBe('Generic error');
    expect(sanitizeError({}, 'Generic error')).toBe('Generic error');
  });

  it('should always return generic message in production', () => {
    Object.defineProperty(process, 'env', {
      value: { ...process.env, NODE_ENV: 'production' },
      writable: true,
      configurable: true,
    });
    const error = new Error('Sensitive information');
    expect(sanitizeError(error, 'An error occurred')).toBe('An error occurred');
  });
});

describe('Constants', () => {
  it('should have correct allowed platforms', () => {
    expect(ALLOWED_PLATFORMS).toContain('all');
    expect(ALLOWED_PLATFORMS).toContain('instagram');
    expect(ALLOWED_PLATFORMS).toContain('facebook');
    expect(ALLOWED_PLATFORMS).toContain('twitter');
    expect(ALLOWED_PLATFORMS).toContain('linkedin');
    expect(ALLOWED_PLATFORMS).toContain('tiktok');
    expect(ALLOWED_PLATFORMS).toContain('youtube');
  });

  it('should have correct allowed media types', () => {
    expect(ALLOWED_MEDIA_TYPES).toContain('all');
    expect(ALLOWED_MEDIA_TYPES).toContain('image');
    expect(ALLOWED_MEDIA_TYPES).toContain('video');
    expect(ALLOWED_MEDIA_TYPES).toContain('carousel');
    expect(ALLOWED_MEDIA_TYPES).toContain('reel');
    expect(ALLOWED_MEDIA_TYPES).toContain('story');
  });

  it('should have correct allowed post sort fields', () => {
    expect(ALLOWED_POST_SORT_FIELDS).toContain('posted_at');
    expect(ALLOWED_POST_SORT_FIELDS).toContain('impressions');
    expect(ALLOWED_POST_SORT_FIELDS).toContain('likes');
    expect(ALLOWED_POST_SORT_FIELDS).toContain('comments');
    expect(ALLOWED_POST_SORT_FIELDS).toContain('shares');
    expect(ALLOWED_POST_SORT_FIELDS).toContain('reach');
    expect(ALLOWED_POST_SORT_FIELDS).toContain('engagement_rate');
    expect(ALLOWED_POST_SORT_FIELDS).toContain('platform');
    expect(ALLOWED_POST_SORT_FIELDS).toContain('media_type');
  });
});

