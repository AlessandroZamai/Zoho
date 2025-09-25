/**
 * Simple version information for TELUS Zoho Integration
 */

const ADDON_VERSION = "2.0";
const BUILD_DATE = "2025-09-25";

/**
 * Get version information
 * @return {Object} Version information object
 */
function getVersionInfo() {
  return {
    version: ADDON_VERSION,
    buildDate: BUILD_DATE,
    environment: "production"
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
  message += `Build Date: ${info.buildDate}\n\n`;
  message += `For support, contact your administrator.`;
  
  SpreadsheetApp.getUi().alert('Version Information', message, SpreadsheetApp.getUi().ButtonSet.OK);
}
