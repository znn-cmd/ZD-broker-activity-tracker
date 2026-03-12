import { v4 as uuidv4 } from "uuid";
import {
  appendSheetRow,
  getSheetRows,
  updateSheetRow,
} from "@/lib/google/sheetsClient";
import type { DailyReportRecord } from "@/types/domain";

const SHEET_NAME = "daily_reports";

type RawReportRow = {
  rowIndex: number;
  data: DailyReportRecord;
};

function toNumber(value: string | undefined): number {
  if (!value) return 0;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function parseReportRow(row: string[], rowIndex: number): RawReportRow | null {
  if (row.length === 0) return null;

  const [
    report_id,
    user_id,
    report_date,
    buyer_incoming_lead_total,
    buyer_contact_established,
    buyer_qualified,
    buyer_agents,
    buyer_meeting_confirmed,
    buyer_meeting_held,
    buyer_number_of_bookings,
    buyer_booking_commission_amount,
    seller_incoming_requests,
    seller_number_of_cold_calls,
    seller_requested_documents,
    seller_sent_contract,
    seller_objects_entered_xoms,
    seller_listed_property,
    seller_sold_objects,
    seller_total_sales_amount,
    created_at,
    updated_at,
    updated_by,
  ] = row;

  if (!report_id || !user_id || !report_date) return null;

  const data: DailyReportRecord = {
    reportId: report_id,
    userId: user_id,
    reportDate: report_date,
    buyer_incoming_lead_total: toNumber(buyer_incoming_lead_total),
    buyer_contact_established: toNumber(buyer_contact_established),
    buyer_qualified: toNumber(buyer_qualified),
    buyer_agents: toNumber(buyer_agents),
    buyer_meeting_confirmed: toNumber(buyer_meeting_confirmed),
    buyer_meeting_held: toNumber(buyer_meeting_held),
    buyer_number_of_bookings: toNumber(buyer_number_of_bookings),
    buyer_booking_commission_amount: toNumber(buyer_booking_commission_amount),
    seller_incoming_requests: toNumber(seller_incoming_requests),
    seller_number_of_cold_calls: toNumber(seller_number_of_cold_calls),
    seller_requested_documents: toNumber(seller_requested_documents),
    seller_sent_contract: toNumber(seller_sent_contract),
    seller_objects_entered_xoms: toNumber(seller_objects_entered_xoms),
    seller_listed_property: toNumber(seller_listed_property),
    seller_sold_objects: toNumber(seller_sold_objects),
    seller_total_sales_amount: toNumber(seller_total_sales_amount),
    createdAt: created_at ?? "",
    updatedAt: updated_at ?? "",
    updatedBy: updated_by ?? "",
  };

  return { rowIndex, data };
}

function serializeReportRow(
  report: DailyReportRecord,
): (string | number | null)[] {
  return [
    report.reportId,
    report.userId,
    report.reportDate,
    report.buyer_incoming_lead_total,
    report.buyer_contact_established,
    report.buyer_qualified,
    report.buyer_agents,
    report.buyer_meeting_confirmed,
    report.buyer_meeting_held,
    report.buyer_number_of_bookings,
    report.buyer_booking_commission_amount,
    report.seller_incoming_requests,
    report.seller_number_of_cold_calls,
    report.seller_requested_documents,
    report.seller_sent_contract,
    report.seller_objects_entered_xoms,
    report.seller_listed_property,
    report.seller_sold_objects,
    report.seller_total_sales_amount,
    report.createdAt,
    report.updatedAt,
    report.updatedBy,
  ];
}

export async function getReportByUserAndDate(
  userId: string,
  reportDate: string,
): Promise<DailyReportRecord | null> {
  const rows = await getSheetRows(SHEET_NAME);
  if (!rows || rows.length <= 1) return null;
  const [, ...dataRows] = rows;

  for (let i = 0; i < dataRows.length; i += 1) {
    const parsed = parseReportRow(dataRows[i], i + 2);
    if (!parsed) continue;
    if (parsed.data.userId === userId && parsed.data.reportDate === reportDate) {
      return parsed.data;
    }
  }

  return null;
}

export async function listReportsByUserAndDateRange(params: {
  userId: string;
  startDate: string;
  endDate: string;
}): Promise<DailyReportRecord[]> {
  const { userId, startDate, endDate } = params;
  const rows = await getSheetRows(SHEET_NAME);
  if (!rows || rows.length <= 1) return [];
  const [, ...dataRows] = rows;

  const results: DailyReportRecord[] = [];
  dataRows.forEach((row, index) => {
    const parsed = parseReportRow(row, index + 2);
    if (!parsed) return;
    if (parsed.data.userId !== userId) return;
    if (
      parsed.data.reportDate >= startDate &&
      parsed.data.reportDate <= endDate
    ) {
      results.push(parsed.data);
    }
  });

  return results;
}

export async function upsertReportForUserAndDate(
  userId: string,
  reportDate: string,
  payload: Omit<
    DailyReportRecord,
    "reportId" | "userId" | "reportDate" | "createdAt" | "updatedAt"
  >,
): Promise<DailyReportRecord> {
  const rows = await getSheetRows(SHEET_NAME);
  const now = new Date().toISOString();

  if (!rows || rows.length <= 1) {
    const report: DailyReportRecord = {
      ...payload,
      reportId: uuidv4(),
      userId,
      reportDate,
      createdAt: now,
      updatedAt: now,
    };
    await appendSheetRow(SHEET_NAME, serializeReportRow(report));
    return report;
  }

  const [header, ...dataRows] = rows;
  let existingRowIndex: number | null = null;
  let existingReport: DailyReportRecord | null = null;

  for (let i = 0; i < dataRows.length; i += 1) {
    const parsed = parseReportRow(dataRows[i], i + 2);
    if (!parsed) continue;
    if (parsed.data.userId === userId && parsed.data.reportDate === reportDate) {
      existingRowIndex = parsed.rowIndex;
      existingReport = parsed.data;
      break;
    }
  }

  if (existingRowIndex && existingReport) {
    const updated: DailyReportRecord = {
      ...existingReport,
      ...payload,
      updatedAt: now,
    };
    await updateSheetRow(SHEET_NAME, existingRowIndex, serializeReportRow(updated));
    return updated;
  }

  const report: DailyReportRecord = {
    ...payload,
    reportId: uuidv4(),
    userId,
    reportDate,
    createdAt: now,
    updatedAt: now,
  };

  // include header to preserve A:Z structure if needed
  if (header && header.length > 0) {
    await appendSheetRow(SHEET_NAME, serializeReportRow(report));
  } else {
    await appendSheetRow(SHEET_NAME, serializeReportRow(report));
  }

  return report;
}

