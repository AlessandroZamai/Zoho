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
const CONFIG_ENABLED_COLUMNS = 'ZOHO_ENABLED_COLUMNS';

const PROCESSING_MODE_AUTO = 'AUTO';
const PROCESSING_MODE_MANUAL = 'MANUAL';

// Organization types
const ORG_TYPE_CORPORATE = 'KI';
const ORG_TYPE_DEALER = 'DL';
const ORG_TYPE_MOBILE_KLINIK = 'RT';

// Lead assignment types
const ASSIGNMENT_EQUAL = 'EQUAL';
const ASSIGNMENT_MANUAL = 'MANUAL';
const ASSIGNMENT_ADMIN = 'ADMIN';

// Predefined organization settings
const ORG_SETTINGS = {
  [ORG_TYPE_CORPORATE]: {
    orgCode: '50080',
    orgTypeCode: 'KI',
    authTokenNameKey: 'AUTH_TOKEN_NAME_KI',
    authTokenValueKey: 'AUTH_TOKEN_VALUE_KI'
  },
  [ORG_TYPE_MOBILE_KLINIK]: {
    orgCode: '6675',
    orgTypeCode: 'RT',
    authTokenNameKey: 'AUTH_TOKEN_NAME_RT',
    authTokenValueKey: 'AUTH_TOKEN_VALUE_RT'
  },
  [ORG_TYPE_DEALER]: {
    orgTypeCode: 'DL'
    // orgCode, authTokenName, authTokenValue are user-provided
  }
};

/**
 * Main setup function - displays the setup wizard
 */
function showSetupWizard() {
  const html = HtmlService.createHtmlOutputFromFile('setup_wizard_ui')
    .setWidth(500)
    .setHeight(400)
    .setTitle('Zoho Integration Setup');
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Setup Zoho Integration');
}

/**
 * Get current processing mode configuration
 */
function getCurrentProcessingMode() {
  const properties = PropertiesService.getScriptProperties();
  return properties.getProperty(CONFIG_PROCESSING_MODE) || null;
}

/**
 * Save complete configuration from the enhanced setup wizard
 */
function saveCompleteConfiguration(config) {
  Logger.log('Saving complete configuration: ' + JSON.stringify(config));
  
  try {
    const properties = PropertiesService.getScriptProperties();
    
    // Save processing mode
    properties.setProperty(CONFIG_PROCESSING_MODE, config.processingMode);
    
    // Save organization type
    properties.setProperty(CONFIG_ORGANIZATION_TYPE, config.organizationType);
    
    // Save organization-specific settings
    const orgSettings = ORG_SETTINGS[config.organizationType];
    if (config.organizationType === ORG_TYPE_DEALER) {
      // Dealership - save user-provided credentials
      properties.setProperty(CONFIG_ORG_CODE, config.orgCode);
      properties.setProperty(CONFIG_AUTH_TOKEN_NAME, config.authTokenName);
      properties.setProperty(CONFIG_AUTH_TOKEN_VALUE, config.authTokenValue);
    } else {
      // Corporate Store or Mobile Klinik - use predefined settings
      properties.setProperty(CONFIG_ORG_CODE, orgSettings.orgCode);
      
      // Get predefined credentials from script properties
      const authTokenName = properties.getProperty(orgSettings.authTokenNameKey);
      const authTokenValue = properties.getProperty(orgSettings.authTokenValueKey);
      
      if (!authTokenName || !authTokenValue) {
        throw new Error(`Predefined credentials not found for ${config.organizationType}. Please contact your administrator.`);
      }
      
      properties.setProperty(CONFIG_AUTH_TOKEN_NAME, authTokenName);
      properties.setProperty(CONFIG_AUTH_TOKEN_VALUE, authTokenValue);
    }
    
    // Save campaign dates
    properties.setProperty(CONFIG_CAMPAIGN_START_DATE, config.campaignStartDate);
    properties.setProperty(CONFIG_CAMPAIGN_END_DATE, config.campaignEndDate);
    
    // Save lead assignment strategy
    properties.setProperty(CONFIG_LEAD_ASSIGNMENT, config.leadAssignment);
    
    // Configure column enabling based on assignment strategy
    const enabledColumns = {
      channelOutletId: config.leadAssignment === ASSIGNMENT_EQUAL,
      assignToSalesRepEmail: config.leadAssignment === ASSIGNMENT_MANUAL
    };
    properties.setProperty(CONFIG_ENABLED_COLUMNS, JSON.stringify(enabledColumns));
    
    // Configure triggers and menu based on processing mode
    removeExistingTriggers();
    
    if (config.processingMode === PROCESSING_MODE_AUTO) {
      createAutomatedTrigger();
    } else if (config.processingMode === PROCESSING_MODE_MANUAL) {
      createCustomMenu();
    }
    
    // Update the CSV template with new columns
    updateSpreadsheetTemplate();
    
    Logger.log('Configuration saved successfully');
    return { 
      success: true, 
      message: `Configuration saved successfully! Your ${config.organizationType === ORG_TYPE_DEALER ? 'dealership' : (config.organizationType === ORG_TYPE_CORPORATE ? 'corporate store' : 'Mobile Klinik')} integration is now configured for ${config.triggerMode === TRIGGER_MODE_AUTO ? 'automated' : 'manual'} processing.` 
    };
    
  } catch (error) {
    Logger.log('Error saving configuration: ' + error.toString());
    return { success: false, message: 'Error saving configuration: ' + error.toString() };
  }
}

