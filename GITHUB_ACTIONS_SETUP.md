# GitHub Actions Setup Guide

This guide explains how to set up the GitHub Actions workflows for automated deployment of the Zoho Lead Integration Add-on using personal Google account authentication.

## Prerequisites

- Existing Google Cloud Project: `n8n-gcp-api-np-53449c`
- GitHub repository with admin access
- Google Apps Script project for the add-on
- Personal Google account with access to the GCP project

## Step 1: Install and Configure clasp Locally

1. Install clasp on your local machine:
   ```bash
   npm install -g @google/clasp
   ```

2. Enable Google Apps Script API:
   - Go to [Google Apps Script Settings](https://script.google.com/home/usersettings)
   - Turn on **Google Apps Script API**

3. Login with clasp:
   ```bash
   clasp login
   ```
   This will open a browser window for Google authentication.

## Step 2: Get Authentication Credentials

After logging in with clasp, you'll need to get your credentials:

1. Find your clasp credentials file:
   - **Windows**: `%APPDATA%\.clasprc.json`
   - **macOS/Linux**: `~/.clasprc.json`

2. Copy the contents of this file - you'll need it for GitHub secrets

## Step 3: Set up GitHub Secrets

In your GitHub repository, go to **Settings > Secrets and variables > Actions** and add:

### Required Secrets:

1. **GOOGLE_CREDENTIALS**
   - Content: The entire contents of your `.clasprc.json` file from Step 2

2. **CLASP_SETTINGS**
   - Content: JSON with your Apps Script project info:
   ```json
   {
     "scriptId": "your-script-id",
     "rootDir": "."
   }
   ```

3. **SCRIPT_ID**
   - Content: Just the script ID (for reference in workflows)
   - Example: `1BxKp6L2iCGtlyxGVMN0VTEsfMJRdMqt4GOdfUESMcks6DrsjUgs0t1DY`

## Step 4: Create Apps Script Project

Create a single Apps Script project for the add-on:

1. **Create Add-on Project:**
   - Go to [Google Apps Script](https://script.google.com)
   - Click **New Project**
   - Name it "TELUS Zoho Lead Integration"
   - Note the Script ID from Project Settings

2. **Link to GCP Project:**
   - In Project Settings, under "Google Cloud Platform (GCP) Project"
   - Enter the project number for `n8n-gcp-api-np-53449c`
   - Click **Set Project**

## Step 5: Get Apps Script Project ID

To find your Apps Script project IDs:
1. Open [Google Apps Script](https://script.google.com)
2. Open your project
3. Click **Project Settings** (gear icon)
4. Copy the **Script ID**

## Step 7: Test the Setup

1. Push code to the main branch to trigger staging deployment
2. Use **Actions** tab in GitHub to monitor the workflow
3. Check for any authentication or permission errors

## Troubleshooting

### Common Issues:

1. **Authentication Error**: Verify the JSON key is correctly formatted in GitHub secrets
2. **Permission Denied**: Ensure the service account has the required roles
3. **API Not Enabled**: Check that Apps Script API is enabled in your GCP project
4. **Script ID Not Found**: Verify the script IDs in the CLASP_SETTINGS secrets

### Manual Testing:

You can test the authentication locally:
```bash
# Install clasp
npm install -g @google/clasp

# Set up credentials (use the same JSON key)
clasp login --creds credentials.json

# Test access to your project
clasp open --scriptId YOUR_SCRIPT_ID
```

## Security Notes

- Never commit the JSON key file to your repository
- Use separate service accounts for staging and production if possible
- Regularly rotate service account keys
- Monitor service account usage in Google Cloud Console
