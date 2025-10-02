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
    // Check if setup completion date differs from today (for manual processing date tracking)
    const properties = PropertiesService.getScriptProperties();
    const setupDate = properties.getProperty(CONFIG_SETUP_COMPLETION_DATE);
    const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    
    // Only show date confirmation if setup was completed on a different day
    // This allows users to set future campaign dates without being prompted every time
    if (setupDate && setupDate !== today) {
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
function processSingleRowUnified(rowData, rowNumber, mode = 'MANUAL', cachedData = null) {
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
    
    // Build payload using cached data if available
    const payload = cachedData ? 
      buildZohoPayloadOptimized(rowData, cachedData) : 
      buildZohoPayload(rowData);
    
    if (!payload) {
      return {
        success: false,
        rowNumber: rowNumber,
        error: 'Failed to build payload - configuration incomplete'
      };
    }
    
    // Send to webhook
    const apiResult = sendToZohoAPI(payload, mode === 'MANUAL');
    if (!apiResult.success) {
      return {
        success: false,
        rowNumber: rowNumber,
        error: apiResult.error,
        responseCode: apiResult.responseCode
      };
    }
    
    return {
      success: true,
      rowNumber: rowNumber,
      recordId: apiResult.recordId,
      validationWarnings: validation.warnings,
      updateData: {
        recordUrl: buildZohoRecordUrl(apiResult.recordId),
        timestamp: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss")
      }
    };
    
  } catch (error) {
    Logger.log('ERROR Row ' + rowNumber + ': ' + error.toString());
    return {
      success: false,
      rowNumber: rowNumber,
      error: 'Processing error: ' + error.toString()
    };
  }
}

/**
 * Build Zoho API payload from row data using dynamic field mapping
 * @param {Array} rowData - The row data array
 * @returns {Object|null} The payload object or null if configuration is incomplete
 * @throws {Error} If critical errors occur during payload building
 */
