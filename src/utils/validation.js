/**
 * Validation utilities for user input
 * These validations should be used on both client and server side
 */

// Maximum lengths to prevent abuse
export const MAX_LENGTHS = {
  NAME: 100,
  EMAIL: 254, // RFC 5321
  PASSWORD: 128,
  USER_ID: 30,
};

// Minimum lengths
export const MIN_LENGTHS = {
  PASSWORD: 8,
  USER_ID: 3,
  NAME: 2,
};

/**
 * Validate email format
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const trimmedEmail = email.trim();

  if (trimmedEmail.length === 0) {
    return { valid: false, error: 'Email cannot be empty' };
  }

  if (trimmedEmail.length > MAX_LENGTHS.EMAIL) {
    return { valid: false, error: `Email must be less than ${MAX_LENGTHS.EMAIL} characters` };
  }

  // RFC 5322 compliant email regex (simplified but comprehensive)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(trimmedEmail)) {
    return { valid: false, error: 'Invalid email format' };
  }

  // Check for common malicious patterns
  if (/<|>|;|--|'|"|script/i.test(trimmedEmail)) {
    return { valid: false, error: 'Email contains invalid characters' };
  }

  return { valid: true, value: trimmedEmail.toLowerCase() };
}

/**
 * Validate password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < MIN_LENGTHS.PASSWORD) {
    return { 
      valid: false, 
      error: `Password must be at least ${MIN_LENGTHS.PASSWORD} characters long` 
    };
  }

  if (password.length > MAX_LENGTHS.PASSWORD) {
    return { 
      valid: false, 
      error: `Password must be less than ${MAX_LENGTHS.PASSWORD} characters` 
    };
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { 
      valid: false, 
      error: 'Password must contain at least one uppercase letter' 
    };
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    return { 
      valid: false, 
      error: 'Password must contain at least one lowercase letter' 
    };
  }

  // Check for number
  if (!/\d/.test(password)) {
    return { 
      valid: false, 
      error: 'Password must contain at least one number' 
    };
  }

  // Check for special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { 
      valid: false, 
      error: 'Password must contain at least one special character (!@#$%^&*...)' 
    };
  }

  // Check for common weak passwords
  const commonPasswords = [
    'password', 'password1', 'password123', '12345678', 'qwerty123',
    'abc12345', 'password!', 'password@123'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    return { 
      valid: false, 
      error: 'This password is too common. Please choose a stronger password' 
    };
  }

  return { valid: true, value: password };
}

/**
 * Validate name
 */
export function validateName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Name is required' };
  }

  const trimmedName = name.trim();

  if (trimmedName.length < MIN_LENGTHS.NAME) {
    return { 
      valid: false, 
      error: `Name must be at least ${MIN_LENGTHS.NAME} characters` 
    };
  }

  if (trimmedName.length > MAX_LENGTHS.NAME) {
    return { 
      valid: false, 
      error: `Name must be less than ${MAX_LENGTHS.NAME} characters` 
    };
  }

  // Only allow letters, spaces, hyphens, and apostrophes
  if (!/^[a-zA-Z\s'-]+$/.test(trimmedName)) {
    return { 
      valid: false, 
      error: 'Name can only contain letters, spaces, hyphens, and apostrophes' 
    };
  }

  // Check for malicious patterns
  if (/<|>|;|--|script/i.test(trimmedName)) {
    return { valid: false, error: 'Name contains invalid characters' };
  }

  return { valid: true, value: trimmedName };
}

/**
 * Validate user ID
 */
export function validateUserId(userId) {
  if (!userId || typeof userId !== 'string') {
    return { valid: false, error: 'User ID is required' };
  }

  const trimmedUserId = userId.trim();

  if (trimmedUserId.length < MIN_LENGTHS.USER_ID) {
    return { 
      valid: false, 
      error: `User ID must be at least ${MIN_LENGTHS.USER_ID} characters` 
    };
  }

  if (trimmedUserId.length > MAX_LENGTHS.USER_ID) {
    return { 
      valid: false, 
      error: `User ID must be less than ${MAX_LENGTHS.USER_ID} characters` 
    };
  }

  // Only allow alphanumeric and underscores
  if (!/^[a-zA-Z0-9_]+$/.test(trimmedUserId)) {
    return { 
      valid: false, 
      error: 'User ID can only contain letters, numbers, and underscores' 
    };
  }

  // Prevent reserved user IDs
  const reserved = ['admin', 'root', 'system', 'api', 'null', 'undefined', 'test'];
  if (reserved.includes(trimmedUserId.toLowerCase())) {
    return { valid: false, error: 'This user ID is reserved' };
  }

  return { valid: true, value: trimmedUserId.toLowerCase() };
}

