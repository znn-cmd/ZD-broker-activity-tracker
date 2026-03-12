import { google, sheets_v4 } from "googleapis";
import { getGoogleAuthClient } from "./googleAuth";

let cachedSheets: sheets_v4.Sheets | null = null;

function getSheetsClient() {
  if (cachedSheets) return cachedSheets;
  const auth = getGoogleAuthClient();
  cachedSheets = google.sheets({ version: "v4", auth });
  return cachedSheets;
}

function getSpreadsheetId(): string {
  const id = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!id) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID is not configured");
  }
  return id;
}

export async function getSheetRows(
  sheetName: string,
): Promise<string[][] | undefined> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:Z`,
  });

  return res.data.values;
}

export async function appendSheetRow(
  sheetName: string,
  row: (string | number | boolean | null)[],
) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:Z`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [row],
    },
  });
}

export async function updateSheetRow(
  sheetName: string,
  rowIndex: number,
  row: (string | number | boolean | null)[],
) {
  // rowIndex is 1-based including header; Sheets API is also 1-based.
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const start = rowIndex;
  const end = rowIndex;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A${start}:Z${end}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [row],
    },
  });
}

