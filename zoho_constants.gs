/**
 * Zoho Integration Constants and Utilities
 * Essential constants and utility functions used throughout the integration
 */

// Webhook URL for Zoho API
const WEBHOOK_URL = 'https://sandbox.zohoapis.com/crm/v7/functions/telus_webhook_to_capture_lead/actions/execute?auth_type=apikey&zapikey=1003.26a3ebba6146ba321bb5690283cdf991.57db655a174cf1acff14b96739abfd3f';

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
  note: '11-digit ChannelOutletID (store long-code)'
};

// System fields that are always included but not shown to user
const SYSTEM_FIELDS = [
  { apiName: 'AssignmentValue', displayName: 'Assignment Value', required: false, validation: null },
  { apiName: 'Zoho_Record_URL', displayName: 'Zoho Record URL', required: false, validation: null },
  { apiName: 'Time_Created_in_Zoho', displayName: 'Time Created in Zoho', required: false, validation: null }
];

// Legacy column mapping constants (will be replaced by dynamic mapping)
const COLUMN_INDICES = {
  FIRST_NAME: 0,
  LAST_NAME: 1,
  PHONE: 2,
  EMAIL: 3,
  PREFERRED_LANGUAGE: 4,
  CAMPAIGN_NAME: 5,
  DESCRIPTION: 6,
  STREET: 7,
  CITY: 8,
  PROVINCE: 9,
  POSTAL_CODE: 10,
  COUNTRY: 11,
  RATE_PLAN: 12,
  DEVICE_MODEL: 13,
  CURRENT_PROVIDER: 14,
  ASSIGNMENT_VALUE: 15,
  ZOHO_RECORD_URL: 16,
  TIME_CREATED: 17
};

/**
 * Get dynamic column mapping based on selected fields
 * @returns {Object} Mapping of API names to column indices
 */
function getDynamicColumnMapping() {
  const properties = PropertiesService.getScriptProperties();
  const selectedFields = properties.getProperty('ZOHO_SELECTED_FIELDS');
  
  if (!selectedFields) {
    // Fallback to legacy mapping if no fields selected
    return getLegacyColumnMapping();
  }
  
  try {
    const fields = JSON.parse(selectedFields);
    const mapping = {};
    
    fields.forEach((field, index) => {
      mapping[field.apiName] = index;
    });
    
    return mapping;
  } catch (error) {
    Logger.log('Error parsing selected fields: ' + error.toString());
    return getLegacyColumnMapping();
  }
}

/**
 * Get legacy column mapping for backward compatibility
 * @returns {Object} Legacy mapping
 */
function getLegacyColumnMapping() {
  return {
    'First_Name': 0,
    'Last_Name': 1,
    'Phone': 2,
    'Email': 3,
    'Language_Preference': 4,
    'Campaign_Name': 5,
    'Description': 6,
    'Street': 7,
    'City': 8,
    'State': 9,
    'Zip_Code': 10,
    'Country': 11,
    'Rate_Plan_Description': 12,
    'Phone_Model': 13,
    'Brand': 14,
    'AssignmentValue': 15,
    'Zoho_Record_URL': 16,
    'Time_Created_in_Zoho': 17
  };
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
  throw new Error('Unknown API field name: ' + apiName);
}

/**
 * Get column value from row data by API name (dynamic version)
 * @param {Array} rowData - The row data array
 * @param {string} apiName - The API field name
 * @returns {*} The column value
 */
function getColumnValueByApiName(rowData, apiName) {
  const index = getColumnIndexByApiName(apiName);
  return rowData[index];
}

/**
 * Get column index by name (legacy version for backward compatibility)
 * @param {string} columnName - The column name constant
 * @returns {number} The 0-based column index
 */
function getColumnIndex(columnName) {
  if (COLUMN_INDICES.hasOwnProperty(columnName)) {
    return COLUMN_INDICES[columnName];
  }
  throw new Error('Unknown column name: ' + columnName);
}

/**
 * Get column value from row data by column name (legacy version)
 * @param {Array} rowData - The row data array
 * @param {string} columnName - The column name constant
 * @returns {*} The column value
 */
function getColumnValue(rowData, columnName) {
  const index = getColumnIndex(columnName);
  return rowData[index];
}

/**
 * Get selected fields from configuration
 * @returns {Array} Array of selected field objects
 */
function getSelectedFields() {
  const properties = PropertiesService.getScriptProperties();
  const selectedFields = properties.getProperty('ZOHO_SELECTED_FIELDS');
  
  if (!selectedFields) {
    // Return default fields if none selected
    return getDefaultFields();
  }
  
  try {
    return JSON.parse(selectedFields);
  } catch (error) {
    Logger.log('Error parsing selected fields: ' + error.toString());
    return getDefaultFields();
  }
}

/**
 * Get default fields for initial setup
 * @returns {Array} Array of default field objects
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
  
  return defaultFields;
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

/**
 * Utility function to safely get property values
 * @param {string} key - Property key
 * @param {string} defaultValue - Default value if property doesn't exist
 * @returns {string} Property value or default
 */
function getPropertySafe(key, defaultValue = null) {
  try {
    const properties = PropertiesService.getScriptProperties();
    return properties.getProperty(key) || defaultValue;
  } catch (error) {
    Logger.log('Error getting property ' + key + ': ' + error.toString());
    return defaultValue;
  }
}

/**
 * Utility function to safely set property values
 * @param {string} key - Property key
 * @param {string} value - Property value
 * @returns {boolean} Success status
 */
function setPropertySafe(key, value) {
  try {
    const properties = PropertiesService.getScriptProperties();
    properties.setProperty(key, value);
    return true;
  } catch (error) {
    Logger.log('Error setting property ' + key + ': ' + error.toString());
    return false;
  }
}

/**
 * Check if the integration is properly initialized
 * @returns {boolean} True if initialized, false otherwise
 */
function isIntegrationInitialized() {
  try {
    const config = new ZohoConfig();
    const currentConfig = config.getConfig();
    
    return !!(currentConfig.processingMode && 
              currentConfig.authTokenName && 
              currentConfig.authTokenValue && 
              currentConfig.orgCode);
  } catch (error) {
    Logger.log('Error checking initialization: ' + error.toString());
    return false;
  }
}

/**
 * Get current timestamp in a standardized format
 * @returns {string} Formatted timestamp
 */
function getCurrentTimestamp() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Clean and validate phone number
 * @param {string} phone - Phone number to clean
 * @returns {Object} Object with cleaned phone and validation status
 */
function cleanAndValidatePhone(phone) {
  if (!phone) {
    return { cleaned: '', isValid: false, error: 'Phone number is required' };
  }
  
  const cleaned = String(phone).replace(/[^0-9+]/g, '');
  
  if (cleaned.length < 10) {
    return { cleaned: cleaned, isValid: false, error: 'Phone must contain at least 10 digits' };
  }
  
  return { cleaned: cleaned, isValid: true, error: null };
}
