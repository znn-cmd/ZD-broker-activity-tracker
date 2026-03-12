import type { DailyReportRecord, MetricKey } from "@/types/domain";
import type { MetricPaceStats } from "./planning";
import {
  calculateBuyerConversions,
  calculateSellerConversions,
  type ConversionMetric,
} from "./conversions";
import { computeScore, type ScoreResult } from "./scoring";

export type PeriodType = "day" | "week" | "month" | "year" | "custom";

export type DailyPoint = {
  date: string;
  buyer_incoming_lead_total: number;
  buyer_meeting_held: number;
  buyer_number_of_bookings: number;
  seller_number_of_cold_calls: number;
  seller_sold_objects: number;
  seller_total_sales_amount: number;
  score?: number;
};

export type PeriodComparison = {
  previousStart: string;
  previousEnd: string;
  deltaLeads: number;
  deltaMeetings: number;
  deltaBookings: number;
  deltaSales: number;
  pctLeads: number | null;
  pctMeetings: number | null;
  pctBookings: number | null;
  pctSales: number | null;
};

export type BestWorstDay = {
  date: string;
  leads: number;
  meetings: number;
  bookings: number;
  sales: number;
};

export type PersonalAnalyticsSummary = {
  periodType: PeriodType;
  startDate: string;
  endDate: string;
  totals: Record<MetricKey, number>;
  buyerConversions: ConversionMetric[];
  sellerConversions: ConversionMetric[];
  dailySeries: DailyPoint[];
  totalReports: number;
  score: ScoreResult | null;
  disciplinePct: number | null;
  comparison: PeriodComparison | null;
  bestDay: BestWorstDay | null;
  worstDay: BestWorstDay | null;
};

