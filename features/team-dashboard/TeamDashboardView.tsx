"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { TeamDashboardData } from "./team-actions";

type Props = {
  data: TeamDashboardData;
  startDate: string;
  endDate: string;
};

export function TeamDashboardView({ data, startDate, endDate }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setPeriod(start: string, end: string) {
    const p = new URLSearchParams(searchParams.toString());
    p.set("start", start);
    p.set("end", end);
    router.push(`/dashboard/team?${p.toString()}`);
  }

  const { summary, buyerConversions, sellerConversions } = data;
  const s = summary;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          {s.teamName ? `Team: ${s.teamName}` : "All teams"} · {s.startDate} – {s.endDate} ·{" "}
          {s.teamReportCount} reports
          {" · "}
          <a
            href={`/api/export/pdf/team?start=${startDate}&end=${endDate}`}
            className="text-sky-600 hover:underline"
          >
            Export PDF
          </a>
        </p>
        <PeriodQuickSelect startDate={startDate} endDate={endDate} onSelect={setPeriod} />
      </div>

      {(s.brokers.some((b) => (b.discipline?.completionPct ?? 100) < 80 || (b.discipline?.missedDates?.length ?? 0) > 0) ||
        s.rankings.buyer_incoming_lead_total.length > 0) && (
        <div className="grid gap-3 md:grid-cols-2">
          {s.brokers.some((b) => (b.discipline?.completionPct ?? 100) < 80 || (b.discipline?.missedDates?.length ?? 0) > 0) && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                At risk / Пропуски отчётов
              </h2>
              <ul className="mt-2 space-y-1 text-xs text-amber-900">
                {s.brokers
                  .filter((b) => (b.discipline?.completionPct ?? 100) < 80 || (b.discipline?.missedDates?.length ?? 0) > 0)
                  .map((b) => (
                    <li key={b.user.userId}>
                      {b.user.fullName}: {b.discipline?.completionPct ?? 0}% submitted
                      {(b.discipline?.missedDates?.length ?? 0) > 0 &&
                        ` · ${b.discipline?.missedDates?.length ?? 0} missed`}
                    </li>
                  ))}
              </ul>
            </div>
          )}
          {s.rankings.buyer_incoming_lead_total.length > 0 && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                Top by leads
              </h2>
              <ol className="mt-2 list-decimal space-y-0.5 pl-4 text-xs text-emerald-900">
                {s.rankings.buyer_incoming_lead_total.slice(0, 5).map((r) => (
                  <li key={r.userId}>{r.fullName}: {r.value}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Leads" value={s.teamTotals.buyer_incoming_lead_total} />
        <KpiCard label="Meetings" value={s.teamTotals.buyer_meeting_held} />
        <KpiCard label="Bookings" value={s.teamTotals.buyer_number_of_bookings} />
        <KpiCard
          label="Sales amount"
          value={s.teamTotals.seller_total_sales_amount}
          format="money"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Buyer funnel
          </h2>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {buyerConversions.map((c) => (
              <div key={c.key} className="flex justify-between rounded bg-slate-50 px-2 py-1">
                <span className="text-slate-600">{c.label}</span>
                <span className="font-medium text-slate-800">
                  {c.value != null ? (c.value <= 1 ? `${(c.value * 100).toFixed(0)}%` : c.value.toFixed(2)) : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Seller funnel
          </h2>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {sellerConversions.map((c) => (
              <div key={c.key} className="flex justify-between rounded bg-slate-50 px-2 py-1">
                <span className="text-slate-600">{c.label}</span>
                <span className="font-medium text-slate-800">
                  {c.value != null ? (c.value <= 1 ? `${(c.value * 100).toFixed(0)}%` : c.value.toFixed(2)) : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <h2 className="border-b border-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Brokers
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-xs">
            <thead className="bg-slate-50 text-left text-[11px] font-semibold text-slate-600">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Reports</th>
                <th className="px-3 py-2">Discipline %</th>
                <th className="px-3 py-2">Leads</th>
                <th className="px-3 py-2">Meetings</th>
                <th className="px-3 py-2">Bookings</th>
                <th className="px-3 py-2">Sales</th>
              </tr>
            </thead>
            <tbody>
              {s.brokers.map((b) => (
                <tr key={b.user.userId} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-900">{b.user.fullName}</td>
                  <td className="px-3 py-2 text-slate-700">{b.reportCount}</td>
                  <td className="px-3 py-2">
                    {b.discipline?.completionPct != null
                      ? `${b.discipline.completionPct}%`
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-slate-700">{b.totals.buyer_incoming_lead_total}</td>
                  <td className="px-3 py-2 text-slate-700">{b.totals.buyer_meeting_held}</td>
                  <td className="px-3 py-2 text-slate-700">{b.totals.buyer_number_of_bookings}</td>
                  <td className="px-3 py-2 text-slate-700">
                    {b.totals.seller_total_sales_amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Rankings (top by metric)
        </h2>
        <div className="flex flex-wrap gap-4 text-[11px]">
          {(["buyer_incoming_lead_total", "buyer_meeting_held", "buyer_number_of_bookings", "seller_total_sales_amount"] as const).map((key) => (
            <div key={key} className="min-w-[140px] rounded bg-slate-50 p-2">
              <p className="mb-1 font-semibold text-slate-600">
                {key.replace(/_/g, " ")}
              </p>
              <ol className="list-decimal pl-4">
                {s.rankings[key].slice(0, 5).map((r) => (
                  <li key={r.userId}>
                    {r.fullName}: {r.value}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  format = "number",
}: {
  label: string;
  value: number;
  format?: "number" | "money";
}) {
  const display =
    format === "money"
      ? value.toLocaleString(undefined, { maximumFractionDigits: 0 })
      : value.toLocaleString();
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{display}</p>
    </div>
  );
}

function PeriodQuickSelect({
  startDate,
  onSelect,
}: {
  startDate: string;
  endDate: string;
  onSelect: (start: string, end: string) => void;
}) {
  const now = new Date();
  const thisMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const thisMonthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  const lastMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const lastMonthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0));

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-slate-500">Period:</span>
      <button
        type="button"
        onClick={() =>
          onSelect(thisMonthStart.toISOString().slice(0, 10), thisMonthEnd.toISOString().slice(0, 10))
        }
        className={`rounded px-2 py-1 ${startDate === thisMonthStart.toISOString().slice(0, 10) ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
      >
        This month
      </button>
      <button
        type="button"
        onClick={() =>
          onSelect(lastMonthStart.toISOString().slice(0, 10), lastMonthEnd.toISOString().slice(0, 10))
        }
        className={`rounded px-2 py-1 ${startDate === lastMonthStart.toISOString().slice(0, 10) ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
      >
        Last month
      </button>
    </div>
  );
}
