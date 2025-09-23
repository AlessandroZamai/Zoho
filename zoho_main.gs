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
 * Auto-detect organization type from auth token or domain
 */
ZohoConfig.prototype.autoDetectOrgType = function(authTokenName) {
  if (authTokenName) {
    if (authTokenName.includes('KI') || authTokenName.includes('corporate')) {
      return ORG_TYPES.CORPORATE;
    }
    if (authTokenName.includes('RT') || authTokenName.includes('klinik')) {
      return ORG_TYPES.MOBILE_KLINIK;
    }
  }
  
  // Default to dealer if can't detect
  return ORG_TYPES.DEALER;
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
 * Store recent error for debugging
 */
function ZohoErrorHandler_storeRecentError(errorInfo) {
  try {
    const properties = PropertiesService.getScriptProperties();
    const recentErrors = JSON.parse(properties.getProperty('RECENT_ERRORS') || '[]');
    
    // Keep only last 10 errors
    recentErrors.unshift(errorInfo);
    if (recentErrors.length > 10) {
      recentErrors.splice(10);
    }
    
    properties.setProperty('RECENT_ERRORS', JSON.stringify(recentErrors));
  } catch (e) {
    Logger.log('[ERROR] Failed to store recent error: ' + e.toString());
  }
}

/**
 * Get recent errors
 */
function ZohoErrorHandler_getRecentErrors() {
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
 * Reset all configuration (for troubleshooting)
 */
function resetConfiguration() {
  try {
    const properties = PropertiesService.getScriptProperties();
    
    // Remove all Zoho-related properties
    Object.values(CONFIG_KEYS).forEach(key => {
      properties.deleteProperty(key);
    });
    
    // Clear recent errors
    properties.deleteProperty('RECENT_ERRORS');
    
    SpreadsheetApp.getUi().alert(
      'Configuration Reset',
      'All configuration has been reset. Please run the setup wizard to reconfigure.',
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
