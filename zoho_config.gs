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
  const html = HtmlService.createHtmlOutputFromFile('zoho_unified_ui')
    .setWidth(650)
    .setHeight(700)
    .setTitle('Zoho Integration Setup');
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Setup Zoho Integration');
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
    if (config.organizationType === 'DL') {
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
    
    // Note: No longer using enabledColumns - single dynamic column approach
    // Remove old enabledColumns property if it exists
    properties.deleteProperty(CONFIG_ENABLED_COLUMNS);
    
    // Configure triggers and menu based on processing mode
    const triggerResult = configureTriggers(config.processingMode);
    if (!triggerResult.success) {
      throw new Error(triggerResult.message);
    }
    
    // Update the CSV template with new columns
    updateSpreadsheetTemplate();
    
    Logger.log('Configuration saved successfully');
    return { 
      success: true, 
      message: `Configuration saved successfully! Your ${config.organizationType === 'DL' ? 'dealership' : (config.organizationType === 'KI' ? 'corporate store' : 'Mobile Klinik')} integration is now configured for ${config.processingMode === 'AUTO' ? 'automated' : 'manual'} processing.`
    };
    
  } catch (error) {
    Logger.log('Error saving configuration: ' + error.toString());
    return { success: false, message: 'Error saving configuration: ' + error.toString() };
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
      leadAssignment: properties.getProperty(CONFIG_LEAD_ASSIGNMENT) || 'Sales_Rep'
    };
  } else {
    // Legacy configuration format - use global variables
    return {
      processingMode: 'AUTO', // Default for legacy
      authTokenName: AUTH_TOKEN_NAME,
      authTokenValue: AUTH_TOKEN_VALUE,
      orgCode: ORG__CODE,
      orgTypeCode: 'DL', // Default for legacy
      campaignStartDate: null,
      campaignEndDate: null,
      leadAssignment: 'Sales_Rep' // Default for legacy
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
 * Get expected headers with dynamic assignment column
 */
function getExpectedHeaders() {
  const properties = PropertiesService.getScriptProperties();
  const leadAssignment = properties.getProperty(CONFIG_LEAD_ASSIGNMENT) || 'Sales_Rep';
  const assignmentTitle = getAssignmentColumnTitle(leadAssignment);
  
  return [
    'First_Name', 'Last_Name', 'Phone', 'Email', 'Language_Preference', 
    'Datahub_Src', 'Campaign_Name', 'Description', 'Street', 'City', 
    'State', 'Postal Code', 'Country', 'Rate_Plan_Description', 'Phone_Model', 
    'Current_Provider', assignmentTitle, 
    'Zoho_Record_URL', 'Time_Created_in_Zoho'
  ];
}

/**
 * Update spreadsheet template with new columns and formatting
 */
function updateSpreadsheetTemplate() {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const properties = PropertiesService.getScriptProperties();
    const leadAssignment = properties.getProperty(CONFIG_LEAD_ASSIGNMENT) || 'Sales_Rep';
    
    // Get expected headers with dynamic assignment column
    const expectedHeaders = getExpectedHeaders();
    
    // Update header row if needed
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
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
    
    // Apply column formatting for single assignment column (Column 17)
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const assignmentRange = sheet.getRange(2, 17, lastRow - 1, 1);
      
      if (leadAssignment === 'ADMIN') {
        // Admin assignment - disable the column since no input needed
        assignmentRange.setBackground('#f5f5f5');
        assignmentRange.setFontColor('#9aa0a6');
        assignmentRange.protect().setDescription('Admin assignment - no input required');
      } else {
        // Store or Sales Rep assignment - enable the column
        assignmentRange.setBackground('#ffffff');
        assignmentRange.setFontColor('#000000');
        const description = leadAssignment === 'Store' ? 
          'Store assignment - enter Channel Outlet ID' : 
          'Sales Rep assignment - enter sales rep email';
        assignmentRange.protect().setDescription(description);
      }
    }
    
    Logger.log('Spreadsheet template updated successfully with dynamic assignment column');
    
  } catch (error) {
    Logger.log('Error updating spreadsheet template: ' + error.toString());
  }
}
