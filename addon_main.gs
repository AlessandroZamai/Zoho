/**
 * TELUS Zoho Lead Integration Add-on
 * Main entry points and add-on specific functionality
 */

/**
 * Add-on homepage - shown when user opens the add-on
 * @return {Card} The homepage card
 */
function onHomepage() {
  return createHomepageCard();
}

/**
 * Sheets-specific homepage - shown when add-on is opened in Google Sheets
 * @return {Card} The sheets homepage card
 */
function onSheetsHomepage() {
  return createSheetsHomepageCard();
}

/**
 * Called when user grants file scope access
 * @param {Object} e - Event object
 * @return {Card} The configuration card
 */
function onFileScopeGranted(e) {
  return createConfigurationCard();
}

/**
 * Universal action: Open configuration
 * @return {Card} The configuration card
 */
function openConfiguration() {
  return createConfigurationCard();
}

/**
 * Universal action: Show status
 * @return {Card} The status card
 */
function showStatus() {
  return createStatusCard();
}

/**
 * Universal action: Manual sync
 * @return {Card} The manual sync card
 */
function manualSync() {
  return createManualSyncCard();
}

/**
 * Create the main homepage card
 * @return {Card} Homepage card
 */
function createHomepageCard() {
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle('TELUS Zoho Lead Integration')
      .setSubtitle('Lead capture and CRM integration')
      .setImageUrl('https://www.telus.com/favicon.ico'))
    .addSection(CardService.newCardSection()
      .setHeader('Welcome')
      .addWidget(CardService.newTextParagraph()
        .setText('This add-on helps you capture leads from Google Sheets and automatically send them to Zoho CRM.'))
      .addWidget(CardService.newTextParagraph()
        .setText('To get started, open a Google Sheet and configure your integration settings.')))
    .addSection(CardService.newCardSection()
      .setHeader('Quick Actions')
      .addWidget(CardService.newButtonSet()
        .addButton(CardService.newTextButton()
          .setText('Open Configuration')
          .setOnClickAction(CardService.newAction()
            .setFunctionName('openConfiguration')))
        .addButton(CardService.newTextButton()
          .setText('View Documentation')
          .setOnClickAction(CardService.newAction()
            .setFunctionName('showDocumentation')))))
    .build();
    
  return card;
}

/**
 * Create the sheets-specific homepage card
 * @return {Card} Sheets homepage card
 */
function createSheetsHomepageCard() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const configStatus = isConfigurationComplete();
  const isConfigured = configStatus.complete;
  
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle('Zoho Lead Integration')
      .setSubtitle(`Sheet: ${sheet.getName()}`)
      .setImageUrl('https://www.telus.com/favicon.ico'));
      
  // Status section
  const statusSection = CardService.newCardSection()
    .setHeader('Integration Status');
    
  if (isConfigured) {
    try {
      const hasValidStructure = validateSpreadsheetStructure();
      if (hasValidStructure) {
        statusSection.addWidget(CardService.newTextParagraph()
          .setText('✅ Ready to sync leads to Zoho CRM'));
      } else {
        statusSection.addWidget(CardService.newTextParagraph()
          .setText('⚠️ Invalid spreadsheet structure'));
      }
    } catch (error) {
      statusSection.addWidget(CardService.newTextParagraph()
        .setText('⚠️ Configuration validation error'));
    }
  } else {
    statusSection.addWidget(CardService.newTextParagraph()
      .setText('⚠️ Configuration required'))
    .addWidget(CardService.newTextParagraph()
      .setText('Please run the setup wizard in Google Apps Script to configure your integration.'));
  }
  
  card.addSection(statusSection);
  
  // Actions section
  const actionsSection = CardService.newCardSection()
    .setHeader('Actions');
    
  if (!isConfigured) {
    // Check if this is an admin credential issue
    const properties = PropertiesService.getScriptProperties();
    const organizationType = properties.getProperty('ZOHO_ORGANIZATION_TYPE');
    
    if (organizationType === 'KI' || organizationType === 'RT') {
      // Check admin credentials
      const kiTokenName = properties.getProperty('AUTH_TOKEN_NAME_KI');
      const rtTokenName = properties.getProperty('AUTH_TOKEN_NAME_RT');
      
      if (!kiTokenName || !rtTokenName) {
        actionsSection.addWidget(CardService.newTextParagraph()
          .setText('Configuration is incomplete. Please complete the setup process.'))
        .addWidget(CardService.newTextButton()
          .setText('Setup Wizard')
          .setOnClickAction(CardService.newAction()
            .setFunctionName('launchFullSetupWizard')));
      } else {
        actionsSection.addWidget(CardService.newTextParagraph()
          .setText('Configuration is incomplete. Please complete the setup process.'))
        .addWidget(CardService.newTextButton()
          .setText('Setup Wizard')
          .setOnClickAction(CardService.newAction()
            .setFunctionName('launchFullSetupWizard')));
      }
    } else {
      actionsSection.addWidget(CardService.newTextParagraph()
        .setText('Configuration is incomplete. Please complete the setup process.'))
      .addWidget(CardService.newTextButton()
        .setText('Setup Wizard')
        .setOnClickAction(CardService.newAction()
          .setFunctionName('launchFullSetupWizard')));
    }
  } else {
    actionsSection.addWidget(CardService.newButtonSet()
      .addButton(CardService.newTextButton()
        .setText('Manual Sync')
        .setOnClickAction(CardService.newAction()
          .setFunctionName('manualSync')))
      .addButton(CardService.newTextButton()
        .setText('View Status')
        .setOnClickAction(CardService.newAction()
          .setFunctionName('showStatus'))));
  }
  
  actionsSection.addWidget(CardService.newTextButton()
    .setText('Setup Wizard')
    .setOnClickAction(CardService.newAction()
      .setFunctionName('launchFullSetupWizard')));
      
  card.addSection(actionsSection);
  
  return card.build();
}

