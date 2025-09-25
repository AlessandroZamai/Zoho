# 📋 Manual Deployment Guide - Google Workspace Add-on

This guide walks you through manually setting up the TELUS Zoho Lead Integration as a Google Workspace Add-on by copy/pasting the code directly into Google Apps Script.

## 🚀 **What You're Building**

A Google Workspace Add-on that provides:
- **Professional interface** with TELUS branding
- **Configuration management** through add-on sidebar
- **Status monitoring** and manual sync capabilities
- **Integration** with your existing Zoho webhook system

## 📋 **Step 1: Create New Google Apps Script Project**

1. Go to [Google Apps Script](https://script.google.com)
2. Click **"New Project"**
3. Rename the project to **"TELUS Zoho Lead Integration"**

## 📋 **Step 2: Set Up GCP Project**

1. In your Apps Script project, click the **gear icon** (Project Settings)
2. Under **"Google Cloud Platform (GCP) Project"**
3. Enter your project number: **`371880869452`**
4. Click **"Set Project"**

## 📋 **Step 3: Copy Files to Apps Script**

Copy these files from your repository to Google Apps Script **in this exact order:**

### **File 1: appsscript.json (Manifest)**
1. In Apps Script, click **"Project Settings"** (gear icon)
2. Check **"Show 'appsscript.json' manifest file in editor"**
3. Go back to **"Editor"** tab
4. Click on **`appsscript.json`** file
5. **Replace all content** with the content from your `appsscript.json` file

### **File 2: version.gs**
1. Click the **"+"** next to "Files"
2. Choose **"Script"**
3. Name it **`version`**
4. **Copy and paste** the entire content from your `version.gs` file

### **File 3: addon_main.gs**
1. Click the **"+"** next to "Files"
2. Choose **"Script"**
3. Name it **`addon_main`**
4. **Copy and paste** the entire content from your `addon_main.gs` file

### **File 4: zoho_integration_core.gs**
1. Click the **"+"** next to "Files"
2. Choose **"Script"**
3. Name it **`zoho_integration_core`**
4. **Copy and paste** the entire content from your `zoho_integration_core.gs` file

### **File 5: zoho_validation.gs**
1. Click the **"+"** next to "Files"
2. Choose **"Script"**
3. Name it **`zoho_validation`**
4. **Copy and paste** the entire content from your `zoho_validation.gs` file

### **File 6: zoho_config.gs**
1. Click the **"+"** next to "Files"
2. Choose **"Script"**
3. Name it **`zoho_config`**
4. **Copy and paste** the entire content from your `zoho_config.gs` file

### **File 7: zoho_triggers.gs**
1. Click the **"+"** next to "Files"
2. Choose **"Script"**
3. Name it **`zoho_triggers`**
4. **Copy and paste** the entire content from your `zoho_triggers.gs` file

### **File 8: Delete Default Code.gs**
1. Click on the default **`Code.gs`** file
2. Click the **three dots** menu next to it
3. Choose **"Remove file"**

## 📋 **Step 4: Deploy as Add-on**

1. Click **"Deploy"** button (top right)
2. Choose **"New deployment"**
3. Click the **gear icon** next to "Type"
4. Select **"Add-on"**
5. Fill in the details:
   - **Description**: "TELUS Zoho Lead Integration Add-on"
   - **Execute as**: "User accessing the add-on"
   - **Who has access**: "Anyone with Google account"
6. Click **"Deploy"**

## 📋 **Step 5: Get Installation Link**

1. After deployment, you'll get a **Deployment ID**
2. Copy the **"Add-on URL"** - this is what you'll share with users
3. The URL will look like: `https://workspace.google.com/marketplace/app/...`

## 📋 **Step 6: Test the Add-on**

1. Open a new Google Sheet
2. Go to **Extensions > Add-ons > Get add-ons**
3. Search for your add-on or use the installation link
4. Install it and test the functionality

## 🔧 **Configuration for Users**

Once users install the add-on:

1. **Open Google Sheets**
2. **Extensions > TELUS Zoho Lead Integration**
3. **Configure Integration** - Set up:
   - Organization type (KI/DL/RT)
   - API credentials
   - Campaign dates
4. **Start using** - Add lead data and sync to Zoho

## 📋 **Required Files Checklist**

Make sure you copy all these files:

- ✅ `appsscript.json` - Add-on manifest
- ✅ `version.gs` - Version management
- ✅ `addon_main.gs` - Add-on interface
- ✅ `zoho_integration_core.gs` - Core processing
- ✅ `zoho_validation.gs` - Data validation
- ✅ `zoho_config.gs` - Configuration
- ✅ `zoho_triggers.gs` - Trigger management

## 🔄 **Updates and Maintenance**

To update the add-on:

1. **Edit the files** in Google Apps Script
2. **Save** all changes
3. **Deploy > New deployment** 
4. **Update existing deployment** or create new version

The add-on is now ready for distribution to your users!