/**
 * Set processing mode and configure accordingly (legacy function for backward compatibility)
 */
function setTriggerMode(mode) {
  Logger.log('Setting processing mode to: ' + mode);
  
  try {
    const properties = PropertiesService.getScriptProperties();
    properties.setProperty(CONFIG_PROCESSING_MODE, mode);
    
    // Remove existing triggers first
    removeExistingTriggers();
    
    if (mode === PROCESSING_MODE_AUTO) {
      // Create automated trigger
      createAutomatedTrigger();
      Logger.log('Automated processing mode configured successfully');
      return { success: true, message: 'Automated processing mode configured successfully. Data will be sent to Zoho automatically when rows are edited.' };
    } else if (mode === PROCESSING_MODE_MANUAL) {
      // Setup manual mode (no triggers needed, just menu)
      createCustomMenu();
      Logger.log('Manual processing mode configured successfully');
      return { success: true, message: 'Manual processing mode configured successfully. Use the "Send to Zoho" menu to process data.' };
    } else {
      throw new Error('Invalid processing mode: ' + mode);
    }
  } catch (error) {
    Logger.log('Error setting processing mode: ' + error.toString());
    return { success: false, message: 'Error configuring processing mode: ' + error.toString() };
  }
}

/**
 * Remove all existing sendToWebhook triggers
 */
function removeExistingTriggers() {
  const allTriggers = ScriptApp.getProjectTriggers();
  Logger.log('Found ' + allTriggers.length + ' existing triggers.');

  for (let i = 0; i < allTriggers.length; i++) {
    const handlerFunction = allTriggers[i].getHandlerFunction();
    if (handlerFunction === 'sendToWebhook') {
      Logger.log('Deleting existing trigger for sendToWebhook.');
      ScriptApp.deleteTrigger(allTriggers[i]);
    }
  }
}

/**
 * Create automated trigger (same as original createTrigger function)
 */
function createAutomatedTrigger() {
  try {
    ScriptApp.newTrigger('sendToWebhook')
      .forSpreadsheet(SpreadsheetApp.getActive())
      .onEdit()
      .create();
    Logger.log('New onEdit trigger for "sendToWebhook" created successfully.');
  } catch (error) {
    Logger.log('Error creating automated trigger: ' + error.toString());
    throw error;
  }
}

/**
 * Create custom menu for manual mode
 */
function createCustomMenu() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Send to Zoho')
    .addItem('Send unsubmitted rows to Zoho', 'sendUnsubmittedRowsToZoho')
    .addSeparator()
    .addItem('Change settings', 'showSetupWizard')
    .addToUi();
}

/**
 * Initialize the integration based on current configuration
 * This should be called when the spreadsheet opens
 */
