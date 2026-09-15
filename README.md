# AutomationTodayCA Service Report — V14

## Package
- `index.html` — frontend form
- `app.js` — frontend logic, Google authentication lock, form UX, PDF and delivery
- `style.css` — frontend styling
- `atd-logo.png` — company logo
- `Code.gs` — Google Apps Script backend

## V14 changes
- Multiple customer email fields: Add / Remove as needed; at least one valid email is required.
- Multiple customer phone fields: Add / Remove as needed; optional.
- Required Start Time and End Time fields.
- Required fields are highlighted yellow while incomplete so they are easy to find.
- Section/progress indicators show: red = missing required information, yellow = missing optional information, green = complete.
- Customer emails are sent to all valid entered customer email addresses plus the company email configured in Apps Script.
- Start/end time and multiple contacts are included in the review and customer PDF.

## Security
The Google authentication/security block from the supplied working baseline was preserved unchanged. The Google Client ID and server authorization flow were not modified.

`ATD_SECRET`, `ALLOWED_GOOGLE_EMAIL`, `COMPANY_EMAIL`, and other private server properties remain in Apps Script Script Properties. Do not place secrets in GitHub/frontend files.

## Deployment
1. Upload the frontend files to the V14 GitHub Pages repository.
2. Update `DELIVERY_CONFIG.webAppUrl` in `app.js` with the newly deployed Apps Script `/exec` URL.
3. Deploy/update the Apps Script backend using `Code.gs`.
4. Keep Apps Script configured to execute as the authorized account and allow the web app to receive requests as required by the existing deployment.
5. Test both an authorized Google account and an unauthorized Google account before production use.

## Important
The Apps Script URL in `app.js` is intentionally left as the existing placeholder/current baseline URL. Replace it with the new deployment URL before testing the new V14 frontend.
