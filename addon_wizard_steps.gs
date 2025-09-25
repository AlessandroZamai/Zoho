/**
 * TELUS Zoho Lead Integration Add-on - Setup Wizard Steps
 * Complete step-by-step setup similar to unified_ui
 */

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
 * Helper functions
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
 * Reset setup wizard
 */
function resetSetupWizard() {
  try {
    const properties = PropertiesService.getScriptProperties();
    properties.setProperty('SETUP_CURRENT_STEP', '1');
    clearSetupProperties(properties);
    
    const notification = CardService.newNotification()
      .setType(CardService.NotificationType.INFO)
      .setText('Setup wizard reset to beginning.');
      
    return CardService.newActionResponseBuilder()
      .setNotification(notification)
      .setNavigation(CardService.newNavigation()
        .updateCard(createConfigurationCard()))
      .build();
      
  } catch (error) {
    const notification = CardService.newNotification()
      .setType(CardService.NotificationType.ERROR)
      .setText('Error resetting wizard: ' + error.message);
      
    return CardService.newActionResponseBuilder()
      .setNotification(notification)
      .build();
  }
}
