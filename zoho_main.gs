/**
 * Zoho Integration - Main Entry Point
 * Simplified architecture with unified coordination and error handling
 */

// ============================================================================
// SHARED CONSTANTS AND CONFIGURATION
// ============================================================================

const ZOHO_VERSION = 'v2.0.0';
const WEBHOOK_URL = 'https://sandbox.zohoapis.com/crm/v7/functions/telus_webhook_to_capture_lead/actions/execute?auth_type=apikey&zapikey=1003.26a3ebba6146ba321bb5690283cdf991.57db655a174cf1acff14b96739abfd3f';

// Configuration keys
const CONFIG_KEYS = {
  PROCESSING_MODE: 'ZOHO_PROCESSING_MODE',
  ORGANIZATION_TYPE: 'ZOHO_ORGANIZATION_TYPE',
  ORG_CODE: 'ZOHO_ORG_CODE',
  AUTH_TOKEN_NAME: 'ZOHO_AUTH_TOKEN_NAME',
  AUTH_TOKEN_VALUE: 'ZOHO_AUTH_TOKEN_VALUE',
  CAMPAIGN_START_DATE: 'ZOHO_CAMPAIGN_START_DATE',
  CAMPAIGN_END_DATE: 'ZOHO_CAMPAIGN_END_DATE',
  LEAD_ASSIGNMENT: 'ZOHO_LEAD_ASSIGNMENT',
  ENABLED_COLUMNS: 'ZOHO_ENABLED_COLUMNS'
};

// Processing modes
const PROCESSING_MODES = {
  AUTO: 'AUTO',
  MANUAL: 'MANUAL'
};

// Organization types
const ORG_TYPES = {
  CORPORATE: 'KI',
  DEALER: 'DL',
  MOBILE_KLINIK: 'RT'
};

// Lead assignment types
const ASSIGNMENT_TYPES = {
  EQUAL: 'EQUAL',
  MANUAL: 'MANUAL',
  ADMIN: 'ADMIN'
};

// ============================================================================
// COLUMN MAPPING CONSTANTS
// ============================================================================

/**
 * Column mapping for spreadsheet data
 * This centralizes all column indices to improve maintainability
 * If spreadsheet column order changes, only update these constants
 */
const COLUMN_MAP = {
  // Core contact information
  FIRST_NAME: 0,           // Column A - First Name
  LAST_NAME: 1,            // Column B - Last Name
  PHONE: 2,                // Column C - Phone
  EMAIL: 3,                // Column D - Email
  PREFERRED_LANGUAGE: 4,   // Column E - Preferred Language
  
  // Campaign and description
  CAMPAIGN_NAME: 5,        // Column F - Campaign Name
  DESCRIPTION: 6,          // Column G - Description
  
  // Address information
  STREET: 7,               // Column H - Street
  CITY: 8,                 // Column I - City
  PROVINCE: 9,             // Column J - Province
  POSTAL_CODE: 10,         // Column K - Postal Code
  COUNTRY: 11,             // Column L - Country
  
  // Product information
  RATE_PLAN: 12,           // Column M - Rate Plan
  DEVICE_MODEL: 13,        // Column N - Device Model
  CURRENT_PROVIDER: 14,    // Column O - Current Provider
  
  // Assignment (dynamic based on configuration)
  ASSIGNMENT_VALUE: 15,    // Column P - Assignment Value (Store ID, Sales Rep Email, or N/A for Admin)
  
  // System fields
  ZOHO_RECORD_URL: 16,     // Column Q - Zoho Record URL
  TIME_CREATED: 17         // Column R - Time Created in Zoho
};

/**
 * Get column index by name (with validation)
 * @param {string} columnName - The column name from COLUMN_MAP
 * @returns {number} The column index (0-based)
 */
function getColumnIndex(columnName) {
  if (COLUMN_MAP.hasOwnProperty(columnName)) {
    return COLUMN_MAP[columnName];
  }
  throw new Error(`Unknown column name: ${columnName}`);
}

/**
 * Get value from row data using column name
 * @param {Array} rowData - The row data array
 * @param {string} columnName - The column name from COLUMN_MAP
 * @returns {*} The cell value
 */
function getColumnValue(rowData, columnName) {
  const index = getColumnIndex(columnName);
  return rowData[index];
}

/**
 * Set value in row data using column name
 * @param {Array} rowData - The row data array
 * @param {string} columnName - The column name from COLUMN_MAP
 * @param {*} value - The value to set
 */
