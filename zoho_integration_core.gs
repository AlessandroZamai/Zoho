/**
 * Zoho Integration Core - Unified Processing Engine
 * Handles both automated and manual processing with shared validation and logic
 */

/**
 * Main entry point for automated processing (triggered by onEdit)
 */
function sendToWebhook(e) {
  Logger.log('sendToWebhook function started.');
  Logger.log('Event object (e): ' + JSON.stringify(e));
  
  try {
    // Check if we're in automated mode
    const config = new ZohoConfig();
    const currentConfig = config.getConfig();
    
    if (currentConfig.processingMode !== PROCESSING_MODES.AUTO) {
      Logger.log('Not in automated mode. Exiting.');
      return;
    }
    
    // Validate event and get row to process
    const rowToProcess = validateEditEvent(e);
    if (!rowToProcess) {
      return; // Event validation failed, exit silently
    }
    
    // Process single row
    const sheet = SpreadsheetApp.getActiveSheet();
    const rowData = sheet.getRange(rowToProcess, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    const result = processSingleRowUnified(rowData, rowToProcess, 'AUTO');
    
    if (!result.success) {
      ZohoErrorHandler_logError(ZOHO_ERROR_CODES.PROCESSING_ERROR, 
        new Error(result.error || 'Unknown error'), 
        { rowNumber: rowToProcess, validationErrors: result.validationErrors });
    } else {
      Logger.log('SUCCESS: Lead successfully sent to Zoho. Record ID: ' + result.recordId);
    }
    
  } catch (error) {
    ZohoErrorHandler_logError(ZOHO_ERROR_CODES.PROCESSING_ERROR, error, { event: e });
  }
  
  Logger.log('sendToWebhook function finished.');
}

/**
 * Main entry point for manual processing
 */
function sendUnsubmittedRowsToZoho() {
  Logger.log('sendUnsubmittedRowsToZoho function started.');
  
  // Check if we're in manual mode
  const currentMode = getCurrentProcessingMode();
  if (currentMode !== 'MANUAL') {
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
 * Unified function to process a single row (used by both auto and manual modes)
 */
function processSingleRowUnified(rowData, rowNumber, mode = 'MANUAL') {
  Logger.log('Processing row ' + rowNumber + ' in ' + mode + ' mode');
  
  try {
    // Validate the row first
    const validation = validateRowDataUnified(rowData, rowNumber);
    if (!validation.isValid) {
      return {
        success: false,
        rowNumber: rowNumber,
        validationErrors: validation.errors,
        validationWarnings: validation.warnings,
        error: 'Validation failed: ' + validation.errors.join(', ')
      };
    }
    
    // Build payload
    const payload = buildZohoPayload(rowData);
    if (!payload) {
      return {
        success: false,
        rowNumber: rowNumber,
        error: 'Failed to build payload - configuration incomplete'
      };
    }
    
    // Send to webhook
    const apiResult = sendToZohoAPI(payload);
    if (!apiResult.success) {
      return {
        success: false,
        rowNumber: rowNumber,
        error: apiResult.error,
        responseCode: apiResult.responseCode
      };
    }
    
    // Update spreadsheet
    const updateResult = updateSpreadsheetWithResult(rowNumber, apiResult.recordId);
    if (!updateResult.success) {
      Logger.log('Warning: Failed to update spreadsheet: ' + updateResult.error);
    }
    
    return {
      success: true,
      rowNumber: rowNumber,
      recordId: apiResult.recordId,
      validationWarnings: validation.warnings
    };
    
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
 * Build Zoho API payload from row data
 */
function buildZohoPayload(rowData) {
  try {
    // Get configuration
    const config = getConfigurationValues();
    if (!config.authTokenName || !config.authTokenValue) {
      Logger.log('Configuration incomplete - missing auth tokens');
      return null;
    }
    
    // Get campaign dates
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
    
    // Clean phone using column constants
    const phone = String(getColumnValue(rowData, 'PHONE')).replace(/[^0-9+]/g, '');
    
    // Build base payload using column constants
    const payload = {
      auth_token_name: config.authTokenName,
      auth_token_value: config.authTokenValue,
      First_Name: getColumnValue(rowData, 'FIRST_NAME'),
      Last_Name: getColumnValue(rowData, 'LAST_NAME'),
      Phone: phone,
      Email: getColumnValue(rowData, 'EMAIL'),
      Language_Preference: getColumnValue(rowData, 'PREFERRED_LANGUAGE'),
      Datahub_Src: "Google Apps Script " + ZOHO_VERSION,
      Campaign_Name: getColumnValue(rowData, 'CAMPAIGN_NAME'),
      Description: getColumnValue(rowData, 'DESCRIPTION'),
      Street: getColumnValue(rowData, 'STREET'),
      City: getColumnValue(rowData, 'CITY'),
      State: getColumnValue(rowData, 'PROVINCE'),
      Zip_Code: getColumnValue(rowData, 'POSTAL_CODE'), // "Postal Code" maps to API field "Zip_Code"
      Country: getColumnValue(rowData, 'COUNTRY'),
      Rate_Plan_Description: getColumnValue(rowData, 'RATE_PLAN'),
      Phone_Model: getColumnValue(rowData, 'DEVICE_MODEL'),
      Brand: getColumnValue(rowData, 'CURRENT_PROVIDER'),
      notify_record_owner: true,
      OrgTypeCode: config.orgTypeCode,
      Organization_Code: config.orgCode,
      Consent_to_Contact_Captured: true,
      Created_By_Email: Session.getActiveUser().getEmail(),
      Campaign_Start_Date: Utilities.formatDate(startDate, "GMT", "yyyy-MM-dd"),
      Campaign_End_Date: Utilities.formatDate(endDate, "GMT", "yyyy-MM-dd")
    };
    
    // Add assignment field based on configuration
    const assignmentValue = getColumnValue(rowData, 'ASSIGNMENT_VALUE');
    if (assignmentValue && assignmentValue.toString().trim() !== '') {
      switch (config.leadAssignment) {
        case 'Store':
          payload.ChannelOutletId = assignmentValue.toString().trim();
          break;
        case 'Sales_Rep':
          payload.AssignToSalesRepEmail = assignmentValue.toString().trim();
          break;
        // ADMIN assignment doesn't need a value in the payload
      }
    }
    
    Logger.log('Payload built successfully');
    return payload;
    
  } catch (error) {
    Logger.log('Error building payload: ' + error.toString());
    return null;
  }
}

/**
 * Send payload to Zoho API
 */
function sendToZohoAPI(payload) {
  try {
    const options = {
      'method': 'POST',
      'contentType': 'application/json',
      'payload': JSON.stringify(payload),
      'muteHttpExceptions': true
    };
    
    const response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    Logger.log('Webhook response code: ' + responseCode);
    Logger.log('Webhook response: ' + responseText);
    
    // Parse response
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      return {
        success: false,
        error: 'Failed to parse API response: ' + parseError.toString(),
        responseCode: responseCode
      };
    }
    
    // Extract record ID
    let recordId = null;
    if (responseData && responseData.data && Array.isArray(responseData.data) && 
        responseData.data.length > 0 && responseData.data[0].code === "SUCCESS" && 
        responseData.data[0].details && responseData.data[0].details.id) {
      
      recordId = responseData.data[0].details.id;
      Logger.log('Record ID extracted: ' + recordId);
      
      return {
        success: true,
        recordId: recordId
      };
    } else {
      return {
        success: false,
        error: 'Zoho API did not return a success response: ' + responseText,
        responseCode: responseCode
      };
    }
    
  } catch (error) {
    Logger.log('Error calling Zoho API: ' + error.toString());
    return {
      success: false,
      error: 'API call failed: ' + error.toString()
    };
  }
}

/**
 * Update spreadsheet with processing result
 */
function updateSpreadsheetWithResult(rowNumber, recordId) {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    
    // Update record ID column using column constants
    const recordUrlColumn = getColumnIndex('ZOHO_RECORD_URL') + 1; // Convert to 1-based index for getRange
    sheet.getRange(rowNumber, recordUrlColumn).setValue('https://crm.zoho.com/crm/org820120607/tab/Leads/' + recordId);
    
    // Update timestamp column using column constants
    const timestampColumn = getColumnIndex('TIME_CREATED') + 1; // Convert to 1-based index for getRange
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
    sheet.getRange(rowNumber, timestampColumn).setValue(timestamp);
    
    Logger.log('Spreadsheet updated for row ' + rowNumber);
    return { success: true };
    
  } catch (error) {
    Logger.log('Error updating spreadsheet: ' + error.toString());
    return { 
      success: false, 
      error: error.toString() 
    };
  }
}

/**
 * Validate edit event for automated processing
 */
function validateEditEvent(e) {
  // Check if event is valid
  if (!e || !e.range) {
    Logger.log('Not an onEdit event or range not found. Exiting.');
    return null;
  }
  
  const rowToProcess = e.range.getLastRow();
  
  // Check for header row and example data row
  if (rowToProcess == 1 || rowToProcess == 2) {
    Logger.log('Header row or example data row change detected. Ignoring.');
    return null;
  }
  
  Logger.log('Change detected in row: ' + rowToProcess);
  
  // Check if row has already been processed using column constants
  const sheet = SpreadsheetApp.getActiveSheet();
  const recordUrlColumn = getColumnIndex('ZOHO_RECORD_URL') + 1; // Convert to 1-based index
  const recordIdCell = sheet.getRange(rowToProcess, recordUrlColumn).getValue();
  if (recordIdCell && recordIdCell.toString().trim() !== '') {
    Logger.log('Row ' + rowToProcess + ' has already been processed. Ignoring.');
    return null;
  }
  
  // Check if assignment column has data when ADMIN assignment is configured
  const config = getConfigurationValues();
  if (config.leadAssignment === 'ADMIN') {
    const assignmentColumn = getColumnIndex('ASSIGNMENT_VALUE') + 1; // Convert to 1-based index
    const assignmentValue = sheet.getRange(rowToProcess, assignmentColumn).getValue();
    if (assignmentValue && assignmentValue.toString().trim() !== '') {
      Logger.log('Row ' + rowToProcess + ' has data in assignment column but ADMIN assignment is configured. Ignoring.');
      return null;
    }
  }
  
  return rowToProcess;
}

/**
 * Get all rows that haven't been submitted to Zoho yet
 */
function getUnsubmittedRows() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const lastRow = sheet.getLastRow();
  
  if (lastRow <= 1) {
    return []; // No data rows (only header)
  }
  
  const unsubmittedRows = [];
  const recordUrlColumn = getColumnIndex('ZOHO_RECORD_URL') + 1; // Convert to 1-based index
  
  // Start from row 2 (skip header)
  for (let rowNum = 2; rowNum <= lastRow; rowNum++) {
    // Check if Record ID column is empty using column constants
    const recordIdCell = sheet.getRange(rowNum, recordUrlColumn).getValue();
    
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
 * Process all rows (called from progress dialog)
 */
function processAllRows() {
  const rowsToProcess = getRowsToProcess();
  const results = [];
  
  for (let i = 0; i < rowsToProcess.length; i++) {
    const row = rowsToProcess[i];
    const result = processSingleRowUnified(row.data, row.rowNumber, 'MANUAL');
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
 * Get count of already processed rows (for UI feedback)
 */
function getProcessedRowsCount() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const lastRow = sheet.getLastRow();
  
  if (lastRow <= 1) {
    return { processedCount: 0, totalDataRows: 0 };
  }
  
  let processedCount = 0;
  let totalDataRows = 0;
  const recordUrlColumn = getColumnIndex('ZOHO_RECORD_URL') + 1; // Convert to 1-based index
  
  // Start from row 2 (skip header)
  for (let rowNum = 2; rowNum <= lastRow; rowNum++) {
    // Get all data for this row
    const rowData = sheet.getRange(rowNum, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Check if row has any data (not completely empty)
    const hasData = rowData.some(cell => cell && cell.toString().trim() !== '');
    
    if (hasData) {
      totalDataRows++;
      
      // Check if Record ID column has data using column constants
      const recordIdCell = sheet.getRange(rowNum, recordUrlColumn).getValue();
      if (recordIdCell && recordIdCell.toString().trim() !== '') {
        processedCount++;
      }
    }
  }
  
  return { processedCount, totalDataRows };
}

/**
 * Show date confirmation dialog
 */
function showDateConfirmationDialog() {
  const html = HtmlService.createHtmlOutputFromFile('zoho_unified_ui')
    .setWidth(550)
    .setHeight(450)
    .setTitle('Campaign Date Confirmation');
  
  // Add a script to automatically show the date confirmation step
  const htmlWithScript = html.getContent().replace(
    'window.onload = function() {',
    'window.onload = function() { showDateConfirmationStep(); return; '
  );
  
  const modifiedHtml = HtmlService.createHtmlOutput(htmlWithScript)
    .setWidth(550)
    .setHeight(450)
    .setTitle('Campaign Date Confirmation');
  
  SpreadsheetApp.getUi().showModalDialog(modifiedHtml, 'Confirm Campaign Dates');
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
