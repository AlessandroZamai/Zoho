/**
 * EPP Callback Form Webhook - Main Handler
 * Processes Google Form submissions and sends data to Zoho webhook
 */

/**
 * Main form submit trigger function
 * This function is triggered automatically when the form is submitted
 * @param {Object} e - The form submit event object
 */
function onFormSubmit(e) {
  Logger.log('Form submission received');
  
  try {
    // 1. Extract form responses
    const formData = extractFormResponses(e);
    Logger.log('Form data extracted: ' + JSON.stringify(formData));
    
    // 2. Validate required fields
    const validation = validateFormData(formData);
    if (!validation.isValid) {
      Logger.log('Validation failed: ' + validation.errors.join(', '));
      sendErrorEmail(validation.errors, formData);
      return;
    }
    
    Logger.log('Validation passed');
    
    // 3. Build webhook payload
    const payload = buildWebhookPayload(validation.validatedData);
    Logger.log('Payload built successfully');
    
    // 4. Send to webhook
    const result = sendToWebhook(payload);
    
    // 5. Handle result
    if (!result.success) {
      Logger.log('Webhook submission failed: ' + result.error);
      sendErrorEmail([result.error], formData, result.responseCode);
    } else {
      Logger.log('SUCCESS: Lead successfully sent to Zoho. Record ID: ' + result.recordId);
      Logger.log('Record URL: ' + buildZohoRecordUrl(result.recordId));
    }
    
  } catch (error) {
    Logger.log('ERROR in onFormSubmit: ' + error.toString());
    Logger.log('Stack trace: ' + error.stack);
    sendErrorEmail(['Unexpected error: ' + error.toString()], null);
  }
}

/**
 * Extract form responses from the event object
 * @param {Object} e - The form submit event object
 * @returns {Object} Object containing form field values
 */
function extractFormResponses(e) {
  const formData = {};
  
  try {
    // Get the item responses from the event
    const itemResponses = e.response.getItemResponses();
    
    // Map each response to our field structure
    itemResponses.forEach(function(itemResponse) {
      const question = itemResponse.getItem().getTitle();
      const answer = itemResponse.getResponse();
      
      // Map question to field name using FORM_FIELD_MAPPING
      if (FORM_FIELD_MAPPING.hasOwnProperty(question)) {
        const fieldName = FORM_FIELD_MAPPING[question];
        formData[fieldName] = answer;
      } else {
        Logger.log('Warning: Unmapped form question: ' + question);
      }
    });
    
    return formData;
    
  } catch (error) {
    Logger.log('Error extracting form responses: ' + error.toString());
    throw new Error('Failed to extract form responses: ' + error.message);
  }
}

/**
 * Build the webhook payload from validated form data
 * @param {Object} validatedData - The validated form data
 * @returns {Object} The complete webhook payload
 */
function buildWebhookPayload(validatedData) {
  try {
    // Get authentication credentials
    const credentials = getAuthCredentials();
    
    // Get campaign dates
    const campaignDates = getCampaignDates();
    
    // Build the note field with blank line separators
    const noteField = buildNoteField(
      validatedData.company,
      validatedData.newCustomer,
      validatedData.additionalDetails
    );
    
    // Build the complete payload
    const payload = {
      // Authentication
      auth_token_name: credentials.authTokenName,
      auth_token_value: credentials.authTokenValue,
      
      // Required fields
      First_Name: validatedData.firstName,
      Last_Name: validatedData.lastName,
      Phone: validatedData.phone,
      Email: validatedData.email,
      State: validatedData.province,
      
      // Optional fields
      Zip_Code: validatedData.postalCode || '',
      Language_Preference: validatedData.languagePreference || '',
      
      // Combined note field
      note: noteField,
      
      // System fields
      Datahub_Src: DATAHUB_SOURCE,
      notify_record_owner: true,
      OrgTypeCode: KI_ORG_SETTINGS.orgTypeCode,
      Organization_Code: KI_ORG_SETTINGS.orgCode,
      Consent_to_Contact_Captured: true,
      Created_By_Email: CREATED_BY_EMAIL,
      Campaign_Start_Date: campaignDates.startDate,
      Campaign_End_Date: campaignDates.endDate
    };
    
    return payload;
    
  } catch (error) {
    Logger.log('Error building webhook payload: ' + error.toString());
    throw new Error('Failed to build webhook payload: ' + error.message);
  }
}

/**
 * Build the note field with proper formatting
 * @param {string} company - Company name
 * @param {string} newCustomer - New customer status
 * @param {string} additionalDetails - Additional comments
 * @returns {string} Formatted note field with blank line separators
 */
