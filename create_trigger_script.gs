// Creates a trigger so when a new row is added, the data from that row is automatically sent to Zoho
function createTrigger() {
  Logger.log('createTrigger function started.');

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
  } catch (error) {
    Logger.log('Error creating trigger: ' + error.toString());
  }

  Logger.log('createTrigger function finished.');
}