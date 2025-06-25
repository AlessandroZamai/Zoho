# System Patterns: Zoho Webhook Integration

## System Architecture

The Zoho webhook integration follows an end-to-end flow from lead generation to final storage in Zoho CRM:

1. **Partner System (Lead Source)**: The initial source where leads are generated (e.g., social media, Google ads, website contact forms).
2. **Integration Service (Optional)**: Middleware (e.g., Zapier) that may be used to process leads before adding them to Google Sheets.
3. **Google Sheet (Data Repository)**: Structured storage where leads are collected and organized.
4. **Google Apps Script (Processing Logic)**: Contains the business logic for data validation, formatting, and transmission using a custom Zoho webhook.
5. **Zoho CRM (Final Destination)**: The ultimate destination system where leads are stored, managed, and acted upon by sales representatives.

The complete data flow is:
Partner System → [Integration Service] → Google Sheet → Google Apps Script → Zoho CRM

## Key Technical Decisions

1. **Google Apps Script as Integration Layer**:
   - Chosen for its native integration with Google Sheets
   - Low barrier to entry for non-technical users
   - No need for external hosting or infrastructure

2. **Webhook-based Integration**:
   - RESTful API approach for simplicity and reliability
   - JSON payload format for data transmission
   - Synchronous communication pattern for immediate feedback

3. **Trigger-based Automation**:
   - onEdit trigger to detect new rows
   - Automatic execution without manual intervention

4. **Token-based Authentication**:
   - Simple API key authentication for security
   - Partner-specific tokens for access control and tracking

5. **Two-Environment Approach**:
   - Sandbox environment for testing
   - Production environment for live data
   - Identical API structure between environments for seamless transition

## Design Patterns

1. **Event-Driven Pattern**:
   - System responds to events (new row additions) rather than polling
   - Efficient resource usage by only executing when needed

2. **Adapter Pattern**:
   - Google Apps Script acts as an adapter between Google Sheets data model and Zoho CRM API
   - Transforms data from sheet format to the expected JSON payload format

3. **Template Method Pattern**:
   - Standard process flow for all lead submissions
   - Customization points for organization-specific requirements

4. **Observer Pattern**:
   - Sheet changes are observed by the trigger
   - Script executes in response to observed changes

## Component Relationships

1. **Partner System → Integration Service (Optional) → Google Sheet**:
   - Lead data flows from partner systems to Google Sheets
   - May be direct entry or via integration services like Zapier

2. **Google Sheet ↔ Google Apps Script**:
   - Sheet provides data to script via the event object
   - Script reads additional data from the sheet as needed
   - Script writes status information back to the sheet

3. **Google Apps Script → Zoho CRM**:
   - Script sends HTTP POST requests to Zoho webhook
   - Zoho returns response with success/failure and record ID
   - Script processes response to determine outcome
   - Lead is created and assigned in Zoho CRM for sales follow-up

## Critical Implementation Paths

1. **Data Capture Path**:
   - Lead generated in Partner System
   - Data transferred to Google Sheet (directly or via integration service)
   - New row added to Google Sheet
   - onEdit trigger fires
   - sendToWebhook function executes
   - Data is read from the sheet

2. **Data Validation Path**:
   - Required fields are checked
   - Phone number is cleaned
   - Dates are formatted correctly

3. **Data Transmission Path**:
   - JSON payload is constructed
   - HTTP POST request is sent to webhook
   - Response is received and parsed

4. **Feedback Path**:
   - Record ID is extracted from response
   - Sheet is updated with record ID and timestamp
   - Success/failure is logged

5. **Lead Management Path (in Zoho CRM)**:
   - Lead is created in Zoho CRM
   - Lead is assigned to appropriate sales representative
   - Sales representative receives notification
   - Lead is processed according to sales workflow
