# **Enhanced Organization-Specific Zoho Integration Setup Guide**

This guide explains how to set up and use the enhanced Zoho webhook integration that supports organization-specific configurations, multiple processing modes, and advanced lead assignment strategies.

## **What's New**

The integration now supports:

### **Processing Modes**
1. **Automated Processing**: Data is automatically sent to Zoho when you edit any cell
2. **Manual Processing**: Data is sent only when you click a button, with detailed progress tracking and error reporting

### **Organization Types**
1. **Corporate Store (KI)**: TELUS corporate-owned stores with predefined integration settings
2. **Dealership (DL)**: Independent dealer partners who manage their own integration credentials
3. **Mobile Klinik (RT)**: Mobile Klinik locations with predefined integration settings

### **Lead Assignment Strategies**
1. **Equal Distribution**: Distribute leads equally among store employees using Channel Outlet ID
2. **Manual Assignment**: Assign leads to specific sales representatives using email addresses
3. **Dealer Admin**: Automatically assign all leads to the dealer administrator

## **Initial Setup**

### **Step 1: Import Files to Google Apps Script**

1. Open your Google Spreadsheet
2. Go to `Extensions > Apps Script`
3. Import all the following files:
   - `send_to_webhook_script.gs` (updated)
   - `create_trigger_script.gs` (updated)
   - `setup_wizard.gs` (enhanced)
   - `setup_wizard_ui.html` (enhanced)
   - `manual_processing.gs` (enhanced)
   - `progress_dialog_ui.html` (unchanged)
   - `date_confirmation_dialog.html` (new)

### **Step 2: Configure Predefined Credentials (Admin Only)**

**For Corporate Store and Mobile Klinik organizations**, administrators need to set up predefined credentials in script properties:

1. In Apps Script, go to `Project Settings` > `Script Properties`
2. Add the following properties:
   - `AUTH_TOKEN_NAME_KI`: Corporate Store token name
   - `AUTH_TOKEN_VALUE_KI`: Corporate Store token value
   - `AUTH_TOKEN_NAME_RT`: Mobile Klinik token name
   - `AUTH_TOKEN_VALUE_RT`: Mobile Klinik token value

**Note**: Dealership users will enter their own credentials during setup.

### **Step 3: Run the Enhanced Setup Wizard**

1. In the Apps Script editor, select `showSetupWizard` from the function dropdown
2. Click the `Run` button
3. Grant necessary permissions when prompted
4. Follow the multi-step wizard:
   - **Step 1**: Choose your processing mode (Automated or Manual)
   - **Step 2**: Select your organization type
   - **Step 3**: Enter credentials (Dealership only)
   - **Step 4**: Configure campaign dates
   - **Step 5**: Choose lead assignment strategy

## **Organization-Specific Setup**

### **Corporate Store (KI) Configuration**
- **Organization Code**: 50080 (automatic)
- **Credentials**: Predefined and secure (automatic)
- **Lead Assignment Options**:
  - Equal distribution to store employees
  - Manual assignment to specific sales reps
- **Required Field**: Channel Outlet ID (exactly 11 digits) for equal distribution

### **Dealership (DL) Configuration**
- **Organization Code**: User-provided during setup
- **Credentials**: User enters their own token name and value
- **Lead Assignment Options**:
  - Automatic assignment to dealer admin
  - Manual assignment to specific sales reps
- **Flexibility**: Full control over credentials and assignment

### **Mobile Klinik (RT) Configuration**
- **Organization Code**: 6675 (automatic)
- **Credentials**: Predefined and secure (automatic)
- **Lead Assignment Options**:
  - Equal distribution to store employees
  - Manual assignment to specific sales reps
- **Required Field**: Channel Outlet ID (exactly 11 digits) for equal distribution

## **Using Automated Processing Mode**

### **How It Works**
- Data is automatically sent to Zoho when you edit any cell in a row
- Uses organization-specific configuration and campaign dates
- Processes assignment fields based on your configuration
- No user interface - processing happens in the background
- Check the Apps Script logs for success/error information

