# Webhook Documentation

## Purpose
The Zoho webhook is designed to capture lead information and send it to Zoho CRM.

## Approval Process
To access the Zoho webhook please follow the below process:

1. Contact the Book of Business team to request access to the Zoho webhook by submitting a request on the Book of Business Partners page.
2. The Book of Business team will respond to your request and provide next steps.
3. Once approved:
   - You'll receive an email with a link to your organization's testing authentication token ("auth_token_name" and "auth_token_value"). This link will expire after 7 days.
   - Your developers will be granted access to the Zoho Sandbox for testing
4. Use the Sandbox URL to test sending data to Zoho. Once you are satisfied with the results, email **dltrlzohodev@telus.com** and a TELUS developer will validate your test data and provide you with the production webhook url.

## Questions?
- Technical inquiries can be sent to **dltrlzohodev@telus.com**
- Non-technical or program related questions can be sent to **DLR-BOB@telus.com**

## How to Connect

### Option #1: Connect Google Sheets directly with Zoho using Google App Scripts

**Guide:** [Link to guide]

**Templates:**
- Zoho _ Webhook Template + App Script.csv
- Send_to_webhook_script.txt
- create_trigger_script.txt

### Option #2: Connect Zapier with Zoho using a Webhook event type

- **Event type** = POST
- **Sandbox URL:** https://sandbox.zohoapis.com/crm/v7/functions/telus_webhook_to_capture_lead/actions/execute?auth_type=apikey&zapikey=1003.889f987039f9ee27f3c76f676263a8f4.5409f4070de428bf6646fad109b33cc0
- **Payload type** = json
- **Mapping** = You must map your source data fields to the relevant **API Name** listed in the table below.

## API Parameters

| Field Name in CRM UI | API Name | Description | Required? |
| ----- | :---- | :---- | ----- |
| auth_token_name | auth_token_name | Email **dltrlzohodev@telus.com** to receive your organization's token | Yes |
| auth_token_value | auth_token_value |  | Yes |
| First Name | First_Name |  | Yes |
| Last Name | Last_Name |  | Yes |
| Phone | Phone | Must contain 10 digits without symbols or spaces | Yes |
| Consent to Contact Captured | Consent_to_Contact_Captured | Pass "true" for value | Yes |
| Created By Email | Created_By_Email | Individual responsible for data source that TELUS can contact | Yes |
| Campaign Start Date | Campaign_Start_Date | Date format should be yyyy-MM-dd  Ex. 2025-03-13 | Yes |
| Campaign End Date | Campaign_End_Date | Date format should be yyyy-MM-dd  Ex. 2025-03-13 | Yes |
| Quote Source | Datahub_Src | Used to help you identify where this lead originated.  Ex. Website Lead Form or telus.com/contact | Yes |
| Campaign_Name | Campaign_Name |  | Yes |
| Street | Street |  | No |
| City | City |  | No |
| Province | State |  | No |
| Postal Code | Zip_Code | 6-digits can include spaces | No |
| Country | Country |  | No |
| Rate Plan Description | Rate_Plan_Description |  | No |
| Device Model | Phone_Model |  | No |
| Current Provider | Brand |  | No |
| Description | Description | Describe what you want your sales reps to know about this lead.  Ex. "Customer requested a sales callback on telus.com/contact. Callback within 48 hours." | No |
| Note | note | Add note to the lead. To add new line in the note use "\n" | No |
| notify_record_owner | notify_record_owner | Pass boolean "true" to send email notification on lead creation to record owner | No |
| **CORPORATE STORES** |  |  |  |
| AssignToSalesRepUserID | AssignToSalesRepUserID | Zoho CRM User ID, If you don't know how to get it, you can contact zoho admin. You can use this to assign the record directly to the specific user Ex. 5877708000022044043 | Yes - Only pass one of these fields. |
| SalesRepPin | SalesRepPin | You can use this to assign the record directly to the specific user Ex. HX1T |  |
| AssignToSalesRepEmail | AssignToSalesRepEmail | You can use this to assign the record directly to the specific user. The email address must be associated with an active user in Zoho CRM. Ex. sample@telus.com |  |
| ChannelOutletId | ChannelOutletId_Updated | 10 character CPMS value associated with a store (add leading zeros if less than 10 characters long) Ex. 0000612342 |  |
| **DEALERS** |  |  |  |
| AssignToSalesRepUserID | AssignToSalesRepUserID | Zoho CRM User ID, If you don't know how to get it, you can contact zoho admin. You can use this to assign the record directly to the specific user Ex. 5877708000022044043 | Yes - Only pass one of these fields. |
| SalesRepPin | SalesRepPin | You can use this to assign the record directly to the specific user Ex. HX1T |  |
| AssignToSalesRepEmail | AssignToSalesRepEmail | You can use this to assign the record directly to the specific user. The email address must be associated with an active user in Zoho CRM. Ex. sample@telus.com |  |
| **MobileKlinik** |  |  |  |
| AssignToSalesRepUserID | AssignToSalesRepUserID | Zoho CRM User ID, If you don't know how to get it, you can contact zoho admin. You can use this to assign the record directly to the specific user Ex. 5877708000022044043 | Yes - Only pass one of these fields. |
| SalesRepPin | SalesRepPin | You can use this to assign the record directly to the specific user Ex. HX1T |  |
| AssignToSalesRepEmail | AssignToSalesRepEmail | You can use this to assign the record directly to the specific user. The email address must be associated with an active user in Zoho CRM. Ex. sample@telus.com |  |
| ChannelOutletId | ChannelOutletId_Updated | 10 character CPMS value associated with a store (add leading zeros if less than 10 characters long) Ex. 0000612342 |  |

## Request Additional Fields
If you want to pass value to additional fields not outlined above, contact **dltrlzohodev@telus.com**.

## Request Body
The request body should contain the lead information in JSON format.

### Example JSON Payload
Test webhook json body:

```json
{
  "auth_token_name": "example_token",
  "auth_token_value": "exampletoken",
  "AssignToSalesRepUserID": "0123456789",
  "First_Name": "test apple",
  "Last_Name": "Test postman",
  "Phone": "1231231234",
  "Rate_Plan_Description": "$55 Unlimited US/CAN",
  "Phone_Model": "samsung",
  "Consent_to_Contact_Captured": true,
  "Created_By_Email": "example@email.com",
  "Campaign_Start_Date": "2025-03-13",
  "Campaign_End_Date": "2025-03-13",
  "Campaign_Name": "Test campaign",
  "Datahub_Src": "example.com web lead",
  "note": "exmaple note"
}
```

## Implementation Notes
- Ensure the API key is securely stored and not exposed.
- Test the webhook thoroughly with various data inputs.
- Handle potential error responses appropriately.
- Monitor the webhook for performance and reliability.