/**
 * Validate date of birth and age
 */
export function validateDateOfBirth(dateOfBirth, minAge = 16) {
  if (!dateOfBirth) {
    return { valid: false, error: 'Date of birth is required' };
  }

  const birthDate = new Date(dateOfBirth);
  
  // Check if date is valid
  if (isNaN(birthDate.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }

  // Check if date is not in the future
  const today = new Date();
  if (birthDate > today) {
    return { valid: false, error: 'Date of birth cannot be in the future' };
  }

  // Check if date is not too far in the past (120 years)
  const maxAge = 120;
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - maxAge);
  
  if (birthDate < minDate) {
    return { valid: false, error: 'Please enter a valid date of birth' };
  }

  // Calculate age
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < minAge) {
    return { 
      valid: false, 
      error: `You must be at least ${minAge} years old to sign up` 
    };
  }

  return { valid: true, value: birthDate, age };
}

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input) {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove HTML tags and script tags
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

/**
 * Validate and sanitize all signup data
 */
export function validateSignupData(data) {
  const errors = [];
  const sanitized = {};

  // Validate name
  const nameValidation = validateName(data.name);
  if (!nameValidation.valid) {
    errors.push(nameValidation.error);
  } else {
    sanitized.name = sanitizeString(nameValidation.value);
  }

  // Validate user ID
  const userIdValidation = validateUserId(data.userId);
  if (!userIdValidation.valid) {
    errors.push(userIdValidation.error);
  } else {
    sanitized.userId = userIdValidation.value;
  }

  // Validate email
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.valid) {
    errors.push(emailValidation.error);
  } else {
    sanitized.email = emailValidation.value;
  }

  // Validate password
  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.valid) {
    errors.push(passwordValidation.error);
  } else {
    sanitized.password = passwordValidation.value;
  }

  // Validate date of birth
  const dobValidation = validateDateOfBirth(data.dateOfBirth);
  if (!dobValidation.valid) {
    errors.push(dobValidation.error);
  } else {
    sanitized.dateOfBirth = dobValidation.value;
  }

  // Optional fields - sanitize if present
  if (data.gender) {
    const validGenders = ['Male', 'Female', 'Other'];
    if (validGenders.includes(data.gender)) {
      sanitized.gender = data.gender;
    }
  }

  if (data.ageGroup) {
    const validAgeGroups = ['13-17', '18-24', '25-34', '35-44', '45-54', '55+'];
    if (validAgeGroups.includes(data.ageGroup)) {
      sanitized.ageGroup = data.ageGroup;
    }
  }

  if (data.occupation) {
    sanitized.occupation = sanitizeString(data.occupation).substring(0, 100);
  }

  if (data.listeningHabits) {
    const validHabits = ['daily', 'weekly', 'occasionally', 'rarely'];
    if (validHabits.includes(data.listeningHabits)) {
      sanitized.listeningHabits = data.listeningHabits;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    data: sanitized
  };
}

/**
 * Validate login data
 */
export function validateLoginData(data) {
  const errors = [];
  const sanitized = {};

  // Validate email
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.valid) {
    errors.push(emailValidation.error);
  } else {
    sanitized.email = emailValidation.value;
  }

  // For login, just check password exists and isn't too long
  if (!data.password || typeof data.password !== 'string') {
    errors.push('Password is required');
  } else if (data.password.length > MAX_LENGTHS.PASSWORD) {
    errors.push('Invalid password');
  } else {
    sanitized.password = data.password;
  }

  return {
    valid: errors.length === 0,
    errors,
    data: sanitized
  };
}