function buildNoteField(company, newCustomer, additionalDetails) {
  const parts = [];
  
  if (company && company.trim() !== '') {
    parts.push('Company: ' + company.trim());
  }
  
  if (newCustomer && newCustomer.trim() !== '') {
    parts.push('New customer: ' + newCustomer.trim());
  }
  
  if (additionalDetails && additionalDetails.trim() !== '') {
    parts.push('Comments: ' + additionalDetails.trim());
  }
  
  // Join with double newline for blank line separation
  return parts.join('\n\n');
}

/**
 * Send payload to Zoho webhook
 * @param {Object} payload - The payload to send
 * @returns {Object} Result object with success status, error, and record ID
 */
function sendToWebhook(payload) {
  try {
    const options = {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    Logger.log('Sending request to webhook...');
    const response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    Logger.log('Response code: ' + responseCode);
    Logger.log('Response text: ' + responseText);
    
    // Check for HTTP errors
    if (responseCode < 200 || responseCode >= 300) {
      let errorMessage = `HTTP ${responseCode}: ${responseText}`;
      
      // Try to extract error message from response
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (parseError) {
        // Use default error message if parsing fails
      }
      
      return {
        success: false,
        error: errorMessage,
        responseCode: responseCode
      };
    }
    
    // Parse successful response
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      Logger.log('Failed to parse API response: ' + parseError.toString());
      return {
        success: false,
        error: 'Failed to parse API response',
        responseCode: responseCode
      };
    }
    
    // Extract record ID from response
    if (responseData && 
        responseData.data && 
        Array.isArray(responseData.data) && 
        responseData.data.length > 0 && 
        responseData.data[0].code === 'SUCCESS' && 
        responseData.data[0].details && 
        responseData.data[0].details.id) {
      
      return {
        success: true,
        recordId: responseData.data[0].details.id
      };
    } else {
      Logger.log('Zoho API did not return success: ' + responseText);
      return {
        success: false,
        error: 'Zoho API did not return a success response',
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
 * Send error notification email
 * @param {Array} errors - Array of error messages
 * @param {Object} formData - The form data that caused the error (optional)
 * @param {number} responseCode - HTTP response code (optional)
 */
function sendErrorEmail(errors, formData, responseCode) {
  try {
    const subject = 'EPP Callback Form Webhook Error';
    
    let body = 'An error occurred while processing a form submission:\n\n';
    body += '=== ERRORS ===\n';
    body += errors.join('\n') + '\n\n';
    
    if (responseCode) {
      body += '=== HTTP RESPONSE CODE ===\n';
      body += responseCode + '\n\n';
    }
    
    if (formData) {
      body += '=== FORM DATA ===\n';
      body += JSON.stringify(formData, null, 2) + '\n\n';
    }
    
    body += '=== TIMESTAMP ===\n';
    body += new Date().toISOString() + '\n\n';
    
    body += '=== SCRIPT INFO ===\n';
    body += 'Script ID: ' + ScriptApp.getScriptId() + '\n';
    body += 'User: ' + Session.getActiveUser().getEmail() + '\n';
    
    MailApp.sendEmail({
      to: ERROR_NOTIFICATION_EMAIL,
      subject: subject,
      body: body
    });
    
    Logger.log('Error notification email sent to: ' + ERROR_NOTIFICATION_EMAIL);
    
  } catch (emailError) {
    Logger.log('Failed to send error notification email: ' + emailError.toString());
  }
}

/**
 * Test function to verify configuration
 * Run this manually to check if everything is set up correctly
 */
function testConfiguration() {
  Logger.log('=== Testing Configuration ===');
  
  try {
    // Test 1: Check authentication credentials
    Logger.log('Test 1: Checking authentication credentials...');
    const credentials = getAuthCredentials();
    Logger.log('✓ Auth credentials found');
    Logger.log('  - Token Name: ' + credentials.authTokenName.substring(0, 10) + '...');
    Logger.log('  - Token Value: ' + credentials.authTokenValue.substring(0, 10) + '...');
    
    // Test 2: Check campaign dates
    Logger.log('\nTest 2: Checking campaign dates...');
    const dates = getCampaignDates();
    Logger.log('✓ Campaign dates generated');
    Logger.log('  - Start Date: ' + dates.startDate);
    Logger.log('  - End Date: ' + dates.endDate);
    
    // Test 3: Check webhook URL
    Logger.log('\nTest 3: Checking webhook URL...');
    Logger.log('✓ Webhook URL configured: ' + WEBHOOK_URL.substring(0, 50) + '...');
    
    // Test 4: Test note field building
    Logger.log('\nTest 4: Testing note field building...');
    const testNote = buildNoteField('Test Company', 'Yes', 'Test comments');
    Logger.log('✓ Note field built successfully:');
    Logger.log(testNote);
    
    Logger.log('\n=== All Configuration Tests Passed ===');
    return true;
    
  } catch (error) {
    Logger.log('\n✗ Configuration test failed: ' + error.toString());
    return false;
  }
}
