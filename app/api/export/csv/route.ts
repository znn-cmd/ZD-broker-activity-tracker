import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { listReportsByUserAndDateRange } from "@/lib/repositories/reports-repository";
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
    return NextResponse.json({ error: "start and end date required" }, { status: 400 });
  }

  const reports = await listReportsByUserAndDateRange({
    userId,
    startDate,
    endDate,
  });

  const header =
    "report_date,buyer_incoming_lead_total,buyer_contact_established,buyer_qualified,buyer_agents,buyer_meeting_confirmed,buyer_meeting_held,buyer_number_of_bookings,buyer_booking_commission_amount,seller_incoming_requests,seller_number_of_cold_calls,seller_requested_documents,seller_sent_contract,seller_objects_entered_xoms,seller_listed_property,seller_sold_objects,seller_total_sales_amount";
  const rows = reports.map(
    (r) =>
      [
        r.reportDate,
        r.buyer_incoming_lead_total,
        r.buyer_contact_established,
        r.buyer_qualified,
        r.buyer_agents,
        r.buyer_meeting_confirmed,
        r.buyer_meeting_held,
        r.buyer_number_of_bookings,
        r.buyer_booking_commission_amount,
        r.seller_incoming_requests,
        r.seller_number_of_cold_calls,
        r.seller_requested_documents,
        r.seller_sent_contract,
        r.seller_objects_entered_xoms,
        r.seller_listed_property,
        r.seller_sold_objects,
        r.seller_total_sales_amount,
      ].join(","),
  );
  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reports-${startDate}-${endDate}.csv"`,
    },
  });
}
