/**
 * Setup Wizard for Zoho Webhook Integration
 * Allows users to choose between automated and manual trigger modes
 */

// Configuration keys for PropertiesService
const CONFIG_PROCESSING_MODE = 'ZOHO_PROCESSING_MODE';
const CONFIG_ORGANIZATION_TYPE = 'ZOHO_ORGANIZATION_TYPE';
const CONFIG_ORG_CODE = 'ZOHO_ORG_CODE';
const CONFIG_AUTH_TOKEN_NAME = 'ZOHO_AUTH_TOKEN_NAME';
const CONFIG_AUTH_TOKEN_VALUE = 'ZOHO_AUTH_TOKEN_VALUE';
const CONFIG_CAMPAIGN_START_DATE = 'ZOHO_CAMPAIGN_START_DATE';
const CONFIG_CAMPAIGN_END_DATE = 'ZOHO_CAMPAIGN_END_DATE';
const CONFIG_LEAD_ASSIGNMENT = 'ZOHO_LEAD_ASSIGNMENT';
const CONFIG_SELECTED_FIELDS = 'ZOHO_SELECTED_FIELDS';
const CONFIG_SETUP_COMPLETION_DATE = 'ZOHO_SETUP_COMPLETION_DATE';

// Predefined organization settings
const ORG_SETTINGS = {
  'KI': {
    orgCode: '50080',
    orgTypeCode: 'KI',
    authTokenNameKey: 'AUTH_TOKEN_NAME_KI',
    authTokenValueKey: 'AUTH_TOKEN_VALUE_KI'
  },
  'RT': {
    orgCode: '6675',
    orgTypeCode: 'RT',
    authTokenNameKey: 'AUTH_TOKEN_NAME_RT',
    authTokenValueKey: 'AUTH_TOKEN_VALUE_RT'
  },
  'DL': {
    orgTypeCode: 'DL'
    // orgCode, authTokenName, authTokenValue are user-provided
  }
};


/**
 * Main setup function - displays the setup wizard
 */
function showSetupWizard() {
  try {
    // Check if we're in a spreadsheet context
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    if (!spreadsheet) {
      throw new Error('No active spreadsheet found');
    }
    
    // Check if this is a first-time setup
    const properties = PropertiesService.getScriptProperties();
    const isFirstTimeSetup = properties.getProperty('ZOHO_FIRST_TIME_SETUP_NEEDED');
    const showSettingsPrompt = properties.getProperty('ZOHO_SHOW_SETTINGS_PROMPT');
    
    if (isFirstTimeSetup === 'true' || showSettingsPrompt === 'true') {
      // Show welcome message for first-time users
      const ui = SpreadsheetApp.getUi();
      const response = ui.alert(
        'Welcome to Zoho Integration!',
        'This appears to be your first time using the Zoho Integration.\n\n' +
        'The Settings will help you configure:\n' +
        '• Organization type (Corporate Store, Mobile Klinik, or Dealership)\n' +
        '• Processing mode (Automated or Manual)\n' +
        '• Campaign settings and lead assignment\n\n' +
        'Would you like to continue with the setup?',
        ui.ButtonSet.YES_NO
      );
      
      if (response !== ui.Button.YES) {
        return { success: false, message: 'Setup cancelled by user' };
      }
      
      // Clear the first-time setup flags
      properties.deleteProperty('ZOHO_FIRST_TIME_SETUP_NEEDED');
      properties.deleteProperty('ZOHO_SHOW_SETTINGS_PROMPT');
    }
    
    const html = HtmlService.createHtmlOutputFromFile('zoho_unified_ui')
      .setWidth(650)
      .setHeight(700)
      .setTitle('Zoho Integration Setup');
    
    SpreadsheetApp.getUi().showModalDialog(html, 'Setup Zoho Integration');
    
  } catch (error) {
    // If we can't access the UI (e.g., running from Apps Script editor), provide alternative
    if (error.message.includes('Cannot call SpreadsheetApp.getUi()') || 
        error.message.includes('No active spreadsheet found')) {
      
      Logger.log('Setup wizard cannot be displayed from this context. Please run from a spreadsheet.');
      
      // Try to show a simple alert if possible, otherwise just log
      try {
        Browser.msgBox(
          'Setup Wizard Error',
          'The setup wizard must be run from within a Google Spreadsheet context.\n\n' +
          'Please:\n' +
          '1. Open your Google Spreadsheet\n' +
          '2. Go to Extensions > Apps Script\n' +
          '3. Run showSetupWizard() from there\n\n' +
          'Or use the add-on interface to configure settings.',
          Browser.Buttons.OK
        );
      } catch (browserError) {
        // If Browser.msgBox also fails, just log the instructions
        Logger.log('SETUP INSTRUCTIONS: The setup wizard must be run from within a Google Spreadsheet context. Please open your spreadsheet and run the function from there.');
      }
      
      return {
        success: false,
        message: 'Setup wizard must be run from spreadsheet context. Please open your spreadsheet and try again.'
      };
    } else {
      // Re-throw other errors
      throw error;
    }
  }
}


/**
 * Initialize missing script properties with blank values
 */
