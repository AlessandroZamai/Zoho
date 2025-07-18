# **Webhook Documentation**

# **Purpose**

The Zoho webhook is designed to capture lead information and send it to Zoho CRM.

# **Approval Process**

To access the Zoho webhook please follow the below process:

1. Contact the Book of Business team to request access to the Zoho webhook by submitting a request on the Book of Business Partners page.  
   1. The Book of Business team will respond to your request and provide next steps.  
2. Once approved:  
   1. You’ll receive an email with a link to your organization’s testing authentication token (“auth\_token\_name” and “auth\_token\_value”). This link will expire after 7 days.  
   2. Your developers will be granted access to the Zoho Sandbox for testing  
3. Use the Sandbox URL to test sending data to Zoho. Once you are satisfied with the results, email [dltrlzohodev@telus.com](mailto:dltrlzohodev@telus.com) and a TELUS developer will validate your test data and provide you with the production webhook url.

## **Questions?**

* Technical inquiries can be sent to [dltrlzohodev@telus.com](mailto:dltrlzohodev@telus.com)  
* Non-technical or program related questions can be sent to [DLR-BOB@telus.com](mailto:DLR-BOB@telus.com)

# **How to Connect**

## **Option \#1: Connect Google Sheets directly with Zoho using Google App Scripts**

