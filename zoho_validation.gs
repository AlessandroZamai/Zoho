/**
 * Zoho Integration Validation - Unified Validation System
 * Centralized validation functions used by both automated and manual processing
 */

/**
 * Unified validation function for row data using dynamic field mapping
 * Used by both automated and manual processing modes
 */
function validateRowDataUnified(rowData, rowNumber) {
  const errors = [];
  const warnings = [];
  
  // Get selected fields for validation
  const selectedFields = getSelectedFields();
  
  // Validate each field based on its configuration
  selectedFields.forEach((field, index) => {
    const value = rowData[index];
    const fieldValue = value ? value.toString().trim() : '';
    
    // Check required fields
    if (field.required && (!value || fieldValue === '')) {
      errors.push(`${field.displayName} is required`);
      return;
    }
    
    // Skip validation for empty optional fields
    if (!fieldValue) {
      return;
    }
    
    // Field-specific validation
    switch (field.apiName) {
      case 'Phone':
        const cleanPhone = String(value).replace(/[^0-9+]/g, '');
        if (cleanPhone.length < 10) {
          errors.push('Phone must contain at least 10 digits');
        }
        break;
        
      case 'Email':
        if (!fieldValue.includes('@') || !fieldValue.includes('.')) {
          errors.push('Email format appears invalid');
        }
        break;
        
      case 'Language_Preference':
        const languagePreference = fieldValue.toLowerCase();
        if (languagePreference !== 'en-ca' && languagePreference !== 'fr-ca') {
          errors.push('Language Preference must be either "en-ca" or "fr-ca"');
        }
        break;
        
      case 'State': // Province field
        if (field.validation && field.validation.length > 0) {
          if (!field.validation.includes(fieldValue.toUpperCase())) {
            errors.push(`Province must be one of: ${field.validation.join(', ')}`);
          }
        }
        break;
    }
    
    // Validation for fields with predefined options
    if (field.validation && field.validation.length > 0 && field.apiName !== 'State') {
      if (!field.validation.includes(fieldValue)) {
        errors.push(`${field.displayName} must be one of: ${field.validation.join(', ')}`);
      }
    }
  });
  
  // Validate assignment field based on configuration
  const config = getConfigurationValues();
  const assignmentField = selectedFields.find(f => f.apiName === 'AssignmentValue');
  
  if (assignmentField) {
    const assignmentIndex = selectedFields.indexOf(assignmentField);
    const assignmentValue = rowData[assignmentIndex];
    const assignmentValueStr = assignmentValue ? assignmentValue.toString().trim() : '';
    
    if (config.leadAssignment === 'Store') {
      if (!assignmentValueStr) {
        errors.push('Channel Outlet ID is required for Store assignment');
      } else {
        if (assignmentValueStr.length !== 11 || !/^\d+$/.test(assignmentValueStr)) {
          errors.push('Channel Outlet ID must be exactly 11 digits');
        }
      }
    } else if (config.leadAssignment === 'Sales_Rep') {
      if (!assignmentValueStr) {
        errors.push('Sales Rep Email is required for Sales Rep assignment');
      } else {
        if (!assignmentValueStr.includes('@') || !assignmentValueStr.includes('.')) {
          errors.push('Sales Rep Email format appears invalid');
        }
      }
    }
    // ADMIN assignment doesn't require any assignment value
  }
  
  // Add warnings for commonly missing optional fields
  const streetField = selectedFields.find(f => f.apiName === 'Street');
  if (streetField) {
    const streetIndex = selectedFields.indexOf(streetField);
    const streetValue = rowData[streetIndex];
    if (!streetValue || streetValue.toString().trim() === '') {
      warnings.push('Street address is missing');
    }
  }
  
  const cityField = selectedFields.find(f => f.apiName === 'City');
  if (cityField) {
    const cityIndex = selectedFields.indexOf(cityField);
    const cityValue = rowData[cityIndex];
    if (!cityValue || cityValue.toString().trim() === '') {
      warnings.push('City is missing');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors,
    warnings: warnings,
    rowNumber: rowNumber
  };
}

/**
 * Validate configuration completeness
 * Checks if all required configuration values are present
 */
function validateConfiguration() {
  const configCheck = isConfigurationComplete();
  if (!configCheck.complete) {
    return {
      isValid: false,
      error: 'Configuration incomplete: ' + configCheck.message
    };
  }
  
  const config = getConfigurationValues();
  
  // Check processing mode
  if (!config.processingMode) {
    return {
      isValid: false,
      error: 'Processing mode not configured'
    };
  }
  
  // Check auth tokens
  if (!config.authTokenName || !config.authTokenValue) {
    return {
      isValid: false,
      error: 'Authentication tokens not configured'
    };
  }
  
  // Check organization settings
  if (!config.orgCode || !config.orgTypeCode) {
    return {
      isValid: false,
      error: 'Organization settings not configured'
    };
  }
  
  return {
    isValid: true,
    config: config
  };
}

/**
 * Validate processing mode compatibility
 * Ensures the current operation matches the configured processing mode
 */
function validateProcessingMode(expectedMode) {
  const currentMode = getCurrentProcessingMode();
  
  if (!currentMode) {
    return {
      isValid: false,
      error: 'Processing mode not configured. Please run the setup wizard.'
    };
  }
  
  if (currentMode !== expectedMode) {
    const modeNames = {
      ['AUTO']: 'automated',
      ['MANUAL']: 'manual'
    };
    
    return {
      isValid: false,
      error: `Integration is configured for ${modeNames[currentMode]} processing, but ${modeNames[expectedMode]} processing was requested.`
    };
  }
  
  return {
    isValid: true,
    mode: currentMode
  };
}

/**
 * Validate spreadsheet structure
 * Ensures the spreadsheet has the expected columns and format
 */
function validateSpreadsheetStructure() {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Use the dynamic headers function to get current expected headers
    const expectedHeaders = getExpectedHeaders();
    
    const missingHeaders = [];
    const extraHeaders = [];
    
    // Check for missing required headers
    for (let i = 0; i < expectedHeaders.length; i++) {
      if (i >= headers.length || headers[i] !== expectedHeaders[i]) {
        missingHeaders.push(`Column ${i + 1}: Expected "${expectedHeaders[i]}", found "${headers[i] || 'empty'}"`);
      }
    }
    
    // Check for extra headers
    if (headers.length > expectedHeaders.length) {
      for (let i = expectedHeaders.length; i < headers.length; i++) {
        extraHeaders.push(`Column ${i + 1}: Unexpected "${headers[i]}"`);
      }
    }
    
    if (missingHeaders.length > 0 || extraHeaders.length > 0) {
      let errorMessage = 'Spreadsheet structure validation failed:\n';
      if (missingHeaders.length > 0) {
        errorMessage += 'Missing/incorrect headers:\n' + missingHeaders.join('\n') + '\n';
      }
      if (extraHeaders.length > 0) {
        errorMessage += 'Extra headers:\n' + extraHeaders.join('\n');
      }
      
      return {
        isValid: false,
        error: errorMessage
      };
    }
    
    return {
      isValid: true,
      message: 'Spreadsheet structure is valid'
    };
    
  } catch (error) {
    return {
      isValid: false,
      error: 'Error validating spreadsheet structure: ' + error.toString()
    };
  }
}

