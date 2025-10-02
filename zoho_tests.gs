/**
 * Zoho Integration Test Suite
 * Comprehensive tests for all functions and UI components
 * 
 * IMPORTANT: These tests use mock data and do NOT make real API calls
 * Run tests from: Extensions > Apps Script > Run > runAllTests
 */

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

const TEST_CONFIG = {
  VERBOSE_LOGGING: true,
  STOP_ON_FIRST_FAILURE: false,
  MOCK_API_RESPONSES: true
};

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  errors: []
};

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Assert helper function
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error('Assertion failed: ' + message);
  }
}

/**
 * Assert equals helper
 */
function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`Assertion failed: ${message}\nExpected: ${expected}\nActual: ${actual}`);
  }
}

/**
 * Assert array equals helper
 */
function assertArrayEquals(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Assertion failed: ${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
  }
}

/**
 * Assert contains helper
 */
function assertContains(array, value, message) {
  if (!array.includes(value)) {
    throw new Error(`Assertion failed: ${message}\nArray does not contain: ${value}`);
  }
}

/**
 * Log test result
 */
function logTestResult(testName, passed, error = null) {
  if (passed) {
    testResults.passed++;
    if (TEST_CONFIG.VERBOSE_LOGGING) {
      Logger.log(`✅ PASS: ${testName}`);
    }
  } else {
    testResults.failed++;
    Logger.log(`❌ FAIL: ${testName}`);
    if (error) {
      Logger.log(`   Error: ${error.message}`);
      testResults.errors.push({ test: testName, error: error.message });
    }
  }
}

/**
 * Run a single test with error handling
 */
function runTest(testName, testFunction) {
  try {
    testFunction();
    logTestResult(testName, true);
    return true;
  } catch (error) {
    logTestResult(testName, false, error);
    if (TEST_CONFIG.STOP_ON_FIRST_FAILURE) {
      throw error;
    }
    return false;
  }
}

/**
 * Generate test row data
 */
function generateTestRowData(overrides = {}) {
  const defaults = {
    firstName: 'John',
    lastName: 'Doe',
    phone: '4161234567',
    email: 'john.doe@example.com',
    language: 'en-ca',
    campaignName: 'Test Campaign',
    description: 'Test description',
    street: '123 Main St',
    city: 'Toronto',
    province: 'ON',
    postalCode: 'M5H 2N2',
    country: 'Canada',
    ratePlan: 'Unlimited Plan',
    deviceModel: 'iPhone 15',
    currentProvider: 'Rogers',
    assignmentValue: 'test@example.com',
    recordUrl: '',
    timestamp: ''
  };
  
  return { ...defaults, ...overrides };
}

/**
 * Convert test data object to array format based on actual selected fields
 */
function testDataToArray(testData) {
  // Get the actual selected fields to build the array in the correct order
  const selectedFields = getSelectedFields();
  const rowArray = [];
  
  // Map test data to array based on actual field configuration
  selectedFields.forEach(field => {
    switch(field.apiName) {
      case 'First_Name':
        rowArray.push(testData.firstName);
        break;
      case 'Last_Name':
        rowArray.push(testData.lastName);
        break;
      case 'Phone':
        rowArray.push(testData.phone);
        break;
      case 'Email':
        rowArray.push(testData.email);
        break;
      case 'Language_Preference':
        rowArray.push(testData.language);
        break;
      case 'Campaign_Name':
        rowArray.push(testData.campaignName);
        break;
      case 'Description':
        rowArray.push(testData.description);
        break;
      case 'Street':
        rowArray.push(testData.street);
        break;
      case 'City':
        rowArray.push(testData.city);
        break;
      case 'State':
        rowArray.push(testData.province);
        break;
      case 'Zip_Code':
        rowArray.push(testData.postalCode);
        break;
      case 'Country':
        rowArray.push(testData.country);
        break;
      case 'Rate_Plan_Description':
        rowArray.push(testData.ratePlan);
        break;
      case 'Phone_Model':
        rowArray.push(testData.deviceModel);
        break;
      case 'Brand':
        rowArray.push(testData.currentProvider);
        break;
      case 'AssignmentValue':
        rowArray.push(testData.assignmentValue);
        break;
      case 'Zoho_Record_URL':
        rowArray.push(testData.recordUrl);
        break;
      case 'Time_Created_in_Zoho':
        rowArray.push(testData.timestamp);
        break;
      // Hidden fields
      case 'Datahub_Src':
        rowArray.push('Google Apps Script');
        break;
      case 'custom_email_notify_list':
        rowArray.push('');
        break;
      case 'ChannelOutletId_Updated':
        rowArray.push('');
        break;
      case 'OutletId':
        rowArray.push('');
        break;
      default:
        rowArray.push('');
    }
  });
  
  return rowArray;
}

