# FL UAS MEDNET Privacy and Data-Use Policy

Static landing page presenting the FL UAS MEDNET Working Group's Privacy and Data-Use Policy.

## Deploy to Vercel

This is a plain static site (`index.html` + `styles.css`), no build step required.

1. Install the Vercel CLI: `npm i -g vercel`
2. From this directory, run: `vercel --prod`
3. Or connect this GitHub repo in the Vercel dashboard and import it as a project (Framework Preset: "Other").

`vercel.json` sets security headers (CSP, HSTS, X-Frame-Options, etc.) for the deployment.

## Acknowledgment form → Google Sheet

The page includes a name / agree-checkbox form at the bottom (no date field — the date and
time are recorded automatically by the server). On submit, it POSTs to the serverless function
in `api/submit.js`, which appends a row (time, name, date, "Agreed", submitter IP) to a Google
Sheet using a Google Cloud **service account** — no Google account interaction from the
visitor, and nothing client-side ever touches your credentials. The "Timestamp" column holds
the time of submission (e.g. `8:08 PM ET`) and the "Date" column holds the date (e.g.
`6/24/2026`), both in US Eastern time. Rows are appended with `OVERWRITE` (write to the next
empty row) rather than `INSERT_ROWS`, so they don't inherit the bold formatting of the header
row above.

This uses only free tiers: Vercel Hobby plan serverless functions and the Google Sheets API's
free quota (far more than this form will ever use).

### One-time setup

1. **Create the Sheet.** Make a new Google Sheet. Add a header row, e.g.:
   `Timestamp | Name | Date | Status | IP`. Copy the Sheet ID from its URL
   (`https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit`).

2. **Create a Google Cloud service account.**
   - Go to [console.cloud.google.com](https://console.cloud.google.com), create or select a project.
   - Enable the **Google Sheets API** (APIs & Services → Library → search "Google Sheets API" → Enable).
   - Go to APIs & Services → Credentials → Create Credentials → Service Account. Give it any name.
   - Open the new service account → Keys → Add Key → Create new key → JSON. This downloads a
     JSON file containing `client_email` and `private_key`.

3. **Share the Sheet with the service account.** Open your Sheet → Share → paste the
   service account's `client_email` (looks like `something@project-id.iam.gserviceaccount.com`)
   → give it **Editor** access.

4. **Set environment variables in Vercel.** Project Settings → Environment Variables, add:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL` — the `client_email` from the JSON key.
   - `GOOGLE_PRIVATE_KEY` — the `private_key` from the JSON key, pasted as-is (Vercel handles
     the embedded newlines; the code also unescapes `\n` if needed).
   - `GOOGLE_SHEET_ID` — the Sheet ID from step 1.
   - `GOOGLE_SHEET_TAB` — (optional) the tab/sheet name to append to, defaults to `Sheet1`.

5. **Redeploy.** Trigger a redeploy after adding the env vars so the function picks them up.

Submissions then appear in the Sheet in real time as visitors submit the form.
