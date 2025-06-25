# Product Context: Zoho Webhook Integration

## Why This Project Exists

This project exists to bridge the gap between Google Sheets (a common data collection tool) and Zoho CRM (TELUS's customer relationship management system). It provides TELUS partners, dealers, and corporate stores with a straightforward method to capture and transmit lead information to Zoho CRM without requiring advanced technical knowledge.

## Problems It Solves

1. **Data Silos**: Eliminates the disconnect between lead data collected in Google Sheets and the CRM system.
2. **Manual Data Entry**: Removes the need for manual data entry into Zoho CRM, reducing errors and saving time.
3. **Technical Barriers**: Provides a low-code solution that doesn't require partners to have development expertise.
4. **Standardization**: Ensures consistent data formatting and required field validation across different partners.
5. **Lead Attribution**: Maintains proper tracking of lead sources, campaigns, and responsible sales representatives.
6. **Process Efficiency**: Streamlines the lead capture process for TELUS's Book of Business program.

## How It Should Work

1. **Setup Phase**:
   - Partners request access to the Zoho webhook through the Book of Business team.
   - Upon approval, partners receive authentication tokens for testing in a Zoho CRM sandbox environment.
   - Partners set up a Google Sheet using the provided template.
   - Partners add the Google Apps Scripts to their sheet and configure with their authentication tokens.
   - Once testing is completed, Partners request the Book of Business team validate their data. 
   - Once data is validated Book of Business team provides Partner with the Production webhook url and steps to update their script to the Zoho CRM production environment.

2. **Operation Phase**:
   - When a new lead is added to the Google Sheet (new row), the script automatically triggers.
   - The script validates the data, formats it according to Zoho CRM requirements, and sends it to the webhook.
   - Upon successful transmission, the script updates the sheet with a record ID and timestamp.
   - The lead appears in Zoho CRM assigned to the appropriate sales representative.

3. **Maintenance Phase**:
   - Partners can monitor successful/failed transmissions via the record ID column.
   - Technical support is available via email for troubleshooting.
   - Partners can request additional field mappings if needed.

## User Experience Goals

1. **Simplicity**: Partners should be able to set up and use the integration with minimal technical knowledge.
2. **Reliability**: The integration should consistently and accurately transmit lead data.
3. **Transparency**: Partners should receive clear feedback on successful/failed transmissions.
4. **Flexibility**: The integration should accommodate different organization types and lead assignment methods.
5. **Support**: Clear documentation and support channels should be available for partners.

## Key Stakeholders

1. **TELUS Partners**: Dealers, corporate stores, and Mobile Klinik locations who need to capture and transmit leads.
2. **Book of Business Team**: Manages partner access to the webhook.
3. **Sales Representatives**: Receive and act on leads in Zoho CRM.
4. **TELUS Developers**: Maintain the webhook and provide technical support.
