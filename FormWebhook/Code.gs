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
  console.log('=== FORM SUBMISSION STARTED ===');
  
  try {
    // 1. Extract form responses
    const formData = extractFormResponses(e);
    
    // 2. Validate required fields
    const validation = validateFormData(formData);
    
    if (!validation.isValid) {
      console.error('Validation errors:', validation.errors);
      sendErrorEmail(validation.errors, formData);
      console.log('=== FORM SUBMISSION ENDED (Validation Failed) ===');
      return;
    }
    
    // 3. Build webhook payload
    const payload = buildWebhookPayload(validation.validatedData);
    
    // Keep the final payload logging as requested
    console.log('Final Webhook Payload:', JSON.stringify(payload, null, 2));
    
    // 4. Send to webhook
    const result = sendToWebhook(payload);
    
    // Keep the response data structure logging as requested
    console.log('Response Data Structure:', JSON.stringify(result, null, 2));
    
    // 5. Handle result
    if (!result.success) {
      console.error('Webhook submission FAILED');
      console.error('Error:', result.error);
      sendErrorEmail([result.error], formData, result.responseCode);
      console.log('=== FORM SUBMISSION ENDED (Webhook Failed) ===');
    } else {
      console.log('✓ SUCCESS: Lead successfully sent to Zoho');
      console.log('✓ Record ID:', result.recordId);
      console.log('✓ Record URL:', buildZohoRecordUrl(result.recordId));
      console.log('=== FORM SUBMISSION ENDED (Success) ===');
    }
    
  } catch (error) {
    console.error('=== CRITICAL ERROR in onFormSubmit ===');
    console.error('Error message:', error.toString());
    sendErrorEmail(['Unexpected error: ' + error.toString()], null);
    console.log('=== FORM SUBMISSION ENDED (Exception) ===');
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
      }
    });
    
    return formData;
    
  } catch (error) {
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
    return {
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
      
      // Description field (combined company, new customer, and additional details)
      Description: noteField,
      
      // System fields
      Datahub_Src: DATAHUB_SOURCE,
      // notify_record_owner: true,
      OrgTypeCode: KI_ORG_SETTINGS.orgTypeCode,
      Organization_Code: KI_ORG_SETTINGS.orgCode,
      Consent_to_Contact_Captured: true,
      Created_By_Email: CREATED_BY_EMAIL,
      Campaign_Name: CAMPAIGN_NAME,
      Campaign_Start_Date: campaignDates.startDate,
      Campaign_End_Date: campaignDates.endDate,
      AssignToSalesRepUserID: "6634012000042308028",
      lar_id: "6634012000603343117"
    };
    
  } catch (error) {
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
  
  // Join with single newline (no extra line breaks)
  return parts.join('\n');
}


/**
 * Send payload to Zoho webhook
 * @param {Object} payload - The payload to send
 * @returns {Object} Result object with success status, error, and record ID
 */
function sendToWebhook(payload) {
  try {
    // Prepare HTTP request options
    const options = {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    // Send request to webhook
    const response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
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
      
      const recordId = responseData.data[0].details.id;
      return {
        success: true,
        recordId: recordId
      };
    } else {
      return {
        success: false,
        error: 'Zoho API did not return a success response',
        responseCode: responseCode
      };
    }
    
  } catch (error) {
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
    
  } catch (emailError) {
    console.error('Failed to send error notification email:', emailError.toString());
  }
}

/**
 * Test function to verify configuration
 * Run this manually to check if everything is set up correctly
 */
function testConfiguration() {
  console.log('=== TESTING CONFIGURATION ===');
  
  try {
    // Test 1: Check authentication credentials
    const credentials = getAuthCredentials();
    console.log('✓ Auth credentials found');
    
    // Test 2: Check campaign dates
    const dates = getCampaignDates();
    console.log('✓ Campaign dates generated:', dates.startDate, 'to', dates.endDate);
    
    // Test 3: Check webhook URL
    console.log('✓ Webhook URL configured:', WEBHOOK_URL.substring(0, 30) + '...');
    
    // Test 4: Test note field building
    const testNote = buildNoteField('Test Company', 'Yes', 'Test comments');
    console.log('✓ Note field built successfully');
    
    // Test 5: Check error notification email
    console.log('✓ Error notification email configured:', ERROR_NOTIFICATION_EMAIL);
    
    console.log('=== ALL CONFIGURATION TESTS PASSED ===');
    return true;
    
  } catch (error) {
    console.error('=== CONFIGURATION TEST FAILED ===');
    console.error('Error:', error.toString());
    return false;
  }
}