function initializeMissingProperties() {
  try {
    const properties = PropertiesService.getScriptProperties();
    const requiredProperties = [
      'AUTH_TOKEN_NAME_KI',
      'AUTH_TOKEN_VALUE_KI', 
      'AUTH_TOKEN_NAME_RT',
      'AUTH_TOKEN_VALUE_RT'
    ];
    
    const missingProperties = [];
    
    // Check which properties are missing
    requiredProperties.forEach(prop => {
      if (!properties.getProperty(prop)) {
        missingProperties.push(prop);
      }
    });
    
    if (missingProperties.length > 0) {
      // Set missing properties to blank values
      const propsToSet = {};
      missingProperties.forEach(prop => {
        propsToSet[prop] = '';
      });
      properties.setProperties(propsToSet);
      
      const ui = SpreadsheetApp.getUi();
      ui.alert(
        'Missing Properties Initialized',
        `The following script properties were missing and have been initialized with blank values:\n\n${missingProperties.join('\n')}\n\nPlease go to Extensions > Apps Script > Project Settings > Script Properties and enter the correct values for these properties.`,
        ui.ButtonSet.OK
      );
      
      Logger.log('Initialized missing properties: ' + missingProperties.join(', '));
      return { success: true, message: 'Missing properties initialized', missingProperties: missingProperties };
    } else {
      Logger.log('All required properties are present');
      return { success: true, message: 'All required properties are present', missingProperties: [] };
    }
    
  } catch (error) {
    Logger.log('Error initializing missing properties: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}

/**
 * Check and report status of required script properties
 */
function checkRequiredProperties() {
  try {
    const properties = PropertiesService.getScriptProperties();
    
    const kiTokenName = properties.getProperty('AUTH_TOKEN_NAME_KI');
    const kiTokenValue = properties.getProperty('AUTH_TOKEN_VALUE_KI');
    const rtTokenName = properties.getProperty('AUTH_TOKEN_NAME_RT');
    const rtTokenValue = properties.getProperty('AUTH_TOKEN_VALUE_RT');
    
    let message = 'Required Script Properties Status:\n\n';
    
    message += 'Corporate Store (KI):\n';
    message += `- AUTH_TOKEN_NAME_KI: ${kiTokenName ? '✅ Set' : '❌ Missing/Empty'}\n`;
    message += `- AUTH_TOKEN_VALUE_KI: ${kiTokenValue ? '✅ Set' : '❌ Missing/Empty'}\n\n`;
    
    message += 'Mobile Klinik (RT):\n';
    message += `- AUTH_TOKEN_NAME_RT: ${rtTokenName ? '✅ Set' : '❌ Missing/Empty'}\n`;
    message += `- AUTH_TOKEN_VALUE_RT: ${rtTokenValue ? '✅ Set' : '❌ Missing/Empty'}\n\n`;
    
    const allSet = kiTokenName && kiTokenValue && rtTokenName && rtTokenValue;
    
    if (allSet) {
      message += '✅ All required properties are configured\n\n';
      message += 'Users can now configure KI and RT integrations using the setup wizard.';
    } else {
      message += '❌ Some required properties are missing or empty\n\n';
      message += 'To fix this:\n';
      message += '1. Run initializeMissingProperties() to create missing properties\n';
      message += '2. Go to Extensions > Apps Script > Project Settings > Script Properties\n';
      message += '3. Enter the correct values for the missing/empty properties';
    }
    
    SpreadsheetApp.getUi().alert(
      'Required Properties Check',
      message,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
    Logger.log('Required properties check: ' + message);
    
    return {
      success: true,
      allSet: allSet,
      details: {
        ki: { tokenName: !!kiTokenName, tokenValue: !!kiTokenValue },
        rt: { tokenName: !!rtTokenName, tokenValue: !!rtTokenValue }
      }
    };
    
  } catch (error) {
    Logger.log('Error checking required properties: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}

/**
 * Get current processing mode configuration
 */
function getCurrentProcessingMode() {
  const config = new ZohoConfig();
  const currentConfig = config.getConfig();
  return currentConfig.processingMode;
}

/**
 * Save complete configuration from the enhanced setup wizard
 * REFACTORED VERSION - Uses modular architecture with rollback support
 */
function saveCompleteConfiguration(config) {
  Logger.log('Starting configuration save process (refactored version)');
  Logger.log('Configuration: ' + JSON.stringify(config));
  
  let backup = null;
  
  try {
    // Step 1: Validate configuration
    Logger.log('Step 1: Validating configuration...');
    const validation = validateCompleteConfiguration(config);
    
    if (!validation.isValid) {
      Logger.log('Validation failed: ' + validation.errors.join(', '));
      return {
        success: false,
        message: 'Configuration validation failed:\n' + validation.errors.join('\n')
      };
    }
    
    if (validation.warnings.length > 0) {
      Logger.log('Validation warnings: ' + validation.warnings.join(', '));
    }
    
    // Step 2: Create backup before making changes
    Logger.log('Step 2: Creating configuration backup...');
    const backupResult = createConfigurationBackup();
    if (backupResult.success) {
      backup = backupResult.backup;
    } else {
      Logger.log('Warning: Could not create backup - proceeding without rollback capability');
    }
    
    // Step 3: Get properties service instance
    const properties = PropertiesService.getScriptProperties();
    
    // Step 4: Save processing mode (always MANUAL)
    Logger.log('Step 3: Saving processing mode...');
    const modeResult = saveProcessingModeConfig(properties);
    if (!modeResult.success) {
      throw new Error(modeResult.error);
    }
    
    // Step 5: Save organization configuration
    Logger.log('Step 4: Saving organization configuration...');
    const orgResult = saveOrganizationConfig(config, properties);
    if (!orgResult.success) {
      throw new Error(orgResult.error);
    }
    
    // Step 6: Save campaign configuration
    Logger.log('Step 5: Saving campaign configuration...');
    const campaignResult = saveCampaignConfig(config, properties);
    if (!campaignResult.success) {
      throw new Error(campaignResult.error);
    }
    
    // Step 7: Save lead assignment configuration
    Logger.log('Step 6: Saving lead assignment configuration...');
    const assignmentResult = saveLeadAssignmentConfig(config, properties);
    if (!assignmentResult.success) {
      throw new Error(assignmentResult.error);
    }
    
    // Step 8: Prepare and save field selection
    Logger.log('Step 7: Preparing field selection...');
    const completeFieldList = prepareCompleteFieldList(
      config.selectedFields,
      config.leadAssignment
    );
    
    Logger.log('Step 8: Saving field selection...');
    const fieldsResult = saveFieldSelectionConfig(completeFieldList, properties);
    if (!fieldsResult.success) {
      throw new Error(fieldsResult.error);
    }
    
    // Step 9: Save setup completion date
    Logger.log('Step 9: Saving setup completion date...');
    const completionResult = saveSetupCompletionDate(properties);
    if (!completionResult.success) {
      throw new Error(completionResult.error);
    }
    
    // Step 10: Configure triggers
    Logger.log('Step 10: Configuring triggers...');
    const triggerResult = configureTriggersForMode();
    if (!triggerResult.success) {
      throw new Error(triggerResult.error);
    }
    
    // Step 11: Ensure system fields are present
    Logger.log('Step 11: Ensuring system fields are present...');
    const systemFieldsResult = ensureSystemFieldsPresent();
    if (!systemFieldsResult.success) {
      Logger.log('Warning: ' + systemFieldsResult.error);
      // Don't fail the entire process for this
    }
    
    // Step 12: Update spreadsheet
    Logger.log('Step 12: Updating spreadsheet...');
    const spreadsheetResult = updateSpreadsheetWithFields(
      systemFieldsResult.spreadsheetUpdated || false
    );
    if (!spreadsheetResult.success) {
      Logger.log('Warning: ' + spreadsheetResult.error);
      // Don't fail the entire process for this
    }
    
    // Success!
    Logger.log('Configuration saved successfully');
    
    const orgTypeName = config.organizationType === 'DL' 
      ? 'dealership' 
      : (config.organizationType === 'KI' ? 'corporate store' : 'Mobile Klinik');
    
    return {
      success: true,
      message: `Configuration saved successfully! Your ${orgTypeName} integration is now configured for manual processing.`
    };
    
  } catch (error) {
    Logger.log('Error during configuration save: ' + error.toString());
    
    // Attempt rollback if we have a backup
    if (backup) {
      Logger.log('Attempting to rollback configuration...');
      const rollbackResult = restoreConfigurationBackup(backup);
      
      if (rollbackResult.success) {
        Logger.log('Configuration successfully rolled back');
        return {
          success: false,
          message: `Error saving configuration: ${error.message}\n\nConfiguration has been rolled back to previous state.`
        };
      } else {
        Logger.log('Rollback failed: ' + rollbackResult.error);
        return {
          success: false,
          message: `Error saving configuration: ${error.message}\n\nWARNING: Rollback failed. Configuration may be in an inconsistent state. Please run setup again.`
        };
      }
    }
    
    return {
      success: false,
      message: `Error saving configuration: ${error.message}`
    };
  }
}

// ============================================================================
// REFACTORED HELPER FUNCTIONS
// ============================================================================

/**
 * Validates the complete configuration object before saving
 */
function validateCompleteConfiguration(config) {
  const errors = [];
  const warnings = [];
  
  // Validate organization type
  if (!config.organizationType) {
    errors.push('Organization type is required');
  } else if (!['KI', 'RT', 'DL'].includes(config.organizationType)) {
    errors.push(`Invalid organization type: ${config.organizationType}`);
  }
  
  // Validate organization-specific settings
  if (config.organizationType === 'DL') {
    if (!config.orgCode || config.orgCode.trim() === '') {
      errors.push('Organization code is required for Dealerships');
    }
    if (!config.authTokenName || config.authTokenName.trim() === '') {
      errors.push('Auth token name is required for Dealerships');
    }
    if (!config.authTokenValue || config.authTokenValue.trim() === '') {
      errors.push('Auth token value is required for Dealerships');
    }
  } else {
    const orgSettings = ORG_SETTINGS[config.organizationType];
    if (!orgSettings) {
      errors.push(`Organization settings not found for ${config.organizationType}`);
    } else if (!orgSettings.orgCode) {
      errors.push(`Organization code not configured for ${config.organizationType}`);
    }
  }
  
  // Validate campaign dates
  if (!config.campaignStartDate) {
    errors.push('Campaign start date is required');
  } else {
    const startDate = new Date(config.campaignStartDate);
    if (isNaN(startDate.getTime())) {
      errors.push('Invalid campaign start date format');
    }
  }
  
  if (!config.campaignEndDate) {
    errors.push('Campaign end date is required');
  } else {
    const endDate = new Date(config.campaignEndDate);
    if (isNaN(endDate.getTime())) {
      errors.push('Invalid campaign end date format');
    }
    
    if (config.campaignStartDate) {
      const startDate = new Date(config.campaignStartDate);
      if (!isNaN(startDate.getTime()) && endDate <= startDate) {
        errors.push('Campaign end date must be after start date');
      }
    }
  }
  
  // Validate lead assignment
  if (!config.leadAssignment) {
    errors.push('Lead assignment strategy is required');
  } else if (!['Store', 'Sales_Rep', 'ADMIN'].includes(config.leadAssignment)) {
    errors.push(`Invalid lead assignment strategy: ${config.leadAssignment}`);
  }
  
  // Validate selected fields if provided
  if (config.selectedFields) {
    if (!Array.isArray(config.selectedFields)) {
      errors.push('Selected fields must be an array');
    } else if (config.selectedFields.length === 0) {
      warnings.push('No fields selected - default fields will be used');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors,
    warnings: warnings
  };
}

/**
 * Validates that required script properties exist for KI/RT organizations
 */
function validatePredefinedCredentials(organizationType) {
  const properties = PropertiesService.getScriptProperties();
  const orgSettings = ORG_SETTINGS[organizationType];
  
  if (!orgSettings) {
    return {
      isValid: false,
      error: `Organization settings not found for ${organizationType}`
    };
  }
  
  const authTokenName = properties.getProperty(orgSettings.authTokenNameKey);
  const authTokenValue = properties.getProperty(orgSettings.authTokenValueKey);
  
  const missingTokens = [];
  if (!authTokenName) missingTokens.push(orgSettings.authTokenNameKey);
  if (!authTokenValue) missingTokens.push(orgSettings.authTokenValueKey);
  
  if (missingTokens.length > 0) {
    const orgTypeName = organizationType === 'KI' ? 'Corporate Store' : 'Mobile Klinik';
    const errorMessage = `${orgTypeName} credentials not configured.\n\n` +
      `Missing properties: ${missingTokens.join(', ')}\n\n` +
      `To fix this:\n` +
      `1. Go to Extensions > Apps Script\n` +
      `2. Click Project Settings (gear icon)\n` +
      `3. Scroll to Script Properties\n` +
      `4. Add the missing properties with their values\n` +
      `5. Save and try setup again\n\n` +
      `If you don't have these credentials, contact your TELUS administrator.`;
    
    return {
      isValid: false,
      error: errorMessage
    };
  }
  
  return {
    isValid: true,
    authTokenName: authTokenName,
    authTokenValue: authTokenValue,
    orgCode: orgSettings.orgCode
  };
}

/**
 * Prepares the complete field list including user-selected, hidden, and system fields
 */
function prepareCompleteFieldList(userSelectedFields, leadAssignment) {
  const fieldMap = new Map();
  
  if (userSelectedFields && Array.isArray(userSelectedFields)) {
    userSelectedFields.forEach(field => {
      fieldMap.set(field.apiName, field);
    });
  }
  
  HIDDEN_FIELDS.forEach(field => {
    fieldMap.set(field.apiName, field);
  });
  
  SYSTEM_FIELDS.forEach(field => {
    fieldMap.set(field.apiName, field);
  });
  
  let allFields = Array.from(fieldMap.values());
  allFields = updateAssignmentField(allFields, leadAssignment);
  
  return ensureSystemFieldsAreLast(allFields);
}

/**
 * Updates the AssignmentValue field based on lead assignment strategy
 */
function updateAssignmentField(fields, leadAssignment) {
  let updatedFields = fields.filter(field => field.apiName !== 'ChannelOutletId');
  
  const assignmentFieldIndex = updatedFields.findIndex(field => field.apiName === 'AssignmentValue');
  const assignmentDisplayName = getAssignmentColumnTitle(leadAssignment);
  
  const assignmentField = {
    apiName: 'AssignmentValue',
    displayName: assignmentDisplayName,
    required: leadAssignment !== 'ADMIN',
    validation: null
  };
  
  if (assignmentFieldIndex >= 0) {
    updatedFields[assignmentFieldIndex] = assignmentField;
  } else {
    updatedFields.push(assignmentField);
  }
  
  return updatedFields;
}

/**
 * Saves organization-specific configuration
 */
function saveOrganizationConfig(config, properties) {
  try {
    properties.setProperty(CONFIG_ORGANIZATION_TYPE, config.organizationType);
    
    let authTokenName, authTokenValue, orgCode;
    
    if (config.organizationType === 'DL') {
      authTokenName = config.authTokenName;
      authTokenValue = config.authTokenValue;
      orgCode = config.orgCode;
    } else {
      const credentialsValidation = validatePredefinedCredentials(config.organizationType);
      if (!credentialsValidation.isValid) {
        return {
          success: false,
          error: credentialsValidation.error
        };
      }
      
      authTokenName = credentialsValidation.authTokenName;
      authTokenValue = credentialsValidation.authTokenValue;
      orgCode = credentialsValidation.orgCode;
    }
    
    properties.setProperty(CONFIG_ORG_CODE, orgCode);
    properties.setProperty(CONFIG_AUTH_TOKEN_NAME, authTokenName);
    properties.setProperty(CONFIG_AUTH_TOKEN_VALUE, authTokenValue);
    
    return {
      success: true,
      credentials: {
        authTokenName: authTokenName,
        authTokenValue: authTokenValue,
        orgCode: orgCode
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: `Failed to save organization config: ${error.message}`
    };
  }
}

/**
 * Saves campaign configuration
 */
function saveCampaignConfig(config, properties) {
  try {
    properties.setProperty(CONFIG_CAMPAIGN_START_DATE, config.campaignStartDate);
    properties.setProperty(CONFIG_CAMPAIGN_END_DATE, config.campaignEndDate);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Failed to save campaign config: ${error.message}`
    };
  }
}

/**
 * Saves lead assignment configuration
 */
function saveLeadAssignmentConfig(config, properties) {
  try {
    properties.setProperty(CONFIG_LEAD_ASSIGNMENT, config.leadAssignment);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Failed to save lead assignment config: ${error.message}`
    };
  }
}

/**
 * Saves field selection configuration
 */
function saveFieldSelectionConfig(completeFieldList, properties) {
  try {
    properties.setProperty(CONFIG_SELECTED_FIELDS, JSON.stringify(completeFieldList));
    properties.deleteProperty('ZOHO_ENABLED_COLUMNS');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Failed to save field selection: ${error.message}`
    };
  }
}

/**
 * Saves processing mode configuration (always MANUAL for now)
 */
function saveProcessingModeConfig(properties) {
  try {
    properties.setProperty(CONFIG_PROCESSING_MODE, 'MANUAL');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Failed to save processing mode: ${error.message}`
    };
  }
}

/**
 * Saves setup completion timestamp
 */
function saveSetupCompletionDate(properties) {
  try {
    const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    properties.setProperty(CONFIG_SETUP_COMPLETION_DATE, today);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Failed to save completion date: ${error.message}`
    };
  }
}

/**
 * Configures triggers based on processing mode
 */
function configureTriggersForMode() {
  try {
    const triggerResult = configureTriggers('MANUAL');
    if (!triggerResult.success) {
      return {
        success: false,
        error: triggerResult.message
      };
    }
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Failed to configure triggers: ${error.message}`
    };
  }
}

/**
 * Ensures system fields are present and fixes if needed
 */
function ensureSystemFieldsPresent() {
  try {
    const systemFieldsCheck = checkSystemFields();
    
    if (systemFieldsCheck.missing) {
      Logger.log('System fields missing during setup completion, auto-fixing...');
      const fixResult = fixSystemFields();
      
      if (!fixResult.success) {
        Logger.log('Warning: Could not auto-fix system fields: ' + fixResult.message);
        return {
          success: false,
          error: fixResult.message,
          spreadsheetUpdated: false
        };
      }
      
      Logger.log('System fields auto-fixed during setup completion');
      return {
        success: true,
        spreadsheetUpdated: fixResult.spreadsheetUpdated
      };
    }
    
    return {
      success: true,
      spreadsheetUpdated: false
    };
    
  } catch (error) {
    return {
      success: false,
      error: `Failed to ensure system fields: ${error.message}`,
      spreadsheetUpdated: false
    };
  }
}

/**
 * Updates the spreadsheet with selected fields
 */
function updateSpreadsheetWithFields(spreadsheetAlreadyUpdated) {
  try {
    if (!spreadsheetAlreadyUpdated) {
      updateSpreadsheetWithSelectedFields();
      Logger.log('Spreadsheet updated with selected fields during setup completion');
      return { success: true };
    } else {
      Logger.log('Spreadsheet update skipped - already updated by fixSystemFields');
      return { success: true, skipped: true };
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to update spreadsheet: ${error.message}`
    };
  }
}

/**
 * Creates a backup of current configuration before making changes
 */
function createConfigurationBackup() {
  try {
    const properties = PropertiesService.getScriptProperties();
    
    const backup = {
      processingMode: properties.getProperty(CONFIG_PROCESSING_MODE),
      organizationType: properties.getProperty(CONFIG_ORGANIZATION_TYPE),
      orgCode: properties.getProperty(CONFIG_ORG_CODE),
      authTokenName: properties.getProperty(CONFIG_AUTH_TOKEN_NAME),
      authTokenValue: properties.getProperty(CONFIG_AUTH_TOKEN_VALUE),
      campaignStartDate: properties.getProperty(CONFIG_CAMPAIGN_START_DATE),
      campaignEndDate: properties.getProperty(CONFIG_CAMPAIGN_END_DATE),
      leadAssignment: properties.getProperty(CONFIG_LEAD_ASSIGNMENT),
      selectedFields: properties.getProperty(CONFIG_SELECTED_FIELDS),
      setupCompletionDate: properties.getProperty(CONFIG_SETUP_COMPLETION_DATE),
      timestamp: new Date().toISOString()
    };
    
    Logger.log('Configuration backup created at ' + backup.timestamp);
    return { success: true, backup: backup };
    
  } catch (error) {
    Logger.log('Failed to create configuration backup: ' + error.message);
    return {
      success: false,
      error: `Failed to create backup: ${error.message}`
    };
  }
}

/**
 * Restores configuration from a backup
 */
function restoreConfigurationBackup(backup) {
  try {
    const properties = PropertiesService.getScriptProperties();
    
    if (backup.processingMode) properties.setProperty(CONFIG_PROCESSING_MODE, backup.processingMode);
    if (backup.organizationType) properties.setProperty(CONFIG_ORGANIZATION_TYPE, backup.organizationType);
    if (backup.orgCode) properties.setProperty(CONFIG_ORG_CODE, backup.orgCode);
    if (backup.authTokenName) properties.setProperty(CONFIG_AUTH_TOKEN_NAME, backup.authTokenName);
    if (backup.authTokenValue) properties.setProperty(CONFIG_AUTH_TOKEN_VALUE, backup.authTokenValue);
    if (backup.campaignStartDate) properties.setProperty(CONFIG_CAMPAIGN_START_DATE, backup.campaignStartDate);
    if (backup.campaignEndDate) properties.setProperty(CONFIG_CAMPAIGN_END_DATE, backup.campaignEndDate);
    if (backup.leadAssignment) properties.setProperty(CONFIG_LEAD_ASSIGNMENT, backup.leadAssignment);
    if (backup.selectedFields) properties.setProperty(CONFIG_SELECTED_FIELDS, backup.selectedFields);
    if (backup.setupCompletionDate) properties.setProperty(CONFIG_SETUP_COMPLETION_DATE, backup.setupCompletionDate);
    
    Logger.log('Configuration restored from backup created at ' + backup.timestamp);
    return { success: true };
    
  } catch (error) {
    Logger.log('Failed to restore configuration backup: ' + error.message);
    return {
      success: false,
      error: `Failed to restore backup: ${error.message}`
    };
  }
}


/**
 * Check if required configuration is complete
 */
function isConfigurationComplete() {
  const properties = PropertiesService.getScriptProperties();
  
  // Check if we have the new configuration format
  const organizationType = properties.getProperty(CONFIG_ORGANIZATION_TYPE);
  if (organizationType) {
    // New configuration format
    const authTokenName = properties.getProperty(CONFIG_AUTH_TOKEN_NAME);
    const authTokenValue = properties.getProperty(CONFIG_AUTH_TOKEN_VALUE);
    const orgCode = properties.getProperty(CONFIG_ORG_CODE);
    
    if (!authTokenName) {
      return { complete: false, message: 'AUTH_TOKEN_NAME is not configured' };
    }
    if (!authTokenValue) {
      return { complete: false, message: 'AUTH_TOKEN_VALUE is not configured' };
    }
    if (!orgCode) {
      return { complete: false, message: 'ORG_CODE is not configured' };
    }
    
    return { complete: true, message: 'Configuration is complete' };
  } else {
    // Legacy configuration format - check global variables
    if (typeof AUTH_TOKEN_NAME === 'undefined' || AUTH_TOKEN_NAME === 'EnterAuthTokenName') {
      return { complete: false, message: 'AUTH_TOKEN_NAME is not configured' };
    }
    if (typeof AUTH_TOKEN_VALUE === 'undefined' || AUTH_TOKEN_VALUE === 'EnterAuthTokenValue') {
      return { complete: false, message: 'AUTH_TOKEN_VALUE is not configured' };
    }
    if (typeof ORG__CODE === 'undefined' || ORG__CODE === 'EnterOrganizationCode') {
      return { complete: false, message: 'ORG__CODE is not configured' };
    }
    
    return { complete: true, message: 'Configuration is complete' };
  }
}

/**
 * Get existing configuration for the setup wizard
 */
function getExistingConfiguration() {
  const properties = PropertiesService.getScriptProperties();
  
  return {
    organizationType: properties.getProperty(CONFIG_ORGANIZATION_TYPE),
    processingMode: properties.getProperty(CONFIG_PROCESSING_MODE),
    orgCode: properties.getProperty(CONFIG_ORG_CODE),
    authTokenName: properties.getProperty(CONFIG_AUTH_TOKEN_NAME),
    authTokenValue: properties.getProperty(CONFIG_AUTH_TOKEN_VALUE),
    campaignStartDate: properties.getProperty(CONFIG_CAMPAIGN_START_DATE),
    campaignEndDate: properties.getProperty(CONFIG_CAMPAIGN_END_DATE),
    leadAssignment: properties.getProperty(CONFIG_LEAD_ASSIGNMENT),
    setupCompletionDate: properties.getProperty(CONFIG_SETUP_COMPLETION_DATE)
  };
}

/**
 * Get configuration values for use in webhook functions
 */
function getConfigurationValues() {
  const properties = PropertiesService.getScriptProperties();
  
  // Check if we have new configuration format
  const organizationType = properties.getProperty(CONFIG_ORGANIZATION_TYPE);
  if (organizationType) {
    // New configuration format
    return {
      organizationType: organizationType,
      processingMode: properties.getProperty(CONFIG_PROCESSING_MODE),
      authTokenName: properties.getProperty(CONFIG_AUTH_TOKEN_NAME),
      authTokenValue: properties.getProperty(CONFIG_AUTH_TOKEN_VALUE),
      orgCode: properties.getProperty(CONFIG_ORG_CODE),
      orgTypeCode: ORG_SETTINGS[organizationType].orgTypeCode,
      campaignStartDate: properties.getProperty(CONFIG_CAMPAIGN_START_DATE),
      campaignEndDate: properties.getProperty(CONFIG_CAMPAIGN_END_DATE),
      leadAssignment: properties.getProperty(CONFIG_LEAD_ASSIGNMENT) || 'Sales_Rep'
    };
  } else {
    // No configuration exists - return empty configuration
    return {
      organizationType: null,
      processingMode: null,
      authTokenName: null,
      authTokenValue: null,
      orgCode: null,
      orgTypeCode: null,
      campaignStartDate: null,
      campaignEndDate: null,
      leadAssignment: 'Sales_Rep'
    };
  }
}

/**
 * Get assignment column title based on lead assignment strategy
 */
function getAssignmentColumnTitle(leadAssignment) {
  switch (leadAssignment) {
    case 'Store': return 'Store Assignment';
    case 'Sales_Rep': return 'Sales Rep Email';
    case 'ADMIN': return 'Admin Assignment (N/A)';
    default: return 'Assignment Value';
  }
}

/**
 * Update spreadsheet with user-selected fields
 */
function updateSpreadsheetWithSelectedFields() {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const visibleFields = getVisibleFields(); // Use visible fields for spreadsheet headers
    const newHeaders = visibleFields.map(field => field.displayName);
    
    // Get current headers to compare
    const currentLastColumn = sheet.getLastColumn();
    let currentHeaders = [];
    if (currentLastColumn > 0) {
      currentHeaders = sheet.getRange(1, 1, 1, currentLastColumn).getValues()[0];
    }
    
    // Check if headers have changed
    const headersChanged = !arraysEqual(currentHeaders, newHeaders);
    
    if (headersChanged) {
      // Check if there's existing data and warn user
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        const ui = SpreadsheetApp.getUi();
        const response = ui.alert(
          'Field Configuration Changed',
          'Your field selection has changed, which will require restructuring the spreadsheet.\n\n' +
          'This will:\n' +
          '• Remove old columns that are no longer selected\n' +
          '• Add new columns for newly selected fields\n' +
          '• Clear all existing data to prevent misalignment\n\n' +
          'Do you want to continue?',
          ui.ButtonSet.YES_NO
        );
        
        if (response !== ui.Button.YES) {
          throw new Error('Field update cancelled by user');
        }
      }
      
      // Perform complete sheet restructuring
      restructureSpreadsheet(visibleFields, newHeaders);
    } else {
      // Headers haven't changed, just refresh formatting and validation
      refreshSpreadsheetFormatting(visibleFields);
    }
    
    Logger.log('Spreadsheet updated with selected fields: ' + newHeaders.join(', '));
    
  } catch (error) {
    Logger.log('Error updating spreadsheet with selected fields: ' + error.toString());
    throw error;
  }
}

/**
 * Completely restructure the spreadsheet with new field configuration
 */
function restructureSpreadsheet(selectedFields, newHeaders) {
  const sheet = SpreadsheetApp.getActiveSheet();
  
  // Clear everything - complete reset
  sheet.clear();
  
  // Clear data validation from the entire sheet
  const maxRows = sheet.getMaxRows();
  const maxCols = sheet.getMaxColumns();
  if (maxRows > 0 && maxCols > 0) {
    const entireSheet = sheet.getRange(1, 1, maxRows, maxCols);
    entireSheet.clearDataValidations();
    entireSheet.clearNote();
  }
  
  // Clear conditional formatting
  sheet.clearConditionalFormatRules();
  
  // Remove extra columns if the new field count is less than current columns
  const currentColumnCount = sheet.getMaxColumns();
  const newColumnCount = newHeaders.length;
  
  if (currentColumnCount > newColumnCount) {
    // Delete extra columns
    const columnsToDelete = currentColumnCount - newColumnCount;
    for (let i = 0; i < columnsToDelete; i++) {
      sheet.deleteColumn(newColumnCount + 1); // Always delete the column after our new range
    }
  }
  
  // Set new headers
  const headerRange = sheet.getRange(1, 1, 1, newHeaders.length);
  headerRange.setValues([newHeaders]);
  
  // Format header row
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#e8f0fe');
  headerRange.setBorder(true, true, true, true, true, true);
  
  // Apply field-specific formatting
  applyFieldFormatting(selectedFields);
  
  Logger.log('Spreadsheet completely restructured with ' + newHeaders.length + ' columns');
}

/**
 * Refresh spreadsheet formatting without restructuring
 */
function refreshSpreadsheetFormatting(selectedFields) {
  const sheet = SpreadsheetApp.getActiveSheet();
  
  // Clear existing conditional formatting and data validation
  sheet.clearConditionalFormatRules();
  
  const maxRows = sheet.getMaxRows();
  const maxCols = sheet.getMaxColumns();
  if (maxRows > 0 && maxCols > 0) {
    const entireSheet = sheet.getRange(1, 1, maxRows, maxCols);
    entireSheet.clearDataValidations();
    entireSheet.clearNote();
  }
  
  // Reapply field-specific formatting
  applyFieldFormatting(selectedFields);
  
  Logger.log('Spreadsheet formatting refreshed');
}

/**
 * Apply field-specific formatting including highlighting, validation, and notes
 */
function applyFieldFormatting(selectedFields) {
  // Highlight required columns and apply special formatting
  highlightRequiredColumns(selectedFields);
  
  // Apply data validation to fields that need it
  applyDataValidationToSheet();
  
  Logger.log('Field-specific formatting applied');
}

/**
 * Check if two arrays are equal
 */
function arraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) {
    return false;
  }
  
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Highlight required columns and add notes to the spreadsheet
 */
function highlightRequiredColumns(selectedFields) {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const lastRow = Math.max(sheet.getLastRow(), 1000); // Apply to at least 1000 rows
    const properties = PropertiesService.getScriptProperties();
    const leadAssignment = properties.getProperty(CONFIG_LEAD_ASSIGNMENT) || 'Sales_Rep';
    
    selectedFields.forEach((field, index) => {
      if (field.required) {
        const columnIndex = index + 1; // Convert to 1-based index
        
        // Highlight header cell for required fields
        const headerCell = sheet.getRange(1, columnIndex);
        headerCell.setBackground('#fff3e0'); // Light orange background
        headerCell.setFontColor('#e65100'); // Dark orange text
        headerCell.setFontWeight('bold');
        
        // Add a note to indicate it's required
        headerCell.setNote('⚠️ REQUIRED FIELD - This field must be filled for each row');
        
        // Apply conditional formatting to data cells to highlight empty required fields
        if (lastRow > 1) {
          const dataRange = sheet.getRange(2, columnIndex, lastRow - 1, 1);
          
          // Create conditional formatting rule for empty cells in required columns
          const rule = SpreadsheetApp.newConditionalFormatRule()
            .whenCellEmpty()
            .setBackground('#ffebee') // Light red background for empty required cells
            .setRanges([dataRange])
            .build();
          
          const rules = sheet.getConditionalFormatRules();
          rules.push(rule);
          sheet.setConditionalFormatRules(rules);
        }
        
        Logger.log(`Highlighted required column: ${field.displayName} (column ${columnIndex})`);
      } else if (field.apiName === 'AssignmentValue') {
        // Special handling for assignment column based on lead assignment strategy
        const columnIndex = index + 1; // Convert to 1-based index
        const headerCell = sheet.getRange(1, columnIndex);
        
        if (leadAssignment === 'ADMIN') {
          // Admin assignment - black background, white text, disabled input
          headerCell.setBackground('#000000'); // Black background
          headerCell.setFontColor('#ffffff'); // White text
          headerCell.setFontWeight('bold');
          headerCell.setNote('🚫 ADMIN ASSIGNMENT - No input required, leads automatically assigned to admin');
          
          if (lastRow > 1) {
            const dataRange = sheet.getRange(2, columnIndex, lastRow - 1, 1);
            dataRange.setBackground('#000000'); // Black background for data cells
            dataRange.setFontColor('#ffffff'); // White text for data cells
            
            // Add data validation to reject any input
            const rejectRule = SpreadsheetApp.newDataValidation()
              .requireTextContains('=NOT(ISBLANK(A1))') // Only allow empty values
              .setAllowInvalid(false)
              .setHelpText('No input required. Record will automatically be assigned to your Zoho Dealer Admin.')
              .build();
            
            dataRange.setDataValidation(rejectRule);
            
            // Set default value to indicate admin assignment
            const adminValues = Array(lastRow - 1).fill(['ADMIN']);
            dataRange.setValues(adminValues);
          }
          
          Logger.log(`Applied Admin assignment formatting to column: ${field.displayName} (column ${columnIndex})`);
        } else {
          // Store or Sales Rep assignment - normal formatting
          if (leadAssignment === 'Store') {
            headerCell.setNote('📍 STORE ASSIGNMENT - Enter the 10-digit ChannelOutletID (store long-code)');
          } else {
            headerCell.setNote('👤 SALES REP ASSIGNMENT - Enter the sales rep email address');
          }
          
          Logger.log(`Applied ${leadAssignment} assignment formatting to column: ${field.displayName} (column ${columnIndex})`);
        }
      } else if (field.apiName === 'ChannelOutletId') {
        // Special handling for store assignment field
        const columnIndex = index + 1; // Convert to 1-based index
        const headerCell = sheet.getRange(1, columnIndex);
        
        // Add clarifying note for store field
        headerCell.setNote('📍 STORE ASSIGNMENT - Enter the 10-digit ChannelOutletID (store long-code)');
        
        Logger.log(`Added note to store assignment column: ${field.displayName} (column ${columnIndex})`);
      }
    });
    
  } catch (error) {
    Logger.log('Error highlighting required columns: ' + error.toString());
  }
}

/**
 * Apply data validation dropdowns to appropriate fields
 */
function applyDataValidationToSheet() {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const selectedFields = getSelectedFields();
    
    selectedFields.forEach((field, index) => {
      if (field.validation && field.validation.length > 0) {
        const columnIndex = index + 1; // Convert to 1-based index
        const lastRow = Math.max(sheet.getLastRow(), 1000); // Apply to at least 1000 rows
        
        if (lastRow > 1) {
          const range = sheet.getRange(2, columnIndex, lastRow - 1, 1);
          const rule = SpreadsheetApp.newDataValidation()
            .requireValueInList(field.validation)
            .setAllowInvalid(false)
            .setHelpText(`Please select one of: ${field.validation.join(', ')}`)
            .build();
          
          range.setDataValidation(rule);
          Logger.log(`Applied data validation to ${field.displayName}: ${field.validation.join(', ')}`);
        }
      }
    });
    
  } catch (error) {
    Logger.log('Error applying data validation: ' + error.toString());
  }
}

/**
 * Check if setup completion date differs from today (for manual processing date tracking)
 */
function checkSetupDateForManualProcessing() {
  const properties = PropertiesService.getScriptProperties();
  const setupDate = properties.getProperty(CONFIG_SETUP_COMPLETION_DATE);
  const today = new Date().toISOString().split('T')[0];
  
  if (!setupDate) {
    // No setup date recorded, assume first time
    return { needsConfirmation: true, setupDate: null, today: today };
  }
  
  if (setupDate !== today) {
    // Different day, needs confirmation
    return { needsConfirmation: true, setupDate: setupDate, today: today };
  }
  
  // Same day, no confirmation needed
  return { needsConfirmation: false, setupDate: setupDate, today: today };
}

/**
 * Reset sheet data (clear all rows except header)
 */
function resetSheetData() {
  try {
    const ui = SpreadsheetApp.getUi();
    const response = ui.alert(
      'Reset Sheet Data',
      'This will clear all data rows while preserving the header row and your configuration.\n\nAre you sure you want to continue?',
      ui.ButtonSet.YES_NO
    );
    
    if (response !== ui.Button.YES) {
      return { success: false, message: 'Reset cancelled by user' };
    }
    
    const sheet = SpreadsheetApp.getActiveSheet();
    const lastRow = sheet.getLastRow();
    
    if (lastRow > 1) {
      // Get the data range (excluding header row)
      const dataRange = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn());
      
      // Store background colors before clearing
      const backgroundColors = dataRange.getBackgrounds();
      
      // Clear only the content, not formatting
      dataRange.clearContent();
      
      // Restore background colors
      dataRange.setBackgrounds(backgroundColors);
      
      // Reapply data validation to cleared cells
      applyDataValidationToSheet();
      
      Logger.log('Sheet data reset successfully - cleared ' + (lastRow - 1) + ' data rows while preserving background colors');
      
      ui.alert(
        'Reset Complete',
        `Successfully cleared ${lastRow - 1} data rows. Header row, background colors, and configuration preserved.`,
        ui.ButtonSet.OK
      );
      
      return { success: true, message: `Cleared ${lastRow - 1} data rows while preserving formatting` };
    } else {
      ui.alert(
        'No Data to Clear',
        'The sheet only contains the header row. No data to clear.',
        ui.ButtonSet.OK
      );
      
      return { success: true, message: 'No data rows to clear' };
    }
    
  } catch (error) {
    Logger.log('Error resetting sheet data: ' + error.toString());
    
    SpreadsheetApp.getUi().alert(
      'Reset Error',
      'Failed to reset sheet data: ' + error.toString(),
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
    return { success: false, message: error.toString() };
  }
}

/**
 * Get available fields for field selection UI
 */
function getAvailableFieldsForSelection() {
  return {
    required: AVAILABLE_FIELDS.required,
    optional: AVAILABLE_FIELDS.optional
  };
}

/**
 * Save selected fields from the setup wizard
 */
function saveSelectedFields(selectedFields) {
  try {
    const properties = PropertiesService.getScriptProperties();
    
    // Ensure we have the required imports
    if (typeof HIDDEN_FIELDS === 'undefined' || typeof SYSTEM_FIELDS === 'undefined') {
      throw new Error('Required field constants not available');
    }
    
    // Create a map of existing fields to avoid duplicates
    const fieldMap = new Map();
    
    // Add user-selected fields first
    selectedFields.forEach(field => {
      fieldMap.set(field.apiName, field);
    });
    
    // Add hidden fields (overwrite if duplicate)
    HIDDEN_FIELDS.forEach(field => {
      fieldMap.set(field.apiName, field);
    });
    
    // Add system fields (overwrite if duplicate)
    SYSTEM_FIELDS.forEach(field => {
      fieldMap.set(field.apiName, field);
    });
    
    // Convert back to array
    const allSelectedFields = Array.from(fieldMap.values());
    
    // Ensure proper ordering with Zoho_Record_URL and Time_Created_in_Zoho as last two columns
    const orderedFields = ensureSystemFieldsAreLast(allSelectedFields);
    
    properties.setProperty(CONFIG_SELECTED_FIELDS, JSON.stringify(orderedFields));
    
    Logger.log('Selected fields saved with proper ordering: ' + orderedFields.map(f => f.displayName).join(', '));
    Logger.log('System fields positioned as last two columns: Zoho_Record_URL, Time_Created_in_Zoho');
    
    return { success: true, message: 'Selected fields saved successfully with proper column ordering' };
    
  } catch (error) {
    Logger.log('Error saving selected fields: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}

/**
 * Fix missing system fields in the current configuration
 * This function ensures Zoho_Record_URL and Time_Created_in_Zoho are always present
 */
function fixSystemFields() {
  try {
    const properties = PropertiesService.getScriptProperties();
    const currentFieldsJson = properties.getProperty('ZOHO_SELECTED_FIELDS');
    
    let currentFields = [];
    if (currentFieldsJson) {
      try {
        currentFields = JSON.parse(currentFieldsJson);
      } catch (error) {
        Logger.log('Error parsing current fields, using default fields: ' + error.toString());
        currentFields = getDefaultFields();
      }
    } else {
      Logger.log('No field configuration found, using default fields');
      currentFields = getDefaultFields();
    }
    
    Logger.log('Current fields before fix: ' + currentFields.map(f => f.displayName).join(', '));
    
    // Create a map of existing fields by API name for easy lookup
    const existingFieldsMap = new Map();
    currentFields.forEach(field => {
      existingFieldsMap.set(field.apiName, field);
    });
    
    // Ensure all system fields are present
    let fieldsAdded = false;
    SYSTEM_FIELDS.forEach(systemField => {
      if (!existingFieldsMap.has(systemField.apiName)) {
        Logger.log('Adding missing system field: ' + systemField.displayName);
        currentFields.push(systemField);
        existingFieldsMap.set(systemField.apiName, systemField);
        fieldsAdded = true;
      }
    });
    
    // Ensure all hidden fields are present
    HIDDEN_FIELDS.forEach(hiddenField => {
      if (!existingFieldsMap.has(hiddenField.apiName)) {
        Logger.log('Adding missing hidden field: ' + hiddenField.displayName);
        currentFields.push(hiddenField);
        existingFieldsMap.set(hiddenField.apiName, hiddenField);
        fieldsAdded = true;
      }
    });
    
    let spreadsheetUpdated = false;
    
    if (fieldsAdded) {
      // Ensure proper ordering with system fields last before saving
      const orderedFields = ensureSystemFieldsAreLast(currentFields);
      
      // Save the updated field configuration with proper ordering
      properties.setProperty('ZOHO_SELECTED_FIELDS', JSON.stringify(orderedFields));
      
      Logger.log('Fixed fields: ' + currentFields.map(f => f.displayName).join(', '));
      
      // Update the spreadsheet with the new field configuration
      try {
        updateSpreadsheetWithSelectedFields();
        spreadsheetUpdated = true;
        Logger.log('Spreadsheet updated with fixed field configuration');
      } catch (updateError) {
        Logger.log('Warning: Could not update spreadsheet: ' + updateError.toString());
      }
      
      return { 
        success: true, 
        message: 'System fields have been added to your configuration. The spreadsheet has been updated with the missing columns.',
        fieldsAdded: true,
        spreadsheetUpdated: spreadsheetUpdated
      };
    } else {
      Logger.log('All system fields are already present');
      return { 
        success: true, 
        message: 'All system fields are already present in the configuration.',
        fieldsAdded: false,
        spreadsheetUpdated: false
      };
    }
    
  } catch (error) {
    Logger.log('Error fixing system fields: ' + error.toString());
    return { 
      success: false, 
      message: 'Error fixing system fields: ' + error.toString(),
      fieldsAdded: false,
      spreadsheetUpdated: false
    };
  }
}

/**
 * Check if system fields are missing from the current configuration
 */
function checkSystemFields() {
  try {
    const properties = PropertiesService.getScriptProperties();
    const currentFieldsJson = properties.getProperty('ZOHO_SELECTED_FIELDS');
    
    if (!currentFieldsJson) {
      return { 
        missing: true, 
        message: 'No field configuration found',
        missingFields: SYSTEM_FIELDS.map(f => f.displayName)
      };
    }
    
    const currentFields = JSON.parse(currentFieldsJson);
    const existingFieldsMap = new Map();
    currentFields.forEach(field => {
      existingFieldsMap.set(field.apiName, field);
    });
    
    const missingSystemFields = [];
    SYSTEM_FIELDS.forEach(systemField => {
      if (!existingFieldsMap.has(systemField.apiName)) {
        missingSystemFields.push(systemField.displayName);
      }
    });
    
    const missingHiddenFields = [];
    HIDDEN_FIELDS.forEach(hiddenField => {
      if (!existingFieldsMap.has(hiddenField.apiName)) {
        missingHiddenFields.push(hiddenField.displayName);
      }
    });
    
    const allMissingFields = [...missingSystemFields, ...missingHiddenFields];
    
    if (allMissingFields.length > 0) {
      return { 
        missing: true, 
        message: `Missing ${allMissingFields.length} system/hidden fields`,
        missingFields: allMissingFields
      };
    } else {
      return { 
        missing: false, 
        message: 'All system fields are present',
        missingFields: []
      };
    }
    
  } catch (error) {
    Logger.log('Error checking system fields: ' + error.toString());
    return { 
      missing: true, 
      message: 'Error checking system fields: ' + error.toString(),
      missingFields: []
    };
  }
}

/**
 * Show system fields status dialog
 */
function showSystemFieldsStatus() {
  try {
    const status = checkSystemFields();
    const ui = SpreadsheetApp.getUi();
    
    if (status.missing) {
      const response = ui.alert(
        'Missing System Fields',
        `Your configuration is missing required system fields:\n\n${status.missingFields.join('\n')}\n\nThese fields are required for:\n• Tracking submission status\n• Duplicate detection\n• Record URL storage\n\nWould you like to fix this automatically?`,
        ui.ButtonSet.YES_NO
      );
      
      if (response === ui.Button.YES) {
        const fixResult = fixSystemFields();
        ui.alert(
          fixResult.success ? 'System Fields Fixed' : 'Fix Failed',
          fixResult.message,
          ui.ButtonSet.OK
        );
      }
    } else {
      ui.alert(
        'System Fields Status',
        'All required system fields are present in your configuration.',
        ui.ButtonSet.OK
      );
    }
    
  } catch (error) {
    Logger.log('Error showing system fields status: ' + error.toString());
    SpreadsheetApp.getUi().alert(
      'Error',
      'Failed to check system fields status: ' + error.toString(),
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}
