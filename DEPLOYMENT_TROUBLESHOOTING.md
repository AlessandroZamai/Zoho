# Deployment Troubleshooting Guide

This guide helps resolve common issues with the GitHub Actions deployment pipeline for the TELUS Zoho Lead Integration Add-on.

## Common Error: "Cannot read properties of undefined (reading 'access_token')"

### Problem
The GitHub Actions workflow fails with:
```
Error retrieving access token: TypeError: Cannot read properties of undefined (reading 'access_token')
```

### Root Causes & Solutions

#### 1. **Missing or Empty GOOGLE_CREDENTIALS Secret**

**Check:**
- Go to GitHub repository → Settings → Secrets and variables → Actions
- Click on **"Repository secrets"** tab (NOT "Environment secrets")
- Verify `GOOGLE_CREDENTIALS` secret exists and has content

**Fix:**
- Delete the existing secret if it exists
- Create a new `GOOGLE_CREDENTIALS` secret in **Repository secrets**
- Paste the **entire contents** of your `.clasprc.json` file

#### 2. **Malformed JSON in GOOGLE_CREDENTIALS**

**Check:**
- The secret should contain valid JSON starting with `{` and ending with `}`
- No extra characters, spaces, or line breaks before/after the JSON

**Fix:**
1. Open your `.clasprc.json` file locally
2. Copy the **entire file contents** (Ctrl+A, Ctrl+C)
3. Paste directly into the GitHub secret field
4. Do not modify or format the JSON

#### 3. **Expired or Invalid Credentials**

**Check:**
- Your local `clasp login` might have expired
- The `access_token` in `.clasprc.json` might be outdated

**Fix:**
1. Run `clasp logout` locally
2. Run `clasp login` again
3. Copy the new `.clasprc.json` contents
4. Update the `GOOGLE_CREDENTIALS` secret in GitHub

#### 4. **Missing CLASP_SETTINGS Secret**

**Check:**
- Verify `CLASP_SETTINGS` secret exists in GitHub

**Fix:**
Create `CLASP_SETTINGS` secret with this format:
```json
{
  "scriptId": "your-actual-script-id-here",
  "rootDir": "."
}
```

Replace `your-actual-script-id-here` with your Apps Script project ID.

## Step-by-Step Fix Process

### Step 1: Verify Local clasp Setup
```bash
# Check if you're logged in
clasp login --status

# If not logged in or expired, login again
clasp logout
clasp login
```

### Step 2: Get Fresh Credentials
1. **Windows**: Open `%APPDATA%\.clasprc.json`
2. **macOS/Linux**: Open `~/.clasprc.json`
3. Copy the **entire file contents**

### Step 3: Update GitHub Secrets
1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Update or create these secrets:

**GOOGLE_CREDENTIALS:**
```json
{
  "token": {
    "access_token": "ya29.a0AfH6SMC...",
    "refresh_token": "1//04...",
    "scope": "https://www.googleapis.com/auth/...",
    "token_type": "Bearer",
    "expiry_date": 1234567890123
  },
  "oauth2ClientSettings": {
    "clientId": "1234567890-abc123.apps.googleusercontent.com",
    "clientSecret": "GOCSPX-...",
    "redirectUri": "http://localhost"
  },
  "isLocalCreds": false
}
```

**CLASP_SETTINGS:**
```json
{
  "scriptId": "1BxKp6L2iCGtlyxGVMN0VTEsfMJRdMqt4GOdfUESMcks6DrsjUgs0t1DY",
  "rootDir": "."
}
```

**SCRIPT_ID:**
```
1BxKp6L2iCGtlyxGVMN0VTEsfMJRdMqt4GOdfUESMcks6DrsjUgs0t1DY
```

### Step 4: Test the Fix
1. Make a small change to any file (like adding a comment)
2. Commit and push to the main branch
3. Check the Actions tab for the deployment status

## Additional Troubleshooting

### Check Apps Script API Access
1. Go to [Google Apps Script Settings](https://script.google.com/home/usersettings)
2. Ensure **Google Apps Script API** is turned ON

### Verify GCP Project Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select project: `n8n-gcp-api-np-53449c`
3. Go to APIs & Services → Library
4. Ensure these APIs are enabled:
   - Google Apps Script API
   - Google Sheets API
   - Google Drive API

### Check Apps Script Project Settings
1. Open your Apps Script project
2. Go to Project Settings (gear icon)
3. Under "Google Cloud Platform (GCP) Project"
4. Ensure it shows: `n8n-gcp-api-np-53449c`

## Manual Deployment Alternative

If GitHub Actions continues to fail, you can deploy manually:

```bash
# Clone the repository locally
git clone https://github.com/AlessandroZ-TELUS/Zoho.git
cd Zoho

# Login to clasp
clasp login

# Create .clasp.json file
echo '{"scriptId":"your-script-id","rootDir":"."}' > .clasp.json

# Push to Apps Script
clasp push --force

# Create deployment
clasp deploy --description "Manual deployment $(date)"
```

## Getting Help

If you continue to experience issues:

1. **Check the GitHub Actions logs** for specific error messages
2. **Verify all secrets** are correctly formatted JSON
3. **Test clasp locally** to ensure your credentials work
4. **Contact support** with the specific error message and steps you've tried

## Prevention

To avoid future authentication issues:

1. **Set up credential refresh** - clasp tokens expire periodically
2. **Monitor deployments** - check the Actions tab after each push
3. **Keep backups** - save a copy of working `.clasprc.json` files
4. **Document changes** - note when you update credentials or project settings
