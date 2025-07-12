const WEBHOOK_URL = 'https://sandbox.zohoapis.com/crm/v7/functions/telus_webhook_to_capture_lead/actions/execute?auth_type=apikey&zapikey=1003.0b0bd5ee4807f6c6148d8a73715c0c38.025642d6a7b32dcb50f9eba2e49c4f60';

// ORGANIZAITON PLACEHOLDERS
// Replace with the auth token information TELUS provided you and enter your Organization Code. If you don't have this information, email dltrlzohodev@telus.com
const AUTH_TOKEN_NAME = 'EnterAuthTokenName'; // Fill in this field with the token name you were provided
const AUTH_TOKEN_VALUE = 'EnterAuthTokenValue'; // Fill in this field with the token value you were provided
const ORG__CODE = 'EnterOrganizationCode'; // // Fill in this field with your 4 or 5-digit organization code (remove leading zeros)

function sendToWebhook(e) {
  Logger.log('sendToWebhook function started.');
  Logger.log('Event object (e): ' + JSON.stringify(e));
  
  // Check if PLACEHOLDER information has been changed
  if (AUTH_TOKEN_NAME === 'EnterAuthTokenName') {
    Logger.log('AUTH_TOKEN_NAME is not set. Please set it to the token name you were provided.');
    return;
  }
  if (AUTH_TOKEN_VALUE === 'EnterAuthTokenValue') {
    Logger.log('AUTH_TOKEN_VALUE is not set. Please set it to the token value you were provided.');
    return;
  }
  if (ORG__CODE === 'EnterOrganizationCode') {
    Logger.log('ORG__CODE is not set. Please set it to your organization\'s 5-digit organization code.');
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
  
  // Check if this row has already been processed (has a Record ID in column 17)
  const rowToProcess = e.range.getLastRow();
  const recordIdCell = sheet.getRange(rowToProcess, 17).getValue();
  if (recordIdCell && recordIdCell.toString().trim() !== '') {
    Logger.log('Row ' + rowToProcess + ' has already been processed (Record ID found in column 17). Ignoring.');
    return;
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


  // Calculate dates
  const today = new Date();
  const endDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days later
  Logger.log('Today: ' + today.toISOString() + ', End Date (30 days later): ' + endDate.toISOString());

  // Calculate the number of days between today and endDate
  const diffTime = Math.abs(endDate.getTime() - today.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Modified Logger.log line
  Logger.log('Today: ' + today.toISOString() + ', End Date: ' + endDate.toISOString() + ', Days between: ' + diffDays);

  // Clean phone of all symbols, spaces etc.
  const phone = String(data[2]).replace(/[^0-9+]/g, ''); // Retains only digits and '+' and assumes Phone is in the 3rd column
  Logger.log('Original Phone Data: ' + data[2] + ', Cleaned Phone: ' + phone);
  
  // Prepare the payload using API Names from the documentation
  const payload = {
    auth_token_name: AUTH_TOKEN_NAME,
    auth_token_value: AUTH_TOKEN_VALUE,
    First_Name: data[0], // Assuming First Name is in the 1st column
    Last_Name: data[1], // Assuming Last Name is in the 2nd column
    Phone: phone, // Uses cleaned phone from above variable and assumes Phone is in the 3rd column
    Email: data[3], // Assuming Email is in the 4th column
    Datahub_Src: data[4], // Assuming Datahub_Src is in the 5th column
    Campaign_Name: data[5], // Assuming Campaign_Name is in the 6th column
    Description: data[6], // Assuming Description is in the 7th column
    Street: data[7], // Assuming Street is in the 8th column
    City: data[8], // Assuming City is in the 9th column
    State: data[9], // Assuming Province is in the 10th column
    Zip_Code: data[10], // Assuming Postal Code is in the 11th column
    Country: data[11], // Assuming Country is in the 12th column
    Rate_Plan_Description: data[12], // Assuming Rate Plan Description is in the 13th column
    Phone_Model: data[13], // Assuming Device Model is in the 14th column
    Brand: data[14], // Assuming Current Provider is in the 15th column
    note: data[15], // Assuming Note is in the 16th column
    notify_record_owner: true, // To control this from a column in your spreadsheet, change true to data[##] and enter the reference column # (e.g. data[16] for column 17)
    OrgTypeCode: "DL", // Do not modify this field
    Organization_Code: ORG__CODE, // Do not modify this field
    Consent_to_Contact_Captured: true, // Do not modify this field
    Created_By_Email: Session.getActiveUser().getEmail(), // Do not modify this field
    Campaign_Start_Date: Utilities.formatDate(today, "GMT", "yyyy-MM-dd"), // Do not modify this field unless you want the Start Date to show something other than the current date
    Campaign_End_Date: Utilities.formatDate(endDate, "GMT", "yyyy-MM-dd"), // Do not modify this field. If you want to change the end date, refer to the "Calculate dates" code block above
    SalesRepPin: "LDK8" // Enter the CPMS SalesRepPin of the user you want new leads assgined to
    // AssignToSalesRepEmail: "example@email.com", // Enter the email address of the user you want new leads assigned to
    // To add other data fields, refer to the API Name column in our Github documentation https://github.com/AlessandroZ-TELUS/Zoho
  };
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
      if (responseData && responseData.details && responseData.details.output) {
        // Parse the output field which is a stringified JSON
        const outputData = JSON.parse(responseData.details.output);
        
        // Check if data array exists and contains a SUCCESS code
        if (outputData.data && Array.isArray(outputData.data) && outputData.data.length > 0 && 
            outputData.data[0].code === "SUCCESS" && outputData.data[0].details && outputData.data[0].details.id) {
          
          // Extract the correct record ID from the nested structure
          recordId = outputData.data[0].details.id;
        }
      }
    } catch (parseError) {
      Logger.log('Error parsing output JSON: ' + parseError.toString());
    }
    
    if (recordId) {
      // Update record ID column in Google Sheet
      sheet.getRange(rowToProcess, 17).setValue('https://crmsandbox.zoho.com/crm/zohoplayground/tab/Leads/' + recordId); //Change url to https://crm.zoho.com/crm/org820120607/tab/Leads/ after testing is completed
      Logger.log('Record ID: ' + recordId + ' stored on row ' + rowToProcess);
      
      // Store the current date and time in column 18
      const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
      sheet.getRange(rowToProcess, 18).setValue(timestamp);
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