/**
 * Setup test configuration
 */
function setupTestConfiguration() {
  const properties = PropertiesService.getScriptProperties();
  
  // Save current configuration
  const currentConfig = {
    processingMode: properties.getProperty('ZOHO_PROCESSING_MODE'),
    organizationType: properties.getProperty('ZOHO_ORGANIZATION_TYPE'),
    orgCode: properties.getProperty('ZOHO_ORG_CODE'),
    authTokenName: properties.getProperty('ZOHO_AUTH_TOKEN_NAME'),
    authTokenValue: properties.getProperty('ZOHO_AUTH_TOKEN_VALUE'),
    campaignStartDate: properties.getProperty('ZOHO_CAMPAIGN_START_DATE'),
    campaignEndDate: properties.getProperty('ZOHO_CAMPAIGN_END_DATE'),
    leadAssignment: properties.getProperty('ZOHO_LEAD_ASSIGNMENT'),
    selectedFields: properties.getProperty('ZOHO_SELECTED_FIELDS')
  };
  
  // Set test configuration
  properties.setProperty('ZOHO_PROCESSING_MODE', 'MANUAL');
  properties.setProperty('ZOHO_ORGANIZATION_TYPE', 'KI');
  properties.setProperty('ZOHO_ORG_CODE', '50080');
  properties.setProperty('ZOHO_AUTH_TOKEN_NAME', 'test_token_name');
  properties.setProperty('ZOHO_AUTH_TOKEN_VALUE', 'test_token_value');
  
  const today = new Date().toISOString().split('T')[0];
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);
  properties.setProperty('ZOHO_CAMPAIGN_START_DATE', today);
  properties.setProperty('ZOHO_CAMPAIGN_END_DATE', endDate.toISOString().split('T')[0]);
  properties.setProperty('ZOHO_LEAD_ASSIGNMENT', 'Sales_Rep');
  
  // Set default fields if not already set
  if (!properties.getProperty('ZOHO_SELECTED_FIELDS')) {
    const defaultFields = getDefaultFields();
    properties.setProperty('ZOHO_SELECTED_FIELDS', JSON.stringify(defaultFields));
  }
  
  return currentConfig;
}

/**
 * Restore original configuration
 */
function restoreConfiguration(originalConfig) {
  const properties = PropertiesService.getScriptProperties();
  
  Object.keys(originalConfig).forEach(key => {
    const propertyKey = 'ZOHO_' + key.replace(/([A-Z])/g, '_$1').toUpperCase();
    if (originalConfig[key]) {
      properties.setProperty(propertyKey, originalConfig[key]);
    } else {
      properties.deleteProperty(propertyKey);
    }
  });
}

// ============================================================================
// CONFIGURATION TESTS
// ============================================================================

function test_getConfigurationValues() {
  const config = getConfigurationValues();
  
  assert(config !== null, 'Configuration should not be null');
  assert(config.hasOwnProperty('organizationType'), 'Config should have organizationType');
  assert(config.hasOwnProperty('processingMode'), 'Config should have processingMode');
  assert(config.hasOwnProperty('authTokenName'), 'Config should have authTokenName');
  assert(config.hasOwnProperty('authTokenValue'), 'Config should have authTokenValue');
}

function test_isConfigurationComplete() {
  const result = isConfigurationComplete();
  
  assert(result !== null, 'Result should not be null');
  assert(result.hasOwnProperty('complete'), 'Result should have complete property');
  assert(result.hasOwnProperty('message'), 'Result should have message property');
}

function test_getCurrentProcessingMode() {
  const mode = getCurrentProcessingMode();
  
  assert(mode === 'MANUAL' || mode === 'AUTO' || mode === null, 
    'Processing mode should be MANUAL, AUTO, or null');
}

function test_getSelectedFields() {
  const fields = getSelectedFields();
  
  assert(Array.isArray(fields), 'Selected fields should be an array');
  assert(fields.length > 0, 'Should have at least one field');
  
  // Check that all fields have required properties
  fields.forEach(field => {
    assert(field.hasOwnProperty('apiName'), 'Field should have apiName');
    assert(field.hasOwnProperty('displayName'), 'Field should have displayName');
    assert(field.hasOwnProperty('required'), 'Field should have required property');
  });
  
  // Check that system fields are last
  const lastTwoFields = fields.slice(-2);
  assertEquals(lastTwoFields[0].apiName, 'Zoho_Record_URL', 
    'Second to last field should be Zoho_Record_URL');
  assertEquals(lastTwoFields[1].apiName, 'Time_Created_in_Zoho', 
    'Last field should be Time_Created_in_Zoho');
}