- **Guide:** [Github link](https://github.com/AlessandroZamai/Zoho/blob/main/APP_SCRIPT_GUIDE.md) **/**[Zoho | Google App Script + Google Sheet Webhook Setup Guide (Dealers)](https://docs.google.com/document/d/1kftsY9KZa27xBzZ7189bu1S2Fqd1bVfXec4VHZNlXcs/edit?tab=t.0#heading=h.wir9zfzf3130)  
- **Templates:**   
  - [Webhook Sample Template w/Script](https://docs.google.com/spreadsheets/d/1oeYnSNhvaDGVlSK48T_nllv7_U6oIXymqC2oxL80mYo/edit?gid=0#gid=0)  
  - [Zoho \_ Webhook Template \+ App Script.csv](https://github.com/AlessandroZamai/Zoho/blob/main/Zoho_Webhook_Template_App_Script.csv)  
  - [Send\_to\_webhook\_script.gs](https://github.com/AlessandroZamai/Zoho/blob/main/send_to_webhook_script.gs)  
  - [create\_trigger\_script.gs](https://github.com/AlessandroZamai/Zoho/blob/main/create_trigger_script.gs)

## 

## **Option \#2: Write your own code, or use a no-code platform like Zapier, N8N, or Zoho Flow**

- **Zapier event type \= (Webhook event type connector**  
- **Event type** \= POST  
- **Sandbox URL:** [https://sandbox.zohoapis.com/crm/v7/functions/telus\_webhook\_to\_capture\_lead/actions/execute?auth\_type=apikey\&zapikey=1003.26a3ebba6146ba321bb5690283cdf991.57db655a174cf1acff14b96739abfd3f](https://sandbox.zohoapis.com/crm/v7/functions/telus_webhook_to_capture_lead/actions/execute?auth_type=apikey&zapikey=1003.26a3ebba6146ba321bb5690283cdf991.57db655a174cf1acff14b96739abfd3f)  
- **Payload type** \= json  
- **Mapping \=** You must map your source data fields to the relevant **API Name** listed in the table below.

# **API Parameters**

| Field Name in CRM UI | API Name | Description | Required? |
| ----- | :---- | :---- | ----- |
| auth\_token\_name | auth\_token\_name | Email [dltrlzohodev@telus.com](mailto:dltrlzohodev@telus.com) to receive your organization’s token | Yes |
| auth\_token\_value | auth\_token\_value |  | Yes |
| First Name | First\_Name |  | Yes |
| Last Name | Last\_Name |  | Yes |
| Phone | Phone | Must contain 10 digits without symbols or spaces | Yes |
| Consent to Contact Captured | Consent\_to\_Contact\_Captured | Pass “true” for value | Yes |
| Created By Email | Created\_By\_Email | Individual responsible for data source that TELUS can contact | Yes |
| Campaign Start Date | Campaign\_Start\_Date | Date format should be yyyy-MM-dd  Ex. 2025-03-13 | Yes |
| Campaign End Date | Campaign\_End\_Date | Date format should be yyyy-MM-dd  Ex. 2025-03-13 | Yes |
| Quote Source | Datahub\_Src | Used to help you identify where this lead originated.  Ex. Website Lead Form or [telus.com/contact](http://telus.com/contact) | Yes |
| Campaign\_Name | Campaign\_Name |  | Yes |
| OrgTypeCode | OrgTypeCode | The values would be KI, DL, RT.KI \= CorporateDL \= DealerRT \= Mobile Klinik | Yes |
| Organization\_Code | Organization\_Code | The organization code. For example the for corporate it’s “50080” | Yes |
| Street | Street |  | No |
| City | City |  | No |
| Province | State |  | No |
| Postal Code | Zip\_Code | 6-digits can include spaces | No |
| Country | Country |  | No |
| Rate Plan Description | Rate\_Plan\_Description |  | No |
| Device Model | Phone\_Model |  | No |
| Current Provider | Brand |  | No |
| Description | Description | Describe what you want your sales reps to know about this lead.  Ex. “Customer requested a sales callback on [telus.com/contact](http://telus.com/contact). Callback within 48 hours.” | No |
| Note | note | Add note to the lead. To add new line in the note use “\\n” | No |
| notify\_record\_owner | notify\_record\_owner | Pass boolean “true” to send email notification on lead creation to record owner | No |
| share\_with\_other\_users | share\_with\_other\_users | Pass boolean “true” to share records with other peers. Only for KI and RT. | No |
| notify\_share\_with\_other\_users | notify\_share\_with\_other\_users | Pass boolean “true” to send email notification to all peer with whom the record is shared. | No |
| custom\_email\_notify\_list | custom\_email\_notify\_list | Pass custom email address separated by comma to notify them | No |
| **CORPORATE STORES** |  |  |  |
| AssignToSalesRepUserID | AssignToSalesRepUserID | Zoho CRM User ID, If you don’t know how to get it, you can contact zoho admin. You can use this to assign the record directly to the specific user Ex. 5877708000022044043 |  Yes \- Only pass one of these fields. |
| SalesRepPin | SalesRepPin | You can use this to assign the record directly to the specific user Ex. HX1T |  |
| AssignToSalesRepEmail | AssignToSalesRepEmail | You can use this to assign the record directly to the specific user. The email address must be associated with an active user in Zoho CRM. Ex. sample@telus.com |  |
| ChannelOutletId | ChannelOutletId\_Updated | 10 character CPMS value associated with a store (add leading zeros if less than 10 characters long) Ex. 0000612342 |  |
| OutletId | OutletId |  |  |
| **DEALERS** |  |  |  |
| AssignToSalesRepUserID | AssignToSalesRepUserID | Zoho CRM User ID, If you don’t know how to get it, you can contact zoho admin. You can use this to assign the record directly to the specific user Ex. 5877708000022044043 | Yes \- Only pass one of these fields. |
| SalesRepPin | SalesRepPin | You can use this to assign the record directly to the specific user Ex. HX1T |  |
| AssignToSalesRepEmail | AssignToSalesRepEmail | You can use this to assign the record directly to the specific user. The email address must be associated with an active user in Zoho CRM. Ex. sample@telus.com |  |
| **MobileKlinik** |  |  |  |
| AssignToSalesRepUserID | AssignToSalesRepUserID | Zoho CRM User ID, If you don’t know how to get it, you can contact zoho admin. You can use this to assign the record directly to the specific user Ex. 5877708000022044043 |  Yes \- Only pass one of these fields. |
| SalesRepPin | SalesRepPin | You can use this to assign the record directly to the specific user Ex. HX1T |  |
| AssignToSalesRepEmail | AssignToSalesRepEmail | You can use this to assign the record directly to the specific user. The email address must be associated with an active user in Zoho CRM. Ex. sample@telus.com |  |
| ChannelOutletId | ChannelOutletId\_Updated | 10 character CPMS value associated with a store (add leading zeros if less than 10 characters long) Ex. 0000612342 |  |

## **Request Additional Fields**

If you want to pass value to additional fields not outlined above, contact [dltrlzohodev@telus.com](mailto:dltrlzohodev@telus.com).

## **Request Body**

The request body should contain the lead information in JSON format.

### **Example JSON Payload**

```
Test webhook json body:
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
"Datahub_Src": "example.com web lead",
"note": “exmaple note”
}
```

# **Implementation Notes**

* Ensure the API key is securely stored and not exposed.  
* Test the webhook thoroughly with various data inputs.  
* Handle potential error responses appropriately.  
* Monitor the webhook for performance and reliability.

