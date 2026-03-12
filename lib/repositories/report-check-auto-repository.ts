import { getSheetRows } from "@/lib/google/sheetsClient";
import type { MetricKey } from "@/types/domain";

const SHEET_NAME = "report_check_auto_values";

export type ReportCheckAutoRecord = {
  userId: string;
  metricKey: MetricKey;
  reportDate: string;
  autoValue: number;
  updatedAt: string;
};

type RawRow = {
  rowIndex: number;
  data: ReportCheckAutoRecord;
};

function toNumber(value: string | undefined): number {
  if (!value) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function parseRow(row: string[], rowIndex: number): RawRow | null {
  if (row.length === 0) return null;
  const [user_id, metric_key, report_date, auto_value, updated_at] = row;
  if (!user_id || !metric_key || !report_date) return null;

  const data: ReportCheckAutoRecord = {
    userId: user_id,
    metricKey: metric_key as MetricKey,
    reportDate: report_date,
    autoValue: toNumber(auto_value),
    updatedAt: updated_at ?? "",
  };

  return { rowIndex, data };
}

export async function listAutoValuesForDate(
  reportDate: string,
): Promise<ReportCheckAutoRecord[]> {
  const rows = await getSheetRows(SHEET_NAME);
  if (!rows || rows.length <= 1) return [];
  const [, ...dataRows] = rows;

  const results: ReportCheckAutoRecord[] = [];
  dataRows.forEach((row, index) => {
    const parsed = parseRow(row, index + 2);
    if (!parsed) return;
    if (parsed.data.reportDate !== reportDate) return;
    results.push(parsed.data);
  });

  return results;
}

