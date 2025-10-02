/**
 * Zoho Integration Constants and Utilities
 * Essential constants and utility functions used throughout the integration
 */

// Webhook URL for Zoho API
const WEBHOOK_URL = 'https://sandbox.zohoapis.com/crm/v7/functions/telus_webhook_to_capture_lead/actions/execute?auth_type=apikey&zapikey=1003.26a3ebba6146ba321bb5690283cdf991.57db655a174cf1acff14b96739abfd3f';

// Zoho CRM URLs and organization settings
const ZOHO_CRM_BASE_URL = 'https://crm.zoho.com/crm';
const ZOHO_ORG_ID = 'org820120607';
const ZOHO_LEADS_PATH = 'tab/Leads';

// Processing modes
const PROCESSING_MODES = {
  AUTO: 'AUTO',
  MANUAL: 'MANUAL'
};

// Error codes for error handling
const ZOHO_ERROR_CODES = {
  CONFIGURATION_ERROR: 'CONFIG_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  API_ERROR: 'API_ERROR',
  PROCESSING_ERROR: 'PROCESSING_ERROR'
};

// Available fields for user selection
const AVAILABLE_FIELDS = {
  // Required fields (always selected, greyed out)
  required: [
    { apiName: 'First_Name', displayName: 'First Name', required: true, validation: null },
    { apiName: 'Last_Name', displayName: 'Last Name', required: true, validation: null },
    { apiName: 'Phone', displayName: 'Phone', required: true, validation: null },
    { apiName: 'Campaign_Name', displayName: 'Campaign Name', required: true, validation: null }
  ],
  // Optional fields (user can select)
  optional: [
    { apiName: 'Email', displayName: 'Email', required: false, validation: null },
    { apiName: 'Language_Preference', displayName: 'Language Preference', required: false, validation: ['en-ca', 'fr-ca'] },
    { apiName: 'Description', displayName: 'Description', required: false, validation: null },
    { apiName: 'Quote_ID', displayName: 'Quote ID', required: false, validation: null },
    { apiName: 'Street', displayName: 'Street', required: false, validation: null },
    { apiName: 'City', displayName: 'City', required: false, validation: null },
    { apiName: 'State', displayName: 'Province', required: false, validation: ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'] },
    { apiName: 'Zip_Code', displayName: 'Postal Code', required: false, validation: null },
    { apiName: 'Country', displayName: 'Country', required: false, validation: null },
    { apiName: 'Rate_Plan_Description', displayName: 'Rate Plan Description', required: false, validation: null },
    { apiName: 'Phone_Model', displayName: 'Device Model', required: false, validation: null },
    { apiName: 'Brand', displayName: 'Current Provider', required: false, validation: null },
    { apiName: 'note', displayName: 'Note', required: false, validation: null }
  ]
};

// Hidden fields that are not displayed in field selection but are used internally
const HIDDEN_FIELDS = [
  { apiName: 'Datahub_Src', displayName: 'Data Source', required: true, validation: null },
  { apiName: 'custom_email_notify_list', displayName: 'Custom Email Notify List', required: false, validation: null },
  { apiName: 'ChannelOutletId_Updated', displayName: 'Channel Outlet ID', required: false, validation: null },
  { apiName: 'OutletId', displayName: 'Outlet ID', required: false, validation: null }
];

// Store assignment field (added when store assignment is selected)
const STORE_ASSIGNMENT_FIELD = {
  apiName: 'ChannelOutletId',
  displayName: 'Store Assignment',
  required: false,
  validation: null,
  note: '10-digit ChannelOutletID (store long-code)'
};

// System fields that are always included but not shown to user
// NOTE: Zoho_Record_URL and Time_Created_in_Zoho MUST be the last two columns
const SYSTEM_FIELDS = [
  { apiName: 'AssignmentValue', displayName: 'Assignment Value', required: false, validation: null },
  { apiName: 'Zoho_Record_URL', displayName: 'Zoho Record URL', required: false, validation: null },
  { apiName: 'Time_Created_in_Zoho', displayName: 'Time Created in Zoho', required: false, validation: null }
];


/**
 * Get dynamic column mapping based on selected fields
 * @returns {Object} Mapping of API names to column indices
 */
function getDynamicColumnMapping() {
  const properties = PropertiesService.getScriptProperties();
  const selectedFields = properties.getProperty('ZOHO_SELECTED_FIELDS');
  
  if (!selectedFields) {
    Logger.log('No selected fields found, using default fields for mapping');
    // Fallback to default fields if no fields selected
    const defaultFields = getDefaultFields();
    const mapping = {};
    defaultFields.forEach((field, index) => {
      mapping[field.apiName] = index;
    });
    return mapping;
  }
  
  try {
    const fields = JSON.parse(selectedFields);
    const mapping = {};
    
    // Create mapping from fields
    fields.forEach((field, index) => {
      mapping[field.apiName] = index;
    });
    
    // Ensure system fields are always present in mapping
    const systemFieldsPresent = SYSTEM_FIELDS.every(systemField => 
      mapping.hasOwnProperty(systemField.apiName)
    );
    
    if (!systemFieldsPresent) {
      Logger.log('Warning: System fields missing from mapping, attempting auto-repair');
      
      // Try to auto-repair by adding missing system fields
      const existingFieldsMap = new Map();
      fields.forEach(field => {
        existingFieldsMap.set(field.apiName, field);
      });
      
      let fieldsAdded = false;
      SYSTEM_FIELDS.forEach(systemField => {
        if (!existingFieldsMap.has(systemField.apiName)) {
          fields.push(systemField);
          fieldsAdded = true;
          Logger.log('Auto-added missing system field: ' + systemField.displayName);
        }
      });
      
      if (fieldsAdded) {
        // Save the repaired configuration
        properties.setProperty('ZOHO_SELECTED_FIELDS', JSON.stringify(fields));
        
        // Rebuild mapping with repaired fields
        const repairedMapping = {};
        fields.forEach((field, index) => {
          repairedMapping[field.apiName] = index;
        });
        
        Logger.log('Auto-repair completed, mapping updated');
        return repairedMapping;
      }
    }
    
    return mapping;
  } catch (error) {
    Logger.log('Error parsing selected fields: ' + error.toString());
    // Fallback to default fields on error
    const defaultFields = getDefaultFields();
    const mapping = {};
    defaultFields.forEach((field, index) => {
      mapping[field.apiName] = index;
    });
    Logger.log('Using default fields mapping due to parse error');
    return mapping;
  }
}

/**
 * Get column index by API name (dynamic version)
 * @param {string} apiName - The API field name
 * @returns {number} The 0-based column index
 */
function getColumnIndexByApiName(apiName) {
  const mapping = getDynamicColumnMapping();
  if (mapping.hasOwnProperty(apiName)) {
    return mapping[apiName];
  }
  
  // Enhanced error handling with auto-repair attempt
  Logger.log(`Column mapping failed for API field: ${apiName}`);
  Logger.log('Available fields in mapping: ' + Object.keys(mapping).join(', '));
  
  // Check if this is a system field that should be present
  const isSystemField = SYSTEM_FIELDS.some(field => field.apiName === apiName);
  const isHiddenField = HIDDEN_FIELDS.some(field => field.apiName === apiName);
  
  if (isSystemField || isHiddenField) {
    Logger.log(`Missing ${isSystemField ? 'system' : 'hidden'} field detected: ${apiName}`);
    Logger.log('Attempting auto-repair of field configuration...');
    
    try {
      // Try to fix the configuration
      const properties = PropertiesService.getScriptProperties();
      const currentFieldsJson = properties.getProperty('ZOHO_SELECTED_FIELDS');
      
      if (currentFieldsJson) {
        const currentFields = JSON.parse(currentFieldsJson);
        const existingFieldsMap = new Map();
        currentFields.forEach(field => {
          existingFieldsMap.set(field.apiName, field);
        });
        
        // Add missing system/hidden fields
        let fieldsAdded = false;
        
        if (isSystemField) {
          SYSTEM_FIELDS.forEach(systemField => {
            if (!existingFieldsMap.has(systemField.apiName)) {
              currentFields.push(systemField);
              fieldsAdded = true;
              Logger.log('Auto-added missing system field: ' + systemField.displayName);
            }
          });
        }
        
        if (isHiddenField) {
          HIDDEN_FIELDS.forEach(hiddenField => {
            if (!existingFieldsMap.has(hiddenField.apiName)) {
              currentFields.push(hiddenField);
              fieldsAdded = true;
              Logger.log('Auto-added missing hidden field: ' + hiddenField.displayName);
            }
          });
        }
        
        if (fieldsAdded) {
          // Save the repaired configuration
          properties.setProperty('ZOHO_SELECTED_FIELDS', JSON.stringify(currentFields));
          Logger.log('Field configuration auto-repaired and saved');
          
          // Try to get the mapping again
          const repairedMapping = getDynamicColumnMapping();
          if (repairedMapping.hasOwnProperty(apiName)) {
            Logger.log(`Auto-repair successful! Found ${apiName} at index ${repairedMapping[apiName]}`);
            return repairedMapping[apiName];
          }
        }
      }
    } catch (repairError) {
      Logger.log('Auto-repair failed: ' + repairError.toString());
    }
  }
  
  // If auto-repair failed or this isn't a system/hidden field, throw detailed error
  const errorMessage = `Unknown API field name: ${apiName}. Available fields: ${Object.keys(mapping).join(', ')}`;
  
  if (isSystemField || isHiddenField) {
    throw new Error(`${errorMessage}. This is a required ${isSystemField ? 'system' : 'hidden'} field. Please run fixSystemFields() to repair your configuration.`);
  } else {
    throw new Error(errorMessage);
  }
}


/**
 * Get selected fields from configuration with enforced column ordering
 * Ensures Zoho_Record_URL and Time_Created_in_Zoho are always the last two columns
 * @returns {Array} Array of selected field objects with proper ordering
 */
function getSelectedFields() {
  const properties = PropertiesService.getScriptProperties();
  const selectedFields = properties.getProperty('ZOHO_SELECTED_FIELDS');
  
  if (!selectedFields) {
    // Return default fields if none selected
    return getDefaultFields();
  }
  
  try {
    const fields = JSON.parse(selectedFields);
    return ensureSystemFieldsAreLast(fields);
  } catch (error) {
    Logger.log('Error parsing selected fields: ' + error.toString());
    return getDefaultFields();
  }
}

/**
 * Get only visible fields for spreadsheet headers (excludes hidden fields)
 * Ensures Zoho_Record_URL and Time_Created_in_Zoho are always the last two columns
 * @returns {Array} Array of visible field objects with proper ordering
 */
function getVisibleFields() {
  const allFields = getSelectedFields();
  
  // Filter out hidden fields that should not appear in spreadsheet headers
  const hiddenApiNames = HIDDEN_FIELDS.map(field => field.apiName);
  const visibleFields = allFields.filter(field => !hiddenApiNames.includes(field.apiName));
  
  // Ensure proper ordering is maintained
  return ensureSystemFieldsAreLast(visibleFields);
}

/**
 * Ensures that Zoho_Record_URL and Time_Created_in_Zoho are always the last two columns
 * @param {Array} fields - Array of field objects
 * @returns {Array} Array of field objects with proper ordering
 */
function ensureSystemFieldsAreLast(fields) {
  // Create a copy of the fields array to avoid modifying the original
  let orderedFields = [...fields];
  
  // Remove the two system fields if they exist anywhere in the array
  orderedFields = orderedFields.filter(field => 
    field.apiName !== 'Zoho_Record_URL' && 
    field.apiName !== 'Time_Created_in_Zoho'
  );
  
  // Always add the two system fields at the end in the correct order
  orderedFields.push({ apiName: 'Zoho_Record_URL', displayName: 'Zoho Record URL', required: false, validation: null });
  orderedFields.push({ apiName: 'Time_Created_in_Zoho', displayName: 'Time Created in Zoho', required: false, validation: null });
  
  return orderedFields;
}

/**
 * Get default fields for initial setup
 * @returns {Array} Array of default field objects with proper ordering
 */
function getDefaultFields() {
  const allFields = [...AVAILABLE_FIELDS.required, ...AVAILABLE_FIELDS.optional];
  const defaultSelection = [
    'First_Name', 'Last_Name', 'Phone', 'Email', 'Language_Preference',
    'Campaign_Name', 'Description', 'Street', 'City', 'State', 'Zip_Code'
  ];
  
  const defaultFields = [];
  defaultSelection.forEach(apiName => {
    const field = allFields.find(f => f.apiName === apiName);
    if (field) {
      defaultFields.push(field);
    }
  });
  
  // Always add hidden fields and system fields
  defaultFields.push(...HIDDEN_FIELDS);
  defaultFields.push(...SYSTEM_FIELDS);
  
  // Ensure proper ordering with system fields last
  return ensureSystemFieldsAreLast(defaultFields);
}

/**
 * ZohoConfig class for managing configuration
 */
class ZohoConfig {
  constructor() {
    this.properties = PropertiesService.getScriptProperties();
  }
  
  /**
   * Get current configuration
   * @returns {Object} Configuration object
   */
  getConfig() {
    return {
      processingMode: this.properties.getProperty('ZOHO_PROCESSING_MODE'),
      organizationType: this.properties.getProperty('ZOHO_ORGANIZATION_TYPE'),
      orgCode: this.properties.getProperty('ZOHO_ORG_CODE'),
      authTokenName: this.properties.getProperty('ZOHO_AUTH_TOKEN_NAME'),
      authTokenValue: this.properties.getProperty('ZOHO_AUTH_TOKEN_VALUE'),
      campaignStartDate: this.properties.getProperty('ZOHO_CAMPAIGN_START_DATE'),
      campaignEndDate: this.properties.getProperty('ZOHO_CAMPAIGN_END_DATE'),
      leadAssignment: this.properties.getProperty('ZOHO_LEAD_ASSIGNMENT')
    };
  }
  
  /**
   * Set configuration value
   * @param {string} key - Configuration key
   * @param {string} value - Configuration value
   */
  setConfig(key, value) {
    this.properties.setProperty(key, value);
  }
  
  /**
   * Get configuration value
   * @param {string} key - Configuration key
   * @returns {string} Configuration value
   */
  getConfigValue(key) {
    return this.properties.getProperty(key);
  }
}

/**
 * Build Zoho record URL from record ID
 * @param {string} recordId - The Zoho record ID
 * @returns {string} Complete URL to the record in Zoho CRM
 */
function buildZohoRecordUrl(recordId) {
  return `${ZOHO_CRM_BASE_URL}/${ZOHO_ORG_ID}/${ZOHO_LEADS_PATH}/${recordId}`;
}

/**
 * Error handler for Zoho integration
 * @param {string} errorCode - Error code from ZOHO_ERROR_CODES
 * @param {Error} error - The error object
 * @param {Object} context - Additional context information
 */
function ZohoErrorHandler_logError(errorCode, error, context = {}) {
  const timestamp = new Date().toISOString();
  const errorMessage = `[${timestamp}] ${errorCode}: ${error.message}`;
  
  Logger.log(errorMessage);
  
  if (context) {
    Logger.log('Error context: ' + JSON.stringify(context));
  }
  
  // Log stack trace if available
  if (error.stack) {
    Logger.log('Stack trace: ' + error.stack);
  }
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

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
 * @returns {Object} Validation result with isValid and error message
 */
function validatePhoneNumber(phone) {
  if (!phone || phone.toString().trim() === '') {
    return { isValid: false, error: 'Phone number is required' };
  }
  
  const normalized = normalizePhoneNumber(phone);
  
  if (normalized.length < 10) {
    return { isValid: false, error: 'Phone must contain at least 10 digits' };
  }
  
  return { isValid: true, normalized: normalized };
}

/**
 * Validate email format using regex
 * @param {string} email - The email address to validate
 * @returns {Object} Validation result with isValid and error message
 */
function validateEmailAddress(email) {
  if (!email || email.toString().trim() === '') {
    return { isValid: true }; // Email is optional in most cases
  }
  
  const emailStr = email.toString().trim();
  
  // RFC 5322 compliant email regex (simplified but robust)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(emailStr)) {
    return { isValid: false, error: 'Email format is invalid' };
  }
  
  // Additional checks
  if (emailStr.length > 254) {
    return { isValid: false, error: 'Email address is too long' };
  }
  
  const parts = emailStr.split('@');
  if (parts[0].length > 64) {
    return { isValid: false, error: 'Email local part is too long' };
  }
  
  return { isValid: true, normalized: emailStr.toLowerCase() };
}
