"use client";

import type { DailyReportWithPlanning } from "./report-actions";
import { getPaceStatus } from "@/config/scoring";
import type { MetricKey } from "@/types/domain";

type Props = {
  state: DailyReportWithPlanning | null;
};

export function LivePerformancePanel({ state }: Props) {
  if (!state) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
        <p className="text-xs text-slate-500">
          Select a date and load the report to see pace and plan tracking.
        </p>
      </div>
    );
  }

  const { report, paceStats } = state;
  if (paceStats.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Live performance
        </h3>
        <p className="mt-2 text-xs text-slate-500">
          Set monthly plans in Plans to see pace and targets here.
        </p>
      </div>
    );
  }

  const byMetric = new Map<MetricKey, (typeof paceStats)[number]>();
  paceStats.forEach((p) => byMetric.set(p.metricKey, p));

  function getMetricPace(metricKey: MetricKey) {
    const p = byMetric.get(metricKey);
    if (!p) {
      return {
        stat: null,
        pacePct: null as number | null,
        status: getPaceStatus(null),
      };
    }
    const pacePct =
      p.paceAttainmentPct != null ? p.paceAttainmentPct * 100 : null;
    return {
      stat: p,
      pacePct,
      status: getPaceStatus(pacePct),
    };
  }

  const kpiMetrics: {
    metricKey: MetricKey;
    label: string;
    value: number;
  }[] = [
    {
      metricKey: "buyer_incoming_lead_total",
      label: "Leads today / Лиды за день",
      value: report?.buyer_incoming_lead_total ?? 0,
    },
    {
      metricKey: "buyer_meeting_held",
      label: "Meetings today / Встречи за день",
      value: report?.buyer_meeting_held ?? 0,
    },
    {
      metricKey: "seller_number_of_cold_calls",
      label: "Cold calls / Холодные звонки",
      value: report?.seller_number_of_cold_calls ?? 0,
    },
    {
      metricKey: "seller_total_sales_amount",
      label: "Sales amount / Продажи за день",
      value: report?.seller_total_sales_amount ?? 0,
    },
  ];

  const planRows: {
    metricKey: MetricKey;
    label: string;
  }[] = [
    { metricKey: "buyer_incoming_lead_total", label: "Incoming leads" },
    { metricKey: "buyer_meeting_held", label: "Buyer meetings held" },
    { metricKey: "buyer_number_of_bookings", label: "Bookings" },
    { metricKey: "seller_number_of_cold_calls", label: "Cold calls" },
    { metricKey: "seller_listed_property", label: "Listed properties" },
    { metricKey: "seller_sold_objects", label: "Sold objects" },
    { metricKey: "seller_total_sales_amount", label: "Sales amount" },
  ];

  function safeRate(numerator: number, denominator: number): number | null {
    if (!Number.isFinite(denominator) || denominator <= 0) return null;
    return (numerator / denominator) * 100;
  }

  const r = report;

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Live performance / План и темп
      </h3>

      {/* KPI row */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {kpiMetrics.map(({ metricKey, label, value }) => {
          const { stat, pacePct, status } = getMetricPace(metricKey);
          const statusClass =
            status === "green"
              ? "border-emerald-200 bg-emerald-50"
              : status === "yellow"
                ? "border-amber-200 bg-amber-50"
                : status === "red"
                  ? "border-red-200 bg-red-50"
                  : "border-slate-200 bg-slate-50";
          const statusDot =
            status === "green"
              ? "bg-emerald-500"
              : status === "yellow"
                ? "bg-amber-500"
                : status === "red"
                  ? "bg-red-500"
                  : "bg-slate-400";
          return (
            <div
              key={metricKey}
              className={`rounded-lg border p-3 text-xs ${statusClass}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-medium text-slate-700">
                  {label}
                </p>
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${statusDot}`}
                />
              </div>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {metricKey === "seller_total_sales_amount"
                  ? value.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })
                  : value}
              </p>
              {stat && (
                <p className="mt-1 text-[10px] text-slate-600">
                  MTD {stat.actualMonthToDate} · Pace{" "}
                  {pacePct != null ? `${pacePct.toFixed(0)}%` : "—"} · Target/day{" "}
                  {stat.dailyBaselineMinimumTarget.toFixed(1)}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Plan vs actual compact table */}
      <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Plan vs actual (MTD) / План vs факт
          </p>
          <p className="text-[10px] text-slate-500">
            Based on month plan and working days
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-[11px] text-slate-700">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100">
                <th className="px-2 py-1 text-left font-semibold">Metric</th>
                <th className="px-2 py-1 text-right font-semibold">Actual MTD</th>
                <th className="px-2 py-1 text-right font-semibold">
                  Expected by now
                </th>
                <th className="px-2 py-1 text-right font-semibold">Pace</th>
              </tr>
            </thead>
            <tbody>
              {planRows.map(({ metricKey, label }) => {
                const { stat, pacePct, status } = getMetricPace(metricKey);
                if (!stat) return null;
                const rowStatusClass =
                  status === "green"
                    ? "bg-emerald-50/70"
                    : status === "yellow"
                      ? "bg-amber-50/70"
                      : status === "red"
                        ? "bg-red-50/60"
                        : "";
                return (
                  <tr
                    key={metricKey}
                    className={`border-t border-slate-100 ${rowStatusClass}`}
                  >
                    <td className="px-2 py-1">{label}</td>
                    <td className="px-2 py-1 text-right">
                      {stat.actualMonthToDate.toFixed(1)}
                    </td>
                    <td className="px-2 py-1 text-right">
                      {stat.expectedActualByNow.toFixed(1)}
                    </td>
                    <td className="px-2 py-1 text-right">
                      {pacePct != null ? `${pacePct.toFixed(0)}%` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Conversions / funnels */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Buyer funnel / Воронка покупателей (день)
          </p>
          {r ? (
            <ul className="mt-2 space-y-1 text-[11px] text-slate-700">
              <li>
                Contact rate:{" "}
                {formatPct(
                  safeRate(
                    r.buyer_contact_established,
                    r.buyer_incoming_lead_total,
                  ),
                )}
              </li>
              <li>
                Qualification rate:{" "}
                {formatPct(
                  safeRate(r.buyer_qualified, r.buyer_contact_established),
                )}
              </li>
              <li>
                Meeting held rate:{" "}
                {formatPct(
                  safeRate(r.buyer_meeting_held, r.buyer_meeting_confirmed),
                )}
              </li>
              <li>
                Bookings per meeting:{" "}
                {formatPct(
                  safeRate(
                    r.buyer_number_of_bookings,
                    r.buyer_meeting_held,
                  ),
                )}
              </li>
              <li>
                Bookings per lead:{" "}
                {formatPct(
                  safeRate(
                    r.buyer_number_of_bookings,
                    r.buyer_incoming_lead_total,
                  ),
                )}
              </li>
            </ul>
          ) : (
            <p className="mt-2 text-[11px] text-slate-500">
              Save report to see daily conversions.
            </p>
          )}
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Seller funnel / Воронка продавцов (день)
          </p>
          {r ? (
            <ul className="mt-2 space-y-1 text-[11px] text-slate-700">
              <li>
                Docs request rate:{" "}
                {formatPct(
                  safeRate(
                    r.seller_requested_documents,
                    r.seller_incoming_requests,
                  ),
                )}
              </li>
              <li>
                Contract send rate:{" "}
                {formatPct(
                  safeRate(r.seller_sent_contract, r.seller_requested_documents),
                )}
              </li>
              <li>
                Listing conversion:{" "}
                {formatPct(
                  safeRate(
                    r.seller_listed_property,
                    r.seller_sent_contract,
                  ),
                )}
              </li>
              <li>
                Sales conversion:{" "}
                {formatPct(
                  safeRate(
                    r.seller_sold_objects,
                    r.seller_listed_property,
                  ),
                )}
              </li>
              <li>
                Avg sales amount per sold:{" "}
                {r.seller_sold_objects > 0
                  ? (
                      r.seller_total_sales_amount / r.seller_sold_objects
                    ).toFixed(0)
                  : "—"}
              </li>
            </ul>
          ) : (
            <p className="mt-2 text-[11px] text-slate-500">
              Save report to see daily conversions.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function formatPct(value: number | null): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value.toFixed(0)}%`;
}
