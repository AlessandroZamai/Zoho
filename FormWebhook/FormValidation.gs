/**
 * EPP Callback Form Webhook - Validation Utilities
 * Input validation and sanitization functions
 */

/**
 * Normalize phone number to digits only and validate
 * Google Form already validates format with regex: ^\d{10}$
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
  
  // Normalize: remove all non-digit characters
  const normalized = phone ? String(phone).replace(/\D/g, '') : '';
  
  // Google Form already validates exactly 10 digits, just normalize
  return { 
    isValid: true, 
    normalized: normalized,
    error: null
  };
}

/**
 * Validate email format
 * Google Form already validates format with default email validation
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
  
  // Google Form already validates email format, just normalize to lowercase
  return { 
    isValid: true, 
    normalized: email.toString().trim().toLowerCase(),
    error: null
  };
}

// Valid Canadian province codes
const VALID_PROVINCES = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'];

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
  
  const provinceUpper = province.toString().trim().toUpperCase();
  
  if (!VALID_PROVINCES.includes(provinceUpper)) {
    return { 
      isValid: false, 
      error: `Invalid province code. Must be one of: ${VALID_PROVINCES.join(', ')}`
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
 * Google Form validates format with regex: ^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$
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
  
  // Google Form already validates format, just normalize to A1A 1A1 format with space
  const normalized = postalCode.toString().trim().toUpperCase()
    .replace(/^([A-Z]\d[A-Z])[\s-]?(\d[A-Z]\d)$/, '$1 $2');
  
  return { 
    isValid: true,
    normalized: normalized,
    error: null
  };
}

// Language mapping for quick lookups
const LANGUAGE_MAP = {
  'english': 'en-ca',
  'en': 'en-ca',
  'en-ca': 'en-ca',
  'français': 'fr-ca',
  'francais': 'fr-ca',
  'fr': 'fr-ca',
  'fr-ca': 'fr-ca'
};

/**
 * Validate language preference
 * Converts "English" to "en-ca" and "Français" to "fr-ca"
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
  
  const languageLower = language.toString().trim().toLowerCase();
  const normalized = LANGUAGE_MAP[languageLower];
  
  if (!normalized) {
    return { 
      isValid: false, 
      error: 'Language preference must be English or Français',
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
  
  // Convert to string, trim, and remove HTML/script tags in one pass
  return String(text).trim()
    .replace(/<[^>]*>|<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

/**
 * Validate all required form fields
 * @param {Object} formData - The form data object
 * @returns {Object} Validation result with isValid, errors array, and validated data
 */
function validateFormData(formData) {
  const errors = [];
  const validatedData = {};
  
  // Required text fields validation (firstName, lastName)
  const requiredFields = [
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' }
  ];
  
  // Process required text fields
  for (const field of requiredFields) {
    if (!formData[field.key] || formData[field.key].trim() === '') {
      errors.push(`${field.label} is required`);
    } else {
      validatedData[field.key] = sanitizeText(formData[field.key]);
    }
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
  
  // Validate optional fields in one batch
  const optionalValidations = [
    { field: 'postalCode', validator: validatePostalCode },
    { field: 'languagePreference', validator: validateLanguagePreference }
  ];
  
  for (const validation of optionalValidations) {
    const result = validation.validator(formData[validation.field]);
    if (!result.isValid) {
      errors.push(result.error);
    } else {
      validatedData[validation.field] = result.normalized;
    }
  }
  
  // Sanitize optional text fields in one batch
  const optionalTextFields = ['company', 'newCustomer', 'additionalDetails'];
  for (const field of optionalTextFields) {
    validatedData[field] = sanitizeText(formData[field] || '');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors,
    validatedData: validatedData
  };
}