function buildZohoPayload(rowData) {
  try {
    // Validate input
    if (!rowData || !Array.isArray(rowData)) {
      throw new Error('Invalid row data: must be a non-empty array');
    }
    
    // Get configuration
    const config = getConfigurationValues();
    if (!config.authTokenName || !config.authTokenValue) {
      const error = new Error('Configuration incomplete - missing auth tokens');
      ZohoErrorHandler_logError(ZOHO_ERROR_CODES.CONFIGURATION_ERROR, error, { config });
      return null;
    }
    
    if (!config.orgCode || !config.orgTypeCode) {
      const error = new Error('Configuration incomplete - missing organization settings');
      ZohoErrorHandler_logError(ZOHO_ERROR_CODES.CONFIGURATION_ERROR, error, { config });
      return null;
    }
    
    // Get campaign dates
    let startDate, endDate;
    if (config.campaignStartDate && config.campaignEndDate) {
      startDate = new Date(config.campaignStartDate);
      endDate = new Date(config.campaignEndDate);
    } else {
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
    
    // Get visible fields to match spreadsheet structure
    const visibleFields = getVisibleFields();
    
    visibleFields.forEach((field, index) => {
      if (field.apiName !== 'Zoho_Record_URL' && field.apiName !== 'Time_Created_in_Zoho' && field.apiName !== 'AssignmentValue') {
        const value = rowData[index];
        
        if (value !== null && value !== undefined && value !== '') {
          if (field.apiName === 'Phone') {
            payload[field.apiName] = normalizePhoneNumber(value);
          } else {
            payload[field.apiName] = value;
          }
        }
      }
    });
    
    // Handle assignment field based on configuration
    const assignmentField = visibleFields.find(f => f.apiName === 'AssignmentValue');
    if (assignmentField) {
      const assignmentIndex = visibleFields.indexOf(assignmentField);
      const assignmentValue = rowData[assignmentIndex];
      
      if (assignmentValue && assignmentValue.toString().trim() !== '') {
        switch (config.leadAssignment) {
          case 'Store':
            payload.ChannelOutletId_Updated = assignmentValue.toString().trim();
            break;
          case 'Sales_Rep':
            payload.AssignToSalesRepEmail = assignmentValue.toString().trim();
            break;
        }
      }
    }
    
    return payload;
    
  } catch (error) {
    Logger.log('ERROR building payload: ' + error.toString());
    return null;
  }
}

/**
 * Optimized payload builder using cached configuration data
 */
function buildZohoPayloadOptimized(rowData, cachedData) {
  try {
    const { config, visibleFields, campaignDates } = cachedData;
    
    const payload = {
      auth_token_name: config.authTokenName,
      auth_token_value: config.authTokenValue,
      Datahub_Src: "Google Apps Script",
      notify_record_owner: true,
      OrgTypeCode: config.orgTypeCode,
      Organization_Code: config.orgCode,
      Consent_to_Contact_Captured: true,
      Created_By_Email: Session.getActiveUser().getEmail(),
      Campaign_Start_Date: campaignDates.startDate,
      Campaign_End_Date: campaignDates.endDate
    };
    
    visibleFields.forEach((field, index) => {
      if (field.apiName !== 'Zoho_Record_URL' && field.apiName !== 'Time_Created_in_Zoho' && field.apiName !== 'AssignmentValue') {
        const value = rowData[index];
        if (value !== null && value !== undefined && value !== '') {
          payload[field.apiName] = field.apiName === 'Phone' ? normalizePhoneNumber(value) : value;
        }
      }
    });
    
    const assignmentField = visibleFields.find(f => f.apiName === 'AssignmentValue');
    if (assignmentField) {
      const assignmentValue = rowData[visibleFields.indexOf(assignmentField)];
      if (assignmentValue && assignmentValue.toString().trim() !== '') {
        switch (config.leadAssignment) {
          case 'Store':
            payload.ChannelOutletId_Updated = assignmentValue.toString().trim();
            break;
          case 'Sales_Rep':
            payload.AssignToSalesRepEmail = assignmentValue.toString().trim();
            break;
        }
      }
    }
    
    return payload;
  } catch (error) {
    Logger.log('ERROR in optimized payload builder: ' + error.toString());
    return null;
  }
}

/**
 * Send payload to Zoho API
 * @param {Object} payload - The payload to send to Zoho
 * @param {Boolean} verboseLogging - Whether to log detailed request/response info
 * @returns {Object} Result object with success status and data or error
 */
function sendToZohoAPI(payload, verboseLogging = false) {
  try {
    // Validate payload
    if (!payload || typeof payload !== 'object') {
      const error = new Error('Invalid payload: must be a non-null object');
      ZohoErrorHandler_logError(ZOHO_ERROR_CODES.API_ERROR, error, { payload });
      return { success: false, error: error.message };
    }
    
    const options = {
      'method': 'POST',
      'contentType': 'application/json',
      'payload': JSON.stringify(payload),
      'muteHttpExceptions': true
    };
    
    const response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    // Check for HTTP errors
    if (responseCode < 200 || responseCode >= 300) {
      const error = new Error(`HTTP ${responseCode}: ${responseText}`);
      ZohoErrorHandler_logError(ZOHO_ERROR_CODES.API_ERROR, error, { 
        responseCode, 
        responseText,
        payload: JSON.stringify(payload).substring(0, 500)
      });
      
      // Try to extract error message from response
      let errorMessage = `API returned HTTP ${responseCode}`;
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (parseError) {
        // Silent fail on parse error
      }
      
      return {
        success: false,
        error: errorMessage,
        responseCode: responseCode
      };
    }
    
    // Parse response
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      Logger.log('ERROR: Failed to parse API response: ' + parseError.toString());
      return {
        success: false,
        error: 'Failed to parse API response: ' + parseError.toString(),
        responseCode: responseCode
      };
    }
    
    // Extract record ID
    if (responseData && responseData.data && Array.isArray(responseData.data) && 
        responseData.data.length > 0 && responseData.data[0].code === "SUCCESS" && 
        responseData.data[0].details && responseData.data[0].details.id) {
      
      return {
        success: true,
        recordId: responseData.data[0].details.id
      };
    } else {
      Logger.log('ERROR: Zoho API did not return success: ' + responseText);
      return {
        success: false,
        error: 'Zoho API did not return a success response',
        responseCode: responseCode
      };
    }
    
  } catch (error) {
    Logger.log('ERROR calling Zoho API: ' + error.toString());
    return {
      success: false,
      error: 'API call failed: ' + error.toString()
    };
  }
}