function test_getVisibleFields() {
  const visibleFields = getVisibleFields();
  const allFields = getSelectedFields();
  
  assert(Array.isArray(visibleFields), 'Visible fields should be an array');
  assert(visibleFields.length <= allFields.length, 
    'Visible fields should be subset of all fields');
  
  // Check that hidden fields are not in visible fields
  const hiddenApiNames = HIDDEN_FIELDS.map(f => f.apiName);
  visibleFields.forEach(field => {
    assert(!hiddenApiNames.includes(field.apiName), 
      `Visible fields should not contain hidden field: ${field.apiName}`);
  });
}

function test_getDynamicColumnMapping() {
  const mapping = getDynamicColumnMapping();
  
  assert(typeof mapping === 'object', 'Mapping should be an object');
  assert(Object.keys(mapping).length > 0, 'Mapping should have entries');
  
  // Check that system fields are in mapping
  assert(mapping.hasOwnProperty('Zoho_Record_URL'), 
    'Mapping should include Zoho_Record_URL');
  assert(mapping.hasOwnProperty('Time_Created_in_Zoho'), 
    'Mapping should include Time_Created_in_Zoho');
}

function test_getColumnIndexByApiName() {
  // Test with fields that are guaranteed to exist
  const phoneIndex = getColumnIndexByApiName('Phone');
  const firstNameIndex = getColumnIndexByApiName('First_Name');
  
  assert(typeof phoneIndex === 'number', 'Phone index should be a number');
  assert(phoneIndex >= 0, 'Phone index should be non-negative');
  assert(typeof firstNameIndex === 'number', 'First Name index should be a number');
  assert(firstNameIndex >= 0, 'First Name index should be non-negative');
  
  // Test that different fields have different indices
  assert(phoneIndex !== firstNameIndex, 'Different fields should have different indices');
}

function test_ensureSystemFieldsAreLast() {
  const testFields = [
    { apiName: 'First_Name', displayName: 'First Name' },
    { apiName: 'Time_Created_in_Zoho', displayName: 'Time Created' },
    { apiName: 'Last_Name', displayName: 'Last Name' },
    { apiName: 'Zoho_Record_URL', displayName: 'Record URL' },
    { apiName: 'Phone', displayName: 'Phone' }
  ];
  
  const orderedFields = ensureSystemFieldsAreLast(testFields);
  
  assertEquals(orderedFields.length, testFields.length, 
    'Should maintain same number of fields');
  assertEquals(orderedFields[orderedFields.length - 2].apiName, 'Zoho_Record_URL',
    'Second to last should be Zoho_Record_URL');
  assertEquals(orderedFields[orderedFields.length - 1].apiName, 'Time_Created_in_Zoho',
    'Last should be Time_Created_in_Zoho');
}

// ============================================================================
// VALIDATION TESTS
// ============================================================================

function test_validateRowDataUnified_validData() {
  const testData = generateTestRowData();
  const rowArray = testDataToArray(testData);
  
  const result = validateRowDataUnified(rowArray, 2);
  
  assert(result.hasOwnProperty('isValid'), 'Result should have isValid property');
  assert(result.hasOwnProperty('errors'), 'Result should have errors array');
  assert(result.hasOwnProperty('warnings'), 'Result should have warnings array');
  assert(result.isValid === true, 'Valid data should pass validation');
  assertEquals(result.errors.length, 0, 'Should have no errors for valid data');
}

function test_validateRowDataUnified_missingRequired() {
  const testData = generateTestRowData({ firstName: '' });
  const rowArray = testDataToArray(testData);
  
  const result = validateRowDataUnified(rowArray, 2);
  
  assertEquals(result.isValid, false, 'Should fail with missing required field');
  assert(result.errors.length > 0, 'Should have validation errors');
  assert(result.errors.some(e => e.includes('First Name')), 
    'Should mention missing First Name');
}

function test_validateRowDataUnified_invalidPhone() {
  const testData = generateTestRowData({ phone: '123' });
  const rowArray = testDataToArray(testData);
  
  const result = validateRowDataUnified(rowArray, 2);
  
  assertEquals(result.isValid, false, 'Should fail with invalid phone');
  assert(result.errors.some(e => e.includes('Phone')), 
    'Should mention phone validation error');
}

function test_validateRowDataUnified_invalidEmail() {
  // Check if Email field exists in configuration
  const selectedFields = getSelectedFields();
  const hasEmailField = selectedFields.some(f => f.apiName === 'Email');
  
  if (!hasEmailField) {
    testResults.skipped++;
    Logger.log('⏭️  SKIP: test_validateRowDataUnified_invalidEmail (Email field not in configuration)');
    return;
  }
  
  const testData = generateTestRowData({ email: 'invalid-email' });
  const rowArray = testDataToArray(testData);
  
  const result = validateRowDataUnified(rowArray, 2);
  
  assertEquals(result.isValid, false, 'Should fail with invalid email');
  assert(result.errors.some(e => e.includes('Email')), 
    'Should mention email validation error');
}