/**
 * Create the configuration card - Step-by-step setup wizard
 * @return {Card} Configuration card
 */
function createConfigurationCard() {
  const config = getConfigurationValues();
  const properties = PropertiesService.getScriptProperties();
  
  // Get current setup step
  const currentStep = properties.getProperty('SETUP_CURRENT_STEP') || '1';
  
  return createSetupStep(parseInt(currentStep), config, properties);
}

/**
 * Create setup step card
 * @param {number} step - Current step number
 * @param {Object} config - Current configuration
 * @param {Object} properties - Script properties
 * @return {Card} Step card
 */
function createSetupStep(step, config, properties) {
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle('Zoho Integration Setup')
      .setSubtitle(`Step ${step} of 4`)
      .setImageUrl('https://www.telus.com/favicon.ico'));
  
  // Progress indicator
  const progressSection = CardService.newCardSection()
    .addWidget(CardService.newTextParagraph()
      .setText(getProgressIndicator(step)));
  card.addSection(progressSection);
  
  switch (step) {
    case 1:
      return createStep1OrganizationCard(card, config, properties);
    case 2:
      return createStep2ProcessingModeCard(card, config);
    case 3:
      return createStep3CampaignCard(card, config);
    case 4:
      return createStep4LeadAssignmentCard(card, config);
    default:
      return createSetupCompleteCard(card, config);
  }
}

/**
 * Get progress indicator text
 * @param {number} currentStep - Current step
 * @return {string} Progress indicator
 */
function getProgressIndicator(currentStep) {
  const steps = ['Organization', 'Processing Mode', 'Campaign', 'Lead Assignment'];
  let progress = '';
  
  for (let i = 0; i < steps.length; i++) {
    if (i + 1 < currentStep) {
      progress += `✅ ${steps[i]}  `;
    } else if (i + 1 === currentStep) {
      progress += `🔄 ${steps[i]}  `;
    } else {
      progress += `⏳ ${steps[i]}  `;
    }
  }
  
  return progress;
}

/**
 * Step 1: Organization Setup
 */
function createStep1OrganizationCard(card, config, properties) {
  // Check if admin credentials are missing for KI/RT
  const organizationType = config.organizationType || properties.getProperty('ZOHO_ORGANIZATION_TYPE');
  if (organizationType === 'KI' || organizationType === 'RT') {
    const kiTokenName = properties.getProperty('AUTH_TOKEN_NAME_KI');
    const rtTokenName = properties.getProperty('AUTH_TOKEN_NAME_RT');
    
    if (!kiTokenName || !rtTokenName) {
      const adminSection = CardService.newCardSection()
        .setHeader('⚠️ Administrator Setup Required')
        .addWidget(CardService.newTextParagraph()
          .setText(`Your organization type (${organizationType === 'KI' ? 'Corporate Store' : 'Mobile Klinik'}) requires administrator credentials that are not yet configured.`))
        .addWidget(CardService.newTextParagraph()
          .setText('Please contact your administrator to complete the initial setup before proceeding.'))
        .addWidget(CardService.newTextButton()
          .setText('Administrator Setup Guide')
          .setOpenLink(CardService.newOpenLink()
            .setUrl('https://github.com/AlessandroZ-TELUS/Zoho/blob/main/AUTHORIZATION_FIX_GUIDE.md')));
            
      card.addSection(adminSection);
      return card.build();
    }
  }
  
  const orgSection = CardService.newCardSection()
    .setHeader('Organization Setup')
    .addWidget(CardService.newTextParagraph()
      .setText('Choose your organization type to configure the appropriate settings.'))
    .addWidget(CardService.newSelectionInput()
      .setType(CardService.SelectionInputType.DROPDOWN)
      .setTitle('Organization Type')
      .setFieldName('organizationType')
      .addItem('Corporate Store (KI)', 'KI', config.organizationType === 'KI')
      .addItem('Dealership (DL)', 'DL', config.organizationType === 'DL')
      .addItem('Mobile Klinik (RT)', 'RT', config.organizationType === 'RT'));
  
  // Show credentials section for dealership
  if (config.organizationType === 'DL') {
    orgSection.addWidget(CardService.newTextParagraph()
      .setText('\n📋 Dealership Credentials'))
    .addWidget(CardService.newTextInput()
      .setTitle('Auth Token Name')
      .setFieldName('authTokenName')
      .setValue(config.authTokenName || ''))
    .addWidget(CardService.newTextInput()
      .setTitle('Auth Token Value')
      .setFieldName('authTokenValue')
      .setValue(config.authTokenValue || ''))
    .addWidget(CardService.newTextInput()
      .setTitle('Organization Code')
      .setFieldName('orgCode')
      .setValue(config.orgCode || ''));
  } else if (config.organizationType === 'KI' || config.organizationType === 'RT') {
    orgSection.addWidget(CardService.newTextParagraph()
      .setText(`\n✅ Credentials are automatically configured for ${config.organizationType === 'KI' ? 'Corporate Store' : 'Mobile Klinik'} organizations.`));
  }
  
  card.addSection(orgSection);
  
  // Navigation
  const navSection = CardService.newCardSection()
    .addWidget(CardService.newButtonSet()
      .addButton(CardService.newTextButton()
        .setText('Next: Processing Mode')
        .setOnClickAction(CardService.newAction()
          .setFunctionName('saveStepAndContinue'))));
  
  card.addSection(navSection);
  
  return card.build();
}