### **Best For**
- Automated data imports
- Workflows where data is added programmatically
- Users who want "set it and forget it" functionality

### **Key Features**
- **Real-time Processing**: Each edit triggers immediate data submission
- **Automatic Validation**: Ensures data integrity before sending
- **Configurable Columns**: Automatically respects enabled/disabled columns based on assignment strategy
- **Error Logging**: Detailed logs for troubleshooting

## **Using Manual Processing Mode**

### **How It Works**
- A "Send to Zoho" menu appears in your Google Sheet
- Click "Send unsubmitted rows to Zoho" to process data
- Date confirmation dialog appears if processing on a different date
- A progress dialog shows real-time status updates
- The dialog remains open until you close it manually

### **Enhanced Features**
- **Date Confirmation**: Prompts to confirm or update campaign dates
- **Batch Processing**: Processes all unsubmitted rows at once
- **Organization-Specific Validation**: Validates required fields based on your setup
- **Assignment Field Validation**: Ensures Channel Outlet IDs and emails are correct
- **Progress Tracking**: Shows current row being processed
- **Detailed Error Reporting**: Specific validation errors and correction instructions
- **Success Confirmation**: Links to created Zoho records
- **Export Log**: Copy processing results to clipboard
- **Persistent Dialog**: Stays open so you can review all results

### **Best For**
- Manual data entry
- Users who want to review results before closing
- Situations requiring detailed error reporting
- Batch processing of multiple rows
- Time-sensitive campaigns requiring date confirmation

## **Menu Options (Manual Processing Mode Only)**

When in manual processing mode, you'll see a "Send to Zoho" menu with:

- **Send unsubmitted rows to Zoho**: Processes all rows without Record IDs
- **Change settings**: Opens the setup wizard to reconfigure your integration

## **Enhanced Data Validation**

The system includes comprehensive validation based on your organization configuration:

### **Required Fields (All Organizations)**
- First Name
- Last Name
- Phone (must be at least 10 digits)
- Email (basic format validation)
- Datahub_Src
- Campaign_Name

### **Organization-Specific Required Fields**

**Equal Distribution Mode (Corporate Store/Mobile Klinik)**:
- Channel Outlet ID (must be exactly 11 digits)

**Manual Assignment Mode (All Organizations)**:
- Sales Rep Email (valid email format required)

**Dealer Admin Mode (Dealership)**:
- No additional fields required

### **Optional Field Warnings**
- Language Preference
- Street address
- City

### **Enhanced Error Handling**
- Organization-specific validation messages
- Assignment strategy validation
- Clear error messages for each validation issue
- Specific instructions for fixing problems
- Field-level validation with correction guidance

## **Reconfiguring Your Integration**

You can change any configuration at any time:

1. Run the `showSetupWizard` function in Apps Script, OR
2. Use the "Change settings" option in the "Send to Zoho" menu (manual processing mode only)
3. Update any settings:
   - Processing mode (Automated or Manual)
   - Organization type (if needed)
   - Credentials (Dealership only)
   - Campaign dates
   - Lead assignment strategy
4. The system will automatically update configuration and spreadsheet formatting

## **Enhanced Progress Dialog Features (Manual Processing Mode)**

### **Date Confirmation Modal**
- Appears when processing on a different date than configured
- Shows current vs configured campaign dates
- Allows inline date updates with calendar pickers
- Options to continue with current dates or update

### **Real-Time Processing Updates**
- Current processing status with organization context
- Progress bar showing completion percentage
- Row-by-row results as they're processed
- Assignment field validation results

### **Enhanced Result Display**
- ✅ **Success**: Green indicators with direct links to Zoho records
- ❌ **Errors**: Red indicators with organization-specific error messages
- ⚠️ **Warnings**: Yellow indicators for optional field issues
- 📋 **Assignment Info**: Shows which assignment method was used

