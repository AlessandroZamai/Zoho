# Technical Context: Zoho Webhook Integration

## Technologies Used

### Core Technologies

1. **Google Sheets**
   - Purpose: Data collection and storage
   - Version: N/A (cloud-based, always current)
   - Role: Serves as the user interface for data entry and status tracking

2. **Google Apps Script**
   - Purpose: Business logic and integration
   - Language: JavaScript (ECMAScript)
   - Version: N/A (cloud-based, always current)
   - Role: Handles data processing, validation, and transmission

3. **Zoho CRM**
   - Purpose: Lead management and sales process
   - Version: v7 API
   - Role: Final destination for lead data

### Supporting Technologies

1. **HTTP/REST**
   - Purpose: Communication protocol
   - Implementation: UrlFetchApp in Google Apps Script
   - Role: Enables webhook communication

2. **JSON**
   - Purpose: Data format
   - Implementation: Native JavaScript objects/JSON parsing
   - Role: Structures data for transmission and response parsing

3. **Zapier (Optional)**
   - Purpose: Integration middleware
   - Role: Alternative method to connect external systems to Google Sheets

## Development Setup

### Google Apps Script Environment

1. **Script Editor**
   - Access: Via Google Sheets > Extensions > Apps Script
   - Authentication: Google account with edit access to the sheet
   - Deployment: No deployment needed for sheet-bound scripts

2. **Debugging Tools**
   - Logger: Built-in Logger.log() for debugging
   - Execution logs: Available in Apps Script dashboard
   - Testing: Manual execution of functions

### Zoho CRM Environment

1. **Sandbox Environment**
   - Purpose: Testing and development
   - URL: https://sandbox.zohoapis.com/crm/v7/functions/telus_webhook_to_capture_lead/actions/execute
   - Access: Requires authentication token

2. **Production Environment**
   - Purpose: Live data processing
   - URL: https://www.zohoapis.com/crm/v7/functions/telus_webhook_to_capture_lead/actions/execute?auth_type=apikey&zapikey=1003.b23687ee11585b992241674a33528913.502dafbcc54f94b44c54359c9ded065e
   - Access: Requires authentication token

## Technical Constraints

1. **Google Apps Script Limitations**
   - Execution time: Maximum 6 minutes per execution
   - URL fetch: Maximum 20MB response size
   - Triggers: Limited to specific events (e.g., onEdit)
   - Quotas: Daily quotas for various services (https://developers.google.com/apps-script/guides/services/quotas)

2. **Data Validation Constraints**
   - Phone format: Must be 10 digits without symbols or spaces
   - Date format: Must be yyyy-MM-dd
   - Required fields: Several fields marked as required in API documentation

3. **Authentication Constraints**
   - Token-based: Requires valid auth_token_name and auth_token_value
   - Organization-specific: Tokens are tied to specific organizations

4. **Integration Constraints**
   - One-way sync: Data flows from Google Sheets to Zoho CRM, not bidirectionally
   - Manual trigger creation: Requires running createTrigger script
   - No error recovery: Failed transmissions require manual retry

## Dependencies

1. **External APIs**
   - Zoho CRM API v7
   - Google Sheets API (implicit through Apps Script)

2. **Libraries**
   - None (using built-in Google Apps Script functionality)

3. **Services**
   - UrlFetchApp: For HTTP requests
   - SpreadsheetApp: For sheet manipulation
   - Utilities: For date formatting and other utilities
   - Logger: For debugging and logging

## Tool Usage Patterns

1. **Google Sheet Structure**
   - Headers in row 1
   - Example data in row 2
   - Actual data from row 3 onwards
   - Status columns (Record ID, Timestamp) in columns 17-18

2. **Script Initialization**
   - Run createTrigger script once to set up automation
   - Configure authentication tokens and organization code

3. **Data Entry Workflow**
   - Enter lead data in a new row
   - Script automatically triggers on edit
   - Status columns update with results

4. **Troubleshooting Pattern**
   - Check execution logs in Apps Script dashboard
   - Verify required fields are populated
   - Ensure authentication tokens are valid
   - Contact support email for assistance