/**
 * Step 2: Processing Mode
 */
function createStep2ProcessingModeCard(card, config) {
  const modeSection = CardService.newCardSection()
    .setHeader('Processing Mode')
    .addWidget(CardService.newTextParagraph()
      .setText('Choose how leads should be processed and sent to Zoho CRM.'))
    .addWidget(CardService.newSelectionInput()
      .setType(CardService.SelectionInputType.RADIO_BUTTON)
      .setTitle('Processing Method')
      .setFieldName('processingMode')
      .addItem('🔄 Automatic - Send to Zoho when rows are edited', 'AUTO', config.processingMode === 'AUTO')
      .addItem('👆 Manual - Send to Zoho using menu button', 'MANUAL', config.processingMode === 'MANUAL'))
    .addWidget(CardService.newTextParagraph()
      .setText('\n💡 Recommendation: Choose Automated for real-time processing or Manual for batch processing with review.'));
  
  card.addSection(modeSection);
  
  // Navigation
  const navSection = CardService.newCardSection()
    .addWidget(CardService.newButtonSet()
      .addButton(CardService.newTextButton()
        .setText('Previous')
        .setOnClickAction(CardService.newAction()
          .setFunctionName('goToPreviousStep')))
      .addButton(CardService.newTextButton()
        .setText('Next: Campaign Settings')
        .setOnClickAction(CardService.newAction()
          .setFunctionName('saveStepAndContinue'))));
  
  card.addSection(navSection);
  
  return card.build();
}

/**
 * Step 3: Campaign Settings
 */
function createStep3CampaignCard(card, config) {
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 30);
  
  const campaignSection = CardService.newCardSection()
    .setHeader('Campaign Settings')
    .addWidget(CardService.newTextParagraph()
      .setText('Set the campaign duration for your leads. This determines how long leads remain active in Zoho.'))
    .addWidget(CardService.newTextInput()
      .setTitle('Campaign Start Date (YYYY-MM-DD)')
      .setFieldName('campaignStartDate')
      .setValue(config.campaignStartDate || today.toISOString().split('T')[0]))
    .addWidget(CardService.newTextInput()
      .setTitle('Campaign End Date (YYYY-MM-DD)')
      .setFieldName('campaignEndDate')
      .setValue(config.campaignEndDate || endDate.toISOString().split('T')[0]))
    .addWidget(CardService.newTextParagraph()
      .setText('\n💡 Example campaign durations:\n• 10 days - Hot leads (quoting tools)\n• 30 days - Marketing leads\n• 90 days - Rep generated leads'));
  
  card.addSection(campaignSection);
  
  // Navigation
  const navSection = CardService.newCardSection()
    .addWidget(CardService.newButtonSet()
      .addButton(CardService.newTextButton()
        .setText('Previous')
        .setOnClickAction(CardService.newAction()
          .setFunctionName('goToPreviousStep')))
      .addButton(CardService.newTextButton()
        .setText('Next: Lead Assignment')
        .setOnClickAction(CardService.newAction()
          .setFunctionName('saveStepAndContinue'))));
  
  card.addSection(navSection);
  
  return card.build();
}

/**
 * Step 4: Lead Assignment Strategy
 */
