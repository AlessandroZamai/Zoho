**testing
**

**Webhook Documentation
**

# **Purpose
**
The Zoho webhook is designed to capture lead information and send it to Zoho CRM.

# **Approval Process
**
To access the Zoho webhook please follow the below process:

Contact the Book of Business team to request access to the Zoho webhook by submitting a request on the Book of Business Partners page.

The Book of Business team will respond to your request and provide next steps.

Once approved:

You’ll receive an email with a link to your organization’s testing authentication token (“auth_token_name” and “auth_token_value”). This link will expire after 7 days.

Your developers will be granted access to the Zoho Sandbox for testing

Use the Sandbox URL to test sending data to Zoho. Once you are satisfied with the results, email __dltrlzohodev@telus.com__ and a TELUS developer will validate your test data and provide you with the production webhook url.

**Questions?
**

Technical inquiries can be sent to __dltrlzohodev@telus.com__

Non-technical or program related questions can be sent to __DLR-BOB@telus.com__

**How to Connect
**

**Option #1: **Connect Google Sheets directly with Zoho using Google App Scripts

**Guide: **

**Templates: 
**

__Zoho _ Webhook Template + App Script.csv__

__Send_to_webhook_script.txt__

__create_trigger_script.txt__

**Option #2: **Connect Zapier with Zoho using a Webhook event type**
**

**Event type** = POST

**Sandbox URL: **https://sandbox.zohoapis.com/crm/v7/functions/telus_webhook_to_capture_lead/actions/execut e?auth_type=apikey&zapikey=1003.889f987039f9ee27f3c76f676263a8f4.5409f4070de428bf66 46fad109b33cc0

**Payload type **= json

**Mapping = **You must map your source data fields to the relevant **API Name **listed in the table below.

# **API Parameters****
**
## **Request Additional Fields
**
If you want to pass value to additional fields not outlined above, contact __dltrlzohodev@telus.com__.

## **Request Body
**
The request body should contain the lead information in JSON format.

### **Example JSON Payload
**
Test webhook json body:

{

"auth_token_name": "example_token",

"auth_token_value": "exampletoken",

"AssignToSalesRepUserID": "0123456789",

"First_Name":"test apple",

"Last_Name":"Test postman",

"Phone":"1231231234",

"Rate_Plan_Description": "$55 Unlimited US/CAN",

"Phone_Model": "samsung",

"Consent_to_Contact_Captured": true,

"Created_By_Email": "example@email.com",

"Campaign_Start_Date": "2025-03-13",

"Campaign_End_Date": "2025-03-13",

"Campaign_Name": "Test campaign",

"Datahub_Src": "__example.com__ web lead",

"note": “exmaple note”

}

# **Implementation Notes
**
Ensure the API key is securely stored and not exposed.

Test the webhook thoroughly with various data inputs.

Handle potential error responses appropriately.

Monitor the webhook for performance and reliability.

