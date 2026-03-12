import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { listReportsByUserAndDateRange } from "@/lib/repositories/reports-repository";
import { getAllUsers } from "@/lib/repositories/users-repository";
import { getDisciplineForPeriod } from "@/analytics/discipline";
import { computeScore } from "@/analytics/scoring";
import { buildPersonalReportPdf } from "@/server/services/pdf-export";
import type { MetricKey } from "@/types/domain";

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

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
  if (!token?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = token.sub;
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("start");
  const endDate = searchParams.get("end");
  if (!startDate || !endDate) {
    return NextResponse.json({ error: "start and end required" }, { status: 400 });
  }

  const [reports, allUsers] = await Promise.all([
    listReportsByUserAndDateRange({ userId, startDate, endDate }),
    getAllUsers(),
  ]);
  const user = allUsers.find((u) => u.userId === userId);
  const userName = user?.fullName || user?.username || "User";

  const discipline = await getDisciplineForPeriod(userId, startDate, endDate, reports);
  const totals = aggregateTotals(reports);
  const score = computeScore({
    reports,
    disciplinePct: discipline.completionPct,
    planCompletionPct: null,
  });

  const pdfBuffer = buildPersonalReportPdf({
    userName,
    startDate,
    endDate,
    totals,
    reportCount: reports.length,
    score,
    disciplinePct: discipline.completionPct,
  });

  return new NextResponse(pdfBuffer as unknown as globalThis.BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="report-${startDate}-${endDate}.pdf"`,
    },
  });
}
