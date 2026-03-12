"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth/auth-options";
import { listReportsByUserAndDateRange } from "@/lib/repositories/reports-repository";
import { getPlansForUserMonth } from "@/lib/repositories/plans-repository";
import { calculateMetricPaceForUserMonth } from "@/analytics/planning";
import {
  buildPersonalAnalyticsSummary,
  type PeriodType,
  type PersonalAnalyticsSummary,
} from "@/analytics/personalAnalytics";

type SessionUser = {
  id: string;
};

export type PersonalAnalyticsResponse = {
  summary: PersonalAnalyticsSummary;
};

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

  const reports = await listReportsByUserAndDateRange({
    userId,
    startDate,
    endDate,
  });

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

