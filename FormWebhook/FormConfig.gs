/**
 * EPP Callback Form Webhook - Configuration
 * Configuration constants and settings for the Google Form webhook integration
 */

// Webhook URL for Zoho API
const WEBHOOK_URL = 'https://sandbox.zohoapis.com/crm/v7/functions/telus_epp_webhook_lead/actions/execute?auth_type=apikey&zapikey=1003.1ca18734501fe9a28dd1dcef693f5fe9.cc3b7ea0473f93d3ca69dfd1936dff71';

// Zoho CRM URLs and organization settings
const ZOHO_CRM_BASE_URL = 'https://crm.zoho.com/crm';
const ZOHO_ORG_ID = 'org820120607';
const ZOHO_LEADS_PATH = 'tab/Leads';

// KI Organization Settings
const KI_ORG_SETTINGS = {
  orgCode: '50080',
  orgTypeCode: 'KI',
  authTokenNameKey: 'AUTH_TOKEN_NAME_KI',
  authTokenValueKey: 'AUTH_TOKEN_VALUE_KI'
};

// Campaign Settings
const CAMPAIGN_NAME = 'EPP Hot Leads'
const CAMPAIGN_DURATION_DAYS = 10; // Campaign runs for 10 days from submission

// System Settings
const DATAHUB_SOURCE = 'EPP Callback Request';
const CREATED_BY_EMAIL = 'nick.paolini@telus.com';

// Error Notification Settings
const ERROR_NOTIFICATION_EMAIL = 'alessandro.zamai@telus.com';

// Form Field Mapping
// Maps bilingual form question titles to their corresponding field names
const FORM_FIELD_MAPPING = {
  'First Name / Prénom': 'firstName',
  'Last Name / Nom de famille': 'lastName',
  'Phone Number / Numéro de téléphone': 'phone',
  'Please provide your work email address / Veuillez fournir votre adresse de courriel professionnelle': 'email',
  'Province': 'province',
  'Postal Code / Code postal': 'postalCode',
  'Please enter your preferred language / Veuillez entrer votre langue de préférence': 'languagePreference',
  'Are you an existing TELUS customer? / Êtes-vous déjà client de TELUS?': 'newCustomer',
  'Name of your Employer/Organization / Nom de votre employeur/organisation': 'company',
  'Additional Details / Renseignements additionnels': 'additionalDetails'
};

/**
 * Get authentication credentials from Script Properties
 * @returns {Object} Object containing auth token name and value
 * @throws {Error} If credentials are not configured
 */
function getAuthCredentials() {
  const properties = PropertiesService.getScriptProperties();
  
  const authTokenName = properties.getProperty(KI_ORG_SETTINGS.authTokenNameKey);
  const authTokenValue = properties.getProperty(KI_ORG_SETTINGS.authTokenValueKey);
  
  if (!authTokenName || !authTokenValue) {
    throw new Error(
      'Authentication credentials not configured. Please set up Script Properties:\n' +
      `- ${KI_ORG_SETTINGS.authTokenNameKey}\n` +
      `- ${KI_ORG_SETTINGS.authTokenValueKey}`
    );
  }
  
  return {
    authTokenName: authTokenName,
    authTokenValue: authTokenValue
  };
}

/**
 * Get campaign dates (today + 10 days)
 * @returns {Object} Object containing start and end dates in yyyy-MM-dd format
 */
function getCampaignDates() {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + CAMPAIGN_DURATION_DAYS);
  
  return {
    startDate: Utilities.formatDate(startDate, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
    endDate: Utilities.formatDate(endDate, Session.getScriptTimeZone(), 'yyyy-MM-dd')
  };
}

/**
 * Build Zoho record URL from record ID
 * @param {string} recordId - The Zoho record ID
 * @returns {string} Complete URL to the record in Zoho CRM
 */
function buildZohoRecordUrl(recordId) {
  return `${ZOHO_CRM_BASE_URL}/${ZOHO_ORG_ID}/${ZOHO_LEADS_PATH}/${recordId}`;
}