function createStep4LeadAssignmentCard(card, config) {
  const assignmentSection = CardService.newCardSection()
    .setHeader('Lead Assignment Strategy')
    .addWidget(CardService.newTextParagraph()
      .setText('Choose how leads should be assigned to sales representatives in Zoho CRM.'));
  
  // Different options based on organization type
  if (config.organizationType === 'DL') {
    assignmentSection.addWidget(CardService.newSelectionInput()
      .setType(CardService.SelectionInputType.RADIO_BUTTON)
      .setTitle('Assignment Method')
      .setFieldName('leadAssignment')
      .addItem('👤 Admin Assignment - All leads to admin', 'ADMIN', config.leadAssignment === 'ADMIN')
      .addItem('📧 Sales Rep Assignment - Specify rep email per lead', 'Sales_Rep', config.leadAssignment === 'Sales_Rep'));
  } else {
    assignmentSection.addWidget(CardService.newSelectionInput()
      .setType(CardService.SelectionInputType.RADIO_BUTTON)
      .setTitle('Assignment Method')
      .setFieldName('leadAssignment')
      .addItem('📧 Sales Rep Assignment - Specify rep email per lead', 'Sales_Rep', config.leadAssignment === 'Sales_Rep')
      .addItem('🏪 Store Assignment - Distribute by store outlet ID', 'Store', config.leadAssignment === 'Store'));
  }
  
  card.addSection(assignmentSection);
  
  // Navigation
  const navSection = CardService.newCardSection()
    .addWidget(CardService.newButtonSet()
      .addButton(CardService.newTextButton()
        .setText('Previous')
        .setOnClickAction(CardService.newAction()
          .setFunctionName('goToPreviousStep')))
      .addButton(CardService.newTextButton()
        .setText('Complete Setup')
        .setOnClickAction(CardService.newAction()
          .setFunctionName('completeSetup'))));
  
  card.addSection(navSection);
  
  return card.build();
}

/**
 * Setup Complete Card
 */
function createSetupCompleteCard(card, config) {
  const completeSection = CardService.newCardSection()
    .setHeader('✅ Setup Complete!')
    .addWidget(CardService.newTextParagraph()
      .setText('Your Zoho integration has been configured successfully.'))
    .addWidget(CardService.newKeyValue()
      .setTopLabel('Organization Type')
      .setContent(getOrgTypeName(config.organizationType)))
    .addWidget(CardService.newKeyValue()
      .setTopLabel('Processing Mode')
      .setContent(config.processingMode === 'AUTO' ? 'Automatic' : 'Manual'))
    .addWidget(CardService.newKeyValue()
      .setTopLabel('Lead Assignment')
      .setContent(getAssignmentName(config.leadAssignment)))
    .addWidget(CardService.newKeyValue()
      .setTopLabel('Campaign Period')
      .setContent(`${config.campaignStartDate} to ${config.campaignEndDate}`))
    .addWidget(CardService.newTextParagraph()
      .setText('\n🎉 Next Steps:\n• Your spreadsheet template has been updated\n• You can now start adding lead data\n• Leads will sync to Zoho based on your settings'));
  
  card.addSection(completeSection);
  
  // Final actions
  const actionSection = CardService.newCardSection()
    .addWidget(CardService.newButtonSet()
      .addButton(CardService.newTextButton()
        .setText('View Status')
        .setOnClickAction(CardService.newAction()
          .setFunctionName('showStatus')))
      .addButton(CardService.newTextButton()
        .setText('Manual Sync')
        .setOnClickAction(CardService.newAction()
          .setFunctionName('manualSync'))));
  
  card.addSection(actionSection);
  
  return card.build();
}

/**
 * Helper functions for setup completion
 */
function getOrgTypeName(orgType) {
  const names = {
    'KI': 'Corporate Store',
    'DL': 'Dealership',
    'RT': 'Mobile Klinik'
  };
  return names[orgType] || orgType;
}

function getAssignmentName(assignment) {
  const names = {
    'ADMIN': 'Admin Assignment',
    'Sales_Rep': 'Sales Rep Assignment',
    'Store': 'Store Assignment'
  };
  return names[assignment] || assignment;
}

/**
 * Create the status card
 * @return {Card} Status card
 */
function createStatusCard() {
  const versionInfo = getVersionInfo();
  const config = getConfigurationValues();
  
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle('Integration Status')
      .setSubtitle(`Version ${versionInfo.version}`));
  
  // Check for updates first
  const updateCard = createUpdateNotificationSection();
  if (updateCard) {
    card.addSection(updateCard);
  }
      
  // Version section
  const versionSection = CardService.newCardSection()
    .setHeader('Version Information')
    .addWidget(CardService.newKeyValue()
      .setTopLabel('Version')
      .setContent(versionInfo.version))
    .addWidget(CardService.newKeyValue()
      .setTopLabel('Environment')
      .setContent(versionInfo.environment))
    .addWidget(CardService.newKeyValue()
      .setTopLabel('Build Date')
      .setContent(new Date(versionInfo.buildDate).toLocaleDateString()));
      
  card.addSection(versionSection);
  
  // Configuration status
  const configSection = CardService.newCardSection()
    .setHeader('Configuration Status')
    .addWidget(CardService.newKeyValue()
      .setTopLabel('Organization Type')
      .setContent(config.organizationType || 'Not configured'))
    .addWidget(CardService.newKeyValue()
      .setTopLabel('API Credentials')
      .setContent(config.authTokenName ? '✅ Configured' : '❌ Missing'))
    .addWidget(CardService.newKeyValue()
      .setTopLabel('Campaign Dates')
      .setContent(config.campaignStartDate ? '✅ Configured' : '❌ Missing'));
      
  card.addSection(configSection);
  
  return card.build();
}

