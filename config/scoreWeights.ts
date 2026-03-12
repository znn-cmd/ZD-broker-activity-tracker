import type { MetricKey } from "@/types/domain";

/** Weights for score components (sum should be 1 or we normalize). */
export type ScoreWeights = {
  buyerActivity: number;
  buyerResult: number;
  sellerActivity: number;
  sellerResult: number;
  planAdherence: number;
  reportingDiscipline: number;
};

export const DEFAULT_SCORE_WEIGHTS: ScoreWeights = {
  buyerActivity: 0.15,
  buyerResult: 0.2,
  sellerActivity: 0.15,
  sellerResult: 0.25,
  planAdherence: 0.15,
  reportingDiscipline: 0.1,
};

/** Metric keys that contribute to buyer activity (normalized). */
export const BUYER_ACTIVITY_METRICS: MetricKey[] = [
  "buyer_incoming_lead_total",
  "buyer_contact_established",
  "buyer_qualified",
  "buyer_meeting_confirmed",
  "buyer_meeting_held",
];

/** Metric keys that contribute to buyer result. */
export const BUYER_RESULT_METRICS: MetricKey[] = [
  "buyer_number_of_bookings",
  "buyer_booking_commission_amount",
];

/** Metric keys for seller activity. */
export const SELLER_ACTIVITY_METRICS: MetricKey[] = [
  "seller_incoming_requests",
  "seller_number_of_cold_calls",
  "seller_requested_documents",
  "seller_sent_contract",
  "seller_objects_entered_xoms",
  "seller_listed_property",
];

/** Metric keys for seller result. */
export const SELLER_RESULT_METRICS: MetricKey[] = [
  "seller_sold_objects",
  "seller_total_sales_amount",
];
