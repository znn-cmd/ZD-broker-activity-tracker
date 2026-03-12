"use client";

import { useEffect, useState, useTransition } from "react";
import type {
  PeriodType,
  PersonalAnalyticsSummary,
} from "@/analytics/personalAnalytics";
import type { ScoreResult } from "@/analytics/scoring";
import { getPersonalAnalytics } from "./personal-analytics-actions";
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
  initialData: PersonalAnalyticsSummary;
};

export function PersonalAnalyticsView({ initialData }: Props) {
  const [summary, setSummary] = useState<PersonalAnalyticsSummary>(initialData);
  const [periodType, setPeriodType] = useState<PeriodType>(
    initialData.periodType,
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setSummary(initialData);
  }, [initialData]);

  function handleChangePeriod(next: PeriodType) {
    setPeriodType(next);
    startTransition(async () => {
      const res = await getPersonalAnalytics({ periodType: next });
      setSummary(res.summary);
    });
  }

  const totalLeads = summary.totals.buyer_incoming_lead_total ?? 0;
  const totalMeetings = summary.totals.buyer_meeting_held ?? 0;
  const totalBookings = summary.totals.buyer_number_of_bookings ?? 0;
  const totalSales = summary.totals.seller_total_sales_amount ?? 0;

  if (isPending) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
        <div className="h-48 animate-pulse rounded-xl bg-slate-200" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            Personal Analytics / Личная аналитика
          </h1>