function setColumnValue(rowData, columnName, value) {
  const index = getColumnIndex(columnName);
  rowData[index] = value;
}

// ============================================================================
// UNIFIED CONFIGURATION MANAGER
// ============================================================================

/**
 * Unified Configuration Manager
 */
function ZohoConfig() {
  this.properties = PropertiesService.getScriptProperties();
}

/**
 * Get current configuration with smart defaults
 */
ZohoConfig.prototype.getConfig = function() {
  const organizationType = this.properties.getProperty(CONFIG_KEYS.ORGANIZATION_TYPE);
  
  if (organizationType) {
    // New configuration format
    return {
      version: ZOHO_VERSION,
      processingMode: this.properties.getProperty(CONFIG_KEYS.PROCESSING_MODE),
      organizationType: organizationType,
      authTokenName: this.properties.getProperty(CONFIG_KEYS.AUTH_TOKEN_NAME),
      authTokenValue: this.properties.getProperty(CONFIG_KEYS.AUTH_TOKEN_VALUE),
      orgCode: this.properties.getProperty(CONFIG_KEYS.ORG_CODE),
      orgTypeCode: this.getOrgTypeCode(organizationType),
      campaignStartDate: this.properties.getProperty(CONFIG_KEYS.CAMPAIGN_START_DATE),
      campaignEndDate: this.properties.getProperty(CONFIG_KEYS.CAMPAIGN_END_DATE),
      leadAssignment: this.properties.getProperty(CONFIG_KEYS.LEAD_ASSIGNMENT)
    };
  } else {
    // Legacy or empty configuration
    return this.getDefaultConfig();
  }
};

/**
 * Get organization type code
 */
ZohoConfig.prototype.getOrgTypeCode = function(organizationType) {
  const orgSettings = {};
  orgSettings[ORG_TYPES.CORPORATE] = 'KI';
  orgSettings[ORG_TYPES.MOBILE_KLINIK] = 'RT';
  orgSettings[ORG_TYPES.DEALER] = 'DL';
  return orgSettings[organizationType] || 'DL';
};

/**
 * Get default configuration
 */
ZohoConfig.prototype.getDefaultConfig = function() {
  return {
    version: ZOHO_VERSION,
    processingMode: null,
    organizationType: null,
    authTokenName: null,
    authTokenValue: null,
    orgCode: null,
    orgTypeCode: 'DL',
    campaignStartDate: null,
    campaignEndDate: null,
    leadAssignment: ASSIGNMENT_TYPES.MANUAL,
    // No longer using enabledColumns - single dynamic column approach
  };
};

/**
 * Save configuration with validation
 */
ZohoConfig.prototype.saveConfig = function(config) {
  try {
    // Validate required fields
    const validation = this.validateConfig(config);
    if (!validation.isValid) {
      throw new Error('Configuration validation failed: ' + validation.errors.join(', '));
    }
    
    // Save configuration
    const self = this;
    Object.keys(CONFIG_KEYS).forEach(function(key) {
      const configKey = key.toLowerCase().replace(/_([a-z])/g, function(g) { return g[1].toUpperCase(); });
      if (config[configKey] !== undefined) {
        self.properties.setProperty(CONFIG_KEYS[key], 
          typeof config[configKey] === 'object' ? JSON.stringify(config[configKey]) : config[configKey]);
      }
    });
    
    return { success: true, message: 'Configuration saved successfully' };
    
  } catch (error) {
    ZohoErrorHandler_logError('CONFIG_SAVE_ERROR', error, { config: config });
    return { success: false, message: error.toString() };
  }
};

/**
 * Validate configuration completeness
 */