export function buildPersonalAnalyticsSummary(options: {
  reports: DailyReportRecord[];
  periodType: PeriodType;
  startDate: string;
  endDate: string;
  paceStats?: MetricPaceStats[];
  disciplinePct?: number | null;
  previousTotals?: Record<MetricKey, number>;
  previousStart?: string;
  previousEnd?: string;
}): PersonalAnalyticsSummary {
  const {
    reports,
    periodType,
    startDate,
    endDate,
    paceStats,
    disciplinePct = null,
    previousTotals,
    previousStart,
    previousEnd,
  } = options;

  const totals: Record<MetricKey, number> = {
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
  };

  const byDate: Record<string, DailyPoint> = {};

  reports.forEach((report) => {
    (Object.keys(totals) as MetricKey[]).forEach((key) => {
      const value = report[key] as number;
      totals[key] += value ?? 0;
    });

    const date = report.reportDate;
    if (!byDate[date]) {
      byDate[date] = {
        date,
        buyer_incoming_lead_total: 0,
        buyer_meeting_held: 0,
        buyer_number_of_bookings: 0,
        seller_number_of_cold_calls: 0,
        seller_sold_objects: 0,
        seller_total_sales_amount: 0,
      };
    }
    byDate[date].buyer_incoming_lead_total +=
      report.buyer_incoming_lead_total ?? 0;
    byDate[date].buyer_meeting_held += report.buyer_meeting_held ?? 0;
    byDate[date].buyer_number_of_bookings +=
      report.buyer_number_of_bookings ?? 0;
    byDate[date].seller_number_of_cold_calls +=
      report.seller_number_of_cold_calls ?? 0;
    byDate[date].seller_sold_objects += report.seller_sold_objects ?? 0;
    byDate[date].seller_total_sales_amount +=
      report.seller_total_sales_amount ?? 0;
  });

  let dailySeries = Object.values(byDate).sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  const planCompletionPct =
    paceStats && paceStats.length > 0
      ? paceStats.reduce((s, p) => s + (p.planCompletionPct ?? 0), 0) / paceStats.length
      : null;

  const score = computeScore({
    reports,
    disciplinePct,
    planCompletionPct,
    referenceTotals: previousTotals,
  });

  dailySeries = dailySeries.map((p) => {
    const dayReports = reports.filter((r) => r.reportDate === p.date);
    const dayScore = computeScore({
      reports: dayReports,
      disciplinePct: 100,
      planCompletionPct: null,
    });
    return { ...p, score: dayScore.total };
  });

  let comparison: PeriodComparison | null = null;
  if (previousTotals && previousStart && previousEnd) {
    const prev = previousTotals;
    comparison = {
      previousStart,
      previousEnd,
      deltaLeads: totals.buyer_incoming_lead_total - (prev.buyer_incoming_lead_total ?? 0),
      deltaMeetings: totals.buyer_meeting_held - (prev.buyer_meeting_held ?? 0),
      deltaBookings: totals.buyer_number_of_bookings - (prev.buyer_number_of_bookings ?? 0),
      deltaSales: totals.seller_total_sales_amount - (prev.seller_total_sales_amount ?? 0),
      pctLeads:
        (prev.buyer_incoming_lead_total ?? 0) > 0
          ? ((totals.buyer_incoming_lead_total - (prev.buyer_incoming_lead_total ?? 0)) /
              (prev.buyer_incoming_lead_total ?? 1)) *
            100
          : null,
      pctMeetings:
        (prev.buyer_meeting_held ?? 0) > 0
          ? ((totals.buyer_meeting_held - (prev.buyer_meeting_held ?? 0)) /
              (prev.buyer_meeting_held ?? 1)) *
            100
          : null,
      pctBookings:
        (prev.buyer_number_of_bookings ?? 0) > 0
          ? ((totals.buyer_number_of_bookings - (prev.buyer_number_of_bookings ?? 0)) /
              (prev.buyer_number_of_bookings ?? 1)) *
            100
          : null,
      pctSales:
        (prev.seller_total_sales_amount ?? 0) > 0
          ? ((totals.seller_total_sales_amount - (prev.seller_total_sales_amount ?? 0)) /
              (prev.seller_total_sales_amount ?? 1)) *
            100
          : null,
    };
  }

  let bestDay: PersonalAnalyticsSummary["bestDay"] = null;
  let worstDay: PersonalAnalyticsSummary["worstDay"] = null;
  if (dailySeries.length > 0) {
    const byLeads = [...dailySeries].sort(
      (a, b) => b.buyer_incoming_lead_total - a.buyer_incoming_lead_total,
    );
    bestDay = {
      date: byLeads[0].date,
      leads: byLeads[0].buyer_incoming_lead_total,
      meetings: byLeads[0].buyer_meeting_held,
      bookings: byLeads[0].buyer_number_of_bookings,
      sales: byLeads[0].seller_total_sales_amount,
    };
    const withActivity = dailySeries.filter(
      (d) =>
        d.buyer_incoming_lead_total > 0 ||
        d.seller_total_sales_amount > 0,
    );
    worstDay =
      withActivity.length > 0
        ? (() => {
            const w = withActivity.sort(
              (a, b) =>
                a.buyer_incoming_lead_total - b.buyer_incoming_lead_total ||
                a.seller_total_sales_amount - b.seller_total_sales_amount,
            )[0];
            return {
              date: w.date,
              leads: w.buyer_incoming_lead_total,
              meetings: w.buyer_meeting_held,
              bookings: w.buyer_number_of_bookings,
              sales: w.seller_total_sales_amount,
            };
          })()
        : {
            date: dailySeries[dailySeries.length - 1].date,
            leads: 0,
            meetings: 0,
            bookings: 0,
            sales: 0,
          };
  }

  const buyerConversions = calculateBuyerConversions(totals);
  const sellerConversions = calculateSellerConversions(totals);

  return {
    periodType,
    startDate,
    endDate,
    totals,
    buyerConversions,
    sellerConversions,
    dailySeries,
    totalReports: reports.length,
    score,
    disciplinePct,
    comparison,
    bestDay,
    worstDay,
  };
}

