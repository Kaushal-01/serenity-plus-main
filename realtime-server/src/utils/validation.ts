/**
 * Validation Utilities
 * Input validation for socket events
 */

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const validateString = (value: any, fieldName: string, maxLength?: number): string => {
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`);
  }
  
  const trimmed = value.trim();
  
  if (trimmed.length === 0) {
    throw new ValidationError(`${fieldName} cannot be empty`);
  }
  
  if (maxLength && trimmed.length > maxLength) {
    throw new ValidationError(`${fieldName} cannot exceed ${maxLength} characters`);
  }
  
  return trimmed;
};

export const validateObjectId = (value: any, fieldName: string): string => {
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`);
  }
  
  // MongoDB ObjectId is 24 hex characters
  if (!/^[0-9a-fA-F]{24}$/.test(value)) {
    throw new ValidationError(`${fieldName} must be a valid ObjectId`);
  }
  
  return value;
};

export const validateNumber = (value: any, fieldName: string, min?: number, max?: number): number => {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new ValidationError(`${fieldName} must be a number`);
  }
  
  if (min !== undefined && value < min) {
    throw new ValidationError(`${fieldName} must be at least ${min}`);
  }
  
  if (max !== undefined && value > max) {
    throw new ValidationError(`${fieldName} must be at most ${max}`);
  }
  
  return value;
};

export const sanitizeMessage = (content: string): string => {
  // Basic XSS prevention - remove HTML tags
  return content
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim();
};
