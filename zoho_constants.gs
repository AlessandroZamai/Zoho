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
  note: '11-digit ChannelOutletID (store long-code)'
};

// System fields that are always included but not shown to user
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
    
    fields.forEach((field, index) => {
      mapping[field.apiName] = index;
    });
    
    return mapping;
  } catch (error) {
    Logger.log('Error parsing selected fields: ' + error.toString());
    // Fallback to default fields on error
    const defaultFields = getDefaultFields();
    const mapping = {};
    defaultFields.forEach((field, index) => {
      mapping[field.apiName] = index;
    });
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
