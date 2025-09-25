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
const CONFIG_ENABLED_COLUMNS = 'ZOHO_ENABLED_COLUMNS'; // Legacy - will be removed

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
 * Alternative setup function that works from any context
 * Use this when showSetupWizard() fails due to context issues
 */
function setupFromConsole() {
  try {
    Logger.log('Starting console-based setup...');
    
    // Check current configuration
    const configStatus = isConfigurationComplete();
    const properties = PropertiesService.getScriptProperties();
    
    Logger.log('Current configuration status: ' + JSON.stringify(configStatus));
    
    if (configStatus.complete) {
      Logger.log('Configuration is already complete. Use showSetupWizard() from a spreadsheet to modify settings.');
      return { success: true, message: 'Configuration already complete' };
    }
    
    // Check what's missing
    const organizationType = properties.getProperty('ZOHO_ORGANIZATION_TYPE');
    const currentMode = getCurrentProcessingMode();
    
    let instructions = 'Setup Instructions:\n\n';
    
    if (!organizationType) {
      instructions += '1. No organization type set. Please run showSetupWizard() from your spreadsheet.\n';
    } else {
      instructions += `Organization Type: ${organizationType}\n`;
      
      if (organizationType === 'KI' || organizationType === 'RT') {
        // Check admin credentials
        const kiTokenName = properties.getProperty('AUTH_TOKEN_NAME_KI');
        const rtTokenName = properties.getProperty('AUTH_TOKEN_NAME_RT');
        
        if (!kiTokenName || !rtTokenName) {
          instructions += '2. Missing administrator credentials. Run adminSetupCredentials() first.\n';
        } else {
          instructions += '2. Administrator credentials are set.\n';
        }
      }
      
      if (!currentMode) {
        instructions += '3. Processing mode not set. Complete setup using showSetupWizard() from spreadsheet.\n';
      } else {
        instructions += `3. Processing mode: ${currentMode}\n`;
      }
    }
    
    instructions += '\nRecommended actions:\n';
    instructions += '- Run adminSetupCredentials() if you are an administrator\n';
    instructions += '- Open your spreadsheet and run showSetupWizard() to complete user setup\n';
    instructions += '- Use the add-on interface for configuration\n';
    
    Logger.log(instructions);
    
    return { success: true, message: instructions };
    
  } catch (error) {
    Logger.log('Error in console setup: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}

/**
 * Administrator setup function - initializes predefined credentials for KI and RT
 * This should be run once by an administrator before users can configure KI/RT integrations
 */
function adminSetupCredentials() {
  try {
    const ui = SpreadsheetApp.getUi();
    
    // Check if credentials already exist
    const properties = PropertiesService.getScriptProperties();
    const kiTokenName = properties.getProperty('AUTH_TOKEN_NAME_KI');
    const rtTokenName = properties.getProperty('AUTH_TOKEN_NAME_RT');
    
    if (kiTokenName && rtTokenName) {
      const overwrite = ui.alert(
        'Credentials Already Exist',
        'Predefined credentials for KI and RT organizations already exist. Do you want to overwrite them?',
        ui.ButtonSet.YES_NO
      );
      
      if (overwrite !== ui.Button.YES) {
        return { success: false, message: 'Setup cancelled by user' };
      }
    }
    
    // Security warning
    const securityWarning = ui.alert(
      'Administrator Credential Setup',
      'This will set up predefined credentials for Corporate Store (KI) and Mobile Klinik (RT) organizations.\n\nMake sure you are in a secure environment and no one can see your screen.\n\nContinue?',
      ui.ButtonSet.YES_NO
    );
    
    if (securityWarning !== ui.Button.YES) {
      return { success: false, message: 'Setup cancelled by user' };
    }
    
    // Get KI credentials
    const kiTokenNameInput = ui.prompt(
      'Corporate Store (KI) - Token Name', 
      'Enter the auth token name for Corporate Store (KI):\n(e.g., telus_gapps_token)'
    );
    
    if (kiTokenNameInput.getSelectedButton() !== ui.Button.OK || !kiTokenNameInput.getResponseText()) {
      throw new Error('KI token name is required');
    }
    
    const kiTokenValueInput = ui.prompt(
      'Corporate Store (KI) - Token Value', 
      'Enter the auth token value for Corporate Store (KI):'
    );
    
    if (kiTokenValueInput.getSelectedButton() !== ui.Button.OK || !kiTokenValueInput.getResponseText()) {
      throw new Error('KI token value is required');
    }
    
    // Get RT credentials  
    const rtTokenNameInput = ui.prompt(
      'Mobile Klinik (RT) - Token Name', 
      'Enter the auth token name for Mobile Klinik (RT):\n(e.g., mobile_klinik_gapps_token)'
    );
    
    if (rtTokenNameInput.getSelectedButton() !== ui.Button.OK || !rtTokenNameInput.getResponseText()) {
      throw new Error('RT token name is required');
    }
    
    const rtTokenValueInput = ui.prompt(
      'Mobile Klinik (RT) - Token Value', 
      'Enter the auth token value for Mobile Klinik (RT):'
    );
    
    if (rtTokenValueInput.getSelectedButton() !== ui.Button.OK || !rtTokenValueInput.getResponseText()) {
      throw new Error('RT token value is required');
    }
    
    // Store credentials securely
    properties.setProperties({
      'AUTH_TOKEN_NAME_KI': kiTokenNameInput.getResponseText(),
      'AUTH_TOKEN_VALUE_KI': kiTokenValueInput.getResponseText(),
      'AUTH_TOKEN_NAME_RT': rtTokenNameInput.getResponseText(),
      'AUTH_TOKEN_VALUE_RT': rtTokenValueInput.getResponseText()
    });
    
    Logger.log('Administrator credentials initialized securely');
    
    ui.alert(
      'Setup Complete',
      'Predefined credentials for Corporate Store (KI) and Mobile Klinik (RT) have been stored securely.\n\nUsers can now configure their integrations using the setup wizard.',
      ui.ButtonSet.OK
    );
    
    return { success: true, message: 'Administrator credentials initialized securely' };
    
  } catch (error) {
    Logger.log('Error in administrator credential setup: ' + error.toString());
    
    SpreadsheetApp.getUi().alert(
      'Setup Error',
      'Failed to set up administrator credentials: ' + error.toString(),
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
    return { success: false, message: error.toString() };
  }
}

/**
 * Verify administrator credentials are set up
 */
function verifyAdminCredentials() {
  try {
    const properties = PropertiesService.getScriptProperties();
    
    const kiTokenName = properties.getProperty('AUTH_TOKEN_NAME_KI');
    const kiTokenValue = properties.getProperty('AUTH_TOKEN_VALUE_KI');
    const rtTokenName = properties.getProperty('AUTH_TOKEN_NAME_RT');
    const rtTokenValue = properties.getProperty('AUTH_TOKEN_VALUE_RT');
    
    let message = 'Administrator Credentials Status:\n\n';
    
    message += 'Corporate Store (KI):\n';
    message += `- Token Name: ${kiTokenName ? '✅ Set' : '❌ Missing'}\n`;
    message += `- Token Value: ${kiTokenValue ? '✅ Set' : '❌ Missing'}\n\n`;
    
    message += 'Mobile Klinik (RT):\n';
    message += `- Token Name: ${rtTokenName ? '✅ Set' : '❌ Missing'}\n`;
    message += `- Token Value: ${rtTokenValue ? '✅ Set' : '❌ Missing'}\n\n`;
    
    const allSet = kiTokenName && kiTokenValue && rtTokenName && rtTokenValue;
    
    if (allSet) {
      message += '✅ All administrator credentials are properly configured\n\n';
      message += 'Users can now configure KI and RT integrations using the setup wizard.';
    } else {
      message += '❌ Some administrator credentials are missing\n\n';
      message += 'Run adminSetupCredentials() to set up missing credentials.';
    }
    
    SpreadsheetApp.getUi().alert(
      'Administrator Credential Verification',
      message,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
    Logger.log('Administrator credential verification: ' + message);
    
    return {
      success: true,
      allSet: allSet,
      details: {
        ki: { tokenName: !!kiTokenName, tokenValue: !!kiTokenValue },
        rt: { tokenName: !!rtTokenName, tokenValue: !!rtTokenValue }
      }
    };
    
  } catch (error) {
    Logger.log('Error verifying administrator credentials: ' + error.toString());
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
 */
function saveCompleteConfiguration(config) {
  Logger.log('Saving complete configuration: ' + JSON.stringify(config));
  
  try {
    const properties = PropertiesService.getScriptProperties();
    
    // Save processing mode (force to MANUAL for now)
    properties.setProperty(CONFIG_PROCESSING_MODE, 'MANUAL');
    
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
    
    // Save selected fields with assignment field based on lead assignment strategy
    if (config.selectedFields) {
      let fieldsToSave = [...config.selectedFields];
      
      // Add store field if store assignment is selected
      if (config.leadAssignment === 'Store') {
        // Check if store field is not already included
        const hasStoreField = fieldsToSave.some(field => field.apiName === 'ChannelOutletId');
        if (!hasStoreField) {
          fieldsToSave.push(STORE_ASSIGNMENT_FIELD);
        }
      }
      
      // Ensure AssignmentValue field is always included for all assignment types
      const hasAssignmentField = fieldsToSave.some(field => field.apiName === 'AssignmentValue');
      if (!hasAssignmentField) {
        // Add the assignment field with appropriate display name based on assignment strategy
        const assignmentDisplayName = getAssignmentColumnTitle(config.leadAssignment);
        fieldsToSave.push({
          apiName: 'AssignmentValue',
          displayName: assignmentDisplayName,
          required: config.leadAssignment !== 'ADMIN', // Not required for ADMIN assignment
          validation: null
        });
      }
      
      properties.setProperty(CONFIG_SELECTED_FIELDS, JSON.stringify(fieldsToSave));
    }
    
    // Save setup completion date
    const today = new Date().toISOString().split('T')[0];
    properties.setProperty(CONFIG_SETUP_COMPLETION_DATE, today);
    
    // Remove old enabledColumns property if it exists
    properties.deleteProperty(CONFIG_ENABLED_COLUMNS);
    
    // Configure triggers and menu based on processing mode (always manual now)
    const triggerResult = configureTriggers('MANUAL');
    if (!triggerResult.success) {
      throw new Error(triggerResult.message);
    }
    
    // Update the spreadsheet with selected fields
    updateSpreadsheetWithSelectedFields();
    
    Logger.log('Configuration saved successfully');
    return { 
      success: true, 
      message: `Configuration saved successfully! Your ${config.organizationType === 'DL' ? 'dealership' : (config.organizationType === 'KI' ? 'corporate store' : 'Mobile Klinik')} integration is now configured for manual processing.`
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
 * Get expected headers with dynamic assignment column
 */
function getExpectedHeaders() {
  const properties = PropertiesService.getScriptProperties();
  const leadAssignment = properties.getProperty(CONFIG_LEAD_ASSIGNMENT) || 'Sales_Rep';
  const assignmentTitle = getAssignmentColumnTitle(leadAssignment);
  
  return [
    'First Name', 'Last Name', 'Phone', 'Email', 'Preferred Language', 
    'Campaign Name', 'Description', 'Street', 'City', 
    'Province', 'Postal Code', 'Country', 'Rate Plan', 'Device Model', 
    'Current Provider', assignmentTitle,
    'Zoho_Record_URL', 'Time_Created_in_Zoho'
  ];
}

/**
 * Update spreadsheet template with new columns and formatting (legacy function)
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
    
    // Apply column formatting for assignment column using column constants
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const assignmentColumn = getColumnIndex('ASSIGNMENT_VALUE') + 1; // Convert to 1-based index
      const assignmentRange = sheet.getRange(2, assignmentColumn, lastRow - 1, 1);
      
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

/**
 * Update spreadsheet with user-selected fields
 */
function updateSpreadsheetWithSelectedFields() {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const selectedFields = getSelectedFields();
    
    // Check if there's existing data and warn user
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const ui = SpreadsheetApp.getUi();
      const response = ui.alert(
        'Clear Existing Data?',
        'Changing field selections will clear all existing data in the sheet.\n\nDo you want to continue?',
        ui.ButtonSet.YES_NO
      );
      
      if (response !== ui.Button.YES) {
        throw new Error('Field update cancelled by user');
      }
      
      // Clear all data except header row
      if (lastRow > 1) {
        sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clear();
      }
    }
    
    // Create headers from selected fields
    const headers = selectedFields.map(field => field.displayName);
    
    // Clear existing content, data validation, conditional formatting, and notes
    sheet.clear();
    // Clear data validation from the entire sheet (not just data range)
    const maxRows = sheet.getMaxRows();
    const maxCols = sheet.getMaxColumns();
    if (maxRows > 0 && maxCols > 0) {
      const entireSheet = sheet.getRange(1, 1, maxRows, maxCols);
      entireSheet.clearDataValidations();
      // Clear all notes from the entire sheet
      entireSheet.clearNote();
    }
    sheet.clearConditionalFormatRules();
    
    // Set new headers
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
    
    // Format header row
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#e8f0fe');
    headerRange.setBorder(true, true, true, true, true, true);
    
    // Highlight required columns
    highlightRequiredColumns(selectedFields);
    
    // Apply data validation to fields that need it
    applyDataValidationToSheet();
    
    Logger.log('Spreadsheet updated with selected fields: ' + headers.join(', '));
    
  } catch (error) {
    Logger.log('Error updating spreadsheet with selected fields: ' + error.toString());
    throw error;
  }
}

/**
 * Highlight required columns in the spreadsheet
 */
function highlightRequiredColumns(selectedFields) {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const lastRow = Math.max(sheet.getLastRow(), 100); // Apply to at least 100 rows
    
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
      } else if (field.apiName === 'ChannelOutletId') {
        // Special handling for store assignment field
        const columnIndex = index + 1; // Convert to 1-based index
        const headerCell = sheet.getRange(1, columnIndex);
        
        // Add clarifying note for store field
        headerCell.setNote('📍 STORE ASSIGNMENT - Enter the 11-digit ChannelOutletID (store long-code)');
        
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
        const lastRow = Math.max(sheet.getLastRow(), 100); // Apply to at least 100 rows
        
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
    
    // Add hidden fields and system fields to the selection
    const allSelectedFields = [...selectedFields, ...HIDDEN_FIELDS, ...SYSTEM_FIELDS];
    
    properties.setProperty(CONFIG_SELECTED_FIELDS, JSON.stringify(allSelectedFields));
    
    Logger.log('Selected fields saved: ' + allSelectedFields.map(f => f.displayName).join(', '));
    
    return { success: true, message: 'Selected fields saved successfully' };
    
  } catch (error) {
    Logger.log('Error saving selected fields: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}
