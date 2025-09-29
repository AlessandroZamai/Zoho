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
 * Build Zoho API payload from row data using dynamic field mapping
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
    
    // Build base payload with required system fields
    const payload = {
      auth_token_name: config.authTokenName,
      auth_token_value: config.authTokenValue,
      Datahub_Src: "Google Apps Script",
      notify_record_owner: true,
      OrgTypeCode: config.orgTypeCode,
      Organization_Code: config.orgCode,
      Consent_to_Contact_Captured: true,
      Created_By_Email: Session.getActiveUser().getEmail(),
      Campaign_Start_Date: Utilities.formatDate(startDate, "GMT", "yyyy-MM-dd"),
      Campaign_End_Date: Utilities.formatDate(endDate, "GMT", "yyyy-MM-dd")
    };
    
    // Get selected fields and build payload dynamically
    const selectedFields = getSelectedFields();
    
    selectedFields.forEach((field, index) => {
      if (field.apiName !== 'Zoho_Record_URL' && field.apiName !== 'Time_Created_in_Zoho' && field.apiName !== 'AssignmentValue') {
        const value = rowData[index];
        
        if (value !== null && value !== undefined && value !== '') {
          // Special handling for phone field
          if (field.apiName === 'Phone') {
            payload[field.apiName] = String(value).replace(/[^0-9+]/g, '');
          } else {
            payload[field.apiName] = value;
          }
        }
      }
    });
    
    // Handle assignment field based on configuration
    const assignmentField = selectedFields.find(f => f.apiName === 'AssignmentValue');
    if (assignmentField) {
      const assignmentIndex = selectedFields.indexOf(assignmentField);
      const assignmentValue = rowData[assignmentIndex];
      
      if (assignmentValue && assignmentValue.toString().trim() !== '') {
        switch (config.leadAssignment) {
          case 'Store':
            payload.ChannelOutletId_Updated = assignmentValue.toString().trim();
            break;
          case 'Sales_Rep':
            payload.AssignToSalesRepEmail = assignmentValue.toString().trim();
            break;
          // ADMIN assignment doesn't need a value in the payload
        }
      }
    }
    
    Logger.log('Payload built successfully using dynamic field mapping');
    Logger.log('=== PAYLOAD DETAILS ===');
    Logger.log('Full payload: ' + JSON.stringify(payload, null, 2));
    Logger.log('Payload size: ' + JSON.stringify(payload).length + ' characters');
    Logger.log('Selected fields: ' + selectedFields.map(f => f.displayName).join(', '));
    Logger.log('======================');
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
    
    Logger.log('=== API REQUEST DETAILS ===');
    Logger.log('Webhook URL: ' + WEBHOOK_URL);
    Logger.log('Request method: ' + options.method);
    Logger.log('Content type: ' + options.contentType);
    Logger.log('Request payload: ' + options.payload);
    Logger.log('===========================');
    
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
    
    // Update record ID column using dynamic field mapping
    try {
      const recordUrlColumn = getColumnIndexByApiName('Zoho_Record_URL') + 1; // Convert to 1-based index for getRange
      sheet.getRange(rowNumber, recordUrlColumn).setValue(buildZohoRecordUrl(recordId));
    } catch (error) {
      Logger.log('Warning: Could not update Zoho Record URL column - ' + error.toString());
    }
    
    // Update timestamp column using dynamic field mapping
    try {
      const timestampColumn = getColumnIndexByApiName('Time_Created_in_Zoho') + 1; // Convert to 1-based index for getRange
      const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
      sheet.getRange(rowNumber, timestampColumn).setValue(timestamp);
    } catch (error) {
      Logger.log('Warning: Could not update timestamp column - ' + error.toString());
    }
    
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
  
  // Check if row has already been processed using dynamic field mapping
  const sheet = SpreadsheetApp.getActiveSheet();
  try {
    const recordUrlColumn = getColumnIndexByApiName('Zoho_Record_URL') + 1; // Convert to 1-based index
    const recordIdCell = sheet.getRange(rowToProcess, recordUrlColumn).getValue();
    if (recordIdCell && recordIdCell.toString().trim() !== '') {
      Logger.log('Row ' + rowToProcess + ' has already been processed. Ignoring.');
      return null;
    }
  } catch (error) {
    Logger.log('Warning: Could not check Zoho Record URL column - ' + error.toString());
  }
  
  // Check if assignment column has data when ADMIN assignment is configured
  const config = getConfigurationValues();
  if (config.leadAssignment === 'ADMIN') {
    try {
      const assignmentColumn = getColumnIndexByApiName('AssignmentValue') + 1; // Convert to 1-based index
      const assignmentValue = sheet.getRange(rowToProcess, assignmentColumn).getValue();
      if (assignmentValue && assignmentValue.toString().trim() !== '') {
        Logger.log('Row ' + rowToProcess + ' has data in assignment column but ADMIN assignment is configured. Ignoring.');
        return null;
      }
    } catch (error) {
      Logger.log('Warning: Could not check assignment column - ' + error.toString());
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
  
  // Try to get the record URL column using dynamic mapping
  let recordUrlColumn;
  try {
    recordUrlColumn = getColumnIndexByApiName('Zoho_Record_URL') + 1; // Convert to 1-based index
  } catch (error) {
    Logger.log('Warning: Could not find Zoho_Record_URL column - ' + error.toString());
    recordUrlColumn = null;
  }
  
  // Start from row 2 (skip header)
  for (let rowNum = 2; rowNum <= lastRow; rowNum++) {
    let isUnsubmitted = true;
    
    // Check if Record ID column is empty (if we found the column)
    if (recordUrlColumn) {
      try {
        const recordIdCell = sheet.getRange(rowNum, recordUrlColumn).getValue();
        if (recordIdCell && recordIdCell.toString().trim() !== '') {
          isUnsubmitted = false;
        }
      } catch (error) {
        Logger.log('Warning: Could not check record URL for row ' + rowNum + ' - ' + error.toString());
      }
    }
    
    if (isUnsubmitted) {
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
 * Finds duplicate rows based on Phone and Email columns and gathers statistics.
 * @returns {object} An object containing duplicate row information:
 *                   { Set<number> } allDuplicateRows: All subsequent rows identified as duplicates.
 *                   { Set<number> } unsubmittedDuplicateRows: Duplicate rows that haven't been submitted.
 *                   { Array<object> } duplicateStats: Sorted list of duplicate values and their counts.
 */
function findDuplicateRows() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = sheet.getDataRange().getValues();

  // Get column indices
  let phoneColIdx, emailColIdx, recordUrlColIdx;
  try {
    phoneColIdx = getColumnIndexByApiName('Phone');
    emailColIdx = getColumnIndexByApiName('Email');
    recordUrlColIdx = getColumnIndexByApiName('Zoho_Record_URL');
  } catch (e) {
    Logger.log("Error getting column indices for duplicate check: " + e.message);
    return { allDuplicateRows: new Set(), unsubmittedDuplicateRows: new Set(), duplicateStats: [] };
  }

  // Pass 1: Collect all occurrences of each phone and email
  const phoneOccurrences = new Map();
  const emailOccurrences = new Map();
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowNumber = i + 1;
    const phone = row[phoneColIdx] ? String(row[phoneColIdx]).replace(/[^0-9]/g, '') : '';
    const email = row[emailColIdx] ? String(row[emailColIdx]).trim().toLowerCase() : '';

    if (phone) {
      if (!phoneOccurrences.has(phone)) phoneOccurrences.set(phone, []);
      phoneOccurrences.get(phone).push(rowNumber);
    }
    if (email) {
      if (!emailOccurrences.has(email)) emailOccurrences.set(email, []);
      emailOccurrences.get(email).push(rowNumber);
    }
  }

  // Pass 2: Identify duplicates and gather stats
  const allDuplicateRows = new Set();
  const statsMap = new Map();

  const processOccurrences = (occurrencesMap, type) => {
    for (const [value, rows] of occurrencesMap.entries()) {
      if (rows.length > 1) {
        // The first row is the original, the rest are duplicates.
        rows.slice(1).forEach(rowNum => allDuplicateRows.add(rowNum));
        // Add stats for this value
        statsMap.set(value, { count: rows.length, type });
      }
    }
  };

  processOccurrences(phoneOccurrences, 'Phone');
  processOccurrences(emailOccurrences, 'Email');

  // Pass 3: Identify which duplicate rows are unsubmitted
  const unsubmittedDuplicateRows = new Set();
  for (const rowNumber of allDuplicateRows) {
    const recordUrl = data[rowNumber - 1][recordUrlColIdx] ? String(data[rowNumber - 1][recordUrlColIdx]).trim() : '';
    if (!recordUrl) {
      unsubmittedDuplicateRows.add(rowNumber);
    }
  }

  // Final step: Sort stats and return
  const sortedStats = Array.from(statsMap.entries())
    .map(([value, { count, type }]) => ({ value, count, type }))
    .sort((a, b) => b.count - a.count);

  Logger.log(`Found ${allDuplicateRows.size} duplicate rows, ${unsubmittedDuplicateRows.size} of which are unsubmitted.`);
  Logger.log(`Duplicate stats collected for ${sortedStats.length} unique values.`);

  return { allDuplicateRows, unsubmittedDuplicateRows, duplicateStats: sortedStats };
}


/**
 * Process all rows (called from progress dialog)
 */
function processAllRows() {
  const rowsToProcess = getRowsToProcess();
  const results = [];
  
  // Find all duplicates in the sheet before processing
  const { allDuplicateRows, unsubmittedDuplicateRows, duplicateStats } = findDuplicateRows();

  for (let i = 0; i < rowsToProcess.length; i++) {
    const row = rowsToProcess[i];

    // Check if the current row is a duplicate
    if (allDuplicateRows.has(row.rowNumber)) {
      // If it's a duplicate, create a specific result and skip normal processing
      results.push({
        success: false,
        rowNumber: row.rowNumber,
        error: 'Duplicate phone or email',
        isDuplicate: true // Custom flag for the UI
      });
    } else {
      // If not a duplicate, process as usual
      const result = processSingleRowUnified(row.data, row.rowNumber, 'MANUAL');
      results.push(result);
    }
  }
  
  // Clean up stored data
  const properties = PropertiesService.getScriptProperties();
  properties.deleteProperty('ROWS_TO_PROCESS');
  
  // Return a comprehensive object with results and duplicate info
  return {
    results: results,
    unsubmittedDuplicateRows: Array.from(unsubmittedDuplicateRows),
    duplicateStats: duplicateStats
  };
}

/**
 * Deletes specified rows from the active sheet.
 * @param {number[]} rowNumbers An array of row numbers to delete.
 * @returns {object} An object indicating success or failure.
 */
function deleteSheetRows(rowNumbers) {
  if (!rowNumbers || !Array.isArray(rowNumbers) || rowNumbers.length === 0) {
    return { success: false, error: "No row numbers provided." };
  }

  const sheet = SpreadsheetApp.getActiveSheet();
  // Sort rows in descending order to avoid shifting issues
  const sortedRowNumbers = rowNumbers.sort((a, b) => b - a);
  let deletedCount = 0;

  try {
    for (const rowNumber of sortedRowNumbers) {
      sheet.deleteRow(rowNumber);
      deletedCount++;
    }
    Logger.log(`Successfully deleted ${deletedCount} rows.`);
    return { success: true, deletedCount: deletedCount };
  } catch (e) {
    Logger.log(`Error deleting rows: ${e.message}`);
    return { success: false, error: e.message };
  }
}

/**
 * Shows the standalone dialog for finding and deleting duplicates.
 * This is called from the custom menu.
 */
function showDuplicateDeletionDialog() {
  const ui = SpreadsheetApp.getUi();

  // Step 1: Find all duplicates and get stats
  const { unsubmittedDuplicateRows, duplicateStats } = findDuplicateRows();
  const unsubmittedArray = Array.from(unsubmittedDuplicateRows);

  // Step 2: Check if there's anything to do
  if (unsubmittedArray.length === 0) {
    ui.alert('No Unsubmitted Duplicates Found', 'The scan completed successfully and found no unsubmitted duplicate rows.', ui.ButtonSet.OK);
    return;
  }

  // Step 3: Prepare data for the dialog
  const dialogData = {
    unsubmittedDuplicateRows: unsubmittedArray,
    topStats: duplicateStats.slice(0, 3) // Get the top 3 stats
  };

  // Step 4: Show the dialog using the generic function
  showDuplicateDialogWithData(dialogData);
}

/**
 * Shows the duplicate deletion dialog with pre-fetched data.
 * @param {object} dialogData The data to show in the dialog.
 */
function showDuplicateDialogWithData(dialogData) {
  const template = HtmlService.createTemplateFromFile('duplicate_deletion_dialog');
  template.data = JSON.stringify(dialogData);

  const htmlOutput = template.evaluate()
    .setWidth(450)
    .setHeight(350);

  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Find & Delete Duplicates');
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
  
  // Try to get the record URL column using dynamic mapping
  let recordUrlColumn;
  try {
    recordUrlColumn = getColumnIndexByApiName('Zoho_Record_URL') + 1; // Convert to 1-based index
  } catch (error) {
    Logger.log('Warning: Could not find Zoho_Record_URL column - ' + error.toString());
    recordUrlColumn = null;
  }
  
  // Start from row 2 (skip header)
  for (let rowNum = 2; rowNum <= lastRow; rowNum++) {
    // Get all data for this row
    const rowData = sheet.getRange(rowNum, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Check if row has any data (not completely empty)
    const hasData = rowData.some(cell => cell && cell.toString().trim() !== '');
    
    if (hasData) {
      totalDataRows++;
      
      // Check if Record ID column has data (if we found the column)
      if (recordUrlColumn) {
        try {
          const recordIdCell = sheet.getRange(rowNum, recordUrlColumn).getValue();
          if (recordIdCell && recordIdCell.toString().trim() !== '') {
            processedCount++;
          }
        } catch (error) {
          Logger.log('Warning: Could not check record URL for row ' + rowNum + ' - ' + error.toString());
        }
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
