import { v4 as uuidv4 } from "uuid";
import { appendSheetRow, getSheetRows } from "@/lib/google/sheetsClient";
import type { ReminderRecord } from "@/types/domain";

const SHEET_NAME = "reminders";

function parseRow(row: string[]): ReminderRecord | null {
  if (row.length < 8) return null;
  const [reminder_id, user_id, report_date, channel, status, sent_at, payload_json, created_at] = row;
  if (!reminder_id) return null;
  return {
    reminderId: reminder_id,
    userId: user_id ?? "",
    reportDate: report_date ?? "",
    channel: channel ?? "",
    status: status ?? "",
    sentAt: sent_at ?? "",
    payloadJson: payload_json ?? "",
    createdAt: created_at ?? "",
  };
}

export async function listReminders(params: {
  limit?: number;
  userId?: string;
  reportDate?: string;
}): Promise<ReminderRecord[]> {
  const rows = await getSheetRows(SHEET_NAME);
  if (!rows || rows.length <= 1) return [];
  const [, ...dataRows] = rows;
  const entries: ReminderRecord[] = [];
  for (let i = dataRows.length - 1; i >= 0 && entries.length < (params.limit ?? 50); i -= 1) {
    const parsed = parseRow(dataRows[i]);
    if (parsed) {
      if (params.userId && parsed.userId !== params.userId) continue;
      if (params.reportDate && parsed.reportDate !== params.reportDate) continue;
      entries.push(parsed);
    }
  }
  return entries;
}

export async function appendReminder(entry: Omit<ReminderRecord, "reminderId" | "createdAt">): Promise<ReminderRecord> {
  const now = new Date().toISOString();
  const full: ReminderRecord = {
    ...entry,
    reminderId: uuidv4(),
    createdAt: now,
  };
  await appendSheetRow(SHEET_NAME, [
    full.reminderId,
    full.userId,
    full.reportDate,
    full.channel,
    full.status,
    full.sentAt,
    full.payloadJson,
    full.createdAt,
  ]);
  return full;
}
