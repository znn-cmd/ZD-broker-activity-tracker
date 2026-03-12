"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { TeamDashboardData } from "./team-actions";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Props = {
  data: TeamDashboardData;
  startDate: string;
  endDate: string;
};

export function TeamDashboardView({ data, startDate, endDate }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedBrokerId, setSelectedBrokerId] = useState<string | "all">(
    "all",
  );

  function setPeriod(start: string, end: string) {
    const p = new URLSearchParams(searchParams.toString());
    p.set("start", start);
    p.set("end", end);
    router.push(`/dashboard/team?${p.toString()}`);
  }

  const { summary, buyerConversions, sellerConversions } = data;
  const s = summary;

  const filteredBrokers = useMemo(() => {
    if (selectedBrokerId === "all") return s.brokers;
    return s.brokers.filter((b) => b.user.userId === selectedBrokerId);
  }, [s.brokers, selectedBrokerId]);

  const teamDailySeries = useMemo(() => {
    const map = new Map<
      string,
      { date: string; leads: number; meetings: number; bookings: number; sales: number }
    >();
    s.brokers.forEach((b) => {
      b.reports.forEach((r) => {
        const key = r.reportDate;
        const existing =
          map.get(key) ??
          { date: key, leads: 0, meetings: 0, bookings: 0, sales: 0 };
        existing.leads += r.buyer_incoming_lead_total ?? 0;
        existing.meetings += r.buyer_meeting_held ?? 0;
        existing.bookings += r.buyer_number_of_bookings ?? 0;
        existing.sales += r.seller_total_sales_amount ?? 0;
        map.set(key, existing);
      });
    });
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [s.brokers]);

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
        <div className="flex flex-wrap items-center gap-3">
          <PeriodQuickSelect
            startDate={startDate}
            endDate={endDate}
            onSelect={setPeriod}
          />
          {s.brokers.length > 1 && (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-500">Broker:</span>
              <select
                value={selectedBrokerId}
                onChange={(e) =>
                  setSelectedBrokerId(e.target.value as string | "all")
                }
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900"
              >
                <option value="all">All</option>
                {s.brokers.map((b) => (
                  <option key={b.user.userId} value={b.user.userId}>
                    {b.user.fullName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="Reports submitted / Expected"
          value={s.teamSubmittedDays}
          secondary={`${s.teamSubmittedDays} / ${s.teamExpectedWorkingDays}`}
        />
        <KpiCard
          label="Report discipline %"
          value={s.teamCompletionPct ?? 0}
          format="percent"
        />
        <KpiCard
          label="Avg reports per broker"
          value={
            s.brokers.length > 0
              ? s.teamReportCount / s.brokers.length
              : 0
          }
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

      {/* Buyer funnel by broker */}
      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Buyer funnel by broker / Воронка покупателей по брокерам
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-[11px] text-slate-700">
            <thead className="bg-slate-50 text-left font-semibold text-slate-600">
              <tr>
                <th className="px-3 py-2">Broker</th>
                <th className="px-3 py-2 text-right">Contact rate</th>
                <th className="px-3 py-2 text-right">Qualification rate</th>
                <th className="px-3 py-2 text-right">Meeting held rate</th>
                <th className="px-3 py-2 text-right">Bookings / meeting</th>
                <th className="px-3 py-2 text-right">Bookings / lead</th>
              </tr>
            </thead>
            <tbody>
              {s.brokers.map((b) => {
                const t = b.totals;
                const contactRate = safeRate(
                  t.buyer_contact_established,
                  t.buyer_incoming_lead_total,
                );
                const qualificationRate = safeRate(
                  t.buyer_qualified,
                  t.buyer_contact_established,
                );
                const meetingHeldRate = safeRate(
                  t.buyer_meeting_held,
                  t.buyer_meeting_confirmed,
                );
                const bookingsPerMeeting = safeRate(
                  t.buyer_number_of_bookings,
                  t.buyer_meeting_held,
                );
                const bookingsPerLead = safeRate(
                  t.buyer_number_of_bookings,
                  t.buyer_incoming_lead_total,
                );
                return (
                  <tr key={b.user.userId} className="border-t border-slate-100">
                    <td className="px-3 py-1 font-medium text-slate-900">
                      {b.user.fullName}
                    </td>
                    <td className="px-3 py-1 text-right">
                      {formatPct(contactRate)}
                    </td>
                    <td className="px-3 py-1 text-right">
                      {formatPct(qualificationRate)}
                    </td>
                    <td className="px-3 py-1 text-right">
                      {formatPct(meetingHeldRate)}
                    </td>
                    <td className="px-3 py-1 text-right">
                      {formatPct(bookingsPerMeeting)}
                    </td>
                    <td className="px-3 py-1 text-right">
                      {formatPct(bookingsPerLead)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Seller funnel by broker */}
      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Seller funnel by broker / Воронка продавцов по брокерам
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-[11px] text-slate-700">
            <thead className="bg-slate-50 text-left font-semibold text-slate-600">
              <tr>
                <th className="px-3 py-2">Broker</th>
                <th className="px-3 py-2 text-right">Docs request rate</th>
                <th className="px-3 py-2 text-right">Contract send rate</th>
                <th className="px-3 py-2 text-right">Listing conversion</th>
                <th className="px-3 py-2 text-right">Sales conversion</th>
                <th className="px-3 py-2 text-right">Avg sales / sold</th>
              </tr>
            </thead>
            <tbody>
              {s.brokers.map((b) => {
                const t = b.totals;
                const docsRate = safeRate(
                  t.seller_requested_documents,
                  t.seller_incoming_requests,
                );
                const contractRate = safeRate(
                  t.seller_sent_contract,
                  t.seller_requested_documents,
                );
                const listingConv = safeRate(
                  t.seller_listed_property,
                  t.seller_sent_contract,
                );
                const salesConv = safeRate(
                  t.seller_sold_objects,
                  t.seller_listed_property,
                );
                const avgSalesPerSold =
                  t.seller_sold_objects > 0
                    ? t.seller_total_sales_amount / t.seller_sold_objects
                    : null;
                return (
                  <tr key={b.user.userId} className="border-t border-slate-100">
                    <td className="px-3 py-1 font-medium text-slate-900">
                      {b.user.fullName}
                    </td>
                    <td className="px-3 py-1 text-right">
                      {formatPct(docsRate)}
                    </td>
                    <td className="px-3 py-1 text-right">
                      {formatPct(contractRate)}
                    </td>
                    <td className="px-3 py-1 text-right">
                      {formatPct(listingConv)}
                    </td>
                    <td className="px-3 py-1 text-right">
                      {formatPct(salesConv)}
                    </td>
                    <td className="px-3 py-1 text-right">
                      {avgSalesPerSold != null
                        ? avgSalesPerSold.toFixed(0)
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {teamDailySeries.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Team trend / Динамика команды по дням
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={teamDailySeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickMargin={6} />
                <YAxis tick={{ fontSize: 10 }} tickMargin={4} />
                <Tooltip
                  contentStyle={{ fontSize: 11 }}
                  formatter={(value: unknown) =>
                    typeof value === "number"
                      ? value.toFixed(0)
                      : String(value)
                  }
                />
                <Line
                  type="monotone"
                  dataKey="leads"
                  name="Leads"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="bookings"
                  name="Bookings"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  name="Sales amount"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Rankings (top by metric)
        </h2>
        <div className="flex flex-wrap gap-4 text-[11px]">
          {(
            [
              "buyer_incoming_lead_total",
              "buyer_meeting_held",
              "buyer_number_of_bookings",
              "seller_total_sales_amount",
            ] as const
          ).map((key) => (
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

      <div className="rounded-xl border border-slate-200 bg-white">
        <h2 className="border-b border-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Broker reports / Отчёты брокеров
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-xs">
            <thead className="bg-slate-50 text-left text-[11px] font-semibold text-slate-600">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Reports</th>
                <th className="px-3 py-2">Discipline %</th>
              </tr>
            </thead>
            <tbody>
              {filteredBrokers.map((b) => (
                <tr key={b.user.userId} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-900">
                    {b.user.fullName}
                  </td>
                  <td className="px-3 py-2 text-slate-700">{b.reportCount}</td>
                  <td className="px-3 py-2">
                    {b.discipline?.completionPct != null
                      ? `${b.discipline.completionPct}%`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  format = "number",
  secondary,
}: {
  label: string;
  value: number;
  format?: "number" | "money" | "percent";
  secondary?: string;
}) {
  let display: string;
  if (format === "money") {
    display = value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  } else if (format === "percent") {
    display = `${value.toFixed(1)}%`;
  } else {
    display = value.toLocaleString();
  }
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{display}</p>
      {secondary && (
        <p className="text-[10px] text-slate-500">
          {secondary}
        </p>
      )}
    </div>
  );
}

function safeRate(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(denominator) || denominator <= 0) return null;
  return (numerator / denominator) * 100;
}

function formatPct(value: number | null): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value.toFixed(0)}%`;
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
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const yesterday = new Date(today);
  yesterday.setUTCDate(today.getUTCDate() - 1);
  const dayOfWeek = today.getUTCDay() || 7; // 1..7
  const weekStart = new Date(today);
  weekStart.setUTCDate(today.getUTCDate() - (dayOfWeek - 1));
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
  const thisMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const thisMonthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  const lastMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const lastMonthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0));

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="text-slate-500">Period:</span>
      <QuickButton
        label="Today"
        active={
          startDate === today.toISOString().slice(0, 10) &&
          startDate === today.toISOString().slice(0, 10)
        }
        onClick={() => {
          const d = today.toISOString().slice(0, 10);
          onSelect(d, d);
        }}
      />
      <QuickButton
        label="Yesterday"
        active={startDate === yesterday.toISOString().slice(0, 10)}
        onClick={() => {
          const d = yesterday.toISOString().slice(0, 10);
          onSelect(d, d);
        }}
      />
      <QuickButton
        label="This week"
        active={startDate === weekStart.toISOString().slice(0, 10)}
        onClick={() =>
          onSelect(
            weekStart.toISOString().slice(0, 10),
            weekEnd.toISOString().slice(0, 10),
          )
        }
      />
      <QuickButton
        label="This month"
        active={startDate === thisMonthStart.toISOString().slice(0, 10)}
        onClick={() =>
          onSelect(
            thisMonthStart.toISOString().slice(0, 10),
            thisMonthEnd.toISOString().slice(0, 10),
          )
        }
      />
      <QuickButton
        label="Last month"
        active={startDate === lastMonthStart.toISOString().slice(0, 10)}
        onClick={() =>
          onSelect(
            lastMonthStart.toISOString().slice(0, 10),
            lastMonthEnd.toISOString().slice(0, 10),
          )
        }
      />
    </div>
  );
}

function QuickButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-2 py-1 ${
        active
          ? "bg-slate-800 text-white"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );
}
