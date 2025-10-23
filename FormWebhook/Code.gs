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
  console.log('Timestamp:', new Date().toISOString());
  console.log('Event object received:', e ? 'Yes' : 'No');
  
  try {
    // 1. Extract form responses
    console.log('\n--- Step 1: Extracting form responses ---');
    const formData = extractFormResponses(e);
    console.log('Form data extracted successfully');
    console.log('Form data:', JSON.stringify(formData, null, 2));
    console.log('Number of fields extracted:', Object.keys(formData).length);
    
    // 2. Validate required fields
    console.log('\n--- Step 2: Validating form data ---');
    const validation = validateFormData(formData);
    console.log('Validation result:', validation.isValid ? 'PASSED' : 'FAILED');
    
    if (!validation.isValid) {
      console.error('Validation errors:', validation.errors);
      console.log('Sending error notification email...');
      sendErrorEmail(validation.errors, formData);
      console.log('=== FORM SUBMISSION ENDED (Validation Failed) ===');
      return;
    }
    
    console.log('All required fields validated successfully');
    console.log('Validated data:', JSON.stringify(validation.validatedData, null, 2));
    
    // 3. Build webhook payload
    console.log('\n--- Step 3: Building webhook payload ---');
    const payload = buildWebhookPayload(validation.validatedData);
    console.log('Payload built successfully');
    console.log('Payload size:', JSON.stringify(payload).length, 'characters');
    console.log('Payload preview:', JSON.stringify(payload, null, 2));
    
    // 4. Send to webhook
    console.log('\n--- Step 4: Sending to Zoho webhook ---');
    console.log('Webhook URL:', WEBHOOK_URL);
    const result = sendToWebhook(payload);
    console.log('Webhook call completed');
    console.log('Result:', JSON.stringify(result, null, 2));
    
    // 5. Handle result
    console.log('\n--- Step 5: Processing webhook result ---');
    if (!result.success) {
      console.error('Webhook submission FAILED');
      console.error('Error:', result.error);
      console.error('Response code:', result.responseCode);
      console.log('Sending error notification email...');
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
    console.error('Error name:', error.name);
    console.error('Stack trace:', error.stack);
    console.log('Sending error notification email...');
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
    console.log('Extracting form responses from event object...');
    
    // Get the item responses from the event
    const itemResponses = e.response.getItemResponses();
    console.log('Number of item responses:', itemResponses.length);
    
    // Map each response to our field structure
    let mappedCount = 0;
    let unmappedCount = 0;
    
    itemResponses.forEach(function(itemResponse, index) {
      const question = itemResponse.getItem().getTitle();
      const answer = itemResponse.getResponse();
      
      console.log(`Response ${index + 1}:`, question, '=', answer);
      
      // Map question to field name using FORM_FIELD_MAPPING
      if (FORM_FIELD_MAPPING.hasOwnProperty(question)) {
        const fieldName = FORM_FIELD_MAPPING[question];
        formData[fieldName] = answer;
        mappedCount++;
        console.log(`  ✓ Mapped to field: ${fieldName}`);
      } else {
        unmappedCount++;
        console.warn(`  ⚠ Warning: Unmapped form question: ${question}`);
      }
    });
    
    console.log(`Mapping summary: ${mappedCount} mapped, ${unmappedCount} unmapped`);
    return formData;
    
  } catch (error) {
    console.error('Error extracting form responses:', error.toString());
    console.error('Stack trace:', error.stack);
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
    console.log('Building webhook payload...');
    
    // Get authentication credentials
    console.log('Retrieving authentication credentials...');
    const credentials = getAuthCredentials();
    console.log('✓ Credentials retrieved');
    
    // Get campaign dates
    console.log('Generating campaign dates...');
    const campaignDates = getCampaignDates();
    console.log('✓ Campaign dates:', campaignDates);
    
    // Build the note field with blank line separators
    console.log('Building note field...');
    const noteField = buildNoteField(
      validatedData.company,
      validatedData.newCustomer,
      validatedData.additionalDetails
    );
    console.log('✓ Note field built:', noteField.substring(0, 100) + (noteField.length > 100 ? '...' : ''));
    
    // Build the complete payload
    console.log('Assembling complete payload...');
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
      
      // Description field (combined company, new customer, and additional details)
      Description: noteField,
      
      // System fields
      Datahub_Src: DATAHUB_SOURCE,
      notify_record_owner: true,
      OrgTypeCode: KI_ORG_SETTINGS.orgTypeCode,
      Organization_Code: KI_ORG_SETTINGS.orgCode,
      Consent_to_Contact_Captured: true,
      Created_By_Email: CREATED_BY_EMAIL,
      Campaign_Name: 'EPP - REPLACE ASAP',
      Campaign_Start_Date: campaignDates.startDate,
      Campaign_End_Date: campaignDates.endDate,
      AssignToSalesRepEmail: 'sales.retail@telus.com'
    };
    
    console.log('✓ Payload assembled with', Object.keys(payload).length, 'fields');
    return payload;
    
  } catch (error) {
    console.error('Error building webhook payload:', error.toString());
    console.error('Stack trace:', error.stack);
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
  console.log('Building note field from components...');
  const parts = [];
  
  if (company && company.trim() !== '') {
    parts.push('Company: ' + company.trim());
    console.log('  Added company to note');
  }
  
  if (newCustomer && newCustomer.trim() !== '') {
    parts.push('New customer: ' + newCustomer.trim());
    console.log('  Added new customer status to note');
  }
  
  if (additionalDetails && additionalDetails.trim() !== '') {
    parts.push('Comments: ' + additionalDetails.trim());
    console.log('  Added additional details to note');
  }
  
  console.log('Note field has', parts.length, 'components');
  
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
    console.log('Preparing HTTP request to webhook...');
    const options = {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    console.log('Request method:', options.method);
    console.log('Request content type:', options.contentType);
    console.log('Request payload size:', options.payload.length, 'bytes');
    
    console.log('Sending request to webhook...');
    const startTime = new Date().getTime();
    const response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    const endTime = new Date().getTime();
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    console.log('✓ Request completed in', (endTime - startTime), 'ms');
    console.log('Response code:', responseCode);
    console.log('Response text:', responseText);
    console.log('Response headers:', JSON.stringify(response.getAllHeaders()));
    
    // Check for HTTP errors
    if (responseCode < 200 || responseCode >= 300) {
      console.error('HTTP error detected:', responseCode);
      let errorMessage = `HTTP ${responseCode}: ${responseText}`;
      
      // Try to extract error message from response
      try {
        const errorData = JSON.parse(responseText);
        console.log('Parsed error response:', JSON.stringify(errorData, null, 2));
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (parseError) {
        console.warn('Could not parse error response as JSON');
      }
      
      console.error('Final error message:', errorMessage);
      return {
        success: false,
        error: errorMessage,
        responseCode: responseCode
      };
    }
    
    // Parse successful response
    console.log('Parsing successful response...');
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('✓ Response parsed successfully');
      console.log('Response data structure:', JSON.stringify(responseData, null, 2));
    } catch (parseError) {
      console.error('Failed to parse API response:', parseError.toString());
      return {
        success: false,
        error: 'Failed to parse API response',
        responseCode: responseCode
      };
    }
    
    // Extract record ID from response
    console.log('Extracting record ID from response...');
    if (responseData && 
        responseData.data && 
        Array.isArray(responseData.data) && 
        responseData.data.length > 0 && 
        responseData.data[0].code === 'SUCCESS' && 
        responseData.data[0].details && 
        responseData.data[0].details.id) {
      
      const recordId = responseData.data[0].details.id;
      console.log('✓ Record ID extracted:', recordId);
      return {
        success: true,
        recordId: recordId
      };
    } else {
      console.error('Zoho API did not return success');
      console.error('Response structure does not match expected format');
      console.error('Full response:', responseText);
      return {
        success: false,
        error: 'Zoho API did not return a success response',
        responseCode: responseCode
      };
    }
    
  } catch (error) {
    console.error('Exception calling Zoho API:', error.toString());
    console.error('Error name:', error.name);
    console.error('Stack trace:', error.stack);
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
    console.log('Preparing error notification email...');
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
    
    console.log('Sending error email to:', ERROR_NOTIFICATION_EMAIL);
    MailApp.sendEmail({
      to: ERROR_NOTIFICATION_EMAIL,
      subject: subject,
      body: body
    });
    
    console.log('✓ Error notification email sent successfully');
    
  } catch (emailError) {
    console.error('Failed to send error notification email:', emailError.toString());
    console.error('Stack trace:', emailError.stack);
  }
}

