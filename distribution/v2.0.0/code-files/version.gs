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
