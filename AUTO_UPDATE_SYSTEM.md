# 🔄 Automated Update System for TELUS Zoho Integration

**Making Updates as Easy as Possible** | **Semi-Automated Solutions**

While Google Apps Script doesn't support direct GitHub imports, here are several approaches to make code updates much easier and more automated.

---

## 🎯 **Update Automation Options**

### **Option 1: GitHub Raw URL Import (Recommended)**

**How it works:** Create a script that fetches the latest code directly from GitHub raw URLs.

**Implementation:**

```javascript
/**
 * Auto-update system - fetches latest code from GitHub
 * Run this function to update all files to the latest version
 */
function autoUpdateFromGitHub() {
  const BASE_URL = 'https://raw.githubusercontent.com/AlessandroZamai/Zoho/workspace-addon/';
  
  const files = [
    'addon_main.gs',
    'zoho_integration_core.gs',
    'zoho_validation.gs',
    'zoho_config.gs',
    'zoho_triggers.gs',
    'version.gs'
  ];
  
  const ui = SpreadsheetApp.getUi();
  const result = ui.alert(
    'Auto-Update System',
    'This will update all code files to the latest version from GitHub. Continue?',
    ui.ButtonSet.YES_NO
  );
  
  if (result !== ui.Button.YES) {
    return;
  }
  
  let updatedFiles = [];
  let errors = [];
  
  files.forEach(filename => {
    try {
      const response = UrlFetchApp.fetch(BASE_URL + filename);
      if (response.getResponseCode() === 200) {
        const content = response.getContentText();
        
        // Update the file content in Apps Script
        // Note: This requires manual implementation per file
        updateScriptFile(filename, content);
        updatedFiles.push(filename);
      } else {
        errors.push(`${filename}: HTTP ${response.getResponseCode()}`);
      }
    } catch (error) {
      errors.push(`${filename}: ${error.toString()}`);
    }
  });
  
  // Show results
  let message = `Update Complete!\n\n`;
  message += `✅ Updated: ${updatedFiles.length} files\n`;
  if (updatedFiles.length > 0) {
    message += `Files: ${updatedFiles.join(', ')}\n\n`;
  }
  
  if (errors.length > 0) {
    message += `❌ Errors: ${errors.length}\n`;
    message += errors.join('\n');
  }
  
  ui.alert('Update Results', message, ui.ButtonSet.OK);
}

/**
 * Helper function to update individual script files
 * Note: Apps Script doesn't allow direct file modification via code
 * This would need to be implemented differently
 */
function updateScriptFile(filename, content) {
  // This is a conceptual function - actual implementation would require
  // different approach since Apps Script doesn't allow self-modification
  Logger.log(`Would update ${filename} with new content`);
}
```

**Limitations:**
- Apps Script doesn't allow scripts to modify their own files
- Would require manual copy-paste for each file
- Can fetch and display the latest code for easy copying

### **Option 2: Version Checker with Update Notifications**

**How it works:** Automatically check for new versions and notify users with update instructions.

**Implementation:**

```javascript
/**
 * Check for updates and notify users
 * Can be run manually or triggered periodically
 */
function checkForUpdates() {
  try {
    const currentVersion = getVersionInfo().version;
    const latestVersion = getLatestVersionFromGitHub();
    
    if (compareVersions(latestVersion, currentVersion) > 0) {
      showUpdateNotification(currentVersion, latestVersion);
    } else {
      SpreadsheetApp.getUi().alert(
        'No Updates Available',
        `You have the latest version (${currentVersion})`,
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    }
  } catch (error) {
    Logger.log('Error checking for updates: ' + error.toString());
  }
}

/**
 * Get latest version from GitHub releases API
 */
function getLatestVersionFromGitHub() {
  const url = 'https://api.github.com/repos/AlessandroZamai/Zoho/releases/latest';
  const response = UrlFetchApp.fetch(url);
  const data = JSON.parse(response.getContentText());
  return data.tag_name; // e.g., "v2.0.1"
}

/**
 * Show update notification with instructions
 */
function showUpdateNotification(currentVersion, latestVersion) {
  const ui = SpreadsheetApp.getUi();
  const message = `🔄 Update Available!\n\n` +
    `Current Version: ${currentVersion}\n` +
    `Latest Version: ${latestVersion}\n\n` +
    `Visit the GitHub repository to download the latest version:\n` +
    `https://github.com/AlessandroZamai/Zoho/releases/latest\n\n` +
    `Would you like to open the update guide?`;
    
  const result = ui.alert('Update Available', message, ui.ButtonSet.YES_NO);
  
  if (result === ui.Button.YES) {
    // Open update guide (would need to be implemented)
    showUpdateInstructions(latestVersion);
  }
}

/**
 * Compare version strings (semantic versioning)
 */
function compareVersions(version1, version2) {
  const v1parts = version1.replace('v', '').split('.').map(Number);
  const v2parts = version2.replace('v', '').split('.').map(Number);
  
  for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
    const v1part = v1parts[i] || 0;
    const v2part = v2parts[i] || 0;
    
    if (v1part > v2part) return 1;
    if (v1part < v2part) return -1;
  }
  return 0;
}
```

### **Option 3: Update Helper with Code Display**

**How it works:** Fetch latest code and display it for easy copy-paste.

**Implementation:**

```javascript
/**
 * Update helper - displays latest code for manual copying
 */