/**
 * Create update notification section if update is available
 * @return {CardSection|null} Update notification section or null
 */
function createUpdateNotificationSection() {
  try {
    const updateInfo = checkForUpdatesFromGitHub();
    
    if (!updateInfo.updateAvailable || updateInfo.error) {
      return null; // No update needed or error occurred
    }
    
    const updateSection = CardService.newCardSection()
      .setHeader('🔄 Update Available')
      .addWidget(CardService.newKeyValue()
        .setTopLabel('Current Version')
        .setContent(updateInfo.currentVersion))
      .addWidget(CardService.newKeyValue()
        .setTopLabel('Latest Version')
        .setContent(updateInfo.latestVersion))
      .addWidget(CardService.newTextParagraph()
        .setText('A new version is available with improvements and bug fixes.'))
      .addWidget(CardService.newButtonSet()
        .addButton(CardService.newTextButton()
          .setText('View Release')
          .setOpenLink(CardService.newOpenLink()
            .setUrl(updateInfo.releaseUrl)))
        .addButton(CardService.newTextButton()
          .setText('Update Guide')
          .setOpenLink(CardService.newOpenLink()
            .setUrl('https://github.com/AlessandroZamai/Zoho/blob/workspace-addon/UPDATE_GUIDE.md'))))
      .addWidget(CardService.newTextButton()
        .setText('Get Update Helper')
        .setOnClickAction(CardService.newAction()
          .setFunctionName('showUpdateHelperCard')));
    
    return updateSection;
  } catch (error) {
    // Silently fail - don't show update section if there's an error
    Logger.log('Error checking for updates in UI: ' + error.toString());
    return null;
  }
}

/**
 * Show update helper card
 * @return {ActionResponse} Update helper card
 */
function showUpdateHelperCard() {
  try {
    const card = CardService.newCardBuilder()
      .setHeader(CardService.newCardHeader()
        .setTitle('🔄 Update Helper')
        .setSubtitle('Get latest code from GitHub'))
      .addSection(CardService.newCardSection()
        .setHeader('Available Files')
        .addWidget(CardService.newTextParagraph()
          .setText('Select a file to get the latest code. The code will be displayed in the Apps Script logs for easy copying.'))
        .addWidget(CardService.newButtonSet()
          .addButton(CardService.newTextButton()
            .setText('addon_main.gs')
            .setOnClickAction(CardService.newAction()
              .setFunctionName('getFileCode')
              .setParameters({'filename': 'addon_main.gs'})))
          .addButton(CardService.newTextButton()
            .setText('zoho_integration_core.gs')
            .setOnClickAction(CardService.newAction()
              .setFunctionName('getFileCode')
              .setParameters({'filename': 'zoho_integration_core.gs'}))))
        .addWidget(CardService.newButtonSet()
          .addButton(CardService.newTextButton()
            .setText('zoho_validation.gs')
            .setOnClickAction(CardService.newAction()
              .setFunctionName('getFileCode')
              .setParameters({'filename': 'zoho_validation.gs'})))
          .addButton(CardService.newTextButton()
            .setText('zoho_config.gs')
            .setOnClickAction(CardService.newAction()
              .setFunctionName('getFileCode')
              .setParameters({'filename': 'zoho_config.gs'}))))
        .addWidget(CardService.newButtonSet()
          .addButton(CardService.newTextButton()
            .setText('zoho_triggers.gs')
            .setOnClickAction(CardService.newAction()
              .setFunctionName('getFileCode')
              .setParameters({'filename': 'zoho_triggers.gs'})))
          .addButton(CardService.newTextButton()
            .setText('version.gs')
            .setOnClickAction(CardService.newAction()
              .setFunctionName('getFileCode')
              .setParameters({'filename': 'version.gs'}))))
        .addWidget(CardService.newTextButton()
          .setText('appsscript.json')
          .setOnClickAction(CardService.newAction()
            .setFunctionName('getFileCode')
            .setParameters({'filename': 'appsscript.json'}))))
      .addSection(CardService.newCardSection()
        .setHeader('Instructions')
        .addWidget(CardService.newTextParagraph()
          .setText('1. Click a file button above\n2. Check Apps Script logs (View > Logs)\n3. Copy the displayed code\n4. Paste into your file\n5. Save and test')))
      .build();
    
    return CardService.newActionResponseBuilder()
      .setNavigation(CardService.newNavigation()
        .pushCard(card))
      .build();
      
  } catch (error) {
    const notification = CardService.newNotification()
      .setType(CardService.NotificationType.ERROR)
      .setText('Error loading update helper: ' + error.message);
      
    return CardService.newActionResponseBuilder()
      .setNotification(notification)
      .build();
  }
}

