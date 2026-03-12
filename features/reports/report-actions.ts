"use server";

import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/server/auth/auth-options";
import {
  getReportByUserAndDate,
  upsertReportForUserAndDate,
  listReportsByUserAndDateRange,
} from "@/lib/repositories/reports-repository";
import { getPlansForUserMonth } from "@/lib/repositories/plans-repository";
import { calculateMetricPaceForUserMonth } from "@/analytics/planning";
import type { DailyReportRecord } from "@/types/domain";

const dailyReportSchema = z.object({
  reportDate: z.string().min(1),
  buyer_incoming_lead_total: z.number().nonnegative(),
  buyer_contact_established: z.number().nonnegative(),
  buyer_qualified: z.number().nonnegative(),
  buyer_agents: z.number().nonnegative(),
  buyer_meeting_confirmed: z.number().nonnegative(),
  buyer_meeting_held: z.number().nonnegative(),
  buyer_number_of_bookings: z.number().nonnegative(),
  buyer_booking_commission_amount: z.number().nonnegative(),
  seller_incoming_requests: z.number().nonnegative(),
  seller_number_of_cold_calls: z.number().nonnegative(),
  seller_requested_documents: z.number().nonnegative(),
  seller_sent_contract: z.number().nonnegative(),
  seller_objects_entered_xoms: z.number().nonnegative(),
  seller_listed_property: z.number().nonnegative(),
  seller_sold_objects: z.number().nonnegative(),
  seller_total_sales_amount: z.number().nonnegative(),
});

export type DailyReportPayload = z.infer<typeof dailyReportSchema>;

export type DailyReportWithPlanning = {
  report: DailyReportRecord | null;
  paceStats: Awaited<ReturnType<typeof calculateMetricPaceForUserMonth>>;
};

type SessionUser = {
  id: string;
  role: string;
  teamId: string | null;
};

async function getCurrentOrSelectedUserId(
  targetUserId?: string,
): Promise<string> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Unauthenticated");
  }
  const me = session.user as SessionUser;
  if (me.role === "admin" && targetUserId) {
    return targetUserId;
  }
  return me.id;
}

export async function loadDailyReportWithPlanning(
  reportDate: string,
  userIdOverride?: string,
): Promise<DailyReportWithPlanning> {
  const userId = await getCurrentOrSelectedUserId(userIdOverride);
  const report = await getReportByUserAndDate(userId, reportDate);

  const refDate = new Date(reportDate);
  const year = refDate.getUTCFullYear();
  const month = refDate.getUTCMonth() + 1;
  const monthStart = new Date(Date.UTC(year, month - 1, 1))
    .toISOString()
    .slice(0, 10);
  const monthEnd = new Date(Date.UTC(year, month, 0))
    .toISOString()
    .slice(0, 10);

  const plans = await getPlansForUserMonth({ userId, year, month });
  const monthlyReports = await listReportsByUserAndDateRange({
    userId,
    startDate: monthStart,
    endDate: monthEnd,
  });
  const paceStats = await calculateMetricPaceForUserMonth({
    plans,
    reports: monthlyReports,
    year,
    month,
    referenceDate: refDate,
  });

  return { report, paceStats };
}

export async function saveDailyReport(
  values: DailyReportPayload,
  userIdOverride?: string,
): Promise<DailyReportWithPlanning> {
  const userId = await getCurrentOrSelectedUserId(userIdOverride);
  const parsed = dailyReportSchema.parse(values);

  const payloadWithoutMeta = {
    buyer_incoming_lead_total: parsed.buyer_incoming_lead_total,
    buyer_contact_established: parsed.buyer_contact_established,
    buyer_qualified: parsed.buyer_qualified,
    buyer_agents: parsed.buyer_agents,
    buyer_meeting_confirmed: parsed.buyer_meeting_confirmed,
    buyer_meeting_held: parsed.buyer_meeting_held,
    buyer_number_of_bookings: parsed.buyer_number_of_bookings,
    buyer_booking_commission_amount: parsed.buyer_booking_commission_amount,
    seller_incoming_requests: parsed.seller_incoming_requests,
    seller_number_of_cold_calls: parsed.seller_number_of_cold_calls,
    seller_requested_documents: parsed.seller_requested_documents,
    seller_sent_contract: parsed.seller_sent_contract,
    seller_objects_entered_xoms: parsed.seller_objects_entered_xoms,
    seller_listed_property: parsed.seller_listed_property,
    seller_sold_objects: parsed.seller_sold_objects,
    seller_total_sales_amount: parsed.seller_total_sales_amount,
    updatedBy: userId,
  } as Omit<
    DailyReportRecord,
    "reportId" | "userId" | "reportDate" | "createdAt" | "updatedAt"
  >;

  const report = await upsertReportForUserAndDate(
    userId,
    parsed.reportDate,
    payloadWithoutMeta,
  );

  const refDate = new Date(parsed.reportDate);
  const year = refDate.getUTCFullYear();
  const month = refDate.getUTCMonth() + 1;
  const monthStart = new Date(Date.UTC(year, month - 1, 1))
    .toISOString()
    .slice(0, 10);
  const monthEnd = new Date(Date.UTC(year, month, 0))
    .toISOString()
    .slice(0, 10);
  const plans = await getPlansForUserMonth({ userId, year, month });
  const monthlyReports = await listReportsByUserAndDateRange({
    userId,
    startDate: monthStart,
    endDate: monthEnd,
  });
  const paceStats = await calculateMetricPaceForUserMonth({
    plans,
    reports: monthlyReports,
    year,
    month,
    referenceDate: refDate,
  });

  return { report, paceStats };
}

