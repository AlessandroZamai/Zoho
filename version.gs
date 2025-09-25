// Auto-generated version file - DO NOT EDIT MANUALLY
// This file is updated automatically by GitHub Actions during deployment

const ADDON_VERSION = "1.0.0-dev";
const BUILD_DATE = "2024-09-24T22:17:50Z";
const COMMIT_HASH = "development";

/**
 * Get version information for the add-on
 * @return {Object} Version information object
 */
function getVersionInfo() {
  return {
    version: ADDON_VERSION,
    buildDate: BUILD_DATE,
    commitHash: COMMIT_HASH,
    environment: getEnvironment()
  };
}

/**
 * Get current environment
 * @return {string} Environment name
 */
function getEnvironment() {
  return "production";
}

/**
 * Check if a newer version is available
 * @return {Object} Update information
 */
function checkForUpdates() {
  try {
    const response = UrlFetchApp.fetch(
      'https://api.github.com/repos/AlessandroZ-TELUS/Zoho/releases/latest'
    );
    
    if (response.getResponseCode() === 200) {
      const release = JSON.parse(response.getContentText());
      const latestVersion = release.tag_name;
      const currentVersion = ADDON_VERSION;
      
      return {
        hasUpdate: isNewerVersion(latestVersion, currentVersion),
        latestVersion: latestVersion,
        currentVersion: currentVersion,
        releaseUrl: release.html_url,
        releaseNotes: release.body
      };
    }
  } catch (error) {
    console.error('Error checking for updates:', error);
  }
  
  return {
    hasUpdate: false,
    error: 'Unable to check for updates'
  };
}

/**
 * Compare version strings to determine if one is newer
 * @param {string} version1 - First version to compare
 * @param {string} version2 - Second version to compare
 * @return {boolean} True if version1 is newer than version2
 */
function isNewerVersion(version1, version2) {
  // Remove 'v' prefix if present
  const v1 = version1.replace(/^v/, '');
  const v2 = version2.replace(/^v/, '');
  
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    
    if (part1 > part2) return true;
    if (part1 < part2) return false;
  }
  
  return false;
}

/**
 * Display version information in a user-friendly format
 */
function showVersionInfo() {
  const info = getVersionInfo();
  const updateInfo = checkForUpdates();
  
  let message = `Zoho Lead Integration Add-on\n\n`;
  message += `Version: ${info.version}\n`;
  message += `Environment: ${info.environment}\n`;
  message += `Build Date: ${new Date(info.buildDate).toLocaleString()}\n`;
  message += `Commit: ${info.commitHash.substring(0, 8)}\n\n`;
  
  if (updateInfo.hasUpdate) {
    message += `🔄 Update Available!\n`;
    message += `Latest Version: ${updateInfo.latestVersion}\n`;
    message += `Release Notes: ${updateInfo.releaseUrl}`;
  } else if (updateInfo.error) {
    message += `⚠️ ${updateInfo.error}`;
  } else {
    message += `✅ You have the latest version`;
  }
  
  SpreadsheetApp.getUi().alert('Version Information', message, SpreadsheetApp.getUi().ButtonSet.OK);
}
