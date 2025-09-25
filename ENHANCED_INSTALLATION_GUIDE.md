# 📦 Enhanced Installation Guide - TELUS Zoho Integration

**Version 2.0.0** | **Self-Service Installation**

This guide provides step-by-step instructions for installing the TELUS Zoho Lead Integration by copying code files into your own Google Apps Script project.

---

## 🎯 **What You'll Get**

✅ **Professional Google Workspace Add-on** with TELUS branding  
✅ **Automated lead processing** from Google Sheets to Zoho CRM  
✅ **Configuration wizard** for easy setup  
✅ **Manual sync capabilities** for batch processing  
✅ **Status monitoring** and error tracking  

---

## ⏱️ **Installation Time: ~15 minutes**

**Prerequisites:**
- Google account with Apps Script access
- Basic copy-paste skills
- Zoho CRM credentials (provided by TELUS team)

---

## 📋 **Step-by-Step Installation**

### **Step 1: Create New Apps Script Project** (2 minutes)

1. 🌐 Go to [script.google.com](https://script.google.com)
2. 🆕 Click **"New Project"**
3. 📝 Rename project to: **"TELUS Zoho Lead Integration"**
4. 💾 Click **"Save"**

### **Step 2: Configure Project Settings** (3 minutes)

1. ⚙️ Click the **gear icon** (Project Settings) in the left sidebar
2. 🔧 Scroll to **"Google Cloud Platform (GCP) Project"**
3. 📋 Enter project number: **`371880869452`**
4. ✅ Click **"Set Project"**
5. ✅ Check **"Show 'appsscript.json' manifest file in editor"**
6. 🔙 Return to **"Editor"** tab

### **Step 3: Copy Code Files** (8 minutes)

**⚠️ Important: Copy files in this exact order to avoid dependency errors**

#### **File 1: appsscript.json (Manifest)**
1. 📄 Click on **`appsscript.json`** in the file list
2. 🗑️ **Delete all existing content**
3. 📋 **Copy and paste** the following:

```json
{
  "timeZone": "America/Toronto",
  "dependencies": {
    "enabledAdvancedServices": [
      {
        "userSymbol": "Sheets",
        "serviceId": "sheets",
        "version": "v4"
      }
    ]
  },
  "addOns": {
    "common": {
      "name": "TELUS Zoho Lead Integration",
      "logoUrl": "https://www.telus.com/favicon.ico",
      "useLocaleFromApp": true,
      "homepageTrigger": {
        "runFunction": "onHomepage"
      },
      "universalActions": [
        {
          "label": "Configure Integration",
          "runFunction": "openConfiguration"
        },
        {
          "label": "View Status",
          "runFunction": "showStatus"
        },
        {
          "label": "Manual Sync",
          "runFunction": "manualSync"
        }
      ]
    },
    "sheets": {
      "homepageTrigger": {
        "runFunction": "onSheetsHomepage"
      },
      "onFileScopeGrantedTrigger": {
        "runFunction": "onFileScopeGranted"
      }
    }
  },
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/script.external_request",
    "https://www.googleapis.com/auth/script.scriptapp",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/script.locale",
    "https://www.googleapis.com/auth/script.container.ui"
  ],
  "urlFetchWhitelist": [
    "https://sandbox.zohoapis.com/",
    "https://crm.zoho.com/",
    "https://www.telus.com/",
    "https://github.com/"
  ],
  "runtimeVersion": "V8"
}
```

4. 💾 **Save** (Ctrl+S)

#### **File 2: version.gs**
1. ➕ Click **"+"** next to "Files"
2. 📄 Choose **"Script"**
3. 📝 Name it: **`version`**
4. 🗑️ **Delete all existing content**
5. 📋 **Copy the content from:** `version.gs` in the repository
6. 💾 **Save** (Ctrl+S)

#### **File 3: addon_main.gs**
1. ➕ Click **"+"** next to "Files"
2. 📄 Choose **"Script"**
3. 📝 Name it: **`addon_main`**
4. 🗑️ **Delete all existing content**
5. 📋 **Copy the content from:** `addon_main.gs` in the repository
6. 💾 **Save** (Ctrl+S)

#### **File 4: zoho_integration_core.gs**
1. ➕ Click **"+"** next to "Files"
2. 📄 Choose **"Script"**
3. 📝 Name it: **`zoho_integration_core`**
4. 🗑️ **Delete all existing content**
5. 📋 **Copy the content from:** `zoho_integration_core.gs` in the repository
6. 💾 **Save** (Ctrl+S)

#### **File 5: zoho_validation.gs**
1. ➕ Click **"+"** next to "Files"
2. 📄 Choose **"Script"**
3. 📝 Name it: **`zoho_validation`**
4. 🗑️ **Delete all existing content**
5. 📋 **Copy the content from:** `zoho_validation.gs` in the repository
6. 💾 **Save** (Ctrl+S)

#### **File 6: zoho_config.gs**
1. ➕ Click **"+"** next to "Files"
2. 📄 Choose **"Script"**
3. 📝 Name it: **`zoho_config`**
4. 🗑️ **Delete all existing content**
5. 📋 **Copy the content from:** `zoho_config.gs` in the repository
6. 💾 **Save** (Ctrl+S)

#### **File 7: zoho_triggers.gs**
1. ➕ Click **"+"** next to "Files"
2. 📄 Choose **"Script"**
3. 📝 Name it: **`zoho_triggers`**
4. 🗑️ **Delete all existing content**
5. 📋 **Copy the content from:** `zoho_triggers.gs` in the repository
6. 💾 **Save** (Ctrl+S)

#### **File 8: Remove Default Code.gs**
1. 📄 Click on **`Code.gs`** (the default file)
2. ⋮ Click the **three dots** menu next to the filename
3. 🗑️ Choose **"Remove file"**

### **Step 4: Deploy as Add-on** (2 minutes)

1. 🚀 Click **"Deploy"** button (top right)
2. 🆕 Choose **"New deployment"**
3. ⚙️ Click the **gear icon** next to "Type"
4. 🔧 Select **"Add-on"**
5. 📝 Fill in deployment details:
   - **Description**: `TELUS Zoho Lead Integration Add-on`
   - **Execute as**: `User accessing the add-on`
   - **Who has access**: `Anyone with Google account`
6. 🚀 Click **"Deploy"**
7. 📋 **Copy the Add-on URL** for sharing with users

---

## ✅ **Installation Verification**

### **Test Your Installation:**

1. 📊 Open a new Google Sheet
2. 🧩 Go to **Extensions > Add-ons > Manage add-ons**
3. 🔍 Find **"TELUS Zoho Lead Integration"**
4. ✅ Click **"Use in this document"**
5. 🧩 Go to **Extensions > TELUS Zoho Lead Integration**
6. ⚙️ You should see the configuration options

### **Expected Results:**
- ✅ Add-on appears in Extensions menu
- ✅ Configuration wizard opens
- ✅ TELUS branding is visible
- ✅ No error messages in Apps Script console

---

## 🔧 **Initial Configuration**

After successful installation:

1. 📊 **Open Google Sheets**
2. 🧩 **Extensions > TELUS Zoho Lead Integration**
3. ⚙️ **Configure Integration**
4. 📝 **Follow the setup wizard:**
   - Choose organization type (KI/DL/RT)
   - Enter API credentials
   - Set campaign dates
   - Configure lead assignment

---

## 🆘 **Troubleshooting**

### **Common Issues:**

**❌ "Function not found" errors:**
- ✅ Ensure all files are copied in the correct order
- ✅ Check that file names match exactly (no extra spaces)
- ✅ Verify all content was copied completely

**❌ "Authorization required" errors:**
- ✅ Run any function once to trigger authorization
- ✅ Grant all requested permissions
- ✅ Check GCP project number is correct

**❌ Add-on doesn't appear in Extensions menu:**
- ✅ Verify deployment was successful
- ✅ Check deployment type is "Add-on"
- ✅ Refresh Google Sheets

**❌ "urlFetchWhitelist" error during deployment:**
- ✅ Ensure appsscript.json was copied completely
- ✅ Check JSON syntax is valid
- ✅ Verify all URLs are included in whitelist

### **Getting Help:**

1. 📧 **Technical Support**: dltrlzohodev@telus.com
2. 🐛 **Report Issues**: GitHub Issues page
3. 📖 **Documentation**: Check README.md for additional guides

---

## 🔄 **Updates and Maintenance**

### **Checking for Updates:**
1. 🔍 Visit the GitHub repository
2. 📋 Check latest release version
3. 📖 Review release notes for changes

### **Updating Your Installation:**
1. 📋 Copy new/changed files from latest release
2. 💾 Save all changes in Apps Script
3. 🚀 Deploy new version
4. ✅ Test functionality

### **Version History:**
- **v2.0.0**: Initial enhanced release with add-on interface
- **v1.x.x**: Legacy standalone script versions

---

## 📞 **Support and Resources**

**📖 Documentation:**
- [README.md](README.md) - Complete project overview
- [TROUBLESHOOTING_GUIDE.md](TROUBLESHOOTING_GUIDE.md) - Detailed troubleshooting
- [API Documentation](README.md#api-parameters) - Zoho webhook parameters

**🔗 Quick Links:**
- [GitHub Repository](https://github.com/AlessandroZ-TELUS/Zoho)
- [Latest Release](https://github.com/AlessandroZ-TELUS/Zoho/releases/latest)
- [Issue Tracker](https://github.com/AlessandroZ-TELUS/Zoho/issues)

**📧 Contact:**
- **Technical**: dltrlzohodev@telus.com
- **Program**: DLR-BOB@telus.com

---

## 🎉 **You're All Set!**

Your TELUS Zoho Lead Integration is now installed and ready to use. The add-on provides a professional interface for managing your lead integration with Zoho CRM.

**Next Steps:**
1. ⚙️ Complete the configuration wizard
2. 📊 Set up your lead data spreadsheet
3. 🧪 Test with sample data
4. 🚀 Start capturing leads!
