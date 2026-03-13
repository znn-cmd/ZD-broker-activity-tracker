"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth/auth-options";
import { UserRole, type DailyReportRecord, type MetricKey } from "@/types/domain";
import { getAllUsers } from "@/lib/repositories/users-repository";
import {
  getReportByUserAndDate,
  upsertReportForUserAndDate,
  listReportsForUsersInDateRange,
} from "@/lib/repositories/reports-repository";
import {
  listAllReportCheckLinks,
  saveReportCheckLinksForUser,
} from "@/lib/repositories/report-check-repository";
import { listAutoValuesForDate } from "@/lib/repositories/report-check-auto-repository";
import { METRICS } from "./metrics";

type SessionUser = {
  id: string;
  role: UserRole;
};

async function requireAdmin(): Promise<SessionUser> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Unauthenticated");
  }
  const me = session.user as SessionUser;
  if (me.role !== UserRole.Admin) {
    throw new Error("Forbidden");
  }
  return me;
}

export async function loadReportCheckSetup() {
  const me = await requireAdmin();
  void me;

  const allUsers = await getAllUsers();
  const managers = allUsers.filter((u) => u.role === UserRole.Manager && u.isActive);
  const links = await listAllReportCheckLinks();

  return {
    managers: managers.map((m) => ({
      userId: m.userId,
      fullName: m.fullName || m.username,
    })),
    links,
    metrics: METRICS,
  };
}

export async function saveLinksForManager(params: {
  managerId: string;
  metricUrls: { metricKey: MetricKey; url: string }[];
}) {
  const me = await requireAdmin();
  await saveReportCheckLinksForUser({
    userId: params.managerId,
    metricUrls: params.metricUrls,
    updatedBy: me.id,
  });
}

export type ReportCheckResultCell = {
  metricKey: MetricKey;
  manualValue: number;
  autoValue: number | null;
  url: string | null;
};

export type ReportCheckResultRow = {
  userId: string;
  fullName: string;
  cells: ReportCheckResultCell[];
};

export async function runReportCheckForYesterday(): Promise<{
  date: string;
  rows: ReportCheckResultRow[];
}> {
  const me = await requireAdmin();
  void me;

  const today = new Date();
  const yesterday = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 1),
  )
    .toISOString()
    .slice(0, 10);

  const allUsers = await getAllUsers();
  const managers = allUsers.filter((u) => u.role === UserRole.Manager && u.isActive);
  const userIds = managers.map((m) => m.userId);

  const [reports, links, autoValues] = await Promise.all([
    listReportsForUsersInDateRange({
      userIds,
      startDate: yesterday,
      endDate: yesterday,
    }),
    listAllReportCheckLinks(),
    listAutoValuesForDate(yesterday),
  ]);

  const reportsByUser = new Map<string, DailyReportRecord>();
  reports.forEach((r) => {
    reportsByUser.set(r.userId, r);
  });

  const latestLinkByUserMetric = new Map<string, string>();
  links.forEach((l) => {
    const key = `${l.userId}:${l.metricKey}`;
    latestLinkByUserMetric.set(key, l.url);
  });

  const autoByUserMetric = new Map<string, number>();
  autoValues.forEach((a) => {
    const key = `${a.userId}:${a.metricKey}`;
    autoByUserMetric.set(key, a.autoValue);
  });

  const rows: ReportCheckResultRow[] = [];

  for (const manager of managers) {
    const report = reportsByUser.get(manager.userId) ?? null;
    const cells: ReportCheckResultCell[] = [];

    for (const metric of METRICS) {
      const metricKey = metric.key;
      const manualValue = (report?.[metricKey] as number | undefined) ?? 0;
      const linkKey = `${manager.userId}:${metricKey}`;
      const url = latestLinkByUserMetric.get(linkKey) ?? "";
      const autoValue = autoByUserMetric.get(linkKey) ?? null;

      cells.push({
        metricKey,
        manualValue,
        autoValue,
        url: url || null,
      });
    }

    rows.push({
      userId: manager.userId,
      fullName: manager.fullName || manager.username,
      cells,
    });
  }

  return { date: yesterday, rows };
}

export async function saveEditedManagerReport(params: {
  userId: string;
  reportDate: string;
  values: Record<MetricKey, number>;
}) {
  const me = await requireAdmin();
  void me;

  const existing = await getReportByUserAndDate(params.userId, params.reportDate);
  const base: DailyReportRecord =
    existing ??
    ({
      reportId: "",
      userId: params.userId,
      reportDate: params.reportDate,
      buyer_incoming_lead_total: 0,
      buyer_contact_established: 0,
      buyer_qualified: 0,
      buyer_agents: 0,
      buyer_meeting_confirmed: 0,
      buyer_meeting_held: 0,
      buyer_number_of_bookings: 0,
      buyer_booking_commission_amount: 0,
      seller_incoming_requests: 0,
      seller_number_of_cold_calls: 0,
      seller_requested_documents: 0,
      seller_sent_contract: 0,
      seller_objects_entered_xoms: 0,
      seller_listed_property: 0,
      seller_sold_objects: 0,
      seller_total_sales_amount: 0,
      createdAt: "",
      updatedAt: "",
      updatedBy: "",
    } as DailyReportRecord);

  const payload = {
    buyer_incoming_lead_total: params.values.buyer_incoming_lead_total ??
      base.buyer_incoming_lead_total,
    buyer_contact_established: params.values.buyer_contact_established ??
      base.buyer_contact_established,
    buyer_qualified: params.values.buyer_qualified ?? base.buyer_qualified,
    buyer_agents: params.values.buyer_agents ?? base.buyer_agents,
    buyer_meeting_confirmed: params.values.buyer_meeting_confirmed ??
      base.buyer_meeting_confirmed,
    buyer_meeting_held: params.values.buyer_meeting_held ??
      base.buyer_meeting_held,
    buyer_number_of_bookings: params.values.buyer_number_of_bookings ??
      base.buyer_number_of_bookings,
    buyer_booking_commission_amount:
      params.values.buyer_booking_commission_amount ??
      base.buyer_booking_commission_amount,
    seller_incoming_requests: params.values.seller_incoming_requests ??
      base.seller_incoming_requests,
    seller_number_of_cold_calls: params.values.seller_number_of_cold_calls ??
      base.seller_number_of_cold_calls,
    seller_requested_documents: params.values.seller_requested_documents ??
      base.seller_requested_documents,
    seller_sent_contract: params.values.seller_sent_contract ??
      base.seller_sent_contract,
    seller_objects_entered_xoms: params.values.seller_objects_entered_xoms ??
      base.seller_objects_entered_xoms,
    seller_listed_property: params.values.seller_listed_property ??
      base.seller_listed_property,
    seller_sold_objects: params.values.seller_sold_objects ??
      base.seller_sold_objects,
    seller_total_sales_amount: params.values.seller_total_sales_amount ??
      base.seller_total_sales_amount,
    updatedBy: me.id,
  } as Omit<
    DailyReportRecord,
    "reportId" | "userId" | "reportDate" | "createdAt" | "updatedAt"
  >;

  await upsertReportForUserAndDate(params.userId, params.reportDate, payload);
}