function showUpdateHelper() {
  const ui = SpreadsheetApp.getUi();
  const files = [
    'addon_main.gs',
    'zoho_integration_core.gs',
    'zoho_validation.gs',
    'zoho_config.gs',
    'zoho_triggers.gs',
    'version.gs'
  ];
  
  const result = ui.prompt(
    'Update Helper',
    'Enter the filename to get the latest code (e.g., addon_main.gs):',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (result.getSelectedButton() === ui.Button.OK) {
    const filename = result.getResponseText().trim();
    
    if (files.includes(filename)) {
      displayLatestCode(filename);
    } else {
      ui.alert('Invalid filename. Available files: ' + files.join(', '));
    }
  }
}

/**
 * Display latest code for a specific file
 */
function displayLatestCode(filename) {
  try {
    const url = `https://raw.githubusercontent.com/AlessandroZamai/Zoho/workspace-addon/${filename}`;
    const response = UrlFetchApp.fetch(url);
    
    if (response.getResponseCode() === 200) {
      const content = response.getContentText();
      
      // Create HTML dialog to display code
      const html = HtmlService.createHtmlOutput(`
        <div style="font-family: monospace; white-space: pre-wrap; padding: 10px;">
          <h3>Latest ${filename}</h3>
          <p>Copy the code below and paste it into your ${filename} file:</p>
          <textarea style="width: 100%; height: 400px; font-family: monospace;">${content}</textarea>
          <br><br>
          <button onclick="google.script.host.close()">Close</button>
        </div>
      `).setWidth(800).setHeight(500);
      
      SpreadsheetApp.getUi().showModalDialog(html, `Update ${filename}`);
    } else {
      SpreadsheetApp.getUi().alert('Error fetching file: HTTP ' + response.getResponseCode());
    }
  } catch (error) {
    SpreadsheetApp.getUi().alert('Error: ' + error.toString());
  }
}
```

### **Option 4: Webhook-Based Update Notifications**

**How it works:** Set up a webhook that notifies users when new versions are released.

**Implementation:**
- GitHub webhook triggers when new release is published
- Sends notification to a Google Apps Script web app
- Web app stores update notifications
- Users get notified next time they use the add-on

---

## 🛠 **Recommended Implementation Strategy**

### **Phase 1: Version Checker (Immediate)**
1. Add version checking function to existing code
2. Check for updates when add-on is opened
3. Show notification if update is available
4. Provide direct links to update instructions

### **Phase 2: Update Helper (Short-term)**
1. Add update helper function
2. Allow users to fetch latest code for specific files
3. Display code in easy-to-copy format
4. Integrate with add-on interface

### **Phase 3: Enhanced Automation (Long-term)**
1. Create web app for update management
2. Implement webhook notifications
3. Provide update status dashboard
4. Automated testing of updates

---

## 📋 **Implementation Code**

Here's the practical code to add to your existing system:

### **Add to version.gs:**

```javascript
/**
 * Enhanced version checking with GitHub integration
 */
function checkForUpdatesFromGitHub() {
  try {
    const currentVersion = getVersionInfo().version;
    const response = UrlFetchApp.fetch('https://api.github.com/repos/AlessandroZamai/Zoho/releases/latest');
    const release = JSON.parse(response.getContentText());
    const latestVersion = release.tag_name;
    
    if (latestVersion !== currentVersion) {
      return {
        updateAvailable: true,
        currentVersion: currentVersion,
        latestVersion: latestVersion,
        releaseUrl: release.html_url,
        releaseNotes: release.body
      };
    }
    
    return { updateAvailable: false, currentVersion: currentVersion };
  } catch (error) {
    Logger.log('Error checking for updates: ' + error.toString());
    return { updateAvailable: false, error: error.toString() };
  }
}
```

### **Add to addon_main.gs:**

```javascript
/**
 * Show update notification in add-on interface
 */
function createUpdateNotificationCard() {
  const updateInfo = checkForUpdatesFromGitHub();
  
  if (!updateInfo.updateAvailable) {
    return null; // No update needed
  }
  
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle('🔄 Update Available')
      .setSubtitle(`Version ${updateInfo.latestVersion} is available`))
    .addSection(CardService.newCardSection()
      .addWidget(CardService.newTextParagraph()
        .setText(`Current: ${updateInfo.currentVersion}\nLatest: ${updateInfo.latestVersion}`))
      .addWidget(CardService.newTextButton()
        .setText('View Update Guide')
        .setOpenLink(CardService.newOpenLink()
          .setUrl('https://github.com/AlessandroZamai/Zoho/blob/workspace-addon/UPDATE_GUIDE.md')))
      .addWidget(CardService.newTextButton()
        .setText('Download Latest')
        .setOpenLink(CardService.newOpenLink()
          .setUrl(updateInfo.releaseUrl))))
    .build();
    
  return card;
}
```

---

## ✅ **Benefits of This Approach**

1. **Automatic Update Detection** - Users know when updates are available
2. **Easy Access to Latest Code** - Direct links to download/copy
3. **Version Management** - Clear tracking of current vs. latest versions
4. **User-Friendly** - Integrated into the add-on interface
5. **Maintainable** - You control the update process via GitHub releases

---

## 🚀 **Next Steps**

Would you like me to:

1. **Implement the version checker** in your current code?
2. **Create the update helper functions** for easy code fetching?
3. **Add update notifications** to the add-on interface?
4. **Set up automated update checking** when the add-on loads?

This approach makes updates much easier while working within Apps Script's limitations!
