# EPP Callback Form Webhook

Google Apps Script integration for processing Google Form submissions and sending data to Zoho CRM via webhook.

## Overview

This script automatically processes form submissions from a Google Form and sends the data to Zoho CRM. It includes:
- Input validation and sanitization
- Error handling with email notifications
- Automatic campaign date generation
- Support for both required and optional fields

## Form Fields

### Required Fields (marked with *)
- **First Name*** - Contact's first name
- **Last Name*** - Contact's last name
- **Phone Number*** - Contact phone (normalized to digits only)
- **Email*** - Contact email address (validated)
- **Province*** - Canadian province code (AB, BC, MB, etc.)

### Optional Fields
- **Postal Code** - Canadian postal code (format: A1A 1A1)
- **Language Preference** - English or French (normalized to en-ca/fr-ca)
- **Are you an existing TELUS customer?** - Added to note field
- **Company** - Company name (added to note field)
- **Additional details** - Comments (added to note field)

## Project Structure

```
FormWebhook/
├── .clasp.json          # Clasp configuration (auto-generated)
├── Code.gs              # Main form submit handler
├── FormConfig.gs        # Configuration and constants
├── FormValidation.gs    # Input validation utilities
├── appsscript.json      # Project manifest
└── README.md            # This file
```

## Setup Instructions

### Prerequisites

1. **Node.js and npm** installed on your machine
2. **clasp CLI** installed globally:
   ```bash
   npm install -g @google/clasp
   ```
3. **Google Account** with access to Google Forms and Apps Script

### Step 1: Clone or Download This Project

```bash
cd FormWebhook
```

### Step 2: Login to Clasp

```bash
clasp login
```

This will open a browser window for Google authentication.

### Step 3: Create New Apps Script Project

```bash
clasp create --type standalone --title "EPP Callback Form Webhook"
```

This will:
- Create a new Apps Script project
- Generate a script ID
- Update `.clasp.json` with the script ID

### Step 4: Push Code to Apps Script

```bash
clasp push
```

This uploads all `.gs` and `.json` files to your Apps Script project.

### Step 5: Configure Script Properties

1. Open the Apps Script editor:
   ```bash
   clasp open
   ```

2. In the Apps Script editor:
   - Click the gear icon (⚙️) for **Project Settings**
   - Scroll to **Script Properties**
   - Click **Add script property**
   - Add the following properties:

   | Property Name | Value |
   |--------------|-------|
   | `AUTH_TOKEN_NAME_KI` | Your KI auth token name |
   | `AUTH_TOKEN_VALUE_KI` | Your KI auth token value |

3. Click **Save script properties**

### Step 6: Link to Google Form

1. In the Apps Script editor, click the **form icon** in the left sidebar
2. Select **Link to existing form** or create a new form
3. Choose your Google Form

**OR** manually link from the form:
1. Open your Google Form
2. Click the three dots (⋮) → **Script editor**
3. This will open the linked Apps Script project

### Step 7: Install Form Submit Trigger

1. In the Apps Script editor, click the **clock icon** (⏰) for **Triggers**
2. Click **+ Add Trigger**
3. Configure the trigger:
   - **Function to run**: `onFormSubmit`
   - **Event source**: `From form`
   - **Event type**: `On form submit`
4. Click **Save**
5. Authorize the script when prompted

### Step 8: Test the Integration

1. Run the test function:
   - In Apps Script editor, select `testConfiguration` from the function dropdown
   - Click **Run**
   - Check the **Execution log** for results

2. Submit a test form response:
   - Fill out your Google Form
   - Submit the form
   - Check the **Execution log** in Apps Script for processing details
   - Check your email (alessandro.zamai@telus.com) for any error notifications

## Configuration

### Webhook Settings

The webhook URL and organization settings are configured in `FormConfig.gs`:

