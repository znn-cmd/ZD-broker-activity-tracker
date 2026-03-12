"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth/auth-options";
import { listReportsByUserAndDateRange } from "@/lib/repositories/reports-repository";
import { getPlansForUserMonth } from "@/lib/repositories/plans-repository";
import { calculateMetricPaceForUserMonth } from "@/analytics/planning";
import { getDisciplineForPeriod } from "@/analytics/discipline";
import {
  buildPersonalAnalyticsSummary,
  type PeriodType,
  type PersonalAnalyticsSummary,
} from "@/analytics/personalAnalytics";
import type { MetricKey } from "@/types/domain";

type SessionUser = {
  id: string;
};

export type PersonalAnalyticsResponse = {
  summary: PersonalAnalyticsSummary;
};

function getPreviousRange(
  startDate: string,
  endDate: string,
): { previousStart: string; previousEnd: string } {
  const start = new Date(startDate + "T12:00:00Z");
  const end = new Date(endDate + "T12:00:00Z");
  const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  const previousEnd = new Date(start);
  previousEnd.setUTCDate(previousEnd.getUTCDate() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setUTCDate(previousStart.getUTCDate() - days + 1);
  return {
    previousStart: previousStart.toISOString().slice(0, 10),
    previousEnd: previousEnd.toISOString().slice(0, 10),
  };
}

function aggregateTotals(
  reports: Awaited<ReturnType<typeof listReportsByUserAndDateRange>>,
): Record<MetricKey, number> {
  const keys: MetricKey[] = [
    "buyer_incoming_lead_total",
    "buyer_contact_established",
    "buyer_qualified",
    "buyer_agents",
    "buyer_meeting_confirmed",
    "buyer_meeting_held",
    "buyer_number_of_bookings",
    "buyer_booking_commission_amount",
    "seller_incoming_requests",
    "seller_number_of_cold_calls",
    "seller_requested_documents",
    "seller_sent_contract",
    "seller_objects_entered_xoms",
    "seller_listed_property",
    "seller_sold_objects",
    "seller_total_sales_amount",
  ];
  const totals: Record<string, number> = {};
  keys.forEach((k) => {
    totals[k] = 0;
  });
  reports.forEach((r) => {
    keys.forEach((k) => {
      totals[k] += (r[k] as number) ?? 0;
    });
  });
  return totals as Record<MetricKey, number>;
}

export async function getPersonalAnalytics(params: {
  periodType: PeriodType;
  startDate?: string;
  endDate?: string;
}): Promise<PersonalAnalyticsResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Unauthenticated");
  }

  const userId = (session.user as SessionUser).id;
  const { periodType } = params;
  const { startDate, endDate } = resolveRange(periodType, params);

  const [reports, previousRange] = await Promise.all([
    listReportsByUserAndDateRange({ userId, startDate, endDate }),
    (async () => getPreviousRange(startDate, endDate))(),
  ]);

  const previousReports = await listReportsByUserAndDateRange({
    userId,
    startDate: previousRange.previousStart,
    endDate: previousRange.previousEnd,
  });
  const previousTotals = aggregateTotals(previousReports);

  const discipline = await getDisciplineForPeriod(
    userId,
    startDate,
    endDate,
    reports,
  );

  const refDate = new Date(endDate);
  const year = refDate.getUTCFullYear();
  const month = refDate.getUTCMonth() + 1;

  const plans = await getPlansForUserMonth({ userId, year, month });
  const paceStats = await calculateMetricPaceForUserMonth({
    plans,
    reports,
    year,
    month,
    referenceDate: refDate,
  });

  const summary = buildPersonalAnalyticsSummary({
    reports,
    periodType,
    startDate,
    endDate,
    paceStats,
    disciplinePct: discipline.completionPct,
    previousTotals,
    previousStart: previousRange.previousStart,
    previousEnd: previousRange.previousEnd,
  });

  return { summary };
}

function resolveRange(
  periodType: PeriodType,
  params: { startDate?: string; endDate?: string },
): { startDate: string; endDate: string } {
  const today = new Date();

  if (periodType === "custom" && params.startDate && params.endDate) {
    return { startDate: params.startDate, endDate: params.endDate };
  }

  if (periodType === "day") {
    const iso = today.toISOString().slice(0, 10);
    return { startDate: iso, endDate: iso };
  }

  if (periodType === "week") {
    const day = today.getUTCDay() || 7;
    const monday = new Date(today);
    monday.setUTCDate(today.getUTCDate() - (day - 1));
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    return {
      startDate: monday.toISOString().slice(0, 10),
      endDate: sunday.toISOString().slice(0, 10),
    };
  }

  if (periodType === "year") {
    const start = new Date(Date.UTC(today.getUTCFullYear(), 0, 1));
    const end = new Date(Date.UTC(today.getUTCFullYear(), 11, 31));
    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    };
  }

  // default: month
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const end = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0),
  );
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