/**
 * Get code for a specific file and log it
 * @param {Object} e - Event object with parameters
 * @return {ActionResponse} Response with notification
 */
function getFileCode(e) {
  try {
    const filename = e.parameters.filename;
    const content = getLatestFileCode(filename);
    
    if (content) {
      const notification = CardService.newNotification()
        .setType(CardService.NotificationType.INFO)
        .setText(`✅ Latest ${filename} code logged! Check View > Logs to copy it.`);
        
      return CardService.newActionResponseBuilder()
        .setNotification(notification)
        .build();
    } else {
      const notification = CardService.newNotification()
        .setType(CardService.NotificationType.ERROR)
        .setText(`❌ Failed to fetch ${filename}. Check your internet connection.`);
        
      return CardService.newActionResponseBuilder()
        .setNotification(notification)
        .build();
    }
  } catch (error) {
    const notification = CardService.newNotification()
      .setType(CardService.NotificationType.ERROR)
      .setText('Error: ' + error.message);
      
    return CardService.newActionResponseBuilder()
      .setNotification(notification)
      .build();
  }
}

/**
 * Create the manual sync card
 * @return {Card} Manual sync card
 */
function createManualSyncCard() {
  try {
    const unsubmittedRows = getUnsubmittedRows();
    
    const card = CardService.newCardBuilder()
      .setHeader(CardService.newCardHeader()
        .setTitle('Manual Sync')
        .setSubtitle('Process unsynced leads'));
        
    const syncSection = CardService.newCardSection()
      .setHeader('Sync Status')
      .addWidget(CardService.newKeyValue()
        .setTopLabel('Unsynced Leads')
        .setContent(unsubmittedRows.length.toString()));
        
    if (unsubmittedRows.length > 0) {
      // Try to extract row numbers - check different possible property names
      let rowNumbers = [];
      
      for (let i = 0; i < unsubmittedRows.length; i++) {
        const rowData = unsubmittedRows[i];
        // Check various possible property names for row index
        const rowIndex = rowData.rowIndex || rowData.row || rowData.rowNumber || (i + 2); // +2 assuming header row
        rowNumbers.push(rowIndex);
      }
      
      // Sort and format row numbers
      rowNumbers.sort((a, b) => a - b);
      const rowText = rowNumbers.length <= 15 
        ? `Rows: ${rowNumbers.join(', ')}`
        : `Rows: ${rowNumbers.slice(0, 15).join(', ')} and ${rowNumbers.length - 15} more`;
      
      syncSection.addWidget(CardService.newTextParagraph()
        .setText(`📍 ${rowText}`));
      
      syncSection.addWidget(CardService.newTextButton()
        .setText(`Sync ${unsubmittedRows.length} Leads`)
        .setOnClickAction(CardService.newAction()
          .setFunctionName('startManualSync')));
    } else {
      syncSection.addWidget(CardService.newTextParagraph()
        .setText('✅ All leads are synced!'));
    }
    
    card.addSection(syncSection);
    
    return card.build();
    
  } catch (error) {
    // Fallback if there's an error getting unsubmitted rows
    const card = CardService.newCardBuilder()
      .setHeader(CardService.newCardHeader()
        .setTitle('Manual Sync')
        .setSubtitle('Process unsynced leads'))
      .addSection(CardService.newCardSection()
        .setHeader('Sync Status')
        .addWidget(CardService.newTextParagraph()
          .setText('⚠️ Error checking unsynced leads: ' + error.message))
        .addWidget(CardService.newTextButton()
          .setText('Try Manual Sync')
          .setOnClickAction(CardService.newAction()
            .setFunctionName('startManualSync'))));
            
    return card.build();
  }
}

/**
 * Save configuration from add-on card
 * @param {Object} e - Event object with form inputs
 * @return {Card} Updated configuration card
 */
