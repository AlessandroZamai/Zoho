const WEBHOOK_URL = 'https://sandbox.zohoapis.com/crm/v7/functions/telus_webhook_to_capture_lead/actions/execute?auth_type=apikey&zapikey=1003.26a3ebba6146ba321bb5690283cdf991.57db655a174cf1acff14b96739abfd3f';

// ORGANIZAITON PLACEHOLDERS
// Replace with the auth token information TELUS provided you and enter your Organization Code. If you don't have this information, email dltrlzohodev@telus.com
const AUTH_TOKEN_NAME = 'EnterAuthTokenName'; // Fill in this field with the token name you were provided
const AUTH_TOKEN_VALUE = 'EnterAuthTokenValue'; // Fill in this field with the token value you were provided
const ORG__CODE = 'EnterOrganizationCode'; // // Fill in this field with your 4 or 5-digit organization code (remove leading zeros)

function sendToWebhook(e) {
  Logger.log('sendToWebhook function started.');
  Logger.log('Event object (e): ' + JSON.stringify(e));
  
  // Check if we're in automated mode
  const currentMode = getCurrentProcessingMode();
  if (currentMode !== PROCESSING_MODE_AUTO) {
    Logger.log('Not in automated mode. Exiting.');
    return;
  }
  
  // Get configuration values
  const config = getConfigurationValues();
  
  // Check if configuration is complete
  const configCheck = isConfigurationComplete();
  if (!configCheck.complete) {
    Logger.log('Configuration incomplete: ' + configCheck.message);
    return;
  }
  
  // Check if processing mode is set
  if (!config.processingMode) {
    Logger.log('Processing mode not set');
    return;
  }
  
  // This function will be triggered when a new row is added
  if (e && e.range && (e.range.getRow() == 1 || e.range.getRow() == 2)) { // Check for header row and example data row
    Logger.log('Header row or example data row change detected. Ignoring.');
    return;
  }
  if (!e || !e.range) {
    Logger.log('Not an onEdit event or range not found. Exiting.');
    return;
  }
  Logger.log('Change detected in row: ' + e.range.getRow());

  const sheet = SpreadsheetApp.getActiveSheet();
  const lastRow = sheet.getLastRow();
  Logger.log('Active Sheet: ' + sheet.getName());
  Logger.log('Last row in sheet: ' + lastRow);
  
  // Check if this row has already been processed (has a Record ID in column 19)
  const rowToProcess = e.range.getLastRow();
  const recordIdCell = sheet.getRange(rowToProcess, 19).getValue();
  if (recordIdCell && recordIdCell.toString().trim() !== '') {
    Logger.log('Row ' + rowToProcess + ' has already been processed (Record ID found in column 19). Ignoring.');
    return;
  }
  
  // Check if this row has disabled columns based on configuration
  if (config.enabledColumns) {
    const channelOutletId = sheet.getRange(rowToProcess, 17).getValue();
    const salesRepEmail = sheet.getRange(rowToProcess, 18).getValue();
    
    // If a disabled column has data, ignore the edit
    if (!config.enabledColumns.channelOutletId && channelOutletId) {
      Logger.log('Row ' + rowToProcess + ' has data in disabled ChannelOutletID column. Ignoring.');
      return;
    }
    if (!config.enabledColumns.assignToSalesRepEmail && salesRepEmail) {
      Logger.log('Row ' + rowToProcess + ' has data in disabled AssigntoSalesRepEmail column. Ignoring.');
      return;
    }
  }

  // Get data from the last row where the edit occurred
  // It's usually better to use e.range.getRow() instead of lastRow to get the *edited* row's data
  // if the intent is to send the data of the row that was just changed.
  // For 'onEdit' triggers, e.range gives you the exact row/column that was edited.
  // If a single cell edit in a new row triggers this, lastRow might be correct.
  // However, if an existing row is edited, lastRow would get the bottom-most row.
  // For new row additions, e.range.getRow() would be the new last row.
  const data = sheet.getRange(rowToProcess, 1, 1, sheet.getLastColumn()).getValues()[0];
  Logger.log('Data retrieved from row ' + rowToProcess + ': ' + JSON.stringify(data));


  // Use configured campaign dates or fallback to calculated dates
  let startDate, endDate;
  if (config.campaignStartDate && config.campaignEndDate) {
    startDate = new Date(config.campaignStartDate);
    endDate = new Date(config.campaignEndDate);
  } else {
    // Fallback to calculated dates for legacy configurations
    startDate = new Date();
    const campaign_length = 30;
    endDate = new Date(startDate.getTime() + campaign_length * 24 * 60 * 60 * 1000);
  }
  
  Logger.log('Campaign Start Date: ' + startDate.toISOString() + ', End Date: ' + endDate.toISOString());

  // Clean phone of all symbols, spaces etc.
  const phone = String(data[2]).replace(/[^0-9+]/g, ''); // Retains only digits and '+' and assumes Phone is in the 3rd column
  Logger.log('Original Phone Data: ' + data[2] + ', Cleaned Phone: ' + phone);
  
  // Prepare the payload using API Names from the documentation
  const payload = {
    auth_token_name: config.authTokenName,
    auth_token_value: config.authTokenValue,
    First_Name: data[0], // First Name
    Last_Name: data[1], // Last Name
    Phone: phone, // Cleaned phone number
    Email: data[3], // Email
    Language_Preference: data[4], // Language Preference (new field)
    Datahub_Src: data[5], // Datahub_Src
    Campaign_Name: data[6], // Campaign_Name
    Description: data[7], // Description
    Street: data[8], // Street
    City: data[9], // City
    State: data[10], // State/Province
    Zip_Code: data[11], // Postal Code
    Country: data[12], // Country
    Rate_Plan_Description: data[13], // Rate Plan Description
    Phone_Model: data[14], // Device Model
    Brand: data[15], // Current Provider
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
    // Use Channel Outlet ID for equal distribution
    if (data[16] && data[16].toString().trim() !== '') {
      payload.ChannelOutletId = data[16].toString().trim();
    }
  } else if (config.leadAssignment === ASSIGNMENT_MANUAL && config.enabledColumns.assignToSalesRepEmail) {
    // Use sales rep email for manual assignment
    if (data[17] && data[17].toString().trim() !== '') {
      payload.AssignToSalesRepEmail = data[17].toString().trim();
    }
  }
  // For ASSIGNMENT_ADMIN, no additional assignment fields are needed
  Logger.log('Payload prepared: ' + JSON.stringify(payload));
  
  // Send the payload to the webhook
  const options = {
    'method': 'POST',
    'contentType': 'application/json',
    'payload': JSON.stringify(payload),
    'muteHttpExceptions': true // Added for debugging full responses on errors
  };
    Logger.log('Fetch options: ' + JSON.stringify(options));

  try {
    const response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    Logger.log('Webhook response code: ' + response.getResponseCode());
    Logger.log('Webhook response: ' + response.getContentText());
    
    // Parse the response
    const responseData = JSON.parse(response.getContentText());
    const responseText = response.getContentText();
     
    // Check if 'data' and 'SUCCESS' is in the webhook response
    let recordId = null;
    
    try {
      // Check if data array exists and contains a SUCCESS code
      if (responseData && responseData.data && Array.isArray(responseData.data) && responseData.data.length > 0 && 
          responseData.data[0].code === "SUCCESS" && responseData.data[0].details && responseData.data[0].details.id) {
        
        // Extract the record ID from the response structure
        recordId = responseData.data[0].details.id;
        Logger.log('Record ID extracted from response: ' + recordId);
      } else {
        Logger.log('Response structure check failed. ResponseData: ' + JSON.stringify(responseData));
      }
    } catch (parseError) {
      Logger.log('Error parsing response JSON: ' + parseError.toString());
    }
    
    if (recordId) {
      // Update record ID column in Google Sheet (column 19)
      sheet.getRange(rowToProcess, 19).setValue('https://crm.zoho.com/crm/org820120607/tab/Leads/' + recordId);
      Logger.log('Record ID: ' + recordId + ' stored on row ' + rowToProcess);
      
      // Store the current date and time in column 20
      const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
      sheet.getRange(rowToProcess, 20).setValue(timestamp);
      Logger.log('Timestamp: ' + timestamp + ' stored on row ' + rowToProcess);
      Logger.log('SUCCESS: Lead successfully sent to Zoho');
    } else {
      Logger.log('FAILED: Request did not complete as no data was found in the response');
    }
  } catch (error) {
    Logger.log('FAILED: Error sending to webhook. Error message ' + error.toString());
    Logger.log('Error message: ' + error.toString());
  }
  Logger.log('sendToWebhook function finished.');
}
