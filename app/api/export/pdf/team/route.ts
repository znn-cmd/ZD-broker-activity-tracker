import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { UserRole } from "@/types/domain";
import { getTeamScopeUsers } from "@/features/team-dashboard/team-actions";
import { listReportsForUsersInDateRange } from "@/lib/repositories/reports-repository";
import { buildTeamReportPdf } from "@/server/services/pdf-export";
import type { MetricKey } from "@/types/domain";

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

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
  if (!token?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = token.role as UserRole;
  if (role !== UserRole.Head && role !== UserRole.Admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("start");
  const endDate = searchParams.get("end");
  if (!startDate || !endDate) {
    return NextResponse.json({ error: "start and end required" }, { status: 400 });
  }

  const { users, teamName } = await getTeamScopeUsers();
  if (users.length === 0) {
    return NextResponse.json({ error: "No team data" }, { status: 400 });
  }

  const userIds = users.map((u) => u.userId);
  const reports = await listReportsForUsersInDateRange({
    userIds,
    startDate,
    endDate,
  });

  const teamTotals: Record<string, number> = {};
  METRIC_KEYS.forEach((k) => {
    teamTotals[k] = 0;
  });
  reports.forEach((r) => {
    METRIC_KEYS.forEach((k) => {
      teamTotals[k] += (r[k] as number) ?? 0;
    });
  });

  const pdfBuffer = buildTeamReportPdf({
    teamName,
    startDate,
    endDate,
    teamTotals,
    brokerCount: users.length,
    totalReports: reports.length,
  });

  return new NextResponse(pdfBuffer as unknown as globalThis.BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="team-report-${startDate}-${endDate}.pdf"`,
    },
  });
}