/**
 * Test function to verify configuration
 * Run this manually to check if everything is set up correctly
 */
function testConfiguration() {
  console.log('=== TESTING CONFIGURATION ===');
  console.log('Test started at:', new Date().toISOString());
  
  try {
    // Test 1: Check authentication credentials
    console.log('\n--- Test 1: Authentication Credentials ---');
    const credentials = getAuthCredentials();
    console.log('✓ Auth credentials found');
    console.log('  - Token Name:', credentials.authTokenName.substring(0, 10) + '...');
    console.log('  - Token Value:', credentials.authTokenValue.substring(0, 10) + '...');
    
    // Test 2: Check campaign dates
    console.log('\n--- Test 2: Campaign Dates ---');
    const dates = getCampaignDates();
    console.log('✓ Campaign dates generated');
    console.log('  - Start Date:', dates.startDate);
    console.log('  - End Date:', dates.endDate);
    
    // Test 3: Check webhook URL
    console.log('\n--- Test 3: Webhook URL ---');
    console.log('✓ Webhook URL configured');
    console.log('  - URL:', WEBHOOK_URL.substring(0, 50) + '...');
    console.log('  - Length:', WEBHOOK_URL.length, 'characters');
    
    // Test 4: Test note field building
    console.log('\n--- Test 4: Note Field Building ---');
    const testNote = buildNoteField('Test Company', 'Yes', 'Test comments');
    console.log('✓ Note field built successfully');
    console.log('Note content:');
    console.log(testNote);
    
    // Test 5: Check error notification email
    console.log('\n--- Test 5: Error Notification Email ---');
    console.log('✓ Error notification email configured');
    console.log('  - Recipient:', ERROR_NOTIFICATION_EMAIL);
    
    console.log('\n=== ALL CONFIGURATION TESTS PASSED ===');
    console.log('Test completed at:', new Date().toISOString());
    return true;
    
  } catch (error) {
    console.error('\n=== CONFIGURATION TEST FAILED ===');
    console.error('Error:', error.toString());
    console.error('Stack trace:', error.stack);
    return false;
  }
}
