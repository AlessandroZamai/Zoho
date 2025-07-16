# **Dealer Setup Guide: Google Sheet \+ App Script & Zoho Webhook Integration**

This document provides step-by-step instructions for partners to set up the Google Spreadsheet template, integrate the provided Google Apps Script files, update them with their unique API token, and test the webhook integration with Zoho CRM.

## **Prerequisites**

Before you begin, ensure you have:

* A Google account with access to Google Sheets and Google Apps Script.  
* The `Webhook Sample Template w_Script.xlsx - Sheet1.csv` file.  
* The `create_trigger_script.gs` and `send_to_webhook_script.gs` files containing the Google Apps Script code.  
* Your unique Zoho API `AUTH_TOKEN_NAME` and `AUTH_TOKEN_VALUE` provided by TELUS. If you do not have this, or have lost it, email `dltrlzohodev@telus.com`.

## **Step 1: Create a New Google Spreadsheet and Import the Template**

1. **Open Google Sheets:** Go to [sheets.google.com](https://sheets.google.com/).  
2. **Create a New Blank Spreadsheet:** Click on `+ Blank spreadsheet`.  
3. **Rename the Spreadsheet:** Rename your new spreadsheet (e.g., "TELUS Lead Capture Webhook"). Go to `File > Rename` and enter the desired name.  
4. **Import the CSV Template:**  
   * Go to `File > Import`.  
   * Select the `Upload` tab.  
   * Click `Browse` and select the `Webhook Sample Template w_Script.csv` file that was shared with you.  
   * In the Import options, choose:  
     * **Import location:** `Replace spreadsheet` (this will replace the blank sheet with the template data).  
     * **Separator type:** `Detect automatically`.  
     * **Convert text to numbers, dates, and formulas:** `Yes`.  
   * Click `Import data`. Your spreadsheet should now have the correct headers and initial data from the template.

## **Step 2: Create a New Google Apps Script Project and Attach the Scripts**

1. **Open the Script Editor:** While your Google Spreadsheet is open, go to `Extensions > Apps Script`. This will open a new browser tab with the Apps Script editor, automatically linked to your spreadsheet.  
2. **Delete Existing Code:** In the Apps Script editor, you'll see a default file named `Code.gs` with a `myFunction()` template. Delete all the content within `Code.gs`.  
3. **Add `sendToWebhook` Script:**  
   * In the Apps Script editor, click on `+` next to "Files" (or `File > New > Script file`).  
   * Name the new file `sendToWebhook.gs` (or any other descriptive name).  
   * Delete all the content within `sendToWebhook.gs`  
   * Open the `send_to_webhook_script.gs` file you received in a text editor.  
   * Copy **all** the content from this file.  
   * Paste it into the `Code.gs` file in the Apps Script editor.  
4. **Add `createTrigger` Script:**  
   * In the Apps Script editor, click on `+` next to "Files" (or `File > New > Script file`).  
   * Delete all the content within `createTrigger.gs`  
   * Name the new file `createTrigger.gs` (or any other descriptive name).  
   * Open the `create_trigger_script.gs` file you received in a text editor.  
   * Copy **all** the content from this file.  
   * Paste it into the newly created `createTrigger.gs` file.  
5. **Save the Project:** Click the `Save project` icon (looks like a floppy disk) in the Apps Script editor.

## **Step 3: Update the Script with Your Unique API Token and Sales Rep Assignment**

1. **Locate `sendToWebhook` function:** In the Apps Script editor, open the `Code.gs` file.  
2. **Update API Tokens:**  
   * Locate the line:

```javascript
const AUTH_TOKEN_NAME = 'EnterAuthTokenName'; //Fill in this field with the token name you were provided
```

   * Replace `'EnterAuthTokenName'` with the actual `AUTH_TOKEN_NAME` provided by TELUS (e.g., `'dealerName_token'`).  
   * Locate the line:

```javascript
const AUTH_TOKEN_VALUE = 'EnterAuthTokenValue'; //Fill in this field with the token value you were provided
```

   * Replace `'EnterAuthTokenValue'` with the actual `AUTH_TOKEN_VALUE` provided by TELUS (e.g., `'asdFweF234Asdfhg234kjlaSdf'`).  
3. **Example Updated Lines:**

```javascript
const AUTH_TOKEN_NAME = 'dealerName_token';
const AUTH_TOKEN_VALUE = 'asdFweF234Asdfhg234kjlaSdf';
```

4.   
   **Configure Sales Rep Assignment:** In the `payload` section of the `sendToWebhook` function, you will see fields related to assigning the lead to a sales representative. You need to **choose ONE** of the following methods for lead assignment. The other methods should remain commented out (`//` at the beginning of the line).  
   * **Option A: Using Sales Rep Pin (Recommended Default)**  
     * Locate the line:

```javascript
SalesRepPin: "MBPS", // Enter the CPMS SalesRepPin of the user you want new leads assgined to
```

     * Replace `"MBPS"` with the actual CPMS Sales Rep Pin provided for your assignment (e.g., `"1B2C"`).  
     * Ensure the `AssignToSalesRepUserID` and `AssignToSalesRepEmail` lines directly below this are **commented out** (they should start with `//`).  
   * **Example (Option A):**

```javascript
SalesRepPin: "1B2C", // Enter the CPMS SalesRepPin of the user you want new leads assgined to
// AssignToSalesRepUserID: "5877708000011780014", // Enter the Zoho UserID of the user you want new leads assgined to. Email dltrlzohodev@telus.com if you do not know your 19 digit Zoho user ID number
// AssignToSalesRepEmail: "example@email.com", // Enter the email address of the user you want new leads assigned to
```

   * **Option B: Using Zoho User ID (Alternative)**  
     * Locate the line:

```javascript
AssignToSalesRepUserID: "5877708000011780014", // Enter the Zoho UserID of the user you want new leads assgined to. Email dltrlzohodev@telus.com if you do not know your 19 digit Zoho user ID number
```

     * **Uncomment** this line by removing the `//` at the beginning.  
     * Replace `"5877708000011780014"` with the 19-digit Zoho User ID of the sales rep you want to assign leads to. (If you don't know this, email `dltrlzohodev@telus.com`).  
     * Ensure the `SalesRepPin` and `AssignToSalesRepEmail` lines are **commented out**.  
   * **Example (Option B):**

```javascript
// SalesRepPin: "MBPS", // Commented out
AssignToSalesRepUserID: "1234567890123456789", // Enter the Zoho UserID of the user you want new leads assgined to.
// AssignToSalesRepEmail: "example@email.com", // Commented out
```

   * **Option C: Using Sales Rep Email (Alternative)**  
     * Locate the line:

```javascript
AssignToSalesRepEmail: "example@email.com", // Enter the email address of the user you want new leads assigned to
```

     * **Uncomment** this line by removing the `//` at the beginning.  
     * Replace `"example@email.com"` with the email address of the sales rep you want to assign leads to.  
     * Ensure the `SalesRepPin` and `AssignToSalesRepUserID` lines are **commented out**.  
   * **Example (Option C):**

```javascript
// SalesRepPin: "MBPS", // Commented out
// AssignToSalesRepUserID: "5877708000011780014", // Commented out
AssignToSalesRepEmail: "salesrep@yourdomain.com", // Enter the email address of the user you want new leads assigned to
```

5. **Save Changes:** Click the `Save project` icon again.

## **Step 4: Create the `onEdit` Trigger**

This step will set up the automatic sending of data when a new row is added or an existing row is edited in your spreadsheet.

1. **Open** `createTrigger.gs`**:** In the Apps Script editor, open the `createTrigger.gs` file.  
2. **Run `createTrigger` Function:**  
   * In the toolbar, next to the "Run" button, there's a dropdown menu (it might say `(no function selected)` or `createTrigger`). Select `createTrigger` from this dropdown.  
   * Click the `Run` button (looks like a play icon).  
3. **Review Permissions (First Run Only):**  
   * The first time you run a script that accesses Google services (like SpreadsheetApp, UrlFetchApp, Session), you will be prompted to authorize it.  
   * Click `Review permissions`.  
   * Select your Google account.  
   * Click `Allow` to grant the necessary permissions.  
4. **Confirm Trigger Creation:**  
   * After the script runs, go to `Executions` (the clock icon on the left sidebar) to see if the `createTrigger` function executed successfully. You should see a "Completed" status.  
   * You can also click the `Triggers` icon (looks like an alarm clock) on the left sidebar. You should see a trigger listed for the `sendToWebhook` function, with the Event Type set to `On edit`.  
5. **Important:** This `createTrigger` function is designed to *delete any existing* `sendToWebhook` triggers before creating a new one. This ensures you only have one active trigger. You only need to run `createTrigger()` once.

## **Step 5: Test the Webhook Integration**

1. **Go to Your Google Spreadsheet:** Open the Google Sheet where you imported the template.  
2. **Add a New Row of Data:** In the spreadsheet, go to the last empty row and start entering data. Fill in at least the required fields (First Name, Last Name, Phone, Consent to Contact, Created By Email, Campaign Start Date, Campaign End Date, Campaign Name, Datahub Src).  
3. **Trigger the Webhook:** As you type and move out of the last cell in the row (e.g., by pressing Enter or clicking elsewhere), the `onEdit` trigger will fire, and the `sendToWebhook` function will attempt to send the data to Zoho.  
4. **Check Apps Script Logs for Success/Errors:**  
   * Go back to the Apps Script editor.  
   * Click on `Executions` (the clock icon on the left sidebar).  
   * You should see a recent execution for `sendToWebhook`. Click on it.  
   * Review the `Logs` tab. You should see:  
     * Confirmation that the function started.  
     * The data retrieved from your sheet.  
     * The prepared payload.  
     * The webhook URL and options.  
     * Crucially, a `Webhook response:` line. If successful, you should see Zoho's "success" message. If there's an error, the logs will show the detailed error response from Zoho, helping you troubleshoot further.  
5. **Example of a successful log line:** `Webhook response: {"code":"success","details":{"output":"{\"data\":[{\"code\":\"SUCCESS\"}]}", ... }`  
6. **Verify in Zoho CRM:** Check your Zoho CRM instance to confirm that a new lead has been created with the data you entered in the spreadsheet.

If you encounter any errors in the Apps Script logs, review the messages carefully. They often provide clues on what needs to be adjusted in your spreadsheet data or Zoho configuration.

