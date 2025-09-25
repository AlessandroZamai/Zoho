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
  const isConfigured = isConfigurationComplete();
  const hasValidStructure = validateSpreadsheetStructure();
  
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle('Zoho Lead Integration')
      .setSubtitle(`Sheet: ${sheet.getName()}`)
      .setImageUrl('https://www.telus.com/favicon.ico'));
      
  // Status section
  const statusSection = CardService.newCardSection()
    .setHeader('Integration Status');
    
  if (isConfigured && hasValidStructure) {
    statusSection.addWidget(CardService.newTextParagraph()
      .setText('✅ Ready to sync leads to Zoho CRM'));
  } else if (!isConfigured) {
    statusSection.addWidget(CardService.newTextParagraph()
      .setText('⚠️ Configuration required'));
  } else if (!hasValidStructure) {
    statusSection.addWidget(CardService.newTextParagraph()
      .setText('⚠️ Invalid spreadsheet structure'));
  }
  
  card.addSection(statusSection);
  
  // Actions section
  const actionsSection = CardService.newCardSection()
    .setHeader('Actions');
    
  if (!isConfigured) {
    actionsSection.addWidget(CardService.newTextButton()
      .setText('Configure Integration')
      .setOnClickAction(CardService.newAction()
        .setFunctionName('openConfiguration')));
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
    .setText('Settings')
    .setOnClickAction(CardService.newAction()
      .setFunctionName('openConfiguration')));
      
  card.addSection(actionsSection);
  
  return card.build();
}

/**
 * Create the configuration card
 * @return {Card} Configuration card
 */
function createConfigurationCard() {
  const config = getConfigurationValues();
  
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle('Configuration')
      .setSubtitle('Set up your Zoho integration'));
      
  // Organization section
  const orgSection = CardService.newCardSection()
    .setHeader('Organization Settings')
    .addWidget(CardService.newSelectionInput()
      .setType(CardService.SelectionInputType.DROPDOWN)
      .setTitle('Organization Type')
      .setFieldName('organizationType')
      .addItem('Corporate Store (KI)', 'KI', config.organizationType === 'KI')
      .addItem('Dealership (DL)', 'DL', config.organizationType === 'DL')
      .addItem('Mobile Klinik (RT)', 'RT', config.organizationType === 'RT'));
      
  card.addSection(orgSection);
  
  // API Credentials section
  const credentialsSection = CardService.newCardSection()
    .setHeader('API Credentials')
    .addWidget(CardService.newTextInput()
      .setTitle('Auth Token Name')
      .setFieldName('authTokenName')
      .setValue(config.authTokenName || ''))
    .addWidget(CardService.newTextInput()
      .setTitle('Auth Token Value')
      .setFieldName('authTokenValue')
      .setValue(config.authTokenValue || ''));
      
  card.addSection(credentialsSection);
  
  // Campaign section
  const campaignSection = CardService.newCardSection()
    .setHeader('Campaign Settings')
    .addWidget(CardService.newTextInput()
      .setTitle('Campaign Start Date (YYYY-MM-DD)')
      .setFieldName('campaignStartDate')
      .setValue(config.campaignStartDate || ''))
    .addWidget(CardService.newTextInput()
      .setTitle('Campaign End Date (YYYY-MM-DD)')
      .setFieldName('campaignEndDate')
      .setValue(config.campaignEndDate || ''));
      
  card.addSection(campaignSection);
  
  // Save button
  const saveSection = CardService.newCardSection()
    .addWidget(CardService.newTextButton()
      .setText('Save Configuration')
      .setOnClickAction(CardService.newAction()
        .setFunctionName('saveConfigurationFromCard')));
          
  card.addSection(saveSection);
  
  return card.build();
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
 * Create the manual sync card
 * @return {Card} Manual sync card
 */
function createManualSyncCard() {
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
    syncSection.addWidget(CardService.newTextButton()
      .setText(`Sync ${unsubmittedRows.length} Leads`)
      .setOnClickAction(CardService.newAction()
        .setFunctionName('startManualSync')));
  } else {
    syncSection.addWidget(CardService.newTextParagraph()
      .setText('All leads are synced!'));
  }
  
  card.addSection(syncSection);
  
  return card.build();
}

/**
 * Save configuration from add-on card
 * @param {Object} e - Event object with form inputs
 * @return {Card} Updated configuration card
 */
function saveConfigurationFromCard(e) {
  const formInputs = e.formInputs;
  
  const config = {
    organizationType: formInputs.organizationType[0],
    authTokenName: formInputs.authTokenName[0],
    authTokenValue: formInputs.authTokenValue[0],
    campaignStartDate: formInputs.campaignStartDate[0],
    campaignEndDate: formInputs.campaignEndDate[0]
  };
  
  try {
    saveCompleteConfiguration(config);
    
    const notification = CardService.newNotification()
      .setType(CardService.NotificationType.INFO)
      .setText('Configuration saved successfully!');
      
    return CardService.newActionResponseBuilder()
      .setNotification(notification)
      .setNavigation(CardService.newNavigation()
        .updateCard(createConfigurationCard()))
      .build();
      
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