function saveConfigurationFromCard(e) {
  const formInputs = e.formInputs;
  
  const config = {
    organizationType: formInputs.organizationType ? formInputs.organizationType[0] : null,
    processingMode: formInputs.processingMode ? formInputs.processingMode[0] : null,
    leadAssignment: formInputs.leadAssignment ? formInputs.leadAssignment[0] : null,
    campaignStartDate: formInputs.campaignStartDate ? formInputs.campaignStartDate[0] : null,
    campaignEndDate: formInputs.campaignEndDate ? formInputs.campaignEndDate[0] : null
  };
  
  // Add credentials only for dealership organizations
  if (config.organizationType === 'DL') {
    config.authTokenName = formInputs.authTokenName ? formInputs.authTokenName[0] : null;
    config.authTokenValue = formInputs.authTokenValue ? formInputs.authTokenValue[0] : null;
    config.orgCode = formInputs.orgCode ? formInputs.orgCode[0] : null;
  }
  
  try {
    const result = saveCompleteConfiguration(config);
    
    if (result.success) {
      const notification = CardService.newNotification()
        .setType(CardService.NotificationType.INFO)
        .setText('Configuration saved successfully!');
        
      return CardService.newActionResponseBuilder()
        .setNotification(notification)
        .setNavigation(CardService.newNavigation()
          .updateCard(createConfigurationCard()))
        .build();
    } else {
      const notification = CardService.newNotification()
        .setType(CardService.NotificationType.ERROR)
        .setText('Error: ' + result.message);
        
      return CardService.newActionResponseBuilder()
        .setNotification(notification)
        .build();
    }
      
  } catch (error) {
    const notification = CardService.newNotification()
      .setType(CardService.NotificationType.ERROR)
      .setText('Error saving configuration: ' + error.message);
      
    return CardService.newActionResponseBuilder()
      .setNotification(notification)
      .build();
  }
}


/**
 * Start manual sync from add-on
 * @return {ActionResponse} Sync initiation response
 */
function startManualSync() {
  try {
    // This will call the existing manual processing function
    sendUnsubmittedRowsToZoho();
    
    const notification = CardService.newNotification()
      .setType(CardService.NotificationType.INFO)
      .setText('Manual sync started! Check your spreadsheet for progress.');
      
    return CardService.newActionResponseBuilder()
      .setNotification(notification)
      .setNavigation(CardService.newNavigation()
        .updateCard(createManualSyncCard()))
      .build();
      
  } catch (error) {
    const notification = CardService.newNotification()
      .setType(CardService.NotificationType.ERROR)
      .setText('Error starting sync: ' + error.message);
      
    return CardService.newActionResponseBuilder()
      .setNotification(notification)
      .build();
  }
}

/**
 * Show documentation
 * @return {Card} Documentation card
 */
function showDocumentation() {
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle('Documentation')
      .setSubtitle('Help and guides'))
    .addSection(CardService.newCardSection()
      .setHeader('Getting Started')
      .addWidget(CardService.newTextParagraph()
        .setText('1. Configure your organization type and API credentials\n2. Set up campaign dates\n3. Add lead data to your spreadsheet\n4. Leads will automatically sync to Zoho CRM'))
      .addWidget(CardService.newTextButton()
        .setText('View Full Documentation')
        .setOpenLink(CardService.newOpenLink()
          .setUrl('https://github.com/AlessandroZ-TELUS/Zoho/blob/main/README.md'))))
    .build();
    
  return card;
}

/**
 * Wizard Navigation Functions
 */

/**
 * Save current step and continue to next
 */
function saveStepAndContinue(e) {
  try {
    const formInputs = e.formInputs;
    const properties = PropertiesService.getScriptProperties();
    const currentStep = parseInt(properties.getProperty('SETUP_CURRENT_STEP') || '1');
    
    // Save current step data
    saveStepData(currentStep, formInputs, properties);
    
    // Move to next step
    const nextStep = currentStep + 1;
    properties.setProperty('SETUP_CURRENT_STEP', nextStep.toString());
    
    const notification = CardService.newNotification()
      .setType(CardService.NotificationType.INFO)
      .setText('Step saved! Moving to next step...');
    
    return CardService.newActionResponseBuilder()
      .setNotification(notification)
      .setNavigation(CardService.newNavigation()
        .updateCard(createConfigurationCard()))
      .build();
      
  } catch (error) {
    const notification = CardService.newNotification()
      .setType(CardService.NotificationType.ERROR)
      .setText('Error saving step: ' + error.message);
      
    return CardService.newActionResponseBuilder()
      .setNotification(notification)
      .build();
  }
}

/**
 * Go to previous step
 */
function goToPreviousStep() {
  try {
    const properties = PropertiesService.getScriptProperties();
    const currentStep = parseInt(properties.getProperty('SETUP_CURRENT_STEP') || '1');
    
    if (currentStep > 1) {
      const previousStep = currentStep - 1;
      properties.setProperty('SETUP_CURRENT_STEP', previousStep.toString());
    }
    
    return CardService.newActionResponseBuilder()
      .setNavigation(CardService.newNavigation()
        .updateCard(createConfigurationCard()))
      .build();
      
  } catch (error) {
    const notification = CardService.newNotification()
      .setType(CardService.NotificationType.ERROR)
      .setText('Error going to previous step: ' + error.message);
      
    return CardService.newActionResponseBuilder()
      .setNotification(notification)
      .build();
  }
}

/**
 * Complete the setup process
 */
