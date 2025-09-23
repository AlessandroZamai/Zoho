/**
 * Manual Processing Functions for Zoho Webhook Integration
 * Handles batch processing of unsubmitted rows with progress tracking
 */

/**
 * Main function to process all unsubmitted rows
 * Called from the "Send to Zoho" menu
 */
function sendUnsubmittedRowsToZoho() {
  Logger.log('sendUnsubmittedRowsToZoho function started.');
  
  // Check if we're in manual mode
  const currentMode = getCurrentProcessingMode();
  if (currentMode !== PROCESSING_MODE_MANUAL) {
    SpreadsheetApp.getUi().alert(
      'Manual Processing Not Available',
      'This function is only available when the integration is configured for manual processing. Please run the setup wizard to change your configuration.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return;
  }
  
  // Check configuration
  const configCheck = isConfigurationComplete();
  if (!configCheck.complete) {
    SpreadsheetApp.getUi().alert(
      'Configuration Incomplete',
      'Please complete your configuration first: ' + configCheck.message + '\n\nRun the setup wizard to configure your integration.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return;
  }
  
  // Get configuration values
  const config = getConfigurationValues();
  if (!config.processingMode) {
    SpreadsheetApp.getUi().alert(
      'Processing Mode Not Set',
      'Please run the setup wizard to configure your processing mode.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return;
  }
  
  try {
  // Check if dates need confirmation
  const today = new Date().toISOString().split('T')[0];
  
  if (config.campaignStartDate && config.campaignStartDate !== today) {
    // Show date confirmation modal
    showDateConfirmationDialog();
    return; // Exit here, the dialog will continue the process
  }
    
    // Continue with normal processing
    continueWithProcessing();
    
  } catch (error) {
    Logger.log('Error in sendUnsubmittedRowsToZoho: ' + error.toString());
    SpreadsheetApp.getUi().alert(
      'Processing Error',
      'An error occurred while preparing to process rows: ' + error.toString(),
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * Continue with processing after date confirmation (or if no confirmation needed)
 */
function continueWithProcessing() {
  try {
    // Get unsubmitted rows
    const unsubmittedRows = getUnsubmittedRows();
    
    if (unsubmittedRows.length === 0) {
      SpreadsheetApp.getUi().alert(
        'No Unsubmitted Rows',
        'All rows have already been submitted to Zoho or there are no data rows to process.',
        SpreadsheetApp.getUi().ButtonSet.OK
      );
      return;
    }
    
    // Show progress dialog and process rows
    showProgressDialog(unsubmittedRows);
    
  } catch (error) {
    Logger.log('Error in continueWithProcessing: ' + error.toString());
    SpreadsheetApp.getUi().alert(
      'Processing Error',
      'An error occurred while preparing to process rows: ' + error.toString(),
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * Get all rows that haven't been submitted to Zoho yet
 * Returns array of row objects with row number and data
 */
function getUnsubmittedRows() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const lastRow = sheet.getLastRow();
  
  if (lastRow <= 1) {
    return []; // No data rows (only header)
  }
  
  const unsubmittedRows = [];
  
  // Start from row 2 (skip header)
  for (let rowNum = 2; rowNum <= lastRow; rowNum++) {
    // Check if Record ID column (19) is empty
    const recordIdCell = sheet.getRange(rowNum, 19).getValue();
    
    if (!recordIdCell || recordIdCell.toString().trim() === '') {
      // Get all data for this row
      const rowData = sheet.getRange(rowNum, 1, 1, sheet.getLastColumn()).getValues()[0];
      
      // Check if row has any data (not completely empty)
      const hasData = rowData.some(cell => cell && cell.toString().trim() !== '');
      
      if (hasData) {
        unsubmittedRows.push({
          rowNumber: rowNum,
          data: rowData
        });
      }
    }
  }
  
  return unsubmittedRows;
}

/**
 * Validate a single row's data
 * Returns validation result object
 */
function validateRowData(rowData, rowNumber) {
  const errors = [];
  const warnings = [];
  
  // Required fields validation (updated for new column structure)
  if (!rowData[0] || rowData[0].toString().trim() === '') {
    errors.push('First Name is required');
  }
  
  if (!rowData[1] || rowData[1].toString().trim() === '') {
    errors.push('Last Name is required');
  }
  
  if (!rowData[2] || rowData[2].toString().trim() === '') {
    errors.push('Phone is required');
  } else {
    // Validate phone format
    const phone = String(rowData[2]).replace(/[^0-9+]/g, '');
    if (phone.length < 10) {
      errors.push('Phone must contain at least 10 digits');
    }
  }
  
  if (!rowData[3] || rowData[3].toString().trim() === '') {
    errors.push('Email is required');
  } else {
    // Basic email validation
    const email = rowData[3].toString().trim();
    if (!email.includes('@') || !email.includes('.')) {
      errors.push('Email format appears invalid');
    }
  }
  
  if (!rowData[5] || rowData[5].toString().trim() === '') {
    errors.push('Datahub_Src is required');
  }
  
  if (!rowData[6] || rowData[6].toString().trim() === '') {
    errors.push('Campaign_Name is required');
  }
  
  // Optional field warnings (updated column numbers)
  if (!rowData[8] || rowData[8].toString().trim() === '') {
    warnings.push('Street address is missing');
  }
  
  if (!rowData[9] || rowData[9].toString().trim() === '') {
    warnings.push('City is missing');
  }
  
  // Validate assignment fields based on configuration
  const config = getConfigurationValues();
  if (config.leadAssignment === ASSIGNMENT_EQUAL && config.enabledColumns.channelOutletId) {
    if (!rowData[16] || rowData[16].toString().trim() === '') {
      errors.push('Channel Outlet ID is required for equal distribution');
    } else {
      const channelOutletId = rowData[16].toString().trim();
      if (channelOutletId.length !== 11 || !/^\d+$/.test(channelOutletId)) {
        errors.push('Channel Outlet ID must be exactly 11 digits');
      }
    }
  } else if (config.leadAssignment === ASSIGNMENT_MANUAL && config.enabledColumns.assignToSalesRepEmail) {
    if (!rowData[17] || rowData[17].toString().trim() === '') {
      errors.push('Sales Rep Email is required for manual assignment');
    } else {
      const email = rowData[17].toString().trim();
      if (!email.includes('@') || !email.includes('.')) {
        errors.push('Sales Rep Email format appears invalid');
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors,
    warnings: warnings,
    rowNumber: rowNumber
  };
}

/**
 * Process a single row and send to Zoho
 * Returns processing result object
 */
function processSingleRow(rowData, rowNumber) {
  Logger.log('Processing row ' + rowNumber);
  
  try {
    // Validate the row first
    const validation = validateRowData(rowData, rowNumber);
    if (!validation.isValid) {
      return {
        success: false,
        rowNumber: rowNumber,
        error: 'Validation failed: ' + validation.errors.join(', '),
        validationErrors: validation.errors,
        validationWarnings: validation.warnings
      };
    }
    
    // Get configuration and use configured dates
    const config = getConfigurationValues();
    let startDate, endDate;
    
    if (config.campaignStartDate && config.campaignEndDate) {
      startDate = new Date(config.campaignStartDate);
      endDate = new Date(config.campaignEndDate);
    } else {
      // Fallback to calculated dates
      startDate = new Date();
      const campaign_length = 30;
      endDate = new Date(startDate.getTime() + campaign_length * 24 * 60 * 60 * 1000);
    }
    
    // Clean phone
    const phone = String(rowData[2]).replace(/[^0-9+]/g, '');
    
    // Prepare payload using configuration values
    const payload = {
      auth_token_name: config.authTokenName,
      auth_token_value: config.authTokenValue,
      First_Name: rowData[0],
      Last_Name: rowData[1],
      Phone: phone,
      Email: rowData[3],
      Language_Preference: rowData[4], // New field
      Datahub_Src: rowData[5],
      Campaign_Name: rowData[6],
      Description: rowData[7],
      Street: rowData[8],
      City: rowData[9],
      State: rowData[10],
      Zip_Code: rowData[11],
      Country: rowData[12],
      Rate_Plan_Description: rowData[13],
      Phone_Model: rowData[14],
      Brand: rowData[15],
      notify_record_owner: true,
      OrgTypeCode: config.orgTypeCode,
      Organization_Code: config.orgCode,
      Consent_to_Contact_Captured: true,
      Created_By_Email: Session.getActiveUser().getEmail(),
      Campaign_Start_Date: Utilities.formatDate(startDate, "GMT", "yyyy-MM-dd"),
      Campaign_End_Date: Utilities.formatDate(endDate, "GMT", "yyyy-MM-dd")
    };
    
    // Add assignment fields based on configuration
    if (config.leadAssignment === ASSIGNMENT_EQUAL && config.enabledColumns.channelOutletId) {
      if (rowData[16] && rowData[16].toString().trim() !== '') {
        payload.ChannelOutletId = rowData[16].toString().trim();
      }
    } else if (config.leadAssignment === ASSIGNMENT_MANUAL && config.enabledColumns.assignToSalesRepEmail) {
      if (rowData[17] && rowData[17].toString().trim() !== '') {
        payload.AssignToSalesRepEmail = rowData[17].toString().trim();
      }
    }
    
    // Send to webhook
    const options = {
      'method': 'POST',
      'contentType': 'application/json',
      'payload': JSON.stringify(payload),
      'muteHttpExceptions': true
    };
    
    const response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    const responseData = JSON.parse(response.getContentText());
    
    // Check for success
    let recordId = null;
    if (responseData && responseData.data && Array.isArray(responseData.data) && 
        responseData.data.length > 0 && responseData.data[0].code === "SUCCESS" && 
        responseData.data[0].details && responseData.data[0].details.id) {
      
      recordId = responseData.data[0].details.id;
      
      // Update spreadsheet with record ID and timestamp (updated column numbers)
      const sheet = SpreadsheetApp.getActiveSheet();
      sheet.getRange(rowNumber, 19).setValue('https://crm.zoho.com/crm/org820120607/tab/Leads/' + recordId);
      
      const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
      sheet.getRange(rowNumber, 20).setValue(timestamp);
      
      return {
        success: true,
        rowNumber: rowNumber,
        recordId: recordId,
        validationWarnings: validation.warnings
      };
    } else {
      return {
        success: false,
        rowNumber: rowNumber,
        error: 'Zoho API did not return a success response: ' + response.getContentText(),
        responseCode: response.getResponseCode()
      };
    }
    
  } catch (error) {
    Logger.log('Error processing row ' + rowNumber + ': ' + error.toString());
    return {
      success: false,
      rowNumber: rowNumber,
      error: 'Processing error: ' + error.toString()
    };
  }
}

/**
 * Show the progress dialog for batch processing
 */
function showProgressDialog(unsubmittedRows) {
  const html = HtmlService.createHtmlOutputFromFile('progress_dialog_ui')
    .setWidth(600)
    .setHeight(500)
    .setTitle('Sending Data to Zoho');
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Processing Rows');
  
  // Store the rows to process in script properties for the dialog to access
  const properties = PropertiesService.getScriptProperties();
  properties.setProperty('ROWS_TO_PROCESS', JSON.stringify(unsubmittedRows));
}

/**
 * Get rows to process (called from progress dialog)
 */
function getRowsToProcess() {
  const properties = PropertiesService.getScriptProperties();
  const rowsJson = properties.getProperty('ROWS_TO_PROCESS');
  return rowsJson ? JSON.parse(rowsJson) : [];
}

/**
 * Process all rows (called from progress dialog)
 */
function processAllRows() {
  const rowsToProcess = getRowsToProcess();
  const results = [];
  
  for (let i = 0; i < rowsToProcess.length; i++) {
    const row = rowsToProcess[i];
    const result = processSingleRow(row.data, row.rowNumber);
    results.push(result);
    
    // Add a small delay to prevent overwhelming the API
    Utilities.sleep(500);
  }
  
  // Clean up stored data
  const properties = PropertiesService.getScriptProperties();
  properties.deleteProperty('ROWS_TO_PROCESS');
  
  return results;
}

/**
 * Show date confirmation dialog
 */
function showDateConfirmationDialog() {
  const html = HtmlService.createHtmlOutputFromFile('date_confirmation_dialog')
    .setWidth(550)
    .setHeight(450)
    .setTitle('Campaign Date Confirmation');
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Confirm Campaign Dates');
}

/**
 * Update campaign dates and continue with processing
 */
function updateCampaignDatesAndContinue(newStartDate, newEndDate) {
  try {
    const properties = PropertiesService.getScriptProperties();
    properties.setProperty(CONFIG_CAMPAIGN_START_DATE, newStartDate);
    properties.setProperty(CONFIG_CAMPAIGN_END_DATE, newEndDate);
    
    Logger.log('Campaign dates updated: Start=' + newStartDate + ', End=' + newEndDate);
    
    // Continue with processing
    continueWithProcessing();
    
    return { success: true, message: 'Dates updated successfully' };
    
  } catch (error) {
    Logger.log('Error updating campaign dates: ' + error.toString());
    return { success: false, message: 'Error updating dates: ' + error.toString() };
  }
}
