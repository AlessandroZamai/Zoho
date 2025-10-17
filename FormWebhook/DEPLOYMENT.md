# Quick Deployment Guide

## Prerequisites Checklist

- [ ] Node.js and npm installed
- [ ] clasp CLI installed (`npm install -g @google/clasp`)
- [ ] Google account with Forms access
- [ ] KI auth token credentials available

## Deployment Steps

### 1. Navigate to Project Directory
```bash
cd FormWebhook
```

### 2. Login to Clasp (First Time Only)
```bash
clasp login
```
- Browser window will open
- Sign in with your Google account
- Authorize clasp

### 3. Create Apps Script Project
```bash
clasp create --type standalone --title "EPP Callback Form Webhook"
```
- This creates a new Apps Script project
- Updates `.clasp.json` with the script ID
- You'll see output like: `Created new standalone script: https://script.google.com/d/[SCRIPT_ID]/edit`

### 4. Push Code to Apps Script
```bash
clasp push
```
- Uploads all `.gs` and `.json` files
- You'll see: `└─ FormWebhook/Code.gs`, `FormConfig.gs`, etc.

### 5. Open Apps Script Editor
```bash
clasp open
```
- Opens the project in your browser

### 6. Configure Script Properties

In the Apps Script editor:

1. Click **⚙️ Project Settings** (gear icon)
2. Scroll to **Script Properties** section
3. Click **Add script property**
4. Add these two properties:

| Property Name | Example Value |
|--------------|---------------|
| `AUTH_TOKEN_NAME_KI` | `1003.abc123...` |
| `AUTH_TOKEN_VALUE_KI` | `xyz789...` |

5. Click **Save script properties**

### 7. Link to Google Form

**Option A: From Apps Script**
1. In Apps Script editor, click the **form icon** (📝) in left sidebar
2. Select your existing form or create new

**Option B: From Google Form**
1. Open your Google Form
2. Click **⋮** (three dots) → **Script editor**
3. This opens the linked Apps Script

### 8. Install Form Submit Trigger

1. In Apps Script editor, click **⏰ Triggers** (clock icon)
2. Click **+ Add Trigger** (bottom right)
3. Configure:
   - **Choose which function to run**: `onFormSubmit`
   - **Choose which deployment should run**: `Head`
   - **Select event source**: `From form`
   - **Select event type**: `On form submit`
4. Click **Save**
5. **Authorize** the script when prompted

### 9. Test Configuration

In Apps Script editor:
1. Select `testConfiguration` from function dropdown
2. Click **▶ Run**
3. Check **Execution log** for results
4. Should see: "All Configuration Tests Passed"

### 10. Test with Form Submission

1. Open your Google Form
2. Fill out and submit a test response
3. Check Apps Script **Execution log**
4. Look for: "SUCCESS: Lead successfully sent to Zoho"
5. Check email for any error notifications

## Updating the Script

### After Making Local Changes

```bash
# Push changes to Apps Script
clasp push

# View logs to verify
clasp logs
```

### After Making Changes in Web Editor

```bash
# Pull changes to local
clasp pull
```

## Troubleshooting

### "Script Properties Not Found"
- Go to Project Settings → Script Properties
- Add `AUTH_TOKEN_NAME_KI` and `AUTH_TOKEN_VALUE_KI`

### "Trigger Not Working"
- Check Triggers page (⏰ icon)
- Verify trigger is set to `onFormSubmit` with "On form submit" event
- Re-authorize if needed

### "Validation Errors"
- Check form field names match `FORM_FIELD_MAPPING` in `FormConfig.gs`
- Ensure required fields are marked as required in the form

### View Logs
```bash
# View recent logs
clasp logs

# Stream logs in real-time
clasp logs --watch
```

## Form Field Requirements

Ensure your Google Form has these questions with **exact titles**:

### Required (must be marked as required in form)
- First Name
- Last Name
- Phone Number
- Email
- Province

### Optional
- Postal Code
- Language Preference
- Are you an existing TELUS customer?
- Company
- Additional details

## Quick Commands Reference

```bash
# Login to clasp
clasp login

# Create new project
clasp create --type standalone --title "EPP Callback Form Webhook"

# Push code
clasp push

# Pull code
clasp pull

# Open in browser
clasp open

# View logs
clasp logs

# Stream logs
clasp logs --watch

# Get project info
clasp status
```

## Success Indicators

✅ **Configuration Test Passes**
- Run `testConfiguration` function
- All 4 tests should pass

✅ **Form Submission Works**
- Submit test form
- Check execution log for "SUCCESS: Lead successfully sent to Zoho"
- Verify record created in Zoho CRM

✅ **No Error Emails**
- No emails sent to alessandro.zamai@telus.com
- If errors occur, they contain detailed debugging info

## Support

- **Execution Logs**: `clasp logs`
- **Error Emails**: alessandro.zamai@telus.com
- **Full Documentation**: See README.md
