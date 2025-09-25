// Auto-generated version file - DO NOT EDIT MANUALLY
// This file is updated automatically by GitHub Actions during deployment

const ADDON_VERSION = "v2.0.0";
const BUILD_DATE = "2025-09-25T15:53:00Z";
const COMMIT_HASH = "7ee485d";

/**
 * Get version information
 * @return {Object} Version information object
 */
function getVersionInfo() {
  return {
    version: ADDON_VERSION,
    buildDate: BUILD_DATE,
    environment: getEnvironment(),
    commitHash: COMMIT_HASH
  };
}

/**
 * Enhanced version checking with GitHub integration
 * @return {Object} Update information
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
        releaseNotes: release.body || 'No release notes available',
        publishedAt: release.published_at
      };
    }
    
    return { 
      updateAvailable: false, 
      currentVersion: currentVersion,
      latestVersion: latestVersion
    };
  } catch (error) {
    Logger.log('Error checking for updates: ' + error.toString());
    return { 
      updateAvailable: false, 
      error: error.toString(),
      currentVersion: getVersionInfo().version
    };
  }
}

/**
 * Compare version strings (semantic versioning)
 * @param {string} version1 - First version to compare
 * @param {string} version2 - Second version to compare
 * @return {number} -1 if version1 < version2, 0 if equal, 1 if version1 > version2
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

/**
 * Manual update checker - can be run from Apps Script editor
 */
function checkForUpdates() {
  const updateInfo = checkForUpdatesFromGitHub();
  
  if (updateInfo.error) {
    Logger.log('Error checking for updates: ' + updateInfo.error);
    return;
  }
  
  if (updateInfo.updateAvailable) {
    Logger.log(`🔄 Update Available!`);
    Logger.log(`Current Version: ${updateInfo.currentVersion}`);
    Logger.log(`Latest Version: ${updateInfo.latestVersion}`);
    Logger.log(`Release URL: ${updateInfo.releaseUrl}`);
    Logger.log(`Published: ${updateInfo.publishedAt}`);
    Logger.log(`\nRelease Notes:\n${updateInfo.releaseNotes}`);
  } else {
    Logger.log(`✅ You have the latest version (${updateInfo.currentVersion})`);
  }
}

/**
 * Update helper - displays latest code for manual copying
 * Can be run from Apps Script editor
 */
function showUpdateHelper() {
  const files = [
    'addon_main.gs',
    'zoho_integration_core.gs',
    'zoho_validation.gs',
    'zoho_config.gs',
    'zoho_triggers.gs',
    'version.gs',
    'appsscript.json'
  ];
  
  Logger.log('📋 Update Helper - Available Files:');
  files.forEach((file, index) => {
    Logger.log(`${index + 1}. ${file}`);
  });
  
  Logger.log('\n🔗 To get the latest code for any file, use:');
  Logger.log('getLatestFileCode("filename.gs")');
  Logger.log('\nExample: getLatestFileCode("addon_main.gs")');
}

/**
 * Get latest code for a specific file from GitHub
 * @param {string} filename - Name of the file to fetch
 */
function getLatestFileCode(filename) {
  try {
    const url = `https://raw.githubusercontent.com/AlessandroZamai/Zoho/workspace-addon/${filename}`;
    const response = UrlFetchApp.fetch(url);
    
    if (response.getResponseCode() === 200) {
      const content = response.getContentText();
      
      Logger.log(`📄 Latest ${filename}:`);
      Logger.log('=' .repeat(50));
      Logger.log(content);
      Logger.log('=' .repeat(50));
      Logger.log(`\n✅ Copy the code above and paste it into your ${filename} file`);
      
      return content;
    } else {
      Logger.log(`❌ Error fetching ${filename}: HTTP ${response.getResponseCode()}`);
      return null;
    }
  } catch (error) {
    Logger.log(`❌ Error fetching ${filename}: ${error.toString()}`);
    return null;
  }
}

/**
 * Get update instructions
 */
function getUpdateInstructions() {
  const updateInfo = checkForUpdatesFromGitHub();
  
  if (updateInfo.updateAvailable) {
    Logger.log('🔄 UPDATE INSTRUCTIONS:');
    Logger.log('1. Visit: ' + updateInfo.releaseUrl);
    Logger.log('2. Download the latest distribution package');
    Logger.log('3. Follow the update guide: https://github.com/AlessandroZamai/Zoho/blob/workspace-addon/UPDATE_GUIDE.md');
    Logger.log('4. Or use getLatestFileCode("filename.gs") to get individual files');
  } else {
    Logger.log('✅ No update needed - you have the latest version');
  }
}

/**
 * Get current environment
 * @return {string} Environment name
 */
function getEnvironment() {
  return "production";
}

/**
 * Display version information in a user-friendly format
 */
function showVersionInfo() {
  const info = getVersionInfo();
  
  let message = `TELUS Zoho Lead Integration Add-on\n\n`;
  message += `Version: ${info.version}\n`;
  message += `Environment: ${info.environment}\n`;
  message += `Build Date: ${new Date(info.buildDate).toLocaleString()}\n`;
  message += `Commit: ${info.commitHash}\n\n`;
  message += `For updates, contact your administrator.`;
  
  SpreadsheetApp.getUi().alert('Version Information', message, SpreadsheetApp.getUi().ButtonSet.OK);
}
