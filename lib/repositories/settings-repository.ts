import { getSheetRows, updateSheetRow } from "@/lib/google/sheetsClient";

const SHEET_NAME = "settings";

export async function getSetting(key: string): Promise<string | null> {
  const rows = await getSheetRows(SHEET_NAME);
  if (!rows || rows.length <= 1) return null;
  const [, ...dataRows] = rows;
  for (let i = 0; i < dataRows.length; i += 1) {
    const row = dataRows[i];
    if (row[0] === key) return row[1] ?? null;
  }
  return null;
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await getSheetRows(SHEET_NAME);
  const out: Record<string, string> = {};
  if (!rows || rows.length <= 1) return out;
  const [, ...dataRows] = rows;
  dataRows.forEach((row) => {
    const key = row[0];
    const value = row[1];
    if (key) out[key] = value ?? "";
  });
  return out;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const rows = await getSheetRows(SHEET_NAME);
  if (!rows || rows.length <= 1) return;
  const [, ...dataRows] = rows;
  const now = new Date().toISOString();
  for (let i = 0; i < dataRows.length; i += 1) {
    if (dataRows[i][0] === key) {
      await updateSheetRow(SHEET_NAME, i + 2, [key, value, now]);
      return;
    }
  }
  // Append new row - we need appendSheetRow
  const { appendSheetRow } = await import("@/lib/google/sheetsClient");
  await appendSheetRow(SHEET_NAME, [key, value, now]);
}
