import { jsPDF } from "jspdf";
import type { ScoreResult } from "@/analytics/scoring";

function addHeader(doc: jsPDF, title: string, period: string) {
  doc.setFontSize(16);
  doc.text("Broker Activity Tracker", 20, 20);
  doc.setFontSize(10);
  doc.text(title, 20, 28);
  doc.text(`Period: ${period}`, 20, 34);
  doc.text(`Generated: ${new Date().toISOString().slice(0, 19)}`, 20, 40);
}

export function buildPersonalReportPdf(options: {
  userName: string;
  startDate: string;
  endDate: string;
  totals: Record<string, number>;
  reportCount: number;
  score: ScoreResult | null;
  disciplinePct: number | null;
}): Uint8Array {
  const doc = new jsPDF();
  const { userName, startDate, endDate, totals, reportCount, score, disciplinePct } = options;

  addHeader(doc, `Personal report: ${userName}`, `${startDate} – ${endDate}`);

  let y = 50;
  doc.setFontSize(11);
  doc.text(`Reports submitted: ${reportCount}`, 20, y);
  y += 8;
  if (disciplinePct != null) {
    doc.text(`Reporting discipline: ${disciplinePct}%`, 20, y);
    y += 8;
  }
  if (score != null) {
    doc.text(`Score: ${score.total} (0–100)`, 20, y);
    y += 8;
  }

  y += 5;
  doc.setFontSize(12);
  doc.text("KPIs", 20, y);
  y += 8;

  doc.setFontSize(10);
  const kpis = [
    ["Leads", String(totals.buyer_incoming_lead_total ?? 0)],
    ["Meetings", String(totals.buyer_meeting_held ?? 0)],
    ["Bookings", String(totals.buyer_number_of_bookings ?? 0)],
    ["Booking commission", String(totals.buyer_booking_commission_amount ?? 0)],
    ["Seller requests", String(totals.seller_incoming_requests ?? 0)],
    ["Cold calls", String(totals.seller_number_of_cold_calls ?? 0)],
    ["Listed", String(totals.seller_listed_property ?? 0)],
    ["Sold objects", String(totals.seller_sold_objects ?? 0)],
    ["Total sales amount", String(totals.seller_total_sales_amount ?? 0)],
  ];
  kpis.forEach(([label, value]) => {
    doc.text(`${label}: ${value}`, 20, y);
    y += 6;
  });

  return new Uint8Array(doc.output("arraybuffer") as ArrayBuffer);
}

export function buildTeamReportPdf(options: {
  teamName: string | null;
  startDate: string;
  endDate: string;
  teamTotals: Record<string, number>;
  brokerCount: number;
  totalReports: number;
}): Uint8Array {
  const doc = new jsPDF();
  const { teamName, startDate, endDate, teamTotals, brokerCount, totalReports } = options;

  addHeader(
    doc,
    teamName ? `Team report: ${teamName}` : "Team report (all)",
    `${startDate} – ${endDate}`,
  );

  let y = 50;
  doc.setFontSize(11);
  doc.text(`Brokers: ${brokerCount}`, 20, y);
  y += 6;
  doc.text(`Total reports: ${totalReports}`, 20, y);
  y += 10;

  doc.setFontSize(12);
  doc.text("Team KPIs", 20, y);
  y += 8;

  doc.setFontSize(10);
  const kpis = [
    ["Leads", String(teamTotals.buyer_incoming_lead_total ?? 0)],
    ["Meetings", String(teamTotals.buyer_meeting_held ?? 0)],
    ["Bookings", String(teamTotals.buyer_number_of_bookings ?? 0)],
    ["Total sales amount", String(teamTotals.seller_total_sales_amount ?? 0)],
  ];
  kpis.forEach(([label, value]) => {
    doc.text(`${label}: ${value}`, 20, y);
    y += 6;
  });

  return new Uint8Array(doc.output("arraybuffer") as ArrayBuffer);
}