function test_validateRowDataUnified_invalidLanguage() {
  // Check if Language_Preference field exists in configuration
  const selectedFields = getSelectedFields();
  const hasLanguageField = selectedFields.some(f => f.apiName === 'Language_Preference');
  
  if (!hasLanguageField) {
    testResults.skipped++;
    Logger.log('⏭️  SKIP: test_validateRowDataUnified_invalidLanguage (Language_Preference field not in configuration)');
    return;
  }
  
  const testData = generateTestRowData({ language: 'es-mx' });
  const rowArray = testDataToArray(testData);
  
  const result = validateRowDataUnified(rowArray, 2);
  
  assertEquals(result.isValid, false, 'Should fail with invalid language');
  assert(result.errors.some(e => e.includes('Language')), 
    'Should mention language validation error');
}

function test_validateConfiguration() {
  const result = validateConfiguration();
  
  assert(result.hasOwnProperty('isValid'), 'Result should have isValid property');
  
  if (result.isValid) {
    assert(result.hasOwnProperty('config'), 'Valid result should have config');
  } else {
    assert(result.hasOwnProperty('error'), 'Invalid result should have error');
  }
}

function test_validateProcessingMode() {
  const result = validateProcessingMode('MANUAL');
  
  assert(result.hasOwnProperty('isValid'), 'Result should have isValid property');
}

function test_validateCampaignDates() {
  const config = getConfigurationValues();
  const result = validateCampaignDates(config);
  
  assert(result.hasOwnProperty('isValid'), 'Result should have isValid property');
}

function test_validateLeadAssignment() {
  const config = getConfigurationValues();
  const result = validateLeadAssignment(config);
  
  assert(result.hasOwnProperty('isValid'), 'Result should have isValid property');
}

// ============================================================================
// PAYLOAD BUILDING TESTS
// ============================================================================

function test_buildZohoPayload_validData() {
  const testData = generateTestRowData();
  const rowArray = testDataToArray(testData);
  
  const payload = buildZohoPayload(rowArray);
  
  assert(payload !== null, 'Payload should not be null for valid data');
  assert(payload.hasOwnProperty('auth_token_name'), 'Payload should have auth_token_name');
  assert(payload.hasOwnProperty('auth_token_value'), 'Payload should have auth_token_value');
  assert(payload.hasOwnProperty('First_Name'), 'Payload should have First_Name');
  assert(payload.hasOwnProperty('Last_Name'), 'Payload should have Last_Name');
  assert(payload.hasOwnProperty('Phone'), 'Payload should have Phone');
}

function test_buildZohoPayload_phoneNormalization() {
  const testData = generateTestRowData({ phone: '+1 (416) 123-4567' });
  const rowArray = testDataToArray(testData);
  
  const payload = buildZohoPayload(rowArray);
  
  assert(payload !== null, 'Payload should not be null');
  assertEquals(payload.Phone, '14161234567', 'Phone should be normalized to digits only');
}

function test_buildZohoRecordUrl() {
  const recordId = '1234567890';
  const url = buildZohoRecordUrl(recordId);
  
  assert(url.includes(recordId), 'URL should contain record ID');
  assert(url.includes('crm.zoho.com'), 'URL should contain Zoho domain');
  assert(url.includes('Leads'), 'URL should contain Leads path');
}

// ============================================================================
// DUPLICATE DETECTION TESTS
// ============================================================================

function test_findDuplicateRows_noDuplicates() {
  // This test would require spreadsheet access
  // Skipping for now as it needs actual sheet data
  testResults.skipped++;
  Logger.log('⏭️  SKIP: test_findDuplicateRows_noDuplicates (requires spreadsheet)');
}

// ============================================================================
// UTILITY FUNCTION TESTS
// ============================================================================

function test_ZohoConfig_class() {
  const config = new ZohoConfig();
  
  assert(config !== null, 'ZohoConfig should instantiate');
  
  const currentConfig = config.getConfig();
  assert(currentConfig !== null, 'getConfig should return config object');
  assert(currentConfig.hasOwnProperty('processingMode'), 'Config should have processingMode');
}

