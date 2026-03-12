"use client";

import { useEffect, useState, useTransition } from "react";
import type {
  PeriodType,
  PersonalAnalyticsSummary,
} from "@/analytics/personalAnalytics";
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

      <div className="grid gap-3 md:grid-cols-4">
        <KpiCard
          label="Leads / Лиды"
          value={totalLeads}
          muted={false}
        />
        <KpiCard
          label="Meetings / Встречи"
          value={totalMeetings}
          muted={false}
        />
        <KpiCard
          label="Bookings / Брони"
          value={totalBookings}
          muted={false}
        />
        <KpiCard
          label="Sales amount / Продажи"
          value={totalSales}
          format="money"
          muted={false}
        />
      </div>

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