function onOpen() {
  const currentMode = getCurrentProcessingMode();
  
  if (currentMode === null) {
    // First time setup - show wizard
    SpreadsheetApp.getUi().alert(
      'Zoho Integration Setup Required',
      'This appears to be your first time using this spreadsheet. Please run the setup wizard to configure your integration.\n\nGo to Extensions > Apps Script, then run the "showSetupWizard" function.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } else if (currentMode === PROCESSING_MODE_MANUAL) {
    // Create menu for manual mode
    createCustomMenu();
  }
  // For auto mode, triggers are already set up, no menu needed
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
    triggerMode: properties.getProperty(CONFIG_TRIGGER_MODE),
    orgCode: properties.getProperty(CONFIG_ORG_CODE),
    campaignStartDate: properties.getProperty(CONFIG_CAMPAIGN_START_DATE),
    campaignEndDate: properties.getProperty(CONFIG_CAMPAIGN_END_DATE),
    leadAssignment: properties.getProperty(CONFIG_LEAD_ASSIGNMENT)
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
      processingMode: properties.getProperty(CONFIG_PROCESSING_MODE),
      authTokenName: properties.getProperty(CONFIG_AUTH_TOKEN_NAME),
      authTokenValue: properties.getProperty(CONFIG_AUTH_TOKEN_VALUE),
      orgCode: properties.getProperty(CONFIG_ORG_CODE),
      orgTypeCode: ORG_SETTINGS[organizationType].orgTypeCode,
      campaignStartDate: properties.getProperty(CONFIG_CAMPAIGN_START_DATE),
      campaignEndDate: properties.getProperty(CONFIG_CAMPAIGN_END_DATE),
      leadAssignment: properties.getProperty(CONFIG_LEAD_ASSIGNMENT),
      enabledColumns: JSON.parse(properties.getProperty(CONFIG_ENABLED_COLUMNS) || '{}')
    };
  } else {
    // Legacy configuration format - use global variables
    return {
      processingMode: PROCESSING_MODE_AUTO, // Default for legacy
      authTokenName: AUTH_TOKEN_NAME,
      authTokenValue: AUTH_TOKEN_VALUE,
      orgCode: ORG__CODE,
      orgTypeCode: 'DL', // Default for legacy
      campaignStartDate: null,
      campaignEndDate: null,
      leadAssignment: ASSIGNMENT_MANUAL,
      enabledColumns: { channelOutletId: false, assignToSalesRepEmail: true }
    };
  }
}

/**
 * Update spreadsheet template with new columns and formatting
 */
function updateSpreadsheetTemplate() {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const properties = PropertiesService.getScriptProperties();
    const enabledColumns = JSON.parse(properties.getProperty(CONFIG_ENABLED_COLUMNS) || '{}');
    
    // Update header row if needed
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const expectedHeaders = [
      'First_Name', 'Last_Name', 'Phone', 'Email', 'Language_Preference', 
      'Datahub_Src', 'Campaign_Name', 'Description', 'Street', 'City', 
      'State', 'Zip_Code', 'Country', 'Rate_Plan_Description', 'Phone_Model', 
      'Current_Provider', 'ChannelOutletID', 'AssigntoSalesRepEmail', 
      'Zoho_Record_URL', 'Time_Created_in_Zoho'
    ];
    
    // Check if we need to update headers
    let needsUpdate = false;
    if (headers.length !== expectedHeaders.length) {
      needsUpdate = true;
    } else {
      for (let i = 0; i < expectedHeaders.length; i++) {
        if (headers[i] !== expectedHeaders[i]) {
          needsUpdate = true;
          break;
        }
      }
    }
    
    // Update headers if needed
    if (needsUpdate) {
      const headerRange = sheet.getRange(1, 1, 1, expectedHeaders.length);
      headerRange.setValues([expectedHeaders]);
      
      // Format header row
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#e8f0fe');
      headerRange.setBorder(true, true, true, true, true, true);
    }
    
    // Apply column formatting based on enabled columns
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      // Column 17 (ChannelOutletID) formatting
      const channelOutletRange = sheet.getRange(2, 17, lastRow - 1, 1);
      if (enabledColumns.channelOutletId) {
        channelOutletRange.setBackground('#ffffff');
        channelOutletRange.setFontColor('#000000');
        channelOutletRange.protect().setDescription('ChannelOutletID column - enabled for data entry');
      } else {
        channelOutletRange.setBackground('#f5f5f5');
        channelOutletRange.setFontColor('#9aa0a6');
        channelOutletRange.protect().setDescription('ChannelOutletID column - disabled');
      }
      
      // Column 18 (AssigntoSalesRepEmail) formatting
      const salesRepRange = sheet.getRange(2, 18, lastRow - 1, 1);
      if (enabledColumns.assignToSalesRepEmail) {
        salesRepRange.setBackground('#ffffff');
        salesRepRange.setFontColor('#000000');
        salesRepRange.protect().setDescription('AssigntoSalesRepEmail column - enabled for data entry');
      } else {
        salesRepRange.setBackground('#f5f5f5');
        salesRepRange.setFontColor('#9aa0a6');
        salesRepRange.protect().setDescription('AssigntoSalesRepEmail column - disabled');
      }
    }
    
    Logger.log('Spreadsheet template updated successfully');
    
  } catch (error) {
    Logger.log('Error updating spreadsheet template: ' + error.toString());
  }
}
