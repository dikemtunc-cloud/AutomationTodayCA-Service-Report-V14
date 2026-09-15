AutomationTodayCA Service Report — V14

PACKAGE
- index.html — V14-compatible form structure
- app.js — tested authentication/security baseline plus V14 form UX/data layer
- style.css — tested form styling
- Code.gs — tested V13 backend/security baseline with multi-email support
- atd-logo.png — AutomationTodayCA logo

V14 FORM UX
- Section/progress status: green = complete, yellow = missing optional information, red = missing required information.
- Missing required fields are highlighted yellow while filling the form.
- Section 1 Customer Information is required.
- Section 2 required service date, start time, end time, technician, and service type.
- Section 5 Customer Approval requires customer name and signature.
- Section 6 represents overall final completion.
- Customer email supports multiple addresses with add/remove controls; at least one email is required.
- Customer phone supports multiple numbers with add/remove controls; phone remains optional.
- Start Time and End Time are required and are included in review/PDF data.
- Existing equipment and parts repeaters are preserved.

SECURITY — DO NOT CHANGE
- Google authentication flow is preserved.
- Server-side Google ID token verification is preserved.
- Authorization proof flow is preserved.
- OAuth client ID/security architecture is preserved.
- Private backend configuration remains in Apps Script Script Properties.
- ATD_SECRET remains in Script Properties and is not embedded in the frontend.
- Drive storage and Gmail delivery remain server-side.

DEPLOYMENT
1. Upload the frontend files to the new GitHub repository.
2. Keep the Apps Script Code.gs as supplied.
3. If a new Apps Script deployment URL is created, update DELIVERY_CONFIG.webAppUrl in app.js yourself.
4. Keep Apps Script Script Properties unchanged unless you intentionally rotate/configure them.