/**
 * Batch update spreadsheet with multiple row results
 * @param {Array} updates - Array of {rowNumber, recordUrl, timestamp} objects
 */
function batchUpdateSpreadsheet(updates) {
  if (!updates || updates.length === 0) return { success: true };
  
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const visibleFields = getVisibleFields();
    
    const recordUrlField = visibleFields.find(f => f.apiName === 'Zoho_Record_URL');
    const timestampField = visibleFields.find(f => f.apiName === 'Time_Created_in_Zoho');
    
    if (!recordUrlField || !timestampField) {
      Logger.log('ERROR: Could not find required columns for batch update');
      return { success: false, error: 'Missing required columns' };
    }
    
    const recordUrlColumn = visibleFields.indexOf(recordUrlField) + 1;
    const timestampColumn = visibleFields.indexOf(timestampField) + 1;
    
    // Prepare batch updates
    updates.forEach(update => {
      if (update.recordUrl) {
        sheet.getRange(update.rowNumber, recordUrlColumn).setValue(update.recordUrl);
      }
      if (update.timestamp) {
        sheet.getRange(update.rowNumber, timestampColumn).setValue(update.timestamp);
      }
    });
    
    return { success: true };
    
  } catch (error) {
    Logger.log('ERROR in batch update: ' + error.toString());
    return { success: false, error: error.toString() };
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
 * OPTIMIZED: Uses batch reading instead of row-by-row iteration
 */
function getUnsubmittedRows() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const lastRow = sheet.getLastRow();
  
  if (lastRow <= 1) {
    return []; // No data rows (only header)
  }
  
  const unsubmittedRows = [];
  
  // Try to get the record URL column using dynamic mapping
  let recordUrlColumnIndex;
  try {
    recordUrlColumnIndex = getColumnIndexByApiName('Zoho_Record_URL'); // 0-based index
  } catch (error) {
    Logger.log('Warning: Could not find Zoho_Record_URL column - ' + error.toString());
    recordUrlColumnIndex = null;
  }
  
  // OPTIMIZATION: Read all data at once instead of row-by-row
  const numRows = lastRow - 1; // Exclude header row
  const numCols = sheet.getLastColumn();
  const allData = sheet.getRange(2, 1, numRows, numCols).getValues();
  
  // Process each row from the batch-read data
  for (let i = 0; i < allData.length; i++) {
    const rowData = allData[i];
    const rowNumber = i + 2; // Add 2 because we start from row 2 (1-based)
    
    // Check if row has any data (not completely empty)
    const hasData = rowData.some(cell => cell && cell.toString().trim() !== '');
    
    if (!hasData) {
      continue; // Skip empty rows
    }
    
    // Check if Record URL column is empty (if we found the column)
    let isUnsubmitted = true;
    if (recordUrlColumnIndex !== null && recordUrlColumnIndex < rowData.length) {
      const recordUrlValue = rowData[recordUrlColumnIndex];
      if (recordUrlValue && recordUrlValue.toString().trim() !== '') {
        isUnsubmitted = false;
      }
    }
    
    if (isUnsubmitted) {
      unsubmittedRows.push({
        rowNumber: rowNumber,
        data: rowData
      });
    }
  }
  
  Logger.log(`Found ${unsubmittedRows.length} unsubmitted rows out of ${numRows} total data rows`);
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
    recordUrlColIdx = getColumnIndexByApiName('Zoho_Record_URL');
    
    // Email column is optional - check if it exists in selected fields
    emailColIdx = null;
    const selectedFields = getSelectedFields();
    const emailField = selectedFields.find(f => f.apiName === 'Email');
    if (emailField) {
      const emailFieldIndex = selectedFields.indexOf(emailField);
      emailColIdx = emailFieldIndex;
      Logger.log("Email column found at index: " + emailColIdx);
    } else {
      Logger.log("Email column not in selected fields, skipping email duplicate check");
    }
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
    
    // Use standardized phone normalization
    const phone = row[phoneColIdx] ? normalizePhoneNumber(row[phoneColIdx]) : '';
    
    // Use standardized email validation for normalization
    const emailValidation = row[emailColIdx] ? validateEmailAddress(row[emailColIdx]) : { isValid: false };
    const email = emailValidation.isValid && emailValidation.normalized ? emailValidation.normalized : '';

    // Only process non-empty phone numbers
    if (phone && phone.length > 0) {
      if (!phoneOccurrences.has(phone)) phoneOccurrences.set(phone, []);
      phoneOccurrences.get(phone).push(rowNumber);
    }
    
    // Only process non-empty emails that contain @ symbol (basic validation) and only if email column exists
    if (emailColIdx !== null && email && email.length > 0 && email.includes('@')) {
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
 * Process all rows with optimizations (called from progress dialog)
 */
function processAllRows() {
  const startTime = new Date().getTime();
  const rowsToProcess = getRowsToProcess();
  const results = [];
  const spreadsheetUpdates = [];
  
  Logger.log(`Starting batch processing of ${rowsToProcess.length} rows`);
  
  // Find all duplicates in the sheet before processing
  const { allDuplicateRows, unsubmittedDuplicateRows, duplicateStats } = findDuplicateRows();

  // Cache configuration data to avoid repeated calls
  const config = getConfigurationValues();
  const visibleFields = getVisibleFields();
  
  let startDate, endDate;
  if (config.campaignStartDate && config.campaignEndDate) {
    startDate = new Date(config.campaignStartDate);
    endDate = new Date(config.campaignEndDate);
  } else {
    startDate = new Date();
    const campaign_length = 30;
    endDate = new Date(startDate.getTime() + campaign_length * 24 * 60 * 60 * 1000);
  }
  
  const cachedData = {
    config: config,
    visibleFields: visibleFields,
    campaignDates: {
      startDate: Utilities.formatDate(startDate, "GMT", "yyyy-MM-dd"),
      endDate: Utilities.formatDate(endDate, "GMT", "yyyy-MM-dd")
    }
  };

  // Process each row
  for (let i = 0; i < rowsToProcess.length; i++) {
    const row = rowsToProcess[i];

    // Check if the current row is a duplicate
    if (allDuplicateRows.has(row.rowNumber)) {
      results.push({
        success: false,
        rowNumber: row.rowNumber,
        error: 'Duplicate phone or email',
        isDuplicate: true
      });
    } else {
      // Process with cached data
      const result = processSingleRowUnified(row.data, row.rowNumber, 'MANUAL', cachedData);
      results.push(result);
      
      // Collect spreadsheet updates for batch processing
      if (result.success && result.updateData) {
        spreadsheetUpdates.push({
          rowNumber: row.rowNumber,
          recordUrl: result.updateData.recordUrl,
          timestamp: result.updateData.timestamp
        });
      }
    }
  }
  
  // Batch update spreadsheet
  if (spreadsheetUpdates.length > 0) {
    Logger.log(`Batch updating ${spreadsheetUpdates.length} rows in spreadsheet`);
    batchUpdateSpreadsheet(spreadsheetUpdates);
  }
  
  // Clean up stored data
  const properties = PropertiesService.getScriptProperties();
  properties.deleteProperty('ROWS_TO_PROCESS');
  
  const totalTime = (new Date().getTime() - startTime) / 1000;
  Logger.log(`Batch processing completed in ${totalTime.toFixed(2)} seconds`);
  Logger.log(`Average: ${(totalTime / rowsToProcess.length).toFixed(2)} seconds per row`);
  
  // Return a comprehensive object with results and duplicate info
  return {
    results: results,
    unsubmittedDuplicateRows: Array.from(unsubmittedDuplicateRows),
    duplicateStats: duplicateStats,
    processingTime: totalTime
  };
}

/**
 * Process rows in batches with progress tracking
 * @param {number} startIndex - Starting index in the rows array
 * @param {number} batchSize - Number of rows to process in this batch
 * @returns {Object} Batch processing results with progress info
 */
function processRowBatch(startIndex, batchSize) {
  const properties = PropertiesService.getUserProperties();
  const cache = CacheService.getScriptCache();
  
  // Check if processing is paused at the start
  const isPaused = properties.getProperty('BATCH_PROCESSING_PAUSED') === 'true';
  if (isPaused) {
    return {
      paused: true,
      message: 'Processing is paused',
      nextIndex: startIndex,
      totalRows: getRowsToProcess().length,
      processedCount: startIndex
    };
  }
  
  const rowsToProcess = getRowsToProcess();
  const endIndex = Math.min(startIndex + batchSize, rowsToProcess.length);
  const results = [];
  const spreadsheetUpdates = [];
  
  const batchStartTime = new Date().getTime();
  
  // Get cached data or create it
  let cachedData;
  const cachedDataJson = cache.get('PROCESSING_CACHE');
  if (cachedDataJson) {
    cachedData = JSON.parse(cachedDataJson);
  } else {
    const config = getConfigurationValues();
    const visibleFields = getVisibleFields();
    
    let startDate, endDate;
    if (config.campaignStartDate && config.campaignEndDate) {
      startDate = new Date(config.campaignStartDate);
      endDate = new Date(config.campaignEndDate);
    } else {
      startDate = new Date();
      const campaign_length = 30;
      endDate = new Date(startDate.getTime() + campaign_length * 24 * 60 * 60 * 1000);
    }
    
    cachedData = {
      config: config,
      visibleFields: visibleFields,
      campaignDates: {
        startDate: Utilities.formatDate(startDate, "GMT", "yyyy-MM-dd"),
        endDate: Utilities.formatDate(endDate, "GMT", "yyyy-MM-dd")
      }
    };
    
    cache.put('PROCESSING_CACHE', JSON.stringify(cachedData), 600);
  }
  
  // Get duplicate info
  const duplicateInfoJson = cache.get('DUPLICATE_INFO');
  let allDuplicateRows;
  if (duplicateInfoJson) {
    const duplicateInfo = JSON.parse(duplicateInfoJson);
    allDuplicateRows = new Set(duplicateInfo.allDuplicateRows);
  } else {
    const { allDuplicateRows: duplicates, unsubmittedDuplicateRows, duplicateStats } = findDuplicateRows();
    allDuplicateRows = duplicates;
    cache.put('DUPLICATE_INFO', JSON.stringify({
      allDuplicateRows: Array.from(duplicates),
      unsubmittedDuplicateRows: Array.from(unsubmittedDuplicateRows),
      duplicateStats: duplicateStats
    }), 600);
  }
  
  // Process batch - check pause state periodically
  for (let i = startIndex; i < endIndex; i++) {
    // Check pause state every 10 rows
    if (i > startIndex && (i - startIndex) % 10 === 0) {
      const currentPauseState = properties.getProperty('BATCH_PROCESSING_PAUSED') === 'true';
      if (currentPauseState) {
        // Save progress before pausing
        if (spreadsheetUpdates.length > 0) {
          batchUpdateSpreadsheet(spreadsheetUpdates);
        }
        saveProcessingProgress(i, results);
        
        return {
          paused: true,
          message: 'Processing paused',
          results: results,
          nextIndex: i,
          totalRows: rowsToProcess.length,
          processedCount: i,
          hasMore: i < rowsToProcess.length
        };
      }
    }
    
    const row = rowsToProcess[i];
    
    if (allDuplicateRows.has(row.rowNumber)) {
      results.push({
        success: false,
        rowNumber: row.rowNumber,
        error: 'Duplicate phone or email',
        isDuplicate: true
      });
    } else {
      const result = processSingleRowUnified(row.data, row.rowNumber, 'MANUAL', cachedData);
      results.push(result);
      
      if (result.success && result.updateData) {
        spreadsheetUpdates.push({
          rowNumber: row.rowNumber,
          recordUrl: result.updateData.recordUrl,
          timestamp: result.updateData.timestamp
        });
      }
    }
    
    // Update progress in cache
    const progress = {
      currentRow: i + 1,
      totalRows: rowsToProcess.length,
      currentRowNumber: row.rowNumber,
      elapsedTime: new Date().getTime() - batchStartTime,
      lastUpdate: new Date().getTime(),
      processedCount: i + 1,
      nextIndex: i + 1
    };
    cache.put('BATCH_PROGRESS', JSON.stringify(progress), 300);
    
    // Save progress to persistent storage every 10 rows
    if ((i + 1) % 10 === 0) {
      saveProcessingProgress(i + 1, results);
    }
  }
  
  // Batch update spreadsheet
  if (spreadsheetUpdates.length > 0) {
    batchUpdateSpreadsheet(spreadsheetUpdates);
  }
  
  // Save final progress
  saveProcessingProgress(endIndex, results);
  
  return {
    results: results,
    hasMore: endIndex < rowsToProcess.length,
    nextIndex: endIndex,
    totalRows: rowsToProcess.length,
    processedCount: endIndex,
    paused: false
  };
}

/**
 * Get current batch progress (called by client polling)
 */
function getBatchProgress() {
  const cache = CacheService.getScriptCache();
  const progressJson = cache.get('BATCH_PROGRESS');
  return progressJson ? JSON.parse(progressJson) : null;
}

/**
 * Save processing progress to persistent storage
 */
function saveProcessingProgress(processedCount, results) {
  const properties = PropertiesService.getUserProperties();
  const progressData = {
    processedCount: processedCount,
    timestamp: new Date().getTime(),
    successCount: results.filter(r => r.success).length,
    errorCount: results.filter(r => !r.success && !r.isDuplicate).length,
    duplicateCount: results.filter(r => r.isDuplicate).length,
    results: results
  };
  
  properties.setProperty('BATCH_PROGRESS_PERSISTENT', JSON.stringify(progressData));
}

/**
 * Get saved processing progress
 */
function getSavedProgress() {
  const properties = PropertiesService.getUserProperties();
  const progressJson = properties.getProperty('BATCH_PROGRESS_PERSISTENT');
  return progressJson ? JSON.parse(progressJson) : null;
}

/**
 * Clear saved processing progress
 */
function clearSavedProgress() {
  const properties = PropertiesService.getUserProperties();
  properties.deleteProperty('BATCH_PROGRESS_PERSISTENT');
  properties.deleteProperty('BATCH_PROCESSING_PAUSED');
}

/**
 * Pause batch processing
 */
function pauseProcessing() {
  const properties = PropertiesService.getUserProperties();
  properties.setProperty('BATCH_PROCESSING_PAUSED', 'true');
  Logger.log('Batch processing paused');
  return { success: true, message: 'Processing paused' };
}

/**
 * Resume batch processing
 */
function resumeProcessing() {
  const properties = PropertiesService.getUserProperties();
  properties.setProperty('BATCH_PROCESSING_PAUSED', 'false');
  Logger.log('Batch processing resumed');
  return { success: true, message: 'Processing resumed' };
}

/**
 * Check if processing is paused
 */
function isProcessingPaused() {
  const properties = PropertiesService.getUserProperties();
  return properties.getProperty('BATCH_PROCESSING_PAUSED') === 'true';
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
    
    // Update setup completion date to today so user won't be prompted again today
    const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    properties.setProperty(CONFIG_SETUP_COMPLETION_DATE, today);
    
    Logger.log('Campaign dates updated: Start=' + newStartDate + ', End=' + newEndDate);
    Logger.log('Setup completion date updated to: ' + today);
    
    // Continue with processing
    continueWithProcessing();
    
    return { success: true, message: 'Dates updated successfully' };
    
  } catch (error) {
    Logger.log('Error updating campaign dates: ' + error.toString());
    return { success: false, message: 'Error updating dates: ' + error.toString() };
  }
}
