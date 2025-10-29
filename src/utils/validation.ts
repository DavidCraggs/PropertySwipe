/**
 * Validation utilities for forms and user input
 */

/**
 * Validate UK postcode format
 * @param postcode - Postcode to validate
 * @returns True if valid UK postcode
 */
export const isValidPostcode = (postcode: string): boolean => {
  const postcodeRegex =
    /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i;
  return postcodeRegex.test(postcode.trim());
};

/**
 * Validate email format
 * @param email - Email to validate
 * @returns True if valid email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validate name (at least 2 characters, letters and spaces only)
 * @param name - Name to validate
 * @returns True if valid name
 */
export const isValidName = (name: string): boolean => {
  const nameRegex = /^[a-zA-Z\s]{2,}$/;
  return nameRegex.test(name.trim());
};

/**
 * Validate price range
 * @param min - Minimum price
 * @param max - Maximum price
 * @returns Error message if invalid, null if valid
 */
export const validatePriceRange = (min: number, max: number): string | null => {
  if (min < 0) return 'Minimum price must be positive';
  if (max < 0) return 'Maximum price must be positive';
  if (min >= max) return 'Minimum price must be less than maximum price';
  if (max > 10000000) return 'Maximum price too high';
  return null;
};

/**
 * Validate bedroom range
 * @param min - Minimum bedrooms
 * @param max - Maximum bedrooms
 * @returns Error message if invalid, null if valid
 */
export const validateBedroomRange = (min: number, max: number): string | null => {
  if (min < 0) return 'Minimum bedrooms must be positive';
  if (max < 0) return 'Maximum bedrooms must be positive';
  if (min > max) return 'Minimum bedrooms must be less than or equal to maximum';
  if (max > 10) return 'Maximum bedrooms too high';
  return null;
};

/**
 * Validate message content
 * @param message - Message to validate
 * @returns Error message if invalid, null if valid
 */
export const validateMessage = (message: string): string | null => {
  const trimmed = message.trim();
  if (trimmed.length === 0) return 'Message cannot be empty';
  if (trimmed.length > 1000) return 'Message too long (max 1000 characters)';
  return null;
};

/**
 * Sanitize user input to prevent XSS
 * @param input - User input string
 * @returns Sanitized string
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validate required field
 * @param value - Field value
 * @param fieldName - Name of the field for error message
 * @returns Error message if invalid, null if valid
 */
export const validateRequired = (value: string, fieldName: string): string | null => {
  if (!value || value.trim().length === 0) {
    return `${fieldName} is required`;
  }
  return null;
};

/**
 * Validate minimum length
 * @param value - String value
 * @param minLength - Minimum length
 * @param fieldName - Field name for error message
 * @returns Error message if invalid, null if valid
 */
export const validateMinLength = (
  value: string,
  minLength: number,
  fieldName: string
): string | null => {
  if (value.trim().length < minLength) {
    return `${fieldName} must be at least ${minLength} characters`;
  }
  return null;
};

/**
 * Validate maximum length
 * @param value - String value
 * @param maxLength - Maximum length
 * @param fieldName - Field name for error message
 * @returns Error message if invalid, null if valid
 */
export const validateMaxLength = (
  value: string,
  maxLength: number,
  fieldName: string
): string | null => {
  if (value.trim().length > maxLength) {
    return `${fieldName} must be no more than ${maxLength} characters`;
  }
  return null;
};

/**
 * Validate phone number (UK format)
 * @param phone - Phone number to validate
 * @returns True if valid UK phone number
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^(?:(?:\+44\s?|0)(?:\d\s?){9,10})$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
};

/**
 * Validate number is within range
 * @param value - Number to validate
 * @param min - Minimum value
 * @param max - Maximum value
 * @param fieldName - Field name for error message
 * @returns Error message if invalid, null if valid
 */
export const validateNumberRange = (
  value: number,
  min: number,
  max: number,
  fieldName: string
): string | null => {
  if (value < min || value > max) {
    return `${fieldName} must be between ${min} and ${max}`;
  }
  return null;
};

/**
 * Validate array has at least one item
 * @param array - Array to validate
 * @param fieldName - Field name for error message
 * @returns Error message if invalid, null if valid
 */
export const validateArrayNotEmpty = <T>(array: T[], fieldName: string): string | null => {
  if (!array || array.length === 0) {
    return `At least one ${fieldName} must be selected`;
  }
  return null;
};
