# Google Form Setup Guide

## Where to Find Question Titles

The **question titles** are the text that appears at the top of each form field. These must **exactly match** the values in `FORM_FIELD_MAPPING` for the script to work correctly.

## Visual Guide

### In Google Forms Editor

1. **Open your Google Form** in edit mode
2. Each question has a **title field** at the top - this is what you need to match

```
┌─────────────────────────────────────────┐
│ First Name                        [✓]   │  ← This is the Question Title
│ ─────────────────────────────────────── │
│ Short answer text                       │
└─────────────────────────────────────────┘
```

### Example Form Question

When you click on a question in the form editor, you'll see:

```
┌─────────────────────────────────────────────────┐
│ First Name                              [✓]     │  ← Question Title (must match exactly)
│ ───────────────────────────────────────────────│
│ Short answer text                               │
│                                                  │
│ [ ] Required                                    │  ← Check this for required fields
└─────────────────────────────────────────────────┘
```

## Required Question Titles (Must Match Exactly)

Copy and paste these **exact titles** into your Google Form questions:

### Required Fields ✅

1. **Question Title**: `First Name`
   - Type: Short answer
   - Required: ✓ Yes

2. **Question Title**: `Last Name`
   - Type: Short answer
   - Required: ✓ Yes

3. **Question Title**: `Phone Number`
   - Type: Short answer
   - Required: ✓ Yes

4. **Question Title**: `Email`
   - Type: Short answer
   - Required: ✓ Yes
   - Validation: Email address (recommended)

5. **Question Title**: `Province`
   - Type: Multiple choice OR Dropdown
   - Required: ✓ Yes
   - Options: AB, BC, MB, NB, NL, NS, NT, NU, ON, PE, QC, SK, YT

### Optional Fields

6. **Question Title**: `Postal Code`
   - Type: Short answer
   - Required: No

7. **Question Title**: `Language Preference`
   - Type: Multiple choice OR Dropdown
   - Required: No
   - Options: English, French

8. **Question Title**: `Are you an existing TELUS customer?`
   - Type: Multiple choice
   - Required: No
   - Options: Yes, No

9. **Question Title**: `Company`
   - Type: Short answer
   - Required: No

10. **Question Title**: `Additional details`
    - Type: Paragraph
    - Required: No

## Step-by-Step: Creating a Form Question

### 1. Add a New Question
- Click the **+** button on the right side of the form
- Or click on an existing question to edit it

### 2. Set the Question Title
- Click in the **top text field** (where it says "Untitled Question")
- Type or paste the **exact title** from the list above
- Example: `First Name` (case-sensitive, spacing matters)

### 3. Choose Question Type
- Click the dropdown on the right (default is "Multiple choice")
- Select the appropriate type:
  - **Short answer**: For text fields (First Name, Last Name, Phone, Email, etc.)
  - **Paragraph**: For longer text (Additional details)
  - **Multiple choice** or **Dropdown**: For Province, Language Preference

### 4. Mark as Required (if needed)
- Toggle the **Required** switch at the bottom of the question
- Required fields: First Name, Last Name, Phone Number, Email, Province

### 5. Add Validation (Optional but Recommended)
For the **Email** question:
- Click the **⋮** (three dots) at the bottom right
- Select **Response validation**
- Choose **Text** → **Email**
- This ensures users enter valid email addresses

## Quick Setup Checklist

Use this checklist when setting up your form:

- [ ] Question 1: `First Name` (Short answer, Required)
- [ ] Question 2: `Last Name` (Short answer, Required)
- [ ] Question 3: `Phone Number` (Short answer, Required)
- [ ] Question 4: `Email` (Short answer, Required, Email validation)
- [ ] Question 5: `Province` (Dropdown, Required, with all province options)
- [ ] Question 6: `Postal Code` (Short answer, Optional)
- [ ] Question 7: `Language Preference` (Multiple choice, Optional, English/French)
- [ ] Question 8: `Are you an existing TELUS customer?` (Multiple choice, Optional, Yes/No)
- [ ] Question 9: `Company` (Short answer, Optional)
- [ ] Question 10: `Additional details` (Paragraph, Optional)

## Common Mistakes to Avoid

❌ **Wrong**: `First name` (lowercase 'n')
✅ **Correct**: `First Name` (capital 'N')

❌ **Wrong**: `Phone` (missing "Number")
✅ **Correct**: `Phone Number`

