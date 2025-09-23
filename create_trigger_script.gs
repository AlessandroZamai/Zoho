// Creates a trigger so when a new row is added, the data from that row is automatically sent to Zoho
// DEPRECATED: Use the setup wizard instead (showSetupWizard function)
// This function is kept for backward compatibility
function createTrigger() {
  Logger.log('createTrigger function started.');
  
  // Show a message suggesting to use the new setup wizard
  SpreadsheetApp.getUi().alert(
    'Setup Wizard Available',
    'A new setup wizard is available that allows you to choose between automated and manual trigger modes.\n\nWould you like to use the setup wizard instead? Run the "showSetupWizard" function for more options.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );

  // Delete existing triggers first to avoid duplicates
  const allTriggers = ScriptApp.getProjectTriggers();
  Logger.log('Found ' + allTriggers.length + ' existing triggers.');

  for (let i = 0; i < allTriggers.length; i++) {
    const handlerFunction = allTriggers[i].getHandlerFunction();
    Logger.log('Checking trigger: ' + handlerFunction);

    if (handlerFunction === 'sendToWebhook') {
      Logger.log('Deleting existing trigger for sendToWebhook.');
      ScriptApp.deleteTrigger(allTriggers[i]);
      Logger.log('Trigger deleted.');
    }
  }
  Logger.log('Finished deleting old triggers.');

  // Create a trigger that runs when a cell is edited
  try {
    ScriptApp.newTrigger('sendToWebhook')
      .forSpreadsheet(SpreadsheetApp.getActive())
      .onEdit()
      .create();
    Logger.log('New onEdit trigger for "sendToWebhook" created successfully.');
    
    // Set the trigger mode to AUTO for backward compatibility
    const properties = PropertiesService.getScriptProperties();
    properties.setProperty(CONFIG_TRIGGER_MODE, TRIGGER_MODE_AUTO);
    Logger.log('Trigger mode set to AUTO for backward compatibility.');
    
  } catch (error) {
    Logger.log('Error creating trigger: ' + error.toString());
  }

  Logger.log('createTrigger function finished.');
}