ZohoConfig.prototype.validateConfig = function(config) {
  const errors = [];
  
  if (!config.authTokenName) errors.push('Auth token name is required');
  if (!config.authTokenValue) errors.push('Auth token value is required');
  if (!config.orgCode) errors.push('Organization code is required');
  if (!config.processingMode) errors.push('Processing mode is required');
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

/**
 * Check if configuration is complete
 */
ZohoConfig.prototype.isComplete = function() {
  const config = this.getConfig();
  const validation = this.validateConfig(config);
  return validation.isValid;
};

// ============================================================================
// UNIFIED ERROR HANDLER
// ============================================================================

// Error codes
const ZOHO_ERROR_CODES = {
  CONFIG_INCOMPLETE: 'CONFIG_INCOMPLETE',
  CONFIG_SAVE_ERROR: 'CONFIG_SAVE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  API_ERROR: 'API_ERROR',
  PROCESSING_ERROR: 'PROCESSING_ERROR',
  TRIGGER_ERROR: 'TRIGGER_ERROR'
};

// Error log constants
const ERROR_LOG_SHEET_NAME = 'errorLog';
const ERROR_LOG_MAX_ROWS = 100; // Keep last 100 errors
const ERROR_LOG_HEADERS = ['Timestamp', 'Error Code', 'Message', 'Stack Trace', 'Context', 'Session ID'];

/**
 * Get or create the error log sheet
 */
function ZohoErrorHandler_getOrCreateErrorLogSheet() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let errorSheet = spreadsheet.getSheetByName(ERROR_LOG_SHEET_NAME);
    
    if (!errorSheet) {
      // Create the error log sheet
      errorSheet = spreadsheet.insertSheet(ERROR_LOG_SHEET_NAME);
      ZohoErrorHandler_initializeErrorLogSheet(errorSheet);
    }
    
    return errorSheet;
  } catch (error) {
    Logger.log('[ERROR] Failed to get/create error log sheet: ' + error.toString());
    return null;
  }
}

/**
 * Initialize the error log sheet with headers and formatting
 */
