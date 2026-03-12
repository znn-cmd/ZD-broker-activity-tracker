import type { DailyReportRecord, MetricKey } from "@/types/domain";
import type { ScoreWeights } from "@/config/scoreWeights";
import {
  DEFAULT_SCORE_WEIGHTS,
  BUYER_ACTIVITY_METRICS,
  BUYER_RESULT_METRICS,
  SELLER_ACTIVITY_METRICS,
  SELLER_RESULT_METRICS,
} from "@/config/scoreWeights";

export type ScoreBreakdown = {
  buyerActivity: number;
  buyerResult: number;
  sellerActivity: number;
  sellerResult: number;
  planAdherence: number;
  reportingDiscipline: number;
};

export type ScoreResult = {
  total: number;
  breakdown: ScoreBreakdown;
};

function sumMetrics(reports: DailyReportRecord[], keys: MetricKey[]): number {
  let s = 0;
  reports.forEach((r) => {
    keys.forEach((k) => {
      s += (r[k] as number) ?? 0;
    });
  });
  return s;
}

/** Component 0..100 from raw sum and reference (e.g. plan or 1 + max). */
function componentScore(
  rawSum: number,
  reference: number,
): number {
  return Math.min(100, reference > 0 ? (rawSum / reference) * 100 : 0);
}

export function computeScore(options: {
  reports: DailyReportRecord[];
  disciplinePct: number | null;
  planCompletionPct: number | null;
  weights?: Partial<ScoreWeights>;
  /** Reference totals for normalization (e.g. from plan or previous period). */
  referenceTotals?: Partial<Record<MetricKey, number>>;
}): ScoreResult {
  const w: ScoreWeights = { ...DEFAULT_SCORE_WEIGHTS, ...options.weights };
  const ref = options.referenceTotals ?? {};
  const reports = options.reports;

  const buyerActivitySum = sumMetrics(reports, BUYER_ACTIVITY_METRICS);
  const buyerResultSum = sumMetrics(reports, BUYER_RESULT_METRICS);
  const sellerActivitySum = sumMetrics(reports, SELLER_ACTIVITY_METRICS);
  const sellerResultSum = sumMetrics(reports, SELLER_RESULT_METRICS);

  const refBuyerActivity =
    BUYER_ACTIVITY_METRICS.reduce((s, k) => s + ((ref[k] as number) ?? 0), 0) || 20;
  const refBuyerResult =
    BUYER_RESULT_METRICS.reduce((s, k) => s + ((ref[k] as number) ?? 0), 0) || 5;
  const refSellerActivity =
    SELLER_ACTIVITY_METRICS.reduce((s, k) => s + ((ref[k] as number) ?? 0), 0) || 30;
  const refSellerResult =
    SELLER_RESULT_METRICS.reduce((s, k) => s + ((ref[k] as number) ?? 0), 0) || 2;

  const buyerActivity = componentScore(buyerActivitySum, refBuyerActivity);
  const buyerResult = componentScore(buyerResultSum, refBuyerResult);
  const sellerActivity = componentScore(sellerActivitySum, refSellerActivity);
  const sellerResult = componentScore(sellerResultSum, refSellerResult);

  const planAdherence = options.planCompletionPct != null
    ? Math.min(100, options.planCompletionPct)
    : 50;
  const reportingDiscipline = options.disciplinePct != null
    ? Math.min(100, options.disciplinePct)
    : 0;

  const breakdown: ScoreBreakdown = {
    buyerActivity,
    buyerResult,
    sellerActivity,
    sellerResult,
    planAdherence,
    reportingDiscipline,
  };

  const total =
    breakdown.buyerActivity * w.buyerActivity +
    breakdown.buyerResult * w.buyerResult +
    breakdown.sellerActivity * w.sellerActivity +
    breakdown.sellerResult * w.sellerResult +
    breakdown.planAdherence * w.planAdherence +
    breakdown.reportingDiscipline * w.reportingDiscipline;

  const sumWeights =
    w.buyerActivity +
    w.buyerResult +
    w.sellerActivity +
    w.sellerResult +
    w.planAdherence +
    w.reportingDiscipline;
  const normalizedTotal = sumWeights > 0 ? (total / sumWeights) : 0;

  return {
    total: Math.round(Math.min(100, normalizedTotal) * 10) / 10,
    breakdown,
  };
}