/**
 * Validate campaign dates
 * Ensures campaign dates are properly configured and logical
 */
function validateCampaignDates(config) {
  if (!config.campaignStartDate || !config.campaignEndDate) {
    return {
      isValid: false,
      error: 'Campaign dates not configured'
    };
  }
  
  const startDate = new Date(config.campaignStartDate);
  const endDate = new Date(config.campaignEndDate);
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return {
      isValid: false,
      error: 'Invalid campaign date format'
    };
  }
  
  if (endDate <= startDate) {
    return {
      isValid: false,
      error: 'Campaign end date must be after start date'
    };
  }
  
  // Check if campaign dates are reasonable (not too far in the past or future)
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  
  if (startDate < oneYearAgo) {
    return {
      isValid: false,
      warning: 'Campaign start date is more than one year in the past'
    };
  }
  
  if (endDate > oneYearFromNow) {
    return {
      isValid: false,
      warning: 'Campaign end date is more than one year in the future'
    };
  }
  
  return {
    isValid: true,
    startDate: startDate,
    endDate: endDate
  };
}

/**
 * Validate lead assignment configuration
 * Ensures lead assignment settings are properly configured
 */
function validateLeadAssignment(config) {
  if (!config.leadAssignment) {
    return {
      isValid: false,
      error: 'Lead assignment strategy not configured'
    };
  }
  
  const validAssignments = ['Store', 'Sales_Rep', 'ADMIN'];
  if (!validAssignments.includes(config.leadAssignment)) {
    return {
      isValid: false,
      error: 'Invalid lead assignment strategy: ' + config.leadAssignment
    };
  }
  
  // All assignment strategies are valid with the single dynamic column approach
  // No need to check enabledColumns as we now use a single dynamic column
  
  return {
    isValid: true,
    assignment: config.leadAssignment
  };
}

/**
 * Comprehensive validation for processing setup
 * Runs all validation checks before processing begins
 */
function validateProcessingSetup(mode) {
  const validationResults = {
    isValid: true,
    errors: [],
    warnings: [],
    config: null
  };
  
  // Validate processing mode
  const modeValidation = validateProcessingMode(mode);
  if (!modeValidation.isValid) {
    validationResults.isValid = false;
    validationResults.errors.push(modeValidation.error);
    return validationResults;
  }
  
  // Validate configuration
  const configValidation = validateConfiguration();
  if (!configValidation.isValid) {
    validationResults.isValid = false;
    validationResults.errors.push(configValidation.error);
    return validationResults;
  }
  
  validationResults.config = configValidation.config;
  
  // Validate spreadsheet structure
  const structureValidation = validateSpreadsheetStructure();
  if (!structureValidation.isValid) {
    validationResults.isValid = false;
    validationResults.errors.push(structureValidation.error);
  }
  
  // Validate campaign dates
  const dateValidation = validateCampaignDates(validationResults.config);
  if (!dateValidation.isValid) {
    if (dateValidation.warning) {
      validationResults.warnings.push(dateValidation.warning);
    } else {
      validationResults.isValid = false;
      validationResults.errors.push(dateValidation.error);
    }
  }
  
  // Validate lead assignment
  const assignmentValidation = validateLeadAssignment(validationResults.config);
  if (!assignmentValidation.isValid) {
    validationResults.isValid = false;
    validationResults.errors.push(assignmentValidation.error);
  }
  
  return validationResults;
}
