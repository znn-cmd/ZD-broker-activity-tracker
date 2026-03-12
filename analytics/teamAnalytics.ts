import type { DailyReportRecord, MetricKey, UserRecord } from "@/types/domain";
import type { DisciplineResult } from "./discipline";
import {
  calculateBuyerConversions,
  calculateSellerConversions,
  type BuyerSellerTotals,
} from "./conversions";

const METRIC_KEYS: MetricKey[] = [
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

export type BrokerStats = {
  user: UserRecord;
  reports: DailyReportRecord[];
  totals: Record<MetricKey, number>;
  reportCount: number;
  discipline: DisciplineResult | null;
};

export type TeamSummary = {
  startDate: string;
  endDate: string;
  teamId: string | null;
  teamName: string | null;
  brokers: BrokerStats[];
  teamTotals: Record<MetricKey, number>;
  teamReportCount: number;
  rankings: Record<MetricKey, { userId: string; fullName: string; value: number }[]>;
  teamExpectedWorkingDays: number;
  teamSubmittedDays: number;
  teamCompletionPct: number | null;
};

function emptyTotals(): Record<MetricKey, number> {
  const t: Record<string, number> = {};
  METRIC_KEYS.forEach((k) => {
    t[k] = 0;
  });
  return t as Record<MetricKey, number>;
}

function aggregateReports(reports: DailyReportRecord[]): Record<MetricKey, number> {
  const totals = emptyTotals();
  reports.forEach((r) => {
    METRIC_KEYS.forEach((key) => {
      totals[key] += (r[key] as number) ?? 0;
    });
  });
  return totals;
}

export function buildTeamSummary(
  users: UserRecord[],
  reportsByUserId: Map<string, DailyReportRecord[]>,
  disciplineByUserId: Map<string, DisciplineResult>,
  startDate: string,
  endDate: string,
  teamId: string | null,
  teamName: string | null,
): TeamSummary {
  const brokers: BrokerStats[] = users.map((user) => {
    const reports = reportsByUserId.get(user.userId) ?? [];
    const totals = aggregateReports(reports);
    const discipline = disciplineByUserId.get(user.userId) ?? null;
    return {
      user,
      reports,
      totals,
      reportCount: reports.length,
      discipline,
    };
  });

  const teamTotals = emptyTotals();
  let teamReportCount = 0;
  let teamExpectedWorkingDays = 0;
  let teamSubmittedDays = 0;
  brokers.forEach((b) => {
    METRIC_KEYS.forEach((key) => {
      teamTotals[key] += b.totals[key];
    });
    teamReportCount += b.reportCount;
    if (b.discipline) {
      teamExpectedWorkingDays += b.discipline.expectedWorkingDays;
      teamSubmittedDays += b.discipline.submittedDays;
    }
  });

  const teamCompletionPct =
    teamExpectedWorkingDays > 0
      ? Math.round((teamSubmittedDays / teamExpectedWorkingDays) * 1000) / 10
      : null;

  const rankings: TeamSummary["rankings"] = {} as TeamSummary["rankings"];
  METRIC_KEYS.forEach((metricKey) => {
    const list = brokers
      .map((b) => ({
        userId: b.user.userId,
        fullName: b.user.fullName,
        value: b.totals[metricKey],
      }))
      .sort((a, b) => b.value - a.value);
    rankings[metricKey] = list;
  });

  return {
    startDate,
    endDate,
    teamId,
    teamName,
    brokers,
    teamTotals,
    teamReportCount,
    rankings,
    teamExpectedWorkingDays,
    teamSubmittedDays,
    teamCompletionPct,
  };
}

export function getTeamBuyerConversions(summary: TeamSummary) {
  return calculateBuyerConversions(summary.teamTotals as BuyerSellerTotals);
}

export function getTeamSellerConversions(summary: TeamSummary) {
  return calculateSellerConversions(summary.teamTotals as BuyerSellerTotals);
}
