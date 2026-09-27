# RSVP backend (Google Sheets)

Guest answers are saved as rows in a Google Sheet by a small Google Apps Script web app.

## Setup (about 5 minutes)

1. Create a new Google Sheet, e.g. "30 års – svar".
2. Open **Extensions → Apps Script**, delete the default code and paste in the contents of `rsvp.gs`. Save.
3. Click **Deploy → New deployment**, choose type **Web app** and set:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy**, approve the permissions, and copy the **Web app URL** (it ends in `/exec`).
5. Paste the URL into `rsvpEndpoint` in `src/app/invitation.config.ts`, commit and push.

The sheet "Svar" and its header row are created automatically on the first answer.

## Check it works

```bash
curl -L -H 'Content-Type: text/plain' \
  -d '{"name":"Test","attending":true,"count":1,"message":"Test"}' \
  "https://script.google.com/macros/s/XXXX/exec"
```

Expected output: `{"ok":true}`, plus a new row in the sheet. Delete the test row afterwards.

## Updating the script

After editing the code, use **Deploy → Manage deployments → Edit → Version: New version**. This keeps the same URL.
Creating a *new deployment* instead gives a new URL, which you would then have to update in the config.

## Reading the answers

Each guest has one row. Names must be a first and last name, and a name that is already on the list
(ignoring case and extra spaces) is refused; the site then offers the guest **"Opdater mit svar"**, which
replaces their existing row and refreshes its **Tidspunkt**.

## Testing the script

```bash
node --test apps-script/rsvp.test.mjs
```

Runs the script against an in-memory sheet (also run in CI).
The total head count is `=SUMIF(C:C;"Ja";D:D)`.
