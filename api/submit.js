const { JWT } = require("google-auth-library");

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const TIME_ZONE = "America/New_York";

function formatDateAndTime(now) {
  const date = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(now);

  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(now);

  return { date, time: `${time} ET` };
}

async function unboldAppendedRow({ token, spreadsheetId, tab, updatedRange }) {
  if (!updatedRange) return;

  const match = /![A-Z]+(\d+):[A-Z]+(\d+)/.exec(updatedRange);
  if (!match) return;
  const rowIndex = parseInt(match[1], 10) - 1;

  try {
    const metaResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties(sheetId,title)`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!metaResponse.ok) return;
    const meta = await metaResponse.json();
    const sheet = (meta.sheets || []).find((s) => s.properties.title === tab);
    if (!sheet) return;
    const sheetId = sheet.properties.sheetId;

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          {
            repeatCell: {
              range: {
                sheetId,
                startRowIndex: rowIndex,
                endRowIndex: rowIndex + 1,
              },
              cell: {
                userEnteredFormat: {
                  textFormat: { bold: false },
                },
              },
              fields: "userEnteredFormat.textFormat.bold",
            },
          },
        ],
      }),
    });
  } catch (err) {
    console.error("Unbold formatting error:", err);
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, agree } = req.body || {};

  if (typeof name !== "string" || name.trim().length === 0 || name.trim().length > 200) {
    return res.status(400).json({ error: "A valid name is required." });
  }
  if (agree !== true) {
    return res.status(400).json({ error: "You must accept the policy to submit." });
  }

  const { GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEET_ID, GOOGLE_SHEET_TAB } = process.env;

  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY || !GOOGLE_SHEET_ID) {
    return res.status(500).json({ error: "Server is not configured." });
  }

  try {
    const client = new JWT({
      email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes: SCOPES,
    });
    const { token } = await client.getAccessToken();

    const tab = GOOGLE_SHEET_TAB || "Sheet1";
    const range = encodeURIComponent(`${tab}!A:E`);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=OVERWRITE`;

    const now = new Date();
    const { date, time } = formatDateAndTime(now);
    const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || "";

    const sheetResponse = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: [[time, name.trim(), date, "Agreed", ip]],
      }),
    });

    if (!sheetResponse.ok) {
      const text = await sheetResponse.text();
      console.error("Sheets API error:", sheetResponse.status, text);
      return res.status(502).json({ error: "Could not record submission." });
    }

    const appendResult = await sheetResponse.json();
    await unboldAppendedRow({
      token,
      spreadsheetId: GOOGLE_SHEET_ID,
      tab,
      updatedRange: appendResult?.updates?.updatedRange,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Submission error:", err);
    return res.status(500).json({ error: "Unexpected server error." });
  }
};