function test_getDefaultFields() {
  const defaultFields = getDefaultFields();
  
  assert(Array.isArray(defaultFields), 'Default fields should be an array');
  assert(defaultFields.length > 0, 'Should have default fields');
  
  // Check system fields are last
  const lastTwo = defaultFields.slice(-2);
  assertEquals(lastTwo[0].apiName, 'Zoho_Record_URL', 
    'Second to last should be Zoho_Record_URL');
  assertEquals(lastTwo[1].apiName, 'Time_Created_in_Zoho', 
    'Last should be Time_Created_in_Zoho');
}

function test_getAssignmentColumnTitle() {
  const storeTitle = getAssignmentColumnTitle('Store');
  const salesRepTitle = getAssignmentColumnTitle('Sales_Rep');
  const adminTitle = getAssignmentColumnTitle('ADMIN');
  
  assertEquals(storeTitle, 'Store Assignment', 'Store title should be correct');
  assertEquals(salesRepTitle, 'Sales Rep Email', 'Sales Rep title should be correct');
  assertEquals(adminTitle, 'Admin Assignment (N/A)', 'Admin title should be correct');
}

// ============================================================================
// TRIGGER TESTS
// ============================================================================

function test_getTriggerStatus() {
  const status = getTriggerStatus();
  
  assert(status !== null, 'Status should not be null');
  assert(status.hasOwnProperty('processingMode'), 'Status should have processingMode');
  assert(status.hasOwnProperty('triggerCount'), 'Status should have triggerCount');
  assert(status.hasOwnProperty('isConfigured'), 'Status should have isConfigured');
}

function test_validateTriggerConfiguration() {
  const result = validateTriggerConfiguration();
  
  assert(result !== null, 'Result should not be null');
  assert(result.hasOwnProperty('isValid'), 'Result should have isValid');
  assert(result.hasOwnProperty('errors'), 'Result should have errors array');
  assert(result.hasOwnProperty('warnings'), 'Result should have warnings array');
}

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

function test_ZohoErrorHandler_logError() {
  const testError = new Error('Test error message');
  const context = { testKey: 'testValue' };
  
  // This should not throw
  try {
    ZohoErrorHandler_logError(ZOHO_ERROR_CODES.PROCESSING_ERROR, testError, context);
    assert(true, 'Error handler should execute without throwing');
  } catch (error) {
    assert(false, 'Error handler should not throw: ' + error.message);
  }
}

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

function test_processSingleRowUnified_mockValidation() {
  const testData = generateTestRowData();
  const rowArray = testDataToArray(testData);
  
  // Test validation portion only (not actual API call)
  const validation = validateRowDataUnified(rowArray, 2);
  
  assert(validation.isValid, 'Test data should pass validation');
  assertEquals(validation.errors.length, 0, 'Should have no validation errors');
}

function test_validateEditEvent_headerRow() {
  const mockEvent = {
    range: {
      getLastRow: () => 1
    }
  };
  
  const result = validateEditEvent(mockEvent);
  
  assertEquals(result, null, 'Header row edit should be ignored');
}

function test_validateEditEvent_exampleRow() {
  const mockEvent = {
    range: {
      getLastRow: () => 2
    }
  };
  
  const result = validateEditEvent(mockEvent);
  
  assertEquals(result, null, 'Example row edit should be ignored');
}

// ============================================================================
// SYSTEM FIELD TESTS
// ============================================================================

function test_checkSystemFields() {
  const result = checkSystemFields();
  
  assert(result !== null, 'Result should not be null');
  assert(result.hasOwnProperty('missing'), 'Result should have missing property');
  assert(result.hasOwnProperty('message'), 'Result should have message property');
}

// ============================================================================
// REFACTORED CONFIGURATION TESTS
// ============================================================================

function test_validateCompleteConfiguration_valid() {
  const validConfig = {
    organizationType: 'KI',
    campaignStartDate: '2025-01-01',
    campaignEndDate: '2025-12-31',
    leadAssignment: 'Sales_Rep',
    selectedFields: []
  };
  
  const result = validateCompleteConfiguration(validConfig);
  
  assert(result.hasOwnProperty('isValid'), 'Result should have isValid property');
  assert(result.hasOwnProperty('errors'), 'Result should have errors array');
  assert(result.hasOwnProperty('warnings'), 'Result should have warnings array');
  assertEquals(result.isValid, true, 'Valid config should pass validation');
  assertEquals(result.errors.length, 0, 'Valid config should have no errors');
}

function test_validateCompleteConfiguration_missingOrgType() {
  const invalidConfig = {
    campaignStartDate: '2025-01-01',
    campaignEndDate: '2025-12-31',
    leadAssignment: 'Sales_Rep'
  };
  
  const result = validateCompleteConfiguration(invalidConfig);
  
  assertEquals(result.isValid, false, 'Should fail without organization type');
  assert(result.errors.length > 0, 'Should have validation errors');
  assert(result.errors.some(e => e.includes('Organization type')), 'Should mention organization type');
}