```javascript
const WEBHOOK_URL = 'https://sandbox.zohoapis.com/crm/v7/...';
const KI_ORG_SETTINGS = {
  orgCode: '50080',
  orgTypeCode: 'KI',
  // Auth tokens from Script Properties
};
```

### Campaign Duration

Campaign runs for 10 days from submission date (configurable in `FormConfig.gs`):

```javascript
const CAMPAIGN_DURATION_DAYS = 10;
```

### Error Notifications

Errors are sent to:
```javascript
const ERROR_NOTIFICATION_EMAIL = 'alessandro.zamai@telus.com';
```

### System Fields

The following system fields are automatically set:
- `Datahub_Src`: "EPP Callback Request ADD_FORM_URL"
- `Created_By_Email`: "nick.paolini@telus.com"
- `Campaign_Start_Date`: Today's date
- `Campaign_End_Date`: Today + 10 days

## Development Workflow

### Making Changes Locally

1. Edit the `.gs` files in your local directory
2. Push changes to Apps Script:
   ```bash
   clasp push
   ```

### Pulling Changes from Apps Script

If you make changes in the web editor:
```bash
clasp pull
```

### Viewing Logs

View execution logs in real-time:
```bash
clasp logs
```

Or with streaming:
```bash
clasp logs --watch
```

### Opening the Project

Open the project in the Apps Script web editor:
```bash
clasp open
```

## Webhook Payload Structure

The script sends the following payload to Zoho:

```json
{
  "auth_token_name": "...",
  "auth_token_value": "...",
  "First_Name": "John",
  "Last_Name": "Doe",
  "Phone": "4161234567",
  "Email": "john.doe@example.com",
  "State": "ON",
  "Zip_Code": "M5H 2N2",
  "Language_Preference": "en-ca",
  "note": "Company: ABC Corp\n\nNew customer: Yes\n\nComments: Looking for new plan",
  "Datahub_Src": "EPP Callback Request ADD_FORM_URL",
  "notify_record_owner": true,
  "OrgTypeCode": "KI",
  "Organization_Code": "50080",
  "Consent_to_Contact_Captured": true,
  "Created_By_Email": "nick.paolini@telus.com",
  "Campaign_Start_Date": "2025-10-17",
  "Campaign_End_Date": "2025-10-27"
}
```

## Error Handling

### Validation Errors

If form data fails validation, an error email is sent with:
- List of validation errors
- Form data that was submitted
- Timestamp and script information

### API Errors

If the webhook call fails, an error email includes:
- HTTP response code
- Error message from API
- Form data
- Timestamp

### Email Notifications

All errors trigger an email to `alessandro.zamai@telus.com` with detailed information for debugging.

## Troubleshooting

### Script Properties Not Found

**Error**: "Authentication credentials not configured"

**Solution**: 
1. Go to Apps Script editor → Project Settings
2. Add the required Script Properties (see Step 5)

### Form Trigger Not Working

**Error**: Form submissions not being processed

**Solution**:
1. Check that the trigger is installed (Step 7)
2. Verify the trigger function is `onFormSubmit`
3. Check execution logs for errors

### Validation Errors

**Error**: "Phone must contain at least 10 digits"

**Solution**: Ensure phone numbers in the form include area code and number (minimum 10 digits)

### Webhook Errors

**Error**: "HTTP 401" or "HTTP 403"

**Solution**: Verify Script Properties contain correct auth tokens

## Security Notes

- ✅ No credentials hardcoded in scripts
- ✅ All credentials stored in Script Properties
- ✅ Input validation and sanitization
- ✅ HTML/script tag removal from user inputs
- ✅ Email validation using RFC 5322 regex
- ✅ Phone number normalization

## Support

For issues or questions:
- Check the execution logs: `clasp logs`
- Review error notification emails
- Contact: alessandro.zamai@telus.com

## Version History

- **v1.0.0** (2025-10-17) - Initial release
  - Form submit trigger
  - Input validation
  - Webhook integration
  - Error notifications
  - Clasp deployment support
