/**
 * Zoho Integration Triggers - Trigger Management and Entry Points
 * Manages automated triggers and provides entry points for both processing modes
 */

/**
 * Initialize the integration when the spreadsheet opens
 * This function is automatically called when the spreadsheet is opened
 */
function onOpen(e) {
  // Always create the menu
  createCustomMenu();
  
  // Check if we need to show first-time setup
  // According to Google documentation, onOpen can access SpreadsheetApp.getUi()
  showFirstTimeSetupIfNeeded();
}

/**
 * Show first-time setup UI if needed
 * Based on Google Apps Script documentation, onOpen can access UI services
 */
function showFirstTimeSetupIfNeeded() {
  try {
    const currentMode = getCurrentProcessingMode();
    
    if (currentMode === null) {
      // Check if this is a configuration issue vs first-time setup
      const configStatus = isConfigurationComplete();
      
      if (!configStatus.complete) {
        // Check if it's an admin credential issue
        const properties = PropertiesService.getScriptProperties();
        const organizationType = properties.getProperty('ZOHO_ORGANIZATION_TYPE');
        
        if (organizationType === 'KI' || organizationType === 'RT') {
          // User has started setup but admin credentials are missing
          const kiTokenName = properties.getProperty('AUTH_TOKEN_NAME_KI');
          const rtTokenName = properties.getProperty('AUTH_TOKEN_NAME_RT');
          
          if (!kiTokenName || !rtTokenName) {
            SpreadsheetApp.getUi().alert(
              'Administrator Setup Required',
              `Configuration incomplete: Administrator credentials for ${organizationType === 'KI' ? 'Corporate Store' : 'Mobile Klinik'} are missing.\n\nPlease contact your administrator to:\n1. Run "initializeMissingProperties()" in Apps Script\n2. Set values in Project Settings > Script Properties\n\nOr complete the setup wizard.`,
              SpreadsheetApp.getUi().ButtonSet.OK
            );
            return;
          }
        }
        
        // Show first-time setup instructions
        showFirstTimeSetupInstructions();
      }
    }
  } catch (error) {
    Logger.log('Error in showFirstTimeSetupIfNeeded: ' + error.toString());
    // Fallback: set flag for deferred setup
    try {
      const properties = PropertiesService.getScriptProperties();
      properties.setProperty('ZOHO_FIRST_TIME_SETUP_NEEDED', 'true');
      Logger.log('First-time setup detected. Settings will be shown when you access the "Send to Zoho" menu.');
    } catch (fallbackError) {
      Logger.log('Fallback error: ' + fallbackError.toString());
    }
  }
}

/**
 * Show first-time setup instructions UI
 */
function showFirstTimeSetupInstructions() {
  try {
    const ui = SpreadsheetApp.getUi();
    
    const response = ui.alert(
      'Welcome to Zoho Integration!',
      'This appears to be your first time using the Zoho Integration.\n\n' +
      'To get started:\n' +
      '1. Use the "Send to Zoho" menu above\n' +
      '2. Click "Settings" to open the setup wizard\n' +
      '3. Follow the configuration steps\n\n' +
      'Please use the "Send to Zoho" > "Settings" menu option to access the setup wizard.',
      ui.ButtonSet.OK
    );
    
    // Set a flag to indicate the user should be directed to settings
    const properties = PropertiesService.getScriptProperties();
    properties.setProperty('ZOHO_SHOW_SETTINGS_PROMPT', 'true');
    
  } catch (error) {
    Logger.log('Error showing first-time setup instructions: ' + error.toString());
    // Fallback to just logging
    Logger.log('First-time setup detected. Please use the "Send to Zoho" menu to access Settings.');
  }
}

/**
 * Create custom menu for manual processing mode
 */
function createCustomMenu() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Send to Zoho')
    .addItem('Send unsubmitted rows to Zoho', 'sendUnsubmittedRowsToZoho')
    .addSeparator()
    .addItem('Find & Delete Duplicates', 'showDuplicateDeletionDialog')
    .addSeparator()
    .addItem('Settings', 'showSetupWizard')
    .addItem('Reset sheet', 'resetSheetData')
    .addToUi();
}

/**
 * Create automated trigger for onEdit events
 * Used when switching to automated processing mode
 * DISABLED: Automated processing is currently disabled
 */
function createAutomatedTrigger() {
  // COMMENTED OUT: Automated processing disabled per requirements
  /*
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
  */
  
  Logger.log('Automated trigger creation is currently disabled. Only manual processing is available.');
  throw new Error('Automated processing is currently disabled. Please use manual processing mode.');
}

/**
 * Remove all existing sendToWebhook triggers
 * Used when switching processing modes or during setup
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
 * Configure triggers based on processing mode
 * Called during setup wizard completion
 */
function configureTriggers(processingMode) {
  Logger.log('Configuring triggers for mode: ' + processingMode);
  
  try {
    // Remove existing triggers first
    removeExistingTriggers();
    
    if (processingMode === 'AUTO') {
      // Create automated trigger
      createAutomatedTrigger();
      Logger.log('Automated processing mode configured successfully');
      return { 
        success: true, 
        message: 'Automated processing mode configured successfully. Data will be sent to Zoho automatically when rows are edited.' 
      };
    } else if (processingMode === 'MANUAL') {
      // Setup manual mode (no triggers needed, just menu)
      createCustomMenu();
      Logger.log('Manual processing mode configured successfully');
      return { 
        success: true, 
        message: 'Manual processing mode configured successfully. Use the "Send to Zoho" menu to process data.' 
      };
    } else {
      throw new Error('Invalid processing mode: ' + processingMode);
    }
  } catch (error) {
    Logger.log('Error configuring triggers: ' + error.toString());
    return { 
      success: false, 
      message: 'Error configuring processing mode: ' + error.toString() 
    };
  }
}


/**
 * Get current trigger status and information
 * Useful for debugging and status checking
 */
function getTriggerStatus() {
  const allTriggers = ScriptApp.getProjectTriggers();
  const webhookTriggers = allTriggers.filter(trigger => 
    trigger.getHandlerFunction() === 'sendToWebhook'
  );
  
  const currentMode = getCurrentProcessingMode();
  
  return {
    processingMode: currentMode,
    triggerCount: webhookTriggers.length,
    triggers: webhookTriggers.map(trigger => ({
      eventType: trigger.getEventType().toString(),
      source: trigger.getTriggerSource().toString(),
      handlerFunction: trigger.getHandlerFunction()
    })),
    isConfigured: currentMode !== null,
    hasAutomatedTriggers: webhookTriggers.length > 0
  };
}

/**
 * Validate trigger configuration
 * Ensures triggers are properly set up for the current processing mode
 */
function validateTriggerConfiguration() {
  const status = getTriggerStatus();
  const errors = [];
  const warnings = [];
  
  if (!status.isConfigured) {
    errors.push('Processing mode not configured');
    return { isValid: false, errors: errors, warnings: warnings };
  }
  
  if (status.processingMode === 'AUTO') {
    if (status.triggerCount === 0) {
      errors.push('Automated mode configured but no triggers found');
    } else if (status.triggerCount > 1) {
      warnings.push('Multiple triggers found - this may cause duplicate processing');
    }
  } else if (status.processingMode === 'MANUAL') {
    if (status.triggerCount > 0) {
      warnings.push('Manual mode configured but automated triggers still exist');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors,
    warnings: warnings,
    status: status
  };
}