function ZohoErrorHandler_initializeErrorLogSheet(sheet) {
  try {
    // Set headers
    sheet.getRange(1, 1, 1, ERROR_LOG_HEADERS.length).setValues([ERROR_LOG_HEADERS]);
    
    // Format headers
    const headerRange = sheet.getRange(1, 1, 1, ERROR_LOG_HEADERS.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#f0f0f0');
    
    // Set column widths
    sheet.setColumnWidth(1, 150); // Timestamp
    sheet.setColumnWidth(2, 120); // Error Code
    sheet.setColumnWidth(3, 300); // Message
    sheet.setColumnWidth(4, 400); // Stack Trace
    sheet.setColumnWidth(5, 300); // Context
    sheet.setColumnWidth(6, 100); // Session ID
    
    // Freeze header row
    sheet.setFrozenRows(1);
    
  } catch (error) {
    Logger.log('[ERROR] Failed to initialize error log sheet: ' + error.toString());
  }
}

/**
 * Generate a session ID for grouping related errors
 */
function ZohoErrorHandler_generateSessionId() {
  return 'S' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Clean up old error log entries to maintain performance
 */
function ZohoErrorHandler_cleanupErrorLog(sheet) {
  try {
    const lastRow = sheet.getLastRow();
    if (lastRow > ERROR_LOG_MAX_ROWS + 1) { // +1 for header row
      const rowsToDelete = lastRow - ERROR_LOG_MAX_ROWS;
      sheet.deleteRows(ERROR_LOG_MAX_ROWS + 2, rowsToDelete); // +2 to account for header and keep last 100
    }
  } catch (error) {
    Logger.log('[ERROR] Failed to cleanup error log: ' + error.toString());
  }
}

/**
 * Log error with context
 */
function ZohoErrorHandler_logError(errorCode, error, context) {
  context = context || {};
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp: timestamp,
    errorCode: errorCode,
    message: error.toString(),
    stack: error.stack || 'No stack trace available',
    context: context
  };
  
  Logger.log('[ERROR] ' + errorCode + ': ' + JSON.stringify(errorInfo));
  
  // Store recent errors for debugging
  ZohoErrorHandler_storeRecentError(errorInfo);
}

/**
 * Store recent error for debugging in error log sheet
 */
function ZohoErrorHandler_storeRecentError(errorInfo) {
  try {
    const errorSheet = ZohoErrorHandler_getOrCreateErrorLogSheet();
    if (!errorSheet) {
      // Fallback to PropertiesService if sheet access fails
      ZohoErrorHandler_storeRecentErrorFallback(errorInfo);
      return;
    }
    
    // Generate session ID if not present
    if (!errorInfo.sessionId) {
      errorInfo.sessionId = ZohoErrorHandler_generateSessionId();
    }
    
    // Truncate stack trace if too long to prevent cell size issues
    let stackTrace = errorInfo.stack || 'No stack trace available';
    if (stackTrace.length > 2000) {
      stackTrace = stackTrace.substring(0, 2000) + '... [truncated]';
    }
    
    // Prepare context as JSON string, truncate if too long
    let contextStr = '';
    try {
      contextStr = JSON.stringify(errorInfo.context || {});
      if (contextStr.length > 1000) {
        contextStr = contextStr.substring(0, 1000) + '... [truncated]';
      }
    } catch (e) {
      contextStr = 'Failed to serialize context';
    }
    
    // Format timestamp for better readability
    const timestamp = new Date(errorInfo.timestamp).toLocaleString();
    
    // Insert new error at row 2 (after header)
    errorSheet.insertRowAfter(1);
    const newRow = [
      timestamp,
      errorInfo.errorCode,
      errorInfo.message,
      stackTrace,
      contextStr,
      errorInfo.sessionId
    ];
    
    errorSheet.getRange(2, 1, 1, newRow.length).setValues([newRow]);
    
    // Clean up old entries periodically (every 10th error)
    if (Math.random() < 0.1) {
      ZohoErrorHandler_cleanupErrorLog(errorSheet);
    }
    
  } catch (e) {
    Logger.log('[ERROR] Failed to store error in sheet, using fallback: ' + e.toString());
    ZohoErrorHandler_storeRecentErrorFallback(errorInfo);
  }
}

/**
 * Fallback error storage using PropertiesService
 */
function ZohoErrorHandler_storeRecentErrorFallback(errorInfo) {
  try {
    const properties = PropertiesService.getScriptProperties();
    const recentErrors = JSON.parse(properties.getProperty('RECENT_ERRORS') || '[]');
    
    // Keep only last 5 errors for fallback (smaller limit due to size constraints)
    recentErrors.unshift(errorInfo);
    if (recentErrors.length > 5) {
      recentErrors.splice(5);
    }
    
    properties.setProperty('RECENT_ERRORS', JSON.stringify(recentErrors));
  } catch (e) {
    Logger.log('[ERROR] Failed to store recent error in fallback: ' + e.toString());
  }
}

/**
 * Get recent errors from error log sheet
 */
function ZohoErrorHandler_getRecentErrors() {
  try {
    const errorSheet = ZohoErrorHandler_getOrCreateErrorLogSheet();
    if (!errorSheet) {
      // Fallback to PropertiesService if sheet access fails
      return ZohoErrorHandler_getRecentErrorsFallback();
    }
    
    const lastRow = errorSheet.getLastRow();
    if (lastRow <= 1) {
      // No errors logged yet (only header row)
      return [];
    }
    
    // Get up to 10 most recent errors (rows 2-11)
    const maxRows = Math.min(10, lastRow - 1);
    const dataRange = errorSheet.getRange(2, 1, maxRows, ERROR_LOG_HEADERS.length);
    const values = dataRange.getValues();
    
    // Convert sheet data back to error objects
    const recentErrors = values.map(row => {
      let context = {};
      try {
        context = JSON.parse(row[4] || '{}');
      } catch (e) {
        context = { parseError: 'Failed to parse context' };
      }
      
      return {
        timestamp: row[0],
        errorCode: row[1],
        message: row[2],
        stack: row[3],
        context: context,
        sessionId: row[5]
      };
    });
    
    return recentErrors;
    
  } catch (e) {
    Logger.log('[ERROR] Failed to get recent errors from sheet, using fallback: ' + e.toString());
    return ZohoErrorHandler_getRecentErrorsFallback();
  }
}

/**
 * Fallback method to get recent errors from PropertiesService
 */
function ZohoErrorHandler_getRecentErrorsFallback() {
  try {
    const properties = PropertiesService.getScriptProperties();
    return JSON.parse(properties.getProperty('RECENT_ERRORS') || '[]');
  } catch (e) {
    return [];
  }
}

/**
 * Get user-friendly error message
 */
function ZohoErrorHandler_getUserFriendlyMessage(errorCode, error) {
  const messages = {};
  messages[ZOHO_ERROR_CODES.CONFIG_INCOMPLETE] = 'Please complete your configuration using the setup wizard.';
  messages[ZOHO_ERROR_CODES.VALIDATION_ERROR] = 'Data validation failed. Please check your input and try again.';
  messages[ZOHO_ERROR_CODES.API_ERROR] = 'Unable to connect to Zoho. Please check your internet connection and try again.';
  messages[ZOHO_ERROR_CODES.PROCESSING_ERROR] = 'An error occurred while processing your request. Please try again.';
  messages[ZOHO_ERROR_CODES.TRIGGER_ERROR] = 'Trigger configuration error. Please run the setup wizard.';
  
  return messages[errorCode] || 'An unexpected error occurred. Please contact support.';
}

/**
 * Show user-friendly error dialog
 */
function ZohoErrorHandler_showUserError(errorCode, error, context) {
  context = context || {};
  ZohoErrorHandler_logError(errorCode, error, context);
  const userMessage = ZohoErrorHandler_getUserFriendlyMessage(errorCode, error);
  
  SpreadsheetApp.getUi().alert(
    'Error',
    userMessage + '\n\nError details: ' + error.toString(),
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

// ============================================================================
// MAIN ENTRY POINTS
// ============================================================================


/**
 * Main setup wizard entry point
 */
function showSetupWizardMain() {
  try {
    // This will call the setup wizard from zoho_config.gs
    showSetupWizard();
  } catch (error) {
    ZohoErrorHandler_showUserError(ZOHO_ERROR_CODES.CONFIG_SAVE_ERROR, error);
  }
}

/**
 * Show system status and recent errors
 */
function showSystemStatus() {
  try {
    const config = new ZohoConfig();
    const currentConfig = config.getConfig();
    const recentErrors = ZohoErrorHandler_getRecentErrors();
    
    let statusMessage = `Zoho Integration Status\n\n`;
    statusMessage += `Version: ${currentConfig.version}\n`;
    statusMessage += `Processing Mode: ${currentConfig.processingMode || 'Not configured'}\n`;
    statusMessage += `Organization Type: ${currentConfig.organizationType || 'Not configured'}\n`;
    statusMessage += `Configuration Complete: ${config.isComplete() ? 'Yes' : 'No'}\n\n`;
    
    if (recentErrors.length > 0) {
      statusMessage += `Recent Errors (${recentErrors.length}):\n`;
      recentErrors.slice(0, 3).forEach((error, index) => {
        statusMessage += `${index + 1}. ${error.errorCode}: ${error.message.substring(0, 50)}...\n`;
      });
    } else {
      statusMessage += 'No recent errors';
    }
    
    SpreadsheetApp.getUi().alert('System Status', statusMessage, SpreadsheetApp.getUi().ButtonSet.OK);
    
  } catch (error) {
    ZohoErrorHandler_showUserError(ZOHO_ERROR_CODES.PROCESSING_ERROR, error);
  }
}

/**
 * Process unsubmitted rows (manual mode entry point)
 */
function processUnsubmittedRows() {
  try {
    // This will call the manual processing from zoho_integration_core.gs
    sendUnsubmittedRowsToZoho();
  } catch (error) {
    ZohoErrorHandler_showUserError(ZOHO_ERROR_CODES.PROCESSING_ERROR, error);
  }
}

/**
 * Automated processing entry point (onEdit trigger)
 */
function sendToWebhookMain(e) {
  try {
    // This will call the automated processing from zoho_integration_core.gs
    sendToWebhook(e);
  } catch (error) {
    ZohoErrorHandler_logError(ZOHO_ERROR_CODES.PROCESSING_ERROR, error, { event: e });
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get current Zoho integration version
 */
function getZohoVersion() {
  return ZOHO_VERSION;
}

/**
 * Clear the error log sheet
 */
function ZohoErrorHandler_clearErrorLogSheet() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const errorSheet = spreadsheet.getSheetByName(ERROR_LOG_SHEET_NAME);
    
    if (errorSheet) {
      // Clear all data except headers
      const lastRow = errorSheet.getLastRow();
      if (lastRow > 1) {
        errorSheet.deleteRows(2, lastRow - 1);
      }
      Logger.log('[INFO] Error log sheet cleared');
    }
  } catch (error) {
    Logger.log('[ERROR] Failed to clear error log sheet: ' + error.toString());
  }
}

/**
 * Reset all configuration (for troubleshooting)
 */
function resetConfiguration() {
  try {
    const properties = PropertiesService.getScriptProperties();
    
    // Remove all Zoho-related properties
    Object.values(CONFIG_KEYS).forEach(key => {
      properties.deleteProperty(key);
    });
    
    // Clear recent errors from PropertiesService
    properties.deleteProperty('RECENT_ERRORS');
    
    // Clear error log sheet
    ZohoErrorHandler_clearErrorLogSheet();
    
    SpreadsheetApp.getUi().alert(
      'Configuration Reset',
      'All configuration and error logs have been reset. Please run the setup wizard to reconfigure.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
  } catch (error) {
    ZohoErrorHandler_showUserError(ZOHO_ERROR_CODES.CONFIG_SAVE_ERROR, error);
  }
}

/**
 * Export configuration for backup
 */
function exportConfiguration() {
  try {
    const config = new ZohoConfig();
    const currentConfig = config.getConfig();
    
    // Remove sensitive information
    const exportConfig = { ...currentConfig };
    delete exportConfig.authTokenValue;
    
    Logger.log('Configuration Export: ' + JSON.stringify(exportConfig, null, 2));
    
    SpreadsheetApp.getUi().alert(
      'Configuration Exported',
      'Configuration has been exported to the Apps Script logs. Check View > Logs for details.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
  } catch (error) {
    ZohoErrorHandler_showUserError(ZOHO_ERROR_CODES.CONFIG_SAVE_ERROR, error);
  }
}

/**
 * Test function to verify error logging functionality
 * This function can be run manually to test the new sheet-based error logging
 */
function testErrorLogging() {
  try {
    // Test 1: Log a sample error
    ZohoErrorHandler_logError('TEST_ERROR', new Error('This is a test error'), {
      testData: 'Sample context data',
      timestamp: new Date().toISOString(),
      functionName: 'testErrorLogging'
    });
    
    // Test 2: Log another error with different context
    ZohoErrorHandler_logError('VALIDATION_ERROR', new Error('Test validation failed'), {
      field: 'testField',
      value: 'invalidValue',
      expectedFormat: 'email'
    });
    
    // Test 3: Retrieve recent errors
    const recentErrors = ZohoErrorHandler_getRecentErrors();
    
    let message = `Error Logging Test Complete!\n\n`;
    message += `Logged 2 test errors to the errorLog sheet.\n`;
    message += `Retrieved ${recentErrors.length} recent errors.\n\n`;
    
    if (recentErrors.length > 0) {
      message += `Most recent error:\n`;
      message += `- Code: ${recentErrors[0].errorCode}\n`;
      message += `- Message: ${recentErrors[0].message}\n`;
      message += `- Session ID: ${recentErrors[0].sessionId}\n\n`;
    }
    
    message += `Check the 'errorLog' sheet to see the logged errors.`;
    
    SpreadsheetApp.getUi().alert(
      'Error Logging Test Results',
      message,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
  } catch (error) {
    SpreadsheetApp.getUi().alert(
      'Test Failed',
      'Error logging test failed: ' + error.toString(),
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * Test function to verify column mapping functionality
 * This function can be run manually to test the new column mapping system
 */
function testColumnMapping() {
  try {
    let message = `Column Mapping Test Results:\n\n`;
    
    // Test 1: Verify all column constants are defined
    const columnNames = Object.keys(COLUMN_MAP);
    message += `Found ${columnNames.length} column constants:\n`;
    
    columnNames.forEach(name => {
      const index = COLUMN_MAP[name];
      message += `- ${name}: Column ${String.fromCharCode(65 + index)} (index ${index})\n`;
    });
    
    message += `\n`;
    
    // Test 2: Test helper functions
    try {
      const firstNameIndex = getColumnIndex('FIRST_NAME');
      const emailIndex = getColumnIndex('EMAIL');
      const assignmentIndex = getColumnIndex('ASSIGNMENT_VALUE');
      
      message += `Helper function tests:\n`;
      message += `- getColumnIndex('FIRST_NAME'): ${firstNameIndex}\n`;
      message += `- getColumnIndex('EMAIL'): ${emailIndex}\n`;
      message += `- getColumnIndex('ASSIGNMENT_VALUE'): ${assignmentIndex}\n\n`;
      
      // Test 3: Test with sample row data
      const sampleRowData = new Array(18).fill(''); // Create array with 18 elements
      sampleRowData[COLUMN_MAP.FIRST_NAME] = 'John';
      sampleRowData[COLUMN_MAP.LAST_NAME] = 'Doe';
      sampleRowData[COLUMN_MAP.EMAIL] = 'john.doe@example.com';
      sampleRowData[COLUMN_MAP.PHONE] = '555-1234';
      
      const firstName = getColumnValue(sampleRowData, 'FIRST_NAME');
      const lastName = getColumnValue(sampleRowData, 'LAST_NAME');
      const email = getColumnValue(sampleRowData, 'EMAIL');
      
      message += `Sample data test:\n`;
      message += `- First Name: ${firstName}\n`;
      message += `- Last Name: ${lastName}\n`;
      message += `- Email: ${email}\n\n`;
      
      message += `✅ All column mapping tests passed successfully!`;
      
    } catch (testError) {
      message += `❌ Helper function test failed: ${testError.toString()}`;
    }
    
    SpreadsheetApp.getUi().alert(
      'Column Mapping Test Results',
      message,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
  } catch (error) {
    SpreadsheetApp.getUi().alert(
      'Test Failed',
      'Column mapping test failed: ' + error.toString(),
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}
