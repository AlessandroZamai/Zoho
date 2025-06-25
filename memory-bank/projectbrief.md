# Project Brief: Zoho Webhook Integration

## Overview
This project implements a webhook integration between Google Sheets and Zoho CRM, designed to capture lead information and send it to Zoho CRM. The integration uses Google Apps Script to automate the process of sending lead data from a Google Sheet to Zoho CRM when new rows are added to the sheet.

## Core Requirements

1. **Data Capture**: Capture lead information from Google Sheets.
2. **Data Transmission**: Send lead data to Zoho CRM via webhook.
3. **Automation**: Automatically trigger data transmission when new rows are added to the Google Sheet.
4. **Validation**: Ensure data is properly formatted and required fields are present.
5. **Feedback**: Provide feedback on successful/failed transmissions.
6. **Security**: Secure authentication using tokens.

## Goals

1. Streamline lead capture process for TELUS partners.
2. Ensure data integrity between Google Sheets and Zoho CRM.
3. Provide a simple, user-friendly solution for non-technical users.
4. Maintain secure data transmission.
5. Support different organization types (Corporate, Dealer, Mobile Klinik).

## Scope

### In Scope
- Google Apps Script integration with Zoho CRM
- Lead data capture and transmission
- Basic data validation
- Success/failure logging
- Record ID tracking for processed leads

### Out of Scope
- Custom field mapping beyond documented API parameters
- Advanced data validation
- User interface development
- Data analytics or reporting