function test_validateCompleteConfiguration_invalidDateRange() {
  const invalidConfig = {
    organizationType: 'RT',
    campaignStartDate: '2025-12-31',
    campaignEndDate: '2025-01-01',
    leadAssignment: 'Store'
  };
  
  const result = validateCompleteConfiguration(invalidConfig);
  
  assertEquals(result.isValid, false, 'Should fail with invalid date range');
  assert(result.errors.some(e => e.includes('end date must be after start date')), 
    'Should mention date range error');
}

function test_prepareCompleteFieldList() {
  const userFields = [
    { apiName: 'First_Name', displayName: 'First Name', required: true },
    { apiName: 'Last_Name', displayName: 'Last Name', required: true }
  ];
  
  const result = prepareCompleteFieldList(userFields, 'Sales_Rep');
  
  assert(Array.isArray(result), 'Result should be an array');
  assert(result.length > userFields.length, 'Should include hidden and system fields');
  
  // Check that system fields are last
  const lastTwo = result.slice(-2);
  assertEquals(lastTwo[0].apiName, 'Zoho_Record_URL', 'Second to last should be Zoho_Record_URL');
  assertEquals(lastTwo[1].apiName, 'Time_Created_in_Zoho', 'Last should be Time_Created_in_Zoho');
}

function test_updateAssignmentField_salesRep() {
  const fields = [
    { apiName: 'First_Name', displayName: 'First Name' },
    { apiName: 'Last_Name', displayName: 'Last Name' }
  ];
  
  const result = updateAssignmentField(fields, 'Sales_Rep');
  
  const assignmentField = result.find(f => f.apiName === 'AssignmentValue');
  assert(assignmentField !== undefined, 'Should have AssignmentValue field');
  assertEquals(assignmentField.displayName, 'Sales Rep Email', 'Should have correct display name');
  assertEquals(assignmentField.required, true, 'Should be required for Sales_Rep');
}

function test_updateAssignmentField_admin() {
  const fields = [
    { apiName: 'First_Name', displayName: 'First Name' }
  ];
  
  const result = updateAssignmentField(fields, 'ADMIN');
  
  const assignmentField = result.find(f => f.apiName === 'AssignmentValue');
  assert(assignmentField !== undefined, 'Should have AssignmentValue field');
  assertEquals(assignmentField.displayName, 'Admin Assignment (N/A)', 'Should have correct display name');
  assertEquals(assignmentField.required, false, 'Should not be required for ADMIN');
}

function test_createConfigurationBackup() {
  const result = createConfigurationBackup();
  
  assert(result.hasOwnProperty('success'), 'Result should have success property');
  
  if (result.success) {
    assert(result.hasOwnProperty('backup'), 'Successful result should have backup');
    assert(result.backup.hasOwnProperty('timestamp'), 'Backup should have timestamp');
  }
}

function test_validatePredefinedCredentials() {
  // This test may fail if script properties aren't set up
  // We'll test the structure rather than actual validation
  const result = validatePredefinedCredentials('KI');
  
  assert(result.hasOwnProperty('isValid'), 'Result should have isValid property');
  
  if (!result.isValid) {
    assert(result.hasOwnProperty('error'), 'Invalid result should have error message');
  } else {
    assert(result.hasOwnProperty('authTokenName'), 'Valid result should have authTokenName');
    assert(result.hasOwnProperty('authTokenValue'), 'Valid result should have authTokenValue');
    assert(result.hasOwnProperty('orgCode'), 'Valid result should have orgCode');
  }
}

// ============================================================================
// TEST SUITE RUNNERS
// ============================================================================

/**
 * Run all configuration tests
 */
function runConfigurationTests() {
  Logger.log('\n========================================');
  Logger.log('RUNNING CONFIGURATION TESTS');
  Logger.log('========================================\n');
  
  runTest('test_getConfigurationValues', test_getConfigurationValues);
  runTest('test_isConfigurationComplete', test_isConfigurationComplete);
  runTest('test_getCurrentProcessingMode', test_getCurrentProcessingMode);
  runTest('test_getSelectedFields', test_getSelectedFields);
  runTest('test_getVisibleFields', test_getVisibleFields);
  runTest('test_getDynamicColumnMapping', test_getDynamicColumnMapping);
  runTest('test_getColumnIndexByApiName', test_getColumnIndexByApiName);
  runTest('test_ensureSystemFieldsAreLast', test_ensureSystemFieldsAreLast);
}

/**
 * Run all validation tests
 */
