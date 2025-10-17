/**
 * EPP Callback Form Webhook - Validation Utilities
 * Input validation and sanitization functions
 */

/**
 * Normalize phone number to digits only
 * Removes all non-digit characters including + sign
 * @param {string} phone - The phone number to normalize
 * @returns {string} Normalized phone number (digits only)
 */
function normalizePhoneNumber(phone) {
  if (!phone) return '';
  return String(phone).replace(/\D/g, '');
}

/**
 * Validate phone number format
 * @param {string} phone - The phone number to validate
 * @returns {Object} Validation result with isValid, normalized value, and error message
 */
function validatePhoneNumber(phone) {
  if (!phone || phone.toString().trim() === '') {
    return { 
      isValid: false, 
      error: 'Phone number is required',
      normalized: ''
    };
  }
  
  const normalized = normalizePhoneNumber(phone);
  
  if (normalized.length < 10) {
    return { 
      isValid: false, 
      error: 'Phone must contain at least 10 digits',
      normalized: normalized
    };
  }
  
  return { 
    isValid: true, 
    normalized: normalized,
    error: null
  };
}

/**
 * Validate email format using regex
 * @param {string} email - The email address to validate
 * @returns {Object} Validation result with isValid, normalized value, and error message
 */
function validateEmail(email) {
  if (!email || email.toString().trim() === '') {
    return { 
      isValid: false, 
      error: 'Email is required',
      normalized: ''
    };
  }
  
  const emailStr = email.toString().trim();
  
  // RFC 5322 compliant email regex (simplified but robust)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(emailStr)) {
    return { 
      isValid: false, 
      error: 'Email format is invalid',
      normalized: emailStr
    };
  }
  
  // Additional checks
  if (emailStr.length > 254) {
    return { 
      isValid: false, 
      error: 'Email address is too long',
      normalized: emailStr
    };
  }
  
  const parts = emailStr.split('@');
  if (parts[0].length > 64) {
    return { 
      isValid: false, 
      error: 'Email local part is too long',
      normalized: emailStr
    };
  }
  
  return { 
    isValid: true, 
    normalized: emailStr.toLowerCase(),
    error: null
  };
}

/**
 * Validate Canadian province code
 * @param {string} province - The province code to validate
 * @returns {Object} Validation result with isValid and error message
 */
function validateProvince(province) {
  if (!province || province.toString().trim() === '') {
    return { 
      isValid: false, 
      error: 'Province is required'
    };
  }
  
  const validProvinces = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'];
  const provinceUpper = province.toString().trim().toUpperCase();
  
  if (!validProvinces.includes(provinceUpper)) {
    return { 
      isValid: false, 
      error: `Invalid province code. Must be one of: ${validProvinces.join(', ')}`
    };
  }
  
  return { 
    isValid: true,
    normalized: provinceUpper,
    error: null
  };
}

/**
 * Validate Canadian postal code format (optional field)
 * @param {string} postalCode - The postal code to validate
 * @returns {Object} Validation result with isValid, normalized value, and error message
 */
function validatePostalCode(postalCode) {
  // Postal code is optional, so empty is valid
  if (!postalCode || postalCode.toString().trim() === '') {
    return { 
      isValid: true,
      normalized: '',
      error: null
    };
  }
  
  const postalStr = postalCode.toString().trim().toUpperCase();
  
  // Canadian postal code format: A1A 1A1 (with or without space)
  const postalRegex = /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/;
  
  if (!postalRegex.test(postalStr)) {
    return { 
      isValid: false, 
      error: 'Postal code format is invalid. Expected format: A1A 1A1',
      normalized: postalStr
    };
  }
  
  // Normalize to format with space: A1A 1A1
  const normalized = postalStr.replace(/^([A-Z]\d[A-Z])(\d[A-Z]\d)$/, '$1 $2');
  
  return { 
    isValid: true,
    normalized: normalized,
    error: null
  };
}

/**
 * Validate language preference
 * @param {string} language - The language preference to validate
 * @returns {Object} Validation result with isValid, normalized value, and error message
 */
function validateLanguagePreference(language) {
  // Language preference is optional
  if (!language || language.toString().trim() === '') {
    return { 
      isValid: true,
      normalized: '',
      error: null
    };
  }
  
  const validLanguages = ['en-ca', 'fr-ca', 'English', 'French'];
  const languageLower = language.toString().trim().toLowerCase();
  
  // Normalize to standard format
  let normalized = '';
  if (languageLower === 'english' || languageLower === 'en-ca' || languageLower === 'en') {
    normalized = 'en-ca';
  } else if (languageLower === 'french' || languageLower === 'fr-ca' || languageLower === 'fr') {
    normalized = 'fr-ca';
  } else {
    return { 
      isValid: false, 
      error: 'Language preference must be English or French',
      normalized: language.toString().trim()
    };
  }
  
  return { 
    isValid: true,
    normalized: normalized,
    error: null
  };
}

/**
 * Sanitize text input to prevent injection attacks
 * @param {string} text - The text to sanitize
 * @returns {string} Sanitized text
 */
function sanitizeText(text) {
  if (!text) return '';
  
  // Convert to string and trim
  let sanitized = String(text).trim();
  
  // Remove any HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  // Remove any script-like content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  return sanitized;
}

/**
 * Validate all required form fields
 * @param {Object} formData - The form data object
 * @returns {Object} Validation result with isValid, errors array, and validated data
 */
function validateFormData(formData) {
  const errors = [];
  const validatedData = {};
  
  // Validate First Name (required)
  if (!formData.firstName || formData.firstName.trim() === '') {
    errors.push('First Name is required');
  } else {
    validatedData.firstName = sanitizeText(formData.firstName);
  }
  
  // Validate Last Name (required)
  if (!formData.lastName || formData.lastName.trim() === '') {
    errors.push('Last Name is required');
  } else {
    validatedData.lastName = sanitizeText(formData.lastName);
  }
  
  // Validate Phone (required)
  const phoneValidation = validatePhoneNumber(formData.phone);
  if (!phoneValidation.isValid) {
    errors.push(phoneValidation.error);
  } else {
    validatedData.phone = phoneValidation.normalized;
  }
  
  // Validate Email (required)
  const emailValidation = validateEmail(formData.email);
  if (!emailValidation.isValid) {
    errors.push(emailValidation.error);
  } else {
    validatedData.email = emailValidation.normalized;
  }
  
  // Validate Province (required)
  const provinceValidation = validateProvince(formData.province);
  if (!provinceValidation.isValid) {
    errors.push(provinceValidation.error);
  } else {
    validatedData.province = provinceValidation.normalized;
  }
  
  // Validate Postal Code (optional)
  const postalValidation = validatePostalCode(formData.postalCode);
  if (!postalValidation.isValid) {
    errors.push(postalValidation.error);
  } else {
    validatedData.postalCode = postalValidation.normalized;
  }
  
  // Validate Language Preference (optional)
  const languageValidation = validateLanguagePreference(formData.languagePreference);
  if (!languageValidation.isValid) {
    errors.push(languageValidation.error);
  } else {
    validatedData.languagePreference = languageValidation.normalized;
  }
  
  // Sanitize optional text fields
  validatedData.company = sanitizeText(formData.company || '');
  validatedData.newCustomer = sanitizeText(formData.newCustomer || '');
  validatedData.additionalDetails = sanitizeText(formData.additionalDetails || '');
  
  return {
    isValid: errors.length === 0,
    errors: errors,
    validatedData: validatedData
  };
}
