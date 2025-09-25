# Google Cloud Project Setup Guide

This guide explains how to configure your existing Google Cloud Project (`371880869452`) for the TELUS Zoho Lead Integration Add-on.

## Prerequisites

- Access to Google Cloud Project: `371880869452`
- Google Apps Script projects for staging and production
- Admin access to configure OAuth consent screen

## Step 1: Link Apps Script Projects to GCP

### For Apps Script Project:
1. Open your Apps Script project
2. Go to **Project Settings** (gear icon)
3. Under "Google Cloud Platform (GCP) Project"
4. Enter project number: `371880869452`
5. Click **Set Project**

## Step 2: Enable Required APIs

In the Google Cloud Console for project `371880869452`:

1. Go to **APIs & Services > Library**
2. Enable these APIs:
   - **Google Apps Script API**
   - **Google Sheets API** 
   - **Google Drive API**

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services > OAuth consent screen**
2. Choose **Internal** (for TELUS organization only) or **External** (for partners)
3. Fill in the application information:

### Application Information:
- **App name**: `TELUS Zoho Lead Integration`
- **User support email**: Your TELUS email
- **App logo**: Upload TELUS logo (optional)
- **Application home page**: `https://github.com/AlessandroZ-TELUS/Zoho`
- **Application privacy policy**: Link to TELUS privacy policy
- **Application terms of service**: Link to TELUS terms

### App Domain (if External):
- **Authorized domains**: 
  - `telus.com`
  - Add partner domains as needed

### Developer Contact Information:
- **Email addresses**: Your TELUS email

## Step 4: Configure OAuth Scopes

Add these scopes to your OAuth consent screen:

### Required Scopes:
- `https://www.googleapis.com/auth/spreadsheets`
- `https://www.googleapis.com/auth/script.external_request`
- `https://www.googleapis.com/auth/script.scriptapp`
- `https://www.googleapis.com/auth/drive.file`

### Scope Justifications:
- **Spreadsheets**: Read and write lead data
- **External Request**: Send data to Zoho CRM API
- **Script App**: Manage triggers and execution
- **Drive File**: Access spreadsheet files

## Step 5: Set Up Test Users (if External)

If you chose "External" for the OAuth consent screen:

1. Go to **Test users** section
2. Add email addresses of users who should have access during testing
3. Include your own email and key stakeholders

## Step 6: Deploy Add-on for Testing

### Private Distribution Setup:

1. **Head Deployment**:
   - In Apps Script, go to **Deploy > New deployment**
   - Choose **Type: Add-on**
   - Set **Execute as**: User accessing the add-on
   - Set **Who has access**: Anyone with Google account (or specific domains)

2. **Get Installation Link**:
   - Copy the deployment URL
   - Share with test users for installation

### Domain-Restricted Distribution:

If you want to restrict to specific domains:

1. In the OAuth consent screen, add authorized domains
2. Users outside these domains won't be able to install
3. Useful for limiting to TELUS and partner organizations

## Step 7: Production Deployment

### For Marketplace Publication (Optional):

1. **Complete OAuth Review**:
   - Submit for Google's security review
   - Provide detailed scope justifications
   - May take 1-2 weeks for approval

2. **Publish to Workspace Marketplace**:
   - Go to Google Workspace Marketplace
   - Submit your add-on for publication
   - Include screenshots, descriptions, and documentation

### For Private Distribution (Recommended):

1. **Generate Installation Links**:
   - Create deployment with specific access controls
   - Share links directly with authorized users
   - No marketplace review required

2. **Access Control Options**:
   - **Anyone with Google account**: Public access
   - **Anyone in organization**: Domain-restricted
   - **Specific users**: Email-based access control

## Step 8: Monitor and Maintain

### Usage Monitoring:
1. **Apps Script Dashboard**: Monitor execution quotas and errors
2. **GCP Console**: Track API usage and costs
3. **OAuth Consent Screen**: Monitor user consent and access

### Security Best Practices:
1. **Regular Reviews**: Review authorized users and access
2. **Scope Minimization**: Only request necessary permissions
3. **Error Monitoring**: Set up alerts for API errors
4. **Access Logs**: Monitor who's using the add-on

## Troubleshooting

### Common Issues:

1. **"Project not found" Error**:
   - Verify the GCP project ID is correct
   - Ensure you have access to the project

2. **OAuth Consent Required**:
   - Complete the OAuth consent screen setup
   - Add all required scopes

3. **API Not Enabled**:
   - Check that all required APIs are enabled
   - Wait a few minutes after enabling APIs

4. **Access Denied**:
   - Verify user is in authorized domains
   - Check OAuth consent screen configuration

### Getting Help:

- **GCP Support**: Use Google Cloud support for project-level issues
- **Apps Script Support**: Use Apps Script community forums
- **Internal Support**: Contact TELUS IT for organization-specific issues

## Security Considerations

### Data Privacy:
- Add-on only accesses spreadsheets user explicitly grants access to
- No data is stored outside of Google's infrastructure
- All API calls are logged and auditable

### Access Control:
- Use domain restrictions to limit access to authorized organizations
- Regularly review and audit user access
- Implement proper error handling to prevent data leaks

### Compliance:
- Ensure OAuth consent screen accurately describes data usage
- Provide clear privacy policy and terms of service
- Follow TELUS data governance policies
