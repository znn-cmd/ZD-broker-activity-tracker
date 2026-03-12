"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { saveDailyReport, loadDailyReportWithPlanning } from "./report-actions";
import type { DailyReportPayload, DailyReportWithPlanning } from "./report-actions";

type Props = {
  initialDate: string;
  userIdOverride?: string;
  onPlanningStateChange?: (state: DailyReportWithPlanning | null) => void;
};

type Status = "idle" | "saving" | "saved" | "error";

export function DailyReportForm({
  initialDate,
  userIdOverride,
  onPlanningStateChange,
}: Props) {
  const [date, setDate] = useState(initialDate);
  const [form, setForm] = useState<DailyReportPayload>(() =>
    emptyPayload(initialDate),
  );
  const [serverState, setServerState] = useState<DailyReportWithPlanning | null>(
    null,
  );
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const state = await loadDailyReportWithPlanning(date, userIdOverride);
        if (!isMounted) return;
        if (state.report) {
          setForm({
            reportDate: state.report.reportDate,
            buyer_incoming_lead_total:
              state.report.buyer_incoming_lead_total ?? 0,
            buyer_contact_established: state.report.buyer_contact_established ?? 0,
            buyer_qualified: state.report.buyer_qualified ?? 0,
            buyer_agents: state.report.buyer_agents ?? 0,
            buyer_meeting_confirmed: state.report.buyer_meeting_confirmed ?? 0,
            buyer_meeting_held: state.report.buyer_meeting_held ?? 0,
            buyer_number_of_bookings:
              state.report.buyer_number_of_bookings ?? 0,
            buyer_booking_commission_amount:
              state.report.buyer_booking_commission_amount ?? 0,
            seller_incoming_requests: state.report.seller_incoming_requests ?? 0,
            seller_number_of_cold_calls:
              state.report.seller_number_of_cold_calls ?? 0,
            seller_requested_documents:
              state.report.seller_requested_documents ?? 0,
            seller_sent_contract: state.report.seller_sent_contract ?? 0,
            seller_objects_entered_xoms:
              state.report.seller_objects_entered_xoms ?? 0,
            seller_listed_property: state.report.seller_listed_property ?? 0,
            seller_sold_objects: state.report.seller_sold_objects ?? 0,
            seller_total_sales_amount:
              state.report.seller_total_sales_amount ?? 0,
          });
        } else {
          setForm(emptyPayload(date));
        }
        setServerState(state);
        onPlanningStateChange?.(state);
      } catch (e) {
        console.error(e);
        if (isMounted) {
          setError("Failed to load report data.");
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [date, userIdOverride, onPlanningStateChange]);

  useMemo(() => {
    if (!serverState?.report) return;
    // Placeholder for future unsaved-changes tracking / beforeunload protection
  }, [serverState]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setError(null);
    try {
      const normalized: DailyReportPayload = {
        ...form,
        reportDate: date,
      };
      const result = await saveDailyReport(normalized, userIdOverride);
      setServerState(result);
      onPlanningStateChange?.(result);
      setStatus("saved");
      toast.success("Report saved");
    } catch (err) {
      console.error(err);
      setError("Failed to save report.");
      setStatus("error");
      toast.error("Failed to save report");
    }
  }

  function handleNumberChange(field: keyof DailyReportPayload) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (raw === "") {
        setForm((prev) => ({ ...prev, [field]: 0 }));
        return;
      }
      const parsed = Number(raw.replace(",", "."));
      if (!Number.isFinite(parsed) || parsed < 0) return;
      setForm((prev) => ({ ...prev, [field]: parsed }));
    };
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDate(e.target.value);
  }

  function handleReset() {
    setForm(emptyPayload(date));
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
            Selected date / Дата отчета
          </p>
          <input
            type="date"
            value={date}
            onChange={handleDateChange}
            className="mt-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900"
          />
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          {status === "saved" && (
            <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
              Saved / Сохранено
            </span>
          )}
          {serverState?.report?.updatedAt && (
            <span>
              Last updated:{" "}
              {new Date(serverState.report.updatedAt).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Buyer / Покупатели
          </h2>
          <div className="space-y-2 text-xs">
            <NumberField
              label="Incoming lead - total"
              hint="Все входящие лиды"
              value={form.buyer_incoming_lead_total}
              onChange={handleNumberChange("buyer_incoming_lead_total")}
            />
            <NumberField
              label="Contact established"
              hint="Контакт установлен"
              value={form.buyer_contact_established}
              onChange={handleNumberChange("buyer_contact_established")}
            />
            <NumberField
              label="Qualified (Cold+Warm+Hot)"
              hint="Квалифицированные"
              value={form.buyer_qualified}
              onChange={handleNumberChange("buyer_qualified")}
            />
            <NumberField
              label="Agents"
              hint="Агенты"
              value={form.buyer_agents}
              onChange={handleNumberChange("buyer_agents")}
            />
            <NumberField
              label="Meeting Confirmed"
              hint="Подтвержденные встречи"
              value={form.buyer_meeting_confirmed}
              onChange={handleNumberChange("buyer_meeting_confirmed")}
            />
            <NumberField
              label="Meeting (Office/Zoom/Viewing)"
              hint="Проведенные встречи"
              value={form.buyer_meeting_held}
              onChange={handleNumberChange("buyer_meeting_held")}
            />
            <NumberField
              label="Number of bookings"
              hint="Бронирования"
              value={form.buyer_number_of_bookings}
              onChange={handleNumberChange("buyer_number_of_bookings")}
            />
            <NumberField
              label="Booking commission amount"
              hint="Комиссия по бронированию"
              value={form.buyer_booking_commission_amount}
              onChange={handleNumberChange("buyer_booking_commission_amount")}
            />
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Seller / Продавцы
          </h2>
          <div className="space-y-2 text-xs">
            <NumberField
              label="Incoming requests - seller"
              hint="Входящие запросы от продавцов"
              value={form.seller_incoming_requests}
              onChange={handleNumberChange("seller_incoming_requests")}
            />
            <NumberField
              label="Number of cold calls"
              hint="Холодные звонки"
              value={form.seller_number_of_cold_calls}
              onChange={handleNumberChange("seller_number_of_cold_calls")}
            />
            <NumberField
              label="Requested documents"
              hint="Запрошены документы"
              value={form.seller_requested_documents}
              onChange={handleNumberChange("seller_requested_documents")}
            />
            <NumberField
              label="Sent the contract"
              hint="Договор отправлен"
              value={form.seller_sent_contract}
              onChange={handleNumberChange("seller_sent_contract")}
            />
            <NumberField
              label="Objects entered into Xoms"
              hint="Объекты внесены в Xoms"
              value={form.seller_objects_entered_xoms}
              onChange={handleNumberChange("seller_objects_entered_xoms")}
            />
            <NumberField
              label="Listed the property"
              hint="Выставлено в рекламу"
              value={form.seller_listed_property}
              onChange={handleNumberChange("seller_listed_property")}
            />
            <NumberField
              label="Sold objects"
              hint="Продано объектов"
              value={form.seller_sold_objects}
              onChange={handleNumberChange("seller_sold_objects")}
            />
            <NumberField
              label="Total sales amount"
              hint="Суммарный объем продаж"
              value={form.seller_total_sales_amount}
              onChange={handleNumberChange("seller_total_sales_amount")}
            />
          </div>
        </section>
      </div>

      {error && (
        <p className="text-xs text-red-500" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Reset / Сбросить
          </button>
        </div>
        <button
          type="submit"
          disabled={status === "saving"}
          className="inline-flex items-center rounded-md bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white shadow hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "saving" ? "Saving…" : "Save report / Сохранить отчет"}
        </button>
      </div>
    </form>
  );
}

type NumberFieldProps = {
  label: string;
  hint?: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

function NumberField({ label, hint, value, onChange }: NumberFieldProps) {
  return (
    <label className="flex flex-col gap-1">
      <span className="flex items-center justify-between text-[11px] font-medium text-slate-700">
        <span>{label}</span>
        {hint && <span className="text-[10px] text-slate-400">{hint}</span>}
      </span>
      <input
        type="number"
        min={0}
        value={Number.isFinite(value) ? value : 0}
        onChange={onChange}
        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/40"
      />
    </label>
  );
}

function emptyPayload(date: string): DailyReportPayload {
  return {
    reportDate: date,
    buyer_incoming_lead_total: 0,
    buyer_contact_established: 0,
    buyer_qualified: 0,
    buyer_agents: 0,
    buyer_meeting_confirmed: 0,
    buyer_meeting_held: 0,
    buyer_number_of_bookings: 0,
    buyer_booking_commission_amount: 0,
    seller_incoming_requests: 0,
    seller_number_of_cold_calls: 0,
    seller_requested_documents: 0,
    seller_sent_contract: 0,
    seller_objects_entered_xoms: 0,
    seller_listed_property: 0,
    seller_sold_objects: 0,
    seller_total_sales_amount: 0,
  };
}

