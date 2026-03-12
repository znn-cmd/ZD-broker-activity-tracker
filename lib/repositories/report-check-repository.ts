import { appendSheetRow, getSheetRows } from "@/lib/google/sheetsClient";
import type { MetricKey } from "@/types/domain";

const SHEET_NAME = "report_check_links";

export type ReportCheckLinkRecord = {
  userId: string;
  metricKey: MetricKey;
  url: string;
  updatedAt: string;
  updatedBy: string;
};

type RawRow = {
  rowIndex: number;
  data: ReportCheckLinkRecord;
};

function parseRow(row: string[], rowIndex: number): RawRow | null {
  if (row.length === 0) return null;

  const [user_id, metric_key, url, updated_at, updated_by] = row;
  if (!user_id || !metric_key) return null;

  const data: ReportCheckLinkRecord = {
    userId: user_id,
    metricKey: metric_key as MetricKey,
    url: url ?? "",
    updatedAt: updated_at ?? "",
    updatedBy: updated_by ?? "",
  };

  return { rowIndex, data };
}

function serializeRow(rec: ReportCheckLinkRecord): (string | null)[] {
  return [rec.userId, rec.metricKey, rec.url, rec.updatedAt, rec.updatedBy];
}

export async function listAllReportCheckLinks(): Promise<ReportCheckLinkRecord[]> {
  const rows = await getSheetRows(SHEET_NAME);
  if (!rows || rows.length <= 1) return [];
  const [, ...dataRows] = rows;

  const results: ReportCheckLinkRecord[] = [];
  dataRows.forEach((row, index) => {
    const parsed = parseRow(row, index + 2);
    if (!parsed) return;
    results.push(parsed.data);
  });

  return results;
}

export async function listReportCheckLinksForUser(
  userId: string,
): Promise<ReportCheckLinkRecord[]> {
  const all = await listAllReportCheckLinks();
  return all.filter((r) => r.userId === userId);
}

export async function saveReportCheckLinksForUser(params: {
  userId: string;
  metricUrls: { metricKey: MetricKey; url: string }[];
  updatedBy: string;
}): Promise<void> {
  const { userId, metricUrls, updatedBy } = params;
  const now = new Date().toISOString();

  for (const { metricKey, url } of metricUrls) {
    const rec: ReportCheckLinkRecord = {
      userId,
      metricKey,
      url,
      updatedAt: now,
      updatedBy,
    };
    // Для простоты всегда добавляем новую строку;
    // при чтении можно использовать последнюю запись для пары (userId, metricKey).
    // Удаление/очистка старых строк можно добавить позже при необходимости.
    // eslint-disable-next-line no-await-in-loop
    await appendSheetRow(SHEET_NAME, serializeRow(rec));
  }
}