function runValidationTests() {
  Logger.log('\n========================================');
  Logger.log('RUNNING VALIDATION TESTS');
  Logger.log('========================================\n');
  
  runTest('test_validateRowDataUnified_validData', test_validateRowDataUnified_validData);
  runTest('test_validateRowDataUnified_missingRequired', test_validateRowDataUnified_missingRequired);
  runTest('test_validateRowDataUnified_invalidPhone', test_validateRowDataUnified_invalidPhone);
  runTest('test_validateRowDataUnified_invalidEmail', test_validateRowDataUnified_invalidEmail);
  runTest('test_validateRowDataUnified_invalidLanguage', test_validateRowDataUnified_invalidLanguage);
  runTest('test_validateConfiguration', test_validateConfiguration);
  runTest('test_validateProcessingMode', test_validateProcessingMode);
  runTest('test_validateCampaignDates', test_validateCampaignDates);
  runTest('test_validateLeadAssignment', test_validateLeadAssignment);
}

/**
 * Run all payload building tests
 */
function runPayloadTests() {
  Logger.log('\n========================================');
  Logger.log('RUNNING PAYLOAD BUILDING TESTS');
  Logger.log('========================================\n');
  
  runTest('test_buildZohoPayload_validData', test_buildZohoPayload_validData);
  runTest('test_buildZohoPayload_phoneNormalization', test_buildZohoPayload_phoneNormalization);
  runTest('test_buildZohoRecordUrl', test_buildZohoRecordUrl);
}

/**
 * Run all utility function tests
 */
function runUtilityTests() {
  Logger.log('\n========================================');
  Logger.log('RUNNING UTILITY FUNCTION TESTS');
  Logger.log('========================================\n');
  
  runTest('test_ZohoConfig_class', test_ZohoConfig_class);
  runTest('test_getDefaultFields', test_getDefaultFields);
  runTest('test_getAssignmentColumnTitle', test_getAssignmentColumnTitle);
}

/**
 * Run all trigger tests
 */
function runTriggerTests() {
  Logger.log('\n========================================');
  Logger.log('RUNNING TRIGGER TESTS');
  Logger.log('========================================\n');
  
  runTest('test_getTriggerStatus', test_getTriggerStatus);
  runTest('test_validateTriggerConfiguration', test_validateTriggerConfiguration);
}

/**
 * Run all error handling tests
 */
function runErrorHandlingTests() {
  Logger.log('\n========================================');
  Logger.log('RUNNING ERROR HANDLING TESTS');
  Logger.log('========================================\n');
  
  runTest('test_ZohoErrorHandler_logError', test_ZohoErrorHandler_logError);
}

/**
 * Run all integration tests
 */
function runIntegrationTests() {
  Logger.log('\n========================================');
  Logger.log('RUNNING INTEGRATION TESTS');
  Logger.log('========================================\n');
  
  runTest('test_processSingleRowUnified_mockValidation', test_processSingleRowUnified_mockValidation);
  runTest('test_validateEditEvent_headerRow', test_validateEditEvent_headerRow);
  runTest('test_validateEditEvent_exampleRow', test_validateEditEvent_exampleRow);
}

/**
 * Run all system field tests
 */
function runSystemFieldTests() {
  Logger.log('\n========================================');
  Logger.log('RUNNING SYSTEM FIELD TESTS');
  Logger.log('========================================\n');
  
  runTest('test_checkSystemFields', test_checkSystemFields);
}

/**
 * MAIN TEST RUNNER - Run all tests
 * Execute this function to run the complete test suite
 */
function runAllTests() {
  Logger.log('\n╔════════════════════════════════════════╗');
  Logger.log('║   ZOHO INTEGRATION TEST SUITE          ║');
  Logger.log('╚════════════════════════════════════════╝\n');
  
  // Reset test results
  testResults = {
    passed: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };
  
  // Setup test configuration
  Logger.log('Setting up test configuration...');
  const originalConfig = setupTestConfiguration();
  Logger.log('Test configuration ready.\n');
  
  try {
    // Run all test suites
    runConfigurationTests();
    runValidationTests();
    runPayloadTests();
    runUtilityTests();
    runTriggerTests();
    runErrorHandlingTests();
    runIntegrationTests();
    runSystemFieldTests();
    
  } finally {
    // Restore original configuration
    Logger.log('\nRestoring original configuration...');
    restoreConfiguration(originalConfig);
    Logger.log('Configuration restored.\n');
  }
  
  // Print summary
  printTestSummary();
}

/**
 * Run quick tests (subset of critical tests)
 */
