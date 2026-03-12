"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { MissedReportsRow } from "./missed-reports-actions";

type Props = {
  rows: MissedReportsRow[];
  startDate: string;
  endDate: string;
};

export function MissedReportsView({ rows, startDate, endDate }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setPeriod(start: string, end: string) {
    const p = new URLSearchParams(searchParams.toString());
    p.set("start", start);
    p.set("end", end);
    router.push(`/dashboard/missed-reports?${p.toString()}`);
  }

  const now = new Date();
  const thisMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const thisMonthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  const lastMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const lastMonthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          Period: {startDate} – {endDate}
        </p>
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={() =>
              setPeriod(thisMonthStart.toISOString().slice(0, 10), thisMonthEnd.toISOString().slice(0, 10))
            }
            className={`rounded px-2 py-1 ${startDate === thisMonthStart.toISOString().slice(0, 10) ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
          >
            This month
          </button>
          <button
            type="button"
            onClick={() =>
              setPeriod(lastMonthStart.toISOString().slice(0, 10), lastMonthEnd.toISOString().slice(0, 10))
            }
            className={`rounded px-2 py-1 ${startDate === lastMonthStart.toISOString().slice(0, 10) ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
          >
            Last month
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full border-collapse text-xs">
          <thead className="bg-slate-50 text-left text-[11px] font-semibold text-slate-600">
            <tr>
              <th className="px-3 py-2">Broker</th>
              <th className="px-3 py-2">Team</th>
              <th className="px-3 py-2">Expected days</th>
              <th className="px-3 py-2">Submitted</th>
              <th className="px-3 py-2">Missed</th>
              <th className="px-3 py-2">Completion %</th>
              <th className="px-3 py-2">Missed dates</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ user, discipline }) => (
              <tr key={user.userId} className="border-t border-slate-100">
                <td className="px-3 py-2 font-medium text-slate-900">{user.fullName}</td>
                <td className="px-3 py-2 text-slate-600">{user.teamName ?? "—"}</td>
                <td className="px-3 py-2 text-slate-700">{discipline.expectedWorkingDays}</td>
                <td className="px-3 py-2 text-slate-700">{discipline.submittedDays}</td>
                <td className="px-3 py-2">
                  <span className={discipline.missedDates.length > 0 ? "font-medium text-amber-600" : "text-slate-700"}>
                    {discipline.missedDates.length}
                  </span>
                </td>
                <td className="px-3 py-2">
                  {discipline.completionPct != null ? (
                    <span className={discipline.completionPct < 100 ? "text-amber-600" : "text-slate-700"}>
                      {discipline.completionPct}%
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="max-w-[200px] px-3 py-2 text-[11px] text-slate-600">
                  {discipline.missedDates.length > 0
                    ? discipline.missedDates.slice(0, 10).join(", ") +
                      (discipline.missedDates.length > 10 ? "…" : "")
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