function completeSetup(e) {
  try {
    const formInputs = e.formInputs;
    const properties = PropertiesService.getScriptProperties();
    
    // Save final step data
    saveStepData(4, formInputs, properties);
    
    // Compile all configuration data
    const config = {
      organizationType: properties.getProperty('SETUP_ORGANIZATION_TYPE'),
      processingMode: properties.getProperty('SETUP_PROCESSING_MODE'),
      leadAssignment: properties.getProperty('SETUP_LEAD_ASSIGNMENT'),
      campaignStartDate: properties.getProperty('SETUP_CAMPAIGN_START_DATE'),
      campaignEndDate: properties.getProperty('SETUP_CAMPAIGN_END_DATE'),
      authTokenName: properties.getProperty('SETUP_AUTH_TOKEN_NAME'),
      authTokenValue: properties.getProperty('SETUP_AUTH_TOKEN_VALUE'),
      orgCode: properties.getProperty('SETUP_ORG_CODE')
    };
    
    // Save complete configuration
    const result = saveCompleteConfiguration(config);
    
    if (result.success) {
      // Clear setup state
      properties.deleteProperty('SETUP_CURRENT_STEP');
      clearSetupProperties(properties);
      
      // Move to completion step
      properties.setProperty('SETUP_CURRENT_STEP', '5');
      
      const notification = CardService.newNotification()
        .setType(CardService.NotificationType.INFO)
        .setText('Setup completed successfully!');
        
      return CardService.newActionResponseBuilder()
        .setNotification(notification)
        .setNavigation(CardService.newNavigation()
          .updateCard(createConfigurationCard()))
        .build();
    } else {
      const notification = CardService.newNotification()
        .setType(CardService.NotificationType.ERROR)
        .setText('Setup error: ' + result.message);
        
      return CardService.newActionResponseBuilder()
        .setNotification(notification)
        .build();
    }
      
  } catch (error) {
    const notification = CardService.newNotification()
      .setType(CardService.NotificationType.ERROR)
      .setText('Error completing setup: ' + error.message);
      
    return CardService.newActionResponseBuilder()
      .setNotification(notification)
      .build();
  }
}

/**
 * Save step-specific data
 */
function saveStepData(step, formInputs, properties) {
  switch (step) {
    case 1:
      if (formInputs.organizationType) {
        properties.setProperty('SETUP_ORGANIZATION_TYPE', formInputs.organizationType[0]);
      }
      if (formInputs.authTokenName) {
        properties.setProperty('SETUP_AUTH_TOKEN_NAME', formInputs.authTokenName[0]);
      }
      if (formInputs.authTokenValue) {
        properties.setProperty('SETUP_AUTH_TOKEN_VALUE', formInputs.authTokenValue[0]);
      }
      if (formInputs.orgCode) {
        properties.setProperty('SETUP_ORG_CODE', formInputs.orgCode[0]);
      }
      break;
      
    case 2:
      if (formInputs.processingMode) {
        properties.setProperty('SETUP_PROCESSING_MODE', formInputs.processingMode[0]);
      }
      break;
      
    case 3:
      if (formInputs.campaignStartDate) {
        properties.setProperty('SETUP_CAMPAIGN_START_DATE', formInputs.campaignStartDate[0]);
      }
      if (formInputs.campaignEndDate) {
        properties.setProperty('SETUP_CAMPAIGN_END_DATE', formInputs.campaignEndDate[0]);
      }
      break;
      
    case 4:
      if (formInputs.leadAssignment) {
        properties.setProperty('SETUP_LEAD_ASSIGNMENT', formInputs.leadAssignment[0]);
      }
      break;
  }
}

/**
 * Clear setup properties
 */
function clearSetupProperties(properties) {
  const setupKeys = [
    'SETUP_ORGANIZATION_TYPE',
    'SETUP_PROCESSING_MODE',
    'SETUP_LEAD_ASSIGNMENT',
    'SETUP_CAMPAIGN_START_DATE',
    'SETUP_CAMPAIGN_END_DATE',
    'SETUP_AUTH_TOKEN_NAME',
    'SETUP_AUTH_TOKEN_VALUE',
    'SETUP_ORG_CODE'
  ];
  
  setupKeys.forEach(key => {
    properties.deleteProperty(key);
  });
}

/**
 * Launch the full HTML setup wizard (rich UI experience)
 * @return {ActionResponse} Response to launch wizard
 */
function launchFullSetupWizard() {
  try {
    // Call the existing showSetupWizard function which uses the rich HTML UI
    showSetupWizard();
    
    const notification = CardService.newNotification()
      .setType(CardService.NotificationType.INFO)
      .setText('Full Setup Wizard launched! Check for the popup dialog.');
      
    return CardService.newActionResponseBuilder()
      .setNotification(notification)
      .build();
      
  } catch (error) {
    const notification = CardService.newNotification()
      .setType(CardService.NotificationType.ERROR)
      .setText('Error launching wizard: ' + error.message + '\n\nTry running showSetupWizard() from Apps Script instead.');
      
    return CardService.newActionResponseBuilder()
      .setNotification(notification)
      .build();
  }
}