❌ **Wrong**: `Are you an existing TELUS customer` (missing '?')
✅ **Correct**: `Are you an existing TELUS customer?`

❌ **Wrong**: `Additional Details` (capital 'D')
✅ **Correct**: `Additional details` (lowercase 'd')

## How the Script Matches Questions

The script uses this mapping (from `FormConfig.gs`):

```javascript
const FORM_FIELD_MAPPING = {
  'First Name': 'firstName',              // ← Must match exactly
  'Last Name': 'lastName',
  'Phone Number': 'phone',
  'Email': 'email',
  'Province': 'province',
  'Postal Code': 'postalCode',
  'Language Preference': 'languagePreference',
  'Are you an existing TELUS customer?': 'newCustomer',
  'Company': 'company',
  'Additional details': 'additionalDetails'
};
```

When a form is submitted:
1. Script reads each question title
2. Looks up the title in `FORM_FIELD_MAPPING`
3. If found, extracts the answer
4. If not found, logs a warning and skips that field

## Testing Your Form Setup

### Method 1: Check in Form Editor
1. Open your form in edit mode
2. Verify each question title matches the list above **exactly**
3. Check that required fields have the "Required" toggle enabled

### Method 2: Submit a Test Response
1. Fill out and submit your form
2. Check the Apps Script execution log (`clasp logs`)
3. Look for warnings like: `Warning: Unmapped form question: [question title]`
4. If you see warnings, fix the question title in your form

### Method 3: Use the Test Function
1. In Apps Script editor, run `testConfiguration`
2. This verifies the script configuration (but not form questions)
3. Then submit a real test form to verify question mapping

## Need to Change a Question Title?

If you need to use different question titles:

1. Open `FormWebhook/FormConfig.gs`
2. Find the `FORM_FIELD_MAPPING` object
3. Update the left side (question title) to match your form
4. Keep the right side (field name) unchanged
5. Push changes: `clasp push`

Example:
```javascript
// Change this:
'First Name': 'firstName',

// To this (if your form uses "First name"):
'First name': 'firstName',
```

## Visual Example: Complete Form

Here's what your form should look like in the editor:

```
┌─────────────────────────────────────────────────┐
│ EPP Callback Request Form                       │
├─────────────────────────────────────────────────┤
│                                                  │
│ First Name                              [✓]     │
│ ───────────────────────────────────────────────│
│ Short answer text                               │
│ [✓] Required                                    │
│                                                  │
│ Last Name                               [✓]     │
│ ───────────────────────────────────────────────│
│ Short answer text                               │
│ [✓] Required                                    │
│                                                  │
│ Phone Number                            [✓]     │
│ ───────────────────────────────────────────────│
│ Short answer text                               │
│ [✓] Required                                    │
│                                                  │
│ Email                                   [✓]     │
│ ───────────────────────────────────────────────│
│ Short answer text                               │
│ [✓] Required                                    │
│ Response validation: Email address              │
│                                                  │
│ Province                                [✓]     │
│ ───────────────────────────────────────────────│
│ Dropdown                                        │
│ [✓] Required                                    │
│ Options: AB, BC, MB, NB, NL, NS, NT, NU,       │
│          ON, PE, QC, SK, YT                     │
│                                                  │
│ Postal Code                             [✓]     │
│ ───────────────────────────────────────────────│
│ Short answer text                               │
│ [ ] Required                                    │
│                                                  │
│ Language Preference                     [✓]     │
│ ───────────────────────────────────────────────│
│ Multiple choice                                 │
│ [ ] Required                                    │
│ ○ English                                       │
│ ○ French                                        │
│                                                  │
│ Are you an existing TELUS customer?     [✓]     │
│ ───────────────────────────────────────────────│
│ Multiple choice                                 │
│ [ ] Required                                    │
│ ○ Yes                                           │
│ ○ No                                            │
│                                                  │
│ Company                                 [✓]     │
│ ───────────────────────────────────────────────│
│ Short answer text                               │
│ [ ] Required                                    │
│                                                  │
│ Additional details                      [✓]     │
│ ───────────────────────────────────────────────│
│ Paragraph                                       │
│ [ ] Required                                    │
│                                                  │
└─────────────────────────────────────────────────┘
```

## Support

If you're still having trouble:
1. Check the execution logs: `clasp logs`
2. Look for "Warning: Unmapped form question" messages
3. Compare your form question titles to the exact list above
4. Contact: alessandro.zamai@telus.com
