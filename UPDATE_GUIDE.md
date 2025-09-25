# 🔄 Update Guide - TELUS Zoho Integration

**Maintaining Your Installation** | **Version Management**

This guide explains how to update your TELUS Zoho Integration installation when new versions are released.

---

## 📋 **Update Overview**

### **Why Update?**
- 🐛 **Bug fixes** and security improvements
- ✨ **New features** and enhancements
- 🔧 **Performance optimizations**
- 📚 **Updated documentation**
- 🔗 **API compatibility** updates

### **Update Types:**
- **🟢 Patch Updates** (v2.0.1): Bug fixes, minor improvements
- **🟡 Minor Updates** (v2.1.0): New features, backward compatible
- **🔴 Major Updates** (v3.0.0): Breaking changes, may require reconfiguration

---

## 🔍 **Checking for Updates**

### **Method 1: GitHub Releases (Recommended)**
1. 🌐 Visit: [GitHub Releases](https://github.com/AlessandroZ-TELUS/Zoho/releases)
2. 📋 Compare your version with the latest release
3. 📖 Read release notes for changes and requirements

### **Method 2: Built-in Version Check**
1. 📊 Open Google Sheets with your integration
2. 🧩 **Extensions > TELUS Zoho Lead Integration > View Status**
3. 📋 Check version information displayed
4. 🔍 Compare with latest available version

### **Method 3: Email Notifications**
- 📧 Subscribe to release notifications via GitHub
- 📬 Join internal distribution lists for update announcements

---

## 🚀 **Update Process**

### **Before You Start:**
- ⏰ **Schedule downtime** (5-15 minutes)
- 💾 **Backup your configuration** (export settings)
- 📖 **Read release notes** for breaking changes
- ✅ **Test in a copy** of your spreadsheet first

### **Step-by-Step Update:**

#### **Step 1: Identify Changed Files** (2 minutes)
1. 📖 Check the **release notes** for the new version
2. 📋 Note which files have been **modified/added/removed**
3. 🔍 Look for **migration instructions** if any

#### **Step 2: Update Code Files** (5-10 minutes)

**For each changed file:**

1. 🌐 Go to your **Google Apps Script project**
2. 📄 Open the **file to be updated**
3. 🗑️ **Select all content** (Ctrl+A) and **delete**
4. 📋 **Copy new content** from the repository
5. 📝 **Paste** into the file
6. 💾 **Save** (Ctrl+S)

**Common files that may need updates:**
- `addon_main.gs` - Add-on interface updates
- `zoho_integration_core.gs` - Core functionality changes
- `zoho_validation.gs` - Validation improvements
- `zoho_config.gs` - Configuration enhancements
- `version.gs` - Version information
- `appsscript.json` - Manifest updates

#### **Step 3: Update Deployment** (2 minutes)
1. 🚀 Click **"Deploy"** in Apps Script
2. 🆕 Choose **"New deployment"** OR **"Manage deployments"**
3. ✏️ **Edit existing deployment** or create new one
4. 📝 Update **description** with new version number
5. 🚀 Click **"Deploy"**

#### **Step 4: Test Updated Installation** (3 minutes)
1. 📊 Open a **test Google Sheet**
2. 🧩 **Extensions > TELUS Zoho Lead Integration**
3. ✅ Verify **add-on loads correctly**
4. ⚙️ Check **configuration is preserved**
5. 🧪 **Test basic functionality**

---

## 📋 **Version-Specific Update Instructions**

### **Patch Updates (v2.0.x)**
**Typical changes:** Bug fixes, minor improvements

**Update process:**
1. 📋 Update only the **changed files** mentioned in release notes
2. 💾 **Save and deploy**
3. ✅ **Test functionality**

**⏱️ Estimated time:** 5 minutes

### **Minor Updates (v2.x.0)**
**Typical changes:** New features, enhanced functionality

**Update process:**
1. 📋 Update **all changed files**
2. 📖 Review **new configuration options**
3. 🔧 **Run configuration wizard** if prompted
4. ✅ **Test new features**

**⏱️ Estimated time:** 10 minutes

### **Major Updates (v3.0.0+)**
**Typical changes:** Breaking changes, new architecture

**Update process:**
1. 📖 **Read migration guide** carefully
2. 💾 **Export current configuration**
3. 📋 **Update all files** as instructed
4. 🔧 **Reconfigure** using setup wizard
5. 🧪 **Thorough testing** required

**⏱️ Estimated time:** 15-30 minutes

---

## 🛡️ **Backup and Recovery**

### **Before Updating - Create Backup:**

#### **Method 1: Configuration Export**
1. 🧩 **Extensions > TELUS Zoho Lead Integration > View Status**
2. 📋 **Copy configuration details**
3. 💾 **Save to text file**

#### **Method 2: Apps Script Project Copy**
1. 🌐 Go to **Google Apps Script**
2. 📄 **File > Make a copy**
3. 📝 **Rename** to include version number
4. 💾 **Save as backup**

#### **Method 3: Spreadsheet Template Backup**
1. 📊 **Copy your configured spreadsheet**
2. 📝 **Rename** with version and date
3. 💾 **Keep as template**

### **Recovery Process:**
If update fails:
1. 🔙 **Restore from backup** Apps Script project
2. 🚀 **Redeploy** previous version
3. 📧 **Report issue** to support team
4. ⏳ **Wait for fix** before retrying

---

## 🔧 **Configuration Migration**

### **Preserving Settings During Updates:**

**Automatic preservation** (most updates):
- ✅ Organization type and credentials
- ✅ Campaign dates
- ✅ Lead assignment settings
- ✅ Processing mode preferences

**Manual reconfiguration** (major updates):
- 🔧 May require running setup wizard again
- 📋 Use exported configuration as reference
- ✅ Verify all settings after update

### **Configuration Compatibility:**
- **v2.0.x → v2.0.y**: ✅ Fully compatible
- **v2.0.x → v2.1.x**: ✅ Usually compatible
- **v2.x.x → v3.0.x**: ⚠️ May require reconfiguration

---

## 🆘 **Troubleshooting Updates**

### **Common Update Issues:**

**❌ "Function not found" after update:**
- ✅ Ensure **all required files** were updated
- ✅ Check **file names** match exactly
- ✅ Verify **complete content** was copied

**❌ Configuration lost after update:**
- ✅ **Re-run setup wizard**
- ✅ Use **backup configuration** as reference
- ✅ Check **script properties** in Apps Script

**❌ Add-on doesn't work after update:**
- ✅ **Clear browser cache**
- ✅ **Refresh Google Sheets**
- ✅ **Redeploy** the add-on
- ✅ Check **Apps Script logs** for errors

**❌ Deployment fails:**
- ✅ Check **appsscript.json** syntax
- ✅ Verify **all required scopes** are included
- ✅ Ensure **urlFetchWhitelist** is complete

### **Getting Help:**
1. 📖 Check **release notes** for known issues
2. 🔍 Search **GitHub issues** for similar problems
3. 📧 Contact **technical support**: dltrlzohodev@telus.com
4. 🐛 **Report new issues** on GitHub

---

## 📅 **Update Schedule Recommendations**

### **For Production Use:**
- 🟢 **Patch updates**: Apply within 1 week
- 🟡 **Minor updates**: Apply within 1 month
- 🔴 **Major updates**: Plan and test thoroughly

### **For Development/Testing:**
- 🚀 **All updates**: Apply immediately for testing
- 🧪 **Validate** before rolling to production
- 📝 **Document** any issues found

### **Maintenance Windows:**
- 📅 **Schedule regular updates** (monthly)
- ⏰ **Plan downtime** during low-usage periods
- 📧 **Notify users** of scheduled maintenance

---

## 📋 **Update Checklist**

### **Pre-Update:**
- [ ] 📖 Read release notes
- [ ] 💾 Create backup
- [ ] 📅 Schedule maintenance window
- [ ] 📧 Notify users (if applicable)

### **During Update:**
- [ ] 📋 Update changed files
- [ ] 💾 Save all changes
- [ ] 🚀 Deploy new version
- [ ] ✅ Test basic functionality

### **Post-Update:**
- [ ] 🧪 Comprehensive testing
- [ ] 📋 Verify configuration preserved
- [ ] 📧 Confirm with users
- [ ] 📝 Document any issues

---

## 🔗 **Quick Reference Links**

- **📦 Latest Release**: [GitHub Releases](https://github.com/AlessandroZ-TELUS/Zoho/releases/latest)
- **📖 Release Notes**: [GitHub Releases](https://github.com/AlessandroZ-TELUS/Zoho/releases)
- **🐛 Issue Tracker**: [GitHub Issues](https://github.com/AlessandroZ-TELUS/Zoho/issues)
- **📧 Technical Support**: dltrlzohodev@telus.com
- **📚 Documentation**: [README.md](README.md)

---

## 🎯 **Best Practices**

1. **🔄 Regular Updates**: Stay current with latest versions
2. **🧪 Test First**: Always test updates in non-production environment
3. **💾 Backup Always**: Create backups before any update
4. **📖 Read Notes**: Review release notes for important changes
5. **📧 Stay Informed**: Subscribe to update notifications
6. **🆘 Report Issues**: Help improve the project by reporting problems

**Remember**: Keeping your integration updated ensures optimal performance, security, and compatibility with Zoho CRM changes.
