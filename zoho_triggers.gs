/**
 * Zoho Integration Triggers - Trigger Management and Entry Points
 * Manages automated triggers and provides entry points for both processing modes
 */

/**
 * Initialize the integration when the spreadsheet opens
 * This function is automatically called when the spreadsheet is opened
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
  } else if (currentMode === 'MANUAL') {
    // Create menu for manual mode
    createCustomMenu();
  }
  // For auto mode, triggers are already set up, no menu needed
}

/**
 * Create custom menu for manual processing mode
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
 * Create automated trigger for onEdit events
 * Used when switching to automated processing mode
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

/**
 * Reset all triggers and configuration
 * Used for troubleshooting or complete reconfiguration
 */
function resetTriggerConfiguration() {
  try {
    // Remove all triggers
    removeExistingTriggers();
    
    // Clear processing mode
    const properties = PropertiesService.getScriptProperties();
    properties.deleteProperty('ZOHO_PROCESSING_MODE');
    
    Logger.log('Trigger configuration reset successfully');
    return { 
      success: true, 
      message: 'Trigger configuration has been reset. Please run the setup wizard to reconfigure.' 
    };
    
  } catch (error) {
    Logger.log('Error resetting trigger configuration: ' + error.toString());
    return { 
      success: false, 
      message: 'Error resetting configuration: ' + error.toString() 
    };
  }
}

/**
 * Test trigger functionality
 * Creates a test event to verify trigger processing
 */
function testTriggerFunctionality() {
  const currentMode = getCurrentProcessingMode();
  
  if (!currentMode) {
    return {
      success: false,
      message: 'No processing mode configured. Please run the setup wizard first.'
    };
  }
  
  try {
    if (currentMode === 'AUTO') {
      // Test automated trigger by simulating an edit event
      const sheet = SpreadsheetApp.getActiveSheet();
      const testRow = sheet.getLastRow() + 1;
      
      // Create a mock edit event
      const mockEvent = {
        range: {
          getLastRow: () => testRow,
          getRow: () => testRow
        }
      };
      
      // Test validation without actually processing
      const rowToProcess = validateEditEvent(mockEvent);
      
      return {
        success: true,
        message: 'Automated trigger validation test completed. Row validation: ' + 
                (rowToProcess ? 'passed' : 'would be skipped (normal for test)')
      };
      
    } else if (currentMode === 'MANUAL') {
      // Test manual processing setup
      const unsubmittedRows = getUnsubmittedRows();
      
      return {
        success: true,
        message: `Manual processing test completed. Found ${unsubmittedRows.length} unsubmitted rows ready for processing.`
      };
    }
    
  } catch (error) {
    Logger.log('Error testing trigger functionality: ' + error.toString());
    return {
      success: false,
      message: 'Error testing trigger functionality: ' + error.toString()
    };
  }
}
