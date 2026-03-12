import type { MetricKey } from "@/types/domain";

export type ConversionMetric = {
  key: string;
  label: string;
  value: number | null;
};

export type BuyerSellerTotals = Record<MetricKey, number>;

export function calculateBuyerConversions(
  totals: BuyerSellerTotals,
): ConversionMetric[] {
  const leads = totals.buyer_incoming_lead_total ?? 0;
  const contacts = totals.buyer_contact_established ?? 0;
  const qualified = totals.buyer_qualified ?? 0;
  const meetingsConfirmed = totals.buyer_meeting_confirmed ?? 0;
  const meetingsHeld = totals.buyer_meeting_held ?? 0;
  const bookings = totals.buyer_number_of_bookings ?? 0;
  const bookingCommission = totals.buyer_booking_commission_amount ?? 0;

  const contactRate = safeRate(contacts, leads);
  const qualificationRate = safeRate(qualified, contacts);
  const agentShare = safeRate(totals.buyer_agents ?? 0, qualified);
  const meetingConfirmationRate = safeRate(meetingsConfirmed, qualified);
  const meetingHeldRate = safeRate(meetingsHeld, meetingsConfirmed);
  const bookingFromMeetings = safeRate(bookings, meetingsHeld);
  const bookingFromLeads = safeRate(bookings, leads);
  const avgBookingCommission = safeAverage(bookingCommission, bookings);

  return [
    { key: "buyer_contact_rate", label: "Contact rate", value: contactRate },
    {
      key: "buyer_qualification_rate",
      label: "Qualification rate",
      value: qualificationRate,
    },
    { key: "buyer_agent_share", label: "Agent share", value: agentShare },
    {
      key: "buyer_meeting_confirmation_rate",
      label: "Meeting confirmation rate",
      value: meetingConfirmationRate,
    },
    {
      key: "buyer_meeting_held_rate",
      label: "Meeting held rate",
      value: meetingHeldRate,
    },
    {
      key: "buyer_booking_from_meetings",
      label: "Bookings per meeting",
      value: bookingFromMeetings,
    },
    {
      key: "buyer_booking_from_leads",
      label: "Bookings per lead",
      value: bookingFromLeads,
    },
    {
      key: "buyer_avg_booking_commission",
      label: "Avg booking commission",
      value: avgBookingCommission,
    },
  ];
}

export function calculateSellerConversions(
  totals: BuyerSellerTotals,
): ConversionMetric[] {
  const sellerRequests = totals.seller_incoming_requests ?? 0;
  const requestedDocs = totals.seller_requested_documents ?? 0;
  const sentContract = totals.seller_sent_contract ?? 0;
  const xomsEntries = totals.seller_objects_entered_xoms ?? 0;
  const listed = totals.seller_listed_property ?? 0;
  const sold = totals.seller_sold_objects ?? 0;
  const totalSales = totals.seller_total_sales_amount ?? 0;

  const docsRate = safeRate(requestedDocs, sellerRequests);
  const contractSendRate = safeRate(sentContract, requestedDocs);
  const xomsEntryRate = safeRate(xomsEntries, sentContract);
  const listingConversion = safeRate(listed, xomsEntries);
  const salesConversion = safeRate(sold, listed);
  const avgSalesAmount = safeAverage(totalSales, sold);

  return [
    {
      key: "seller_docs_request_rate",
      label: "Docs request rate",
      value: docsRate,
    },
    {
      key: "seller_contract_send_rate",
      label: "Contract send rate",
      value: contractSendRate,
    },
    {
      key: "seller_xoms_entry_rate",
      label: "Xoms entry rate",
      value: xomsEntryRate,
    },
    {
      key: "seller_listing_conversion",
      label: "Listing conversion",
      value: listingConversion,
    },
    {
      key: "seller_sales_conversion",
      label: "Sales conversion",
      value: salesConversion,
    },
    {
      key: "seller_avg_sales_amount",
      label: "Avg sales amount per sold",
      value: avgSalesAmount,
    },
  ];
}

function safeRate(numerator: number, denominator: number): number | null {
  if (!denominator || denominator <= 0) return null;
  return numerator / denominator;
}

function safeAverage(total: number, count: number): number | null {
  if (!count || count <= 0) return null;
  return total / count;
}