<p className="text-xs text-slate-500">
          Period: {summary.startDate} – {summary.endDate} · Reports:{" "}
          {summary.totalReports}
          {" · "}
          <a
            href={`/api/export/csv?start=${summary.startDate}&end=${summary.endDate}`}
            className="text-sky-600 hover:underline"
          >
            Export CSV
          </a>
          {" · "}
          <a
            href={`/api/export/pdf/personal?start=${summary.startDate}&end=${summary.endDate}`}
            className="text-sky-600 hover:underline"
          >
            Export PDF
          </a>
        </p>
        </div>
        <div className="inline-flex rounded-full bg-slate-100 p-1 text-xs">
          <PeriodChip
            label="Day / День"
            active={periodType === "day"}
            onClick={() => handleChangePeriod("day")}
          />
          <PeriodChip
            label="Week / Неделя"
            active={periodType === "week"}
            onClick={() => handleChangePeriod("week")}
          />
          <PeriodChip
            label="Month / Месяц"
            active={periodType === "month"}
            onClick={() => handleChangePeriod("month")}
          />
          <PeriodChip
            label="Year / Год"
            active={periodType === "year"}
            onClick={() => handleChangePeriod("year")}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {summary.score != null && (
          <ScoreCard score={summary.score} disciplinePct={summary.disciplinePct} />
        )}
        <KpiCard label="Leads / Лиды" value={totalLeads} muted={false} />
        <KpiCard label="Meetings / Встречи" value={totalMeetings} muted={false} />
        <KpiCard label="Bookings / Брони" value={totalBookings} muted={false} />
        <KpiCard
          label="Sales amount / Продажи"
          value={totalSales}
          format="money"
          muted={false}
        />
      </div>

      {summary.comparison && (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Vs previous period / Сравнение с прошлым периодом
          </h2>
          <p className="mb-2 text-[11px] text-slate-500">
            {summary.comparison.previousStart} – {summary.comparison.previousEnd}
          </p>
          <div className="flex flex-wrap gap-4 text-xs">
            <DeltaBadge label="Leads" delta={summary.comparison.deltaLeads} pct={summary.comparison.pctLeads} />
            <DeltaBadge label="Meetings" delta={summary.comparison.deltaMeetings} pct={summary.comparison.pctMeetings} />
            <DeltaBadge label="Bookings" delta={summary.comparison.deltaBookings} pct={summary.comparison.pctBookings} />
            <DeltaBadge label="Sales" delta={summary.comparison.deltaSales} pct={summary.comparison.pctSales} />
          </div>
        </div>
      )}

      {(summary.bestDay || summary.worstDay) && (
        <div className="grid gap-3 md:grid-cols-2">
          {summary.bestDay && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                Best day / Лучший день
              </h2>
              <p className="mt-1 font-mono text-sm text-emerald-900">{summary.bestDay.date}</p>
              <p className="text-[11px] text-emerald-700">
                Leads {summary.bestDay.leads} · Meetings {summary.bestDay.meetings} · Sales {summary.bestDay.sales.toLocaleString()}
              </p>
            </div>
          )}
          {summary.worstDay && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Lowest activity day / День с мин. активностью
              </h2>
              <p className="mt-1 font-mono text-sm text-slate-800">{summary.worstDay.date}</p>
              <p className="text-[11px] text-slate-600">
                Leads {summary.worstDay.leads} · Meetings {summary.worstDay.meetings} · Sales {summary.worstDay.sales.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Buyer funnel / Воронка покупателей
          </h2>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {summary.buyerConversions.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between rounded-md bg-slate-50 px-2 py-1"
              >
                <span className="text-slate-500">{item.label}</span>
                <span className="font-semibold text-slate-800">
                  {formatConversionValue(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Seller funnel / Воронка продавцов
          </h2>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {summary.sellerConversions.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between rounded-md bg-slate-50 px-2 py-1"
              >
                <span className="text-slate-500">{item.label}</span>
                <span className="font-semibold text-slate-800">
                  {formatConversionValue(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Daily trend / Динамика по дням
          </h2>
          {isPending && (
            <span className="text-[11px] text-slate-400">Updating…</span>
          )}
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={summary.dailySeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickMargin={6}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                tickMargin={4}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{ fontSize: 11 }}
                formatter={(value: unknown) =>
                  typeof value === "number" ? value.toFixed(0) : String(value)
                }
              />
              <Line
                type="monotone"
                dataKey="buyer_incoming_lead_total"
                name="Leads"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="buyer_meeting_held"
                name="Meetings"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
              />
              {summary.dailySeries.some((d) => d.score != null) && (
                <Line
                  type="monotone"
                  dataKey="score"
                  name="Score"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

type PeriodChipProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

function PeriodChip({ label, active, onClick }: PeriodChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 ${
        active
          ? "bg-slate-900 text-slate-50"
          : "text-slate-600 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );
}

type KpiCardProps = {
  label: string;
  value: number;
  format?: "number" | "money";
  muted: boolean;
};

function KpiCard({ label, value, format = "number" }: KpiCardProps) {
  const display =
    format === "money"
      ? new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(value)
      : value.toLocaleString();

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{display}</p>
    </div>
  );
}

function formatConversionValue(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "—";
  if (value <= 1) {
    return `${(value * 100).toFixed(0)}%`;
  }
  return value.toFixed(2);
}

function ScoreCard({
  score,
  disciplinePct,
}: {
  score: ScoreResult;
  disciplinePct: number | null;
}) {
  const status =
    score.total >= 80 ? "green" : score.total >= 60 ? "yellow" : "red";
  const statusBg =
    status === "green"
      ? "bg-emerald-50 border-emerald-200"
      : status === "yellow"
        ? "bg-amber-50 border-amber-200"
        : "bg-red-50 border-red-200";

  return (
    <div
      className={`rounded-xl border p-3 ${statusBg}`}
      title={`Breakdown: Buyer activity ${score.breakdown.buyerActivity.toFixed(0)}, Buyer result ${score.breakdown.buyerResult.toFixed(0)}, Seller activity ${score.breakdown.sellerActivity.toFixed(0)}, Seller result ${score.breakdown.sellerResult.toFixed(0)}, Plan ${score.breakdown.planAdherence.toFixed(0)}, Discipline ${score.breakdown.reportingDiscipline.toFixed(0)}`}
    >
      <p className="text-[11px] font-medium text-slate-600">
        Score / Балл {disciplinePct != null && `· Discipline ${disciplinePct}%`}
      </p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{score.total}</p>
      <p className="text-[10px] text-slate-500">0–100 (hover for breakdown)</p>
    </div>
  );
}

function DeltaBadge({
  label,
  delta,
  pct,
}: {
  label: string;
  delta: number;
  pct: number | null;
}) {
  const positive = delta >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${
        positive ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
      }`}
    >
      {label}: {positive ? "+" : ""}
      {delta}
      {pct != null && ` (${positive ? "+" : ""}${pct.toFixed(0)}%)`}
    </span>
  );
}

