import type { DailyReportRecord, MetricKey } from "@/types/domain";
import type { MetricPaceStats } from "./planning";
import {
  calculateBuyerConversions,
  calculateSellerConversions,
  type ConversionMetric,
} from "./conversions";

export type PeriodType = "day" | "week" | "month" | "year" | "custom";

export type DailyPoint = {
  date: string;
  buyer_incoming_lead_total: number;
  buyer_meeting_held: number;
  buyer_number_of_bookings: number;
  seller_number_of_cold_calls: number;
  seller_sold_objects: number;
  seller_total_sales_amount: number;
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
};

export function buildPersonalAnalyticsSummary(options: {
  reports: DailyReportRecord[];
  periodType: PeriodType;
  startDate: string;
  endDate: string;
  paceStats?: MetricPaceStats[];
}): PersonalAnalyticsSummary {
  const { reports, periodType, startDate, endDate } = options;

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

  const dailySeries = Object.values(byDate).sort((a, b) =>
    a.date.localeCompare(b.date),
  );

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
  };
}