### **Comprehensive Summary Statistics**
- Total rows processed
- Number of successful submissions
- Number of failed submissions
- Number of warnings
- Assignment method breakdown

### **Advanced Export Functionality**
- Copy detailed results to clipboard
- Includes organization and assignment information
- Shows validation details for each row
- Formatted for easy sharing or record-keeping

## **Troubleshooting**

### **Common Issues**

1. **"Manual Processing Not Available"**
   - You're in automated processing mode
   - Run the setup wizard to switch to manual processing mode

2. **"Configuration Incomplete"**
   - Run the setup wizard to complete configuration
   - For Corporate Store/Mobile Klinik: Contact admin if predefined credentials are missing
   - For Dealership: Ensure all credential fields are filled

3. **"Predefined credentials not found"**
   - Corporate Store/Mobile Klinik only
   - Contact your administrator to set up AUTH_TOKEN_NAME_KI/RT and AUTH_TOKEN_VALUE_KI/RT

4. **Assignment Field Validation Errors**
   - **Channel Outlet ID**: Must be exactly 11 digits
   - **Sales Rep Email**: Must be valid email format
   - Check your lead assignment configuration

5. **Date Confirmation Issues**
   - Update campaign dates if processing on different dates
   - Ensure end date is after start date

6. **Column Formatting Issues**
   - Disabled columns appear grayed out - this is normal
   - Only enter data in enabled columns based on your assignment strategy

7. **No Menu Visible**
   - You might be in automated processing mode
   - Refresh the spreadsheet or run the setup wizard

8. **Data Not Sending in Automated Mode**
   - Check if you're editing enabled columns
   - Verify that your changes are triggering the onEdit event
   - Review Apps Script logs for any error messages

9. **Processing Mode Mismatch**
   - If automated processing isn't working, confirm your processing mode setting
   - Run the setup wizard to change processing mode if needed

### **Organization-Specific Troubleshooting**

**Corporate Store (KI)**:
- Ensure Channel Outlet ID is 11 digits for equal distribution
- Contact admin if predefined credentials are not working

**Dealership (DL)**:
- Verify your organization code is correct
- Check that your auth tokens are valid
- For dealer admin mode, no assignment fields are needed

**Mobile Klinik (RT)**:
- Ensure Channel Outlet ID is 11 digits for equal distribution
- Contact admin if predefined credentials are not working

### **Getting Help**

- Check the Apps Script execution logs for detailed error information
- Use the export log feature in the progress dialog to share results
- Include your organization type when contacting support
- Contact your technical support team with specific error messages

## **Backward Compatibility**

- Existing `createTrigger()` function is now mapped to set up automated processing mode
- Old automated behavior is preserved when using the original function
- All existing spreadsheets will continue to work without modification
- Legacy configurations are automatically detected and supported in the new system

## **Best Practices**

### **For Automated Processing Mode**
- Test thoroughly before deploying to production
- Monitor Apps Script logs regularly
- Ensure data quality before it reaches the spreadsheet
- Set up error notifications to catch issues quickly

### **For Manual Processing Mode**
- Review the progress dialog results before closing
- Use the export log feature to keep records of processing
- Fix validation errors promptly for better data quality
- Process data in reasonable batch sizes (recommended: under 50 rows at once)
- Regularly check for and process unsubmitted rows

### **General Best Practices**
- Regularly review and update your campaign dates
- Keep your organization-specific settings up to date
- Train users on the correct use of enabled columns based on your lead assignment strategy
- Periodically run the setup wizard to ensure your configuration is current

## **Technical Notes**

- Manual processing includes a 500ms delay between rows to prevent API rate limiting
- The progress dialog uses Google Apps Script's HtmlService for the user interface
- Configuration is stored using PropertiesService for persistence
- Both processing modes use the same underlying webhook API and data validation
- Automated processing uses Google Apps Script's onEdit trigger
- The system dynamically enables/disables columns based on the lead assignment strategy
- Error handling and logging are consistent across both processing modes
