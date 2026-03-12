import { v4 as uuidv4 } from "uuid";
import { appendSheetRow, getSheetRows } from "@/lib/google/sheetsClient";
import type { AuditLogEntry } from "@/types/domain";

const SHEET_NAME = "audit_log";

function parseRow(row: string[]): AuditLogEntry | null {
  if (row.length < 7) return null;
  const [log_id, user_id, action, entity_type, entity_id, payload_json, created_at] = row;
  if (!log_id) return null;
  return {
    logId: log_id,
    userId: user_id ?? "",
    action: action ?? "",
    entityType: entity_type ?? "",
    entityId: entity_id ?? "",
    payloadJson: payload_json ?? "",
    createdAt: created_at ?? "",
  };
}

export async function appendAuditLog(entry: Omit<AuditLogEntry, "logId" | "createdAt">) {
  const now = new Date().toISOString();
  const full: AuditLogEntry = {
    ...entry,
    logId: uuidv4(),
    createdAt: now,
  };
  await appendSheetRow(SHEET_NAME, [
    full.logId,
    full.userId,
    full.action,
    full.entityType,
    full.entityId,
    full.payloadJson,
    full.createdAt,
  ]);
}

export async function listAuditLog(params: {
  limit?: number;
  userId?: string;
  action?: string;
}): Promise<AuditLogEntry[]> {
  const rows = await getSheetRows(SHEET_NAME);
  if (!rows || rows.length <= 1) return [];
  const [, ...dataRows] = rows;
  const entries: AuditLogEntry[] = [];
  for (let i = dataRows.length - 1; i >= 0; i -= 1) {
    const parsed = parseRow(dataRows[i]);
    if (parsed) {
      if (params.userId && parsed.userId !== params.userId) continue;
      if (params.action && parsed.action !== params.action) continue;
      entries.push(parsed);
    }
  }
  const limit = params.limit ?? 100;
  return entries.slice(0, limit);
}
