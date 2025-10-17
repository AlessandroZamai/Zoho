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
  
  // Get visible fields to match spreadsheet structure (excludes hidden fields)
  const visibleFields = getVisibleFields();
  
  // Get list of hidden field API names to skip validation
  const hiddenFieldApiNames = HIDDEN_FIELDS.map(f => f.apiName);
  
  // Validate each visible field based on its configuration
  visibleFields.forEach((field, index) => {
    // Skip validation for hidden fields (they're populated automatically in the payload)
    if (hiddenFieldApiNames.includes(field.apiName)) {
      return;
    }
    
    // Skip validation for AssignmentValue field here - it has its own validation logic below
    if (field.apiName === 'AssignmentValue') {
      return;
    }
    
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
        const phoneValidation = validatePhoneNumber(value);
        if (!phoneValidation.isValid) {
          errors.push(phoneValidation.error);
        }
        break;
        
      case 'Email':
        const emailValidation = validateEmailAddress(value);
        if (!emailValidation.isValid) {
          errors.push(emailValidation.error);
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
  const assignmentField = visibleFields.find(f => f.apiName === 'AssignmentValue');
  
  if (assignmentField) {
    // Use visible field index to match spreadsheet column position
    const assignmentIndex = visibleFields.indexOf(assignmentField);
    
    // Safety check: ensure the index is within bounds of rowData
    if (assignmentIndex >= rowData.length) {
      Logger.log(`Warning: AssignmentValue field index (${assignmentIndex}) is out of bounds for rowData length (${rowData.length})`);
      Logger.log('Visible fields: ' + visibleFields.map(f => f.displayName).join(', '));
      Logger.log('Row data length: ' + rowData.length);
      errors.push('Configuration error: Assignment field index mismatch. Please run setup wizard again.');
      return {
        isValid: false,
        errors: errors,
        warnings: warnings,
        rowNumber: rowNumber
      };
    }
    
    const assignmentValue = rowData[assignmentIndex];
    const assignmentValueStr = assignmentValue ? assignmentValue.toString().trim() : '';
    
    if (config.leadAssignment === 'Store') {
      if (!assignmentValueStr) {
        errors.push('Channel Outlet ID is required for Store assignment');
      } else {
        if (assignmentValueStr.length !== 10 || !/^\d+$/.test(assignmentValueStr)) {
          errors.push('Channel Outlet ID must be exactly 10 digits');
        }
      }
    } else if (config.leadAssignment === 'Sales_Rep') {
      if (!assignmentValueStr) {
        errors.push('Sales Rep Email is required for Sales Rep assignment');
      } else {
        // Use the proper email validation function
        const emailValidation = validateEmailAddress(assignmentValueStr);
        if (!emailValidation.isValid) {
          errors.push('Sales Rep Email: ' + emailValidation.error);
        }
      }
    }
    // ADMIN assignment doesn't require any assignment value
  }
  
  // Add warnings for commonly missing optional fields (use visible fields for indexing)
  const streetField = visibleFields.find(f => f.apiName === 'Street');
  if (streetField) {
    const streetIndex = visibleFields.indexOf(streetField);
    if (streetIndex < rowData.length) {
      const streetValue = rowData[streetIndex];
      if (!streetValue || streetValue.toString().trim() === '') {
        warnings.push('Street address is missing');
      }
    }
  }
  
  const cityField = visibleFields.find(f => f.apiName === 'City');
  if (cityField) {
    const cityIndex = visibleFields.indexOf(cityField);
    if (cityIndex < rowData.length) {
      const cityValue = rowData[cityIndex];
      if (!cityValue || cityValue.toString().trim() === '') {
        warnings.push('City is missing');
      }
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
