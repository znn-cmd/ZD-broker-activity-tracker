"use client";

import type { DailyReportWithPlanning } from "./report-actions";
import { getPaceStatus } from "@/config/scoring";

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

  const { paceStats } = state;
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

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Live performance / План и темп
      </h3>
      <div className="space-y-2">
        {paceStats.map((p) => {
          const status = getPaceStatus(p.paceAttainmentPct ?? null);
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
              key={p.metricKey}
              className={`rounded-lg border p-2 text-xs ${statusClass}`}
            >
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 shrink-0 rounded-full ${statusDot}`} />
                <span className="font-medium text-slate-700">
                  {p.metricKey.replace(/_/g, " ")}
                </span>
              </div>
              <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-slate-600">
                <span>Plan: {p.monthlyPlan}</span>
                <span>Actual: {p.actualMonthToDate}</span>
                <span>Pace: {p.paceAttainmentPct != null ? `${p.paceAttainmentPct.toFixed(0)}%` : "—"}</span>
                <span>Target/day: {p.dailyBaselineMinimumTarget.toFixed(1)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