function runQuickTests() {
  Logger.log('\n╔════════════════════════════════════════╗');
  Logger.log('║   ZOHO INTEGRATION QUICK TESTS         ║');
  Logger.log('╚════════════════════════════════════════╝\n');
  
  // Reset test results
  testResults = {
    passed: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };
  
  // Setup test configuration
  const originalConfig = setupTestConfiguration();
  
  try {
    Logger.log('Running critical tests only...\n');
    
    // Configuration
    runTest('test_getConfigurationValues', test_getConfigurationValues);
    runTest('test_getSelectedFields', test_getSelectedFields);
    
    // Validation
    runTest('test_validateRowDataUnified_validData', test_validateRowDataUnified_validData);
    runTest('test_validateRowDataUnified_missingRequired', test_validateRowDataUnified_missingRequired);
    
    // Payload
    runTest('test_buildZohoPayload_validData', test_buildZohoPayload_validData);
    
    // System
    runTest('test_checkSystemFields', test_checkSystemFields);
    
  } finally {
    restoreConfiguration(originalConfig);
  }
  
  printTestSummary();
}

/**
 * Print test summary
 */
function printTestSummary() {
  Logger.log('\n╔════════════════════════════════════════╗');
  Logger.log('║          TEST SUMMARY                  ║');
  Logger.log('╚════════════════════════════════════════╝\n');
  
  const total = testResults.passed + testResults.failed + testResults.skipped;
  const passRate = total > 0 ? ((testResults.passed / total) * 100).toFixed(1) : 0;
  
  Logger.log(`Total Tests:    ${total}`);
  Logger.log(`✅ Passed:      ${testResults.passed}`);
  Logger.log(`❌ Failed:      ${testResults.failed}`);
  Logger.log(`⏭️  Skipped:     ${testResults.skipped}`);
  Logger.log(`Pass Rate:      ${passRate}%\n`);
  
  if (testResults.failed > 0) {
    Logger.log('Failed Tests:');
    testResults.errors.forEach(error => {
      Logger.log(`  ❌ ${error.test}`);
      Logger.log(`     ${error.error}\n`);
    });
  }
  
  Logger.log('\n' + '='.repeat(40) + '\n');
  
  if (testResults.failed === 0 && testResults.skipped === 0) {
    Logger.log('🎉 All tests passed! 🎉\n');
  } else if (testResults.failed === 0) {
    Logger.log('✅ All executed tests passed!\n');
  } else {
    Logger.log('⚠️  Some tests failed. Review the errors above.\n');
  }
}

// ============================================================================
// TEST DOCUMENTATION
// ============================================================================

/**
 * Display test documentation and usage instructions
 */
function showTestDocumentation() {
  Logger.log('\n╔════════════════════════════════════════════════════════════╗');
  Logger.log('║         ZOHO INTEGRATION TEST SUITE DOCUMENTATION          ║');
  Logger.log('╚════════════════════════════════════════════════════════════╝\n');
  
  Logger.log('AVAILABLE TEST FUNCTIONS:\n');
  Logger.log('1. runAllTests()');
  Logger.log('   - Runs the complete test suite (all 30+ tests)');
  Logger.log('   - Recommended for comprehensive validation\n');
  
  Logger.log('2. runQuickTests()');
  Logger.log('   - Runs critical tests only (6 tests)');
  Logger.log('   - Faster execution for quick validation\n');
  
  Logger.log('3. Individual test suite runners:');
  Logger.log('   - runConfigurationTests()');
  Logger.log('   - runValidationTests()');
  Logger.log('   - runPayloadTests()');
  Logger.log('   - runUtilityTests()');
  Logger.log('   - runTriggerTests()');
  Logger.log('   - runErrorHandlingTests()');
  Logger.log('   - runIntegrationTests()');
  Logger.log('   - runSystemFieldTests()\n');
  
  Logger.log('HOW TO RUN TESTS:\n');
  Logger.log('1. Open your Google Spreadsheet');
  Logger.log('2. Go to Extensions > Apps Script');
  Logger.log('3. Select the function to run from the dropdown');
  Logger.log('4. Click the Run button (▶)');
  Logger.log('5. View results in Execution log (View > Logs)\n');
  
  Logger.log('TEST COVERAGE:\n');
  Logger.log('✓ Configuration management');
  Logger.log('✓ Field mapping and validation');
  Logger.log('✓ Row data validation (required fields, formats)');
  Logger.log('✓ Payload building and transformation');
  Logger.log('✓ System field ordering');
  Logger.log('✓ Trigger configuration');
  Logger.log('✓ Error handling');
  Logger.log('✓ Integration workflows\n');
  
  Logger.log('IMPORTANT NOTES:\n');
  Logger.log('• Tests use MOCK data - no real API calls are made');
  Logger.log('• Tests temporarily modify configuration (restored after)');
  Logger.log('• No production data is affected');
  Logger.log('• Safe to run in any environment\n');
  
  Logger.log('═'.repeat(60) + '\n');
}
