"use client";

import { useEffect, useState, useTransition } from "react";
import type { MetricKey, UserRecord } from "@/types/domain";
import {
  loadUserMonthPlans,
  saveUserMonthPlans,
  type EditablePlanEntry,
} from "./plan-actions";

type Props = {
  initialUsers: UserRecord[];
  initialYear: number;
  initialMonth: number;
  initialSelectedUserId: string | null;
};

const METRIC_KEYS: MetricKey[] = [
  "buyer_incoming_lead_total",
  "buyer_contact_established",
  "buyer_qualified",
  "buyer_agents",
  "buyer_meeting_confirmed",
  "buyer_meeting_held",
  "buyer_number_of_bookings",
  "buyer_booking_commission_amount",
  "seller_incoming_requests",
  "seller_number_of_cold_calls",
  "seller_requested_documents",
  "seller_sent_contract",
  "seller_objects_entered_xoms",
  "seller_listed_property",
  "seller_sold_objects",
  "seller_total_sales_amount",
];

export function TeamPlansEditor({
  initialUsers,
  initialYear,
  initialMonth,
  initialSelectedUserId,
}: Props) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    initialSelectedUserId ?? (initialUsers[0]?.userId ?? null),
  );
  const [entries, setEntries] = useState<EditablePlanEntry[]>([]);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!selectedUserId) return;
    startTransition(async () => {
      try {
        const plans = await loadUserMonthPlans(selectedUserId, year, month);
        const map = new Map<MetricKey, number>();
        METRIC_KEYS.forEach((key) => {
          map.set(key, 0);
        });
        plans.forEach((p) => {
          map.set(p.metricKey, p.planValue);
        });
        setEntries(
          METRIC_KEYS.map((metricKey) => ({
            metricKey,
            planValue: map.get(metricKey) ?? 0,
          })),
        );
        setStatus("idle");
        setError(null);
      } catch (e) {
        console.error(e);
        setError("Failed to load plans.");
      }
    });
  }, [selectedUserId, year, month]);

  async function handleSave() {
    if (!selectedUserId) return;
    setStatus("saving");
    setError(null);
    try {
      await saveUserMonthPlans(selectedUserId, year, month, entries);
      setStatus("saved");
    } catch (e) {
      console.error(e);
      setStatus("error");
      setError("Failed to save plans.");
    }
  }

  function handlePlanChange(metricKey: MetricKey, value: string) {
    const parsed = Number(value.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed < 0) return;
    setEntries((prev) =>
      prev.map((e) =>
        e.metricKey === metricKey ? { ...e, planValue: parsed } : e,
      ),
    );
  }

  const selectedUser = initialUsers.find((u) => u.userId === selectedUserId) ?? null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <div>
          <label className="block text-[11px] font-medium text-slate-600">
            Broker / Менеджер
          </label>
          <select
            value={selectedUserId ?? ""}
            onChange={(e) => setSelectedUserId(e.target.value || null)}
            className="mt-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
          >
            {initialUsers.map((u) => (
              <option key={u.userId} value={u.userId}>
                {u.fullName} ({u.username})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-600">
            Year / Год
          </label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value) || year)}
            className="mt-1 w-20 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-600">
            Month / Месяц
          </label>
          <input
            type="number"
            min={1}
            max={12}
            value={month}
            onChange={(e) => {
              const m = Number(e.target.value);
              if (m >= 1 && m <= 12) setMonth(m);
            }}
            className="mt-1 w-16 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
          />
        </div>
        {selectedUser && (
          <div className="text-[11px] text-slate-500">
            Team: {selectedUser.teamName ?? "—"}
          </div>
        )}
        {isPending && (
          <span className="text-[11px] text-slate-400">Loading…</span>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full border-collapse text-xs">
          <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            <tr>
              <th className="px-3 py-2">Metric key</th>
              <th className="px-3 py-2">Plan value</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.metricKey} className="border-t border-slate-100">
                <td className="px-3 py-1.5 font-mono text-[11px] text-slate-700">
                  {entry.metricKey}
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="number"
                    min={0}
                    value={entry.planValue}
                    onChange={(e) =>
                      handlePlanChange(entry.metricKey, e.target.value)
                    }
                    className="w-28 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
      {status === "saved" && (
        <p className="text-xs text-emerald-600">Plans saved successfully.</p>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={status === "saving" || !selectedUserId}
          className="rounded-md bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "saving" ? "Saving…" : "Save plans / Сохранить планы"}
        </button>
      </div>
    </div>
  );
}

