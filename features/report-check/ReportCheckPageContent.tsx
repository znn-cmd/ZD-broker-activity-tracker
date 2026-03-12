"use client";

import { useEffect, useState, useTransition } from "react";
import type { MetricKey } from "@/types/domain";
import { METRICS } from "./metrics";
import {
  loadReportCheckSetup,
  runReportCheckForYesterday,
  saveLinksForManager,
  type ReportCheckResultRow,
} from "./report-check-actions";

type ManagerInfo = {
  userId: string;
  fullName: string;
};

type LinkRecord = {
  userId: string;
  metricKey: MetricKey;
  url: string;
};

export function ReportCheckPageContent() {
  const [tab, setTab] = useState<"check" | "config">("check");
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningCheck, startRunCheckTransition] = useTransition();
  const [managers, setManagers] = useState<ManagerInfo[]>([]);
  const [links, setLinks] = useState<LinkRecord[]>([]);
  const [results, setResults] = useState<ReportCheckResultRow[] | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [selectedManagerId, setSelectedManagerId] = useState<string | null>(null);
  const [savingLinks, startSavingLinks] = useTransition();

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const data = await loadReportCheckSetup();
        setManagers(data.managers);
        setLinks(
          data.links.map((l: any) => ({
            userId: l.userId,
            metricKey: l.metricKey,
            url: l.url,
          })),
        );
        if (data.managers.length > 0) {
          setSelectedManagerId(data.managers[0].userId);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  function getLinkFor(managerId: string, metricKey: MetricKey): string {
    const rec = [...links].reverse().find(
      (l) => l.userId === managerId && l.metricKey === metricKey,
    );
    return rec?.url ?? "";
  }

  function updateLink(managerId: string, metricKey: MetricKey, url: string) {
    setLinks((prev) => [...prev, { userId: managerId, metricKey, url }]);
  }

  function handleRunCheck() {
    startRunCheckTransition(async () => {
      try {
        const res = await runReportCheckForYesterday();
        setResults(res.rows);
        setDate(res.date);
      } catch (err) {
        console.error(err);
      }
    });
  }

  function handleSaveLinksForSelectedManager() {
    if (!selectedManagerId) return;
    const managerId = selectedManagerId;
    const metricUrls: { metricKey: MetricKey; url: string }[] = [];

    METRICS.forEach((m) => {
      const url =
        (document.getElementById(
          `url-${managerId}-${m.key}`,
        ) as HTMLInputElement | null)?.value ?? "";
      metricUrls.push({ metricKey: m.key, url });
    });

    startSavingLinks(async () => {
      try {
        await saveLinksForManager({ managerId, metricUrls });
      } catch (err) {
        console.error(err);
      }
    });
  }

  if (isLoading) {
    return (
      <p className="text-xs text-slate-600">
        Loading report check configuration… / Загрузка настроек проверки отчетов…
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-2 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Report check / Проверка отчетов
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Сравнение ежедневных отчетов менеджеров с данными из amoCRM.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <button
            type="button"
            onClick={() => setTab("check")}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              tab === "check"
                ? "bg-sky-600 text-white"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            Check reports / Проверка отчетов
          </button>
          <button
            type="button"
            onClick={() => setTab("config")}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              tab === "config"
                ? "bg-sky-600 text-white"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            Links config / Настройка ссылок
          </button>
        </div>
      </header>

      {tab === "check" ? (
        <CheckTab
          managers={managers}
          results={results}
          date={date}
          isRunning={isRunningCheck}
          onRunCheck={handleRunCheck}
        />
      ) : (
        <ConfigTab
          managers={managers}
          selectedManagerId={selectedManagerId}
          onSelectManager={setSelectedManagerId}
          getLinkFor={getLinkFor}
          onSave={handleSaveLinksForSelectedManager}
          saving={savingLinks}
        />
      )}
    </div>
  );
}

type CheckTabProps = {
  managers: ManagerInfo[];
  results: ReportCheckResultRow[] | null;
  date: string | null;
  isRunning: boolean;
  onRunCheck: () => void;
};

function CheckTab({ managers, results, date, isRunning, onRunCheck }: CheckTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-slate-600">
          <p>
            Проверка отчетов за <span className="font-semibold">вчера</span> по
            всем активным менеджерам.
          </p>
          {date && (
            <p className="text-[11px] text-slate-500">
              Дата проверки (отчетный день): {date}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onRunCheck}
          disabled={isRunning || managers.length === 0}
          className="inline-flex items-center rounded-md bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white shadow hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRunning ? "Checking…" : "Check reports / Проверить отчеты"}
        </button>
      </div>

      {results == null && (
        <p className="text-xs text-slate-500">
          Нажмите &laquo;Проверить отчеты&raquo;, чтобы загрузить данные.
        </p>
      )}

      {results &&
        results.map((row) => (
          <section
            key={row.userId}
            className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              {row.fullName}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <MetricSection
                title="Buyer / Покупатели"
                rows={row}
                section="buyer"
              />
              <MetricSection
                title="Seller / Продавцы"
                rows={row}
                section="seller"
              />
            </div>
          </section>
        ))}
    </div>
  );
}

type MetricSectionProps = {
  title: string;
  rows: ReportCheckResultRow;
  section: "buyer" | "seller";
};

function MetricSection({ title, rows, section }: MetricSectionProps) {
  const metrics = METRICS.filter((m) => m.section === section);

  return (
    <section className="space-y-2 text-xs">
      <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {title}
      </h3>
      <div className="space-y-1">
        {metrics.map((metric) => {
          const cell = rows.cells.find((c) => c.metricKey === metric.key);
          const manual = cell?.manualValue ?? 0;
          const auto = cell?.autoValue ?? null;
          let bgClass = "";
          if (auto != null) {
            if (auto > manual) {
              bgClass = "bg-red-50 text-red-800 border-red-200";
            } else if (auto < manual) {
              bgClass = "bg-emerald-50 text-emerald-800 border-emerald-200";
            }
          }

          return (
            <div
              key={metric.key}
              className="flex items-center justify-between gap-2 rounded-md border border-slate-100 bg-slate-50 px-2 py-1.5"
            >
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-slate-700">
                  {metric.label}
                </span>
                {metric.hint && (
                  <span className="text-[10px] text-slate-400">
                    {metric.hint}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="rounded-md bg-white px-2 py-0.5 text-slate-700">
                  {manual}
                </span>
                <span
                  className={`rounded-md px-2 py-0.5 text-[11px] ${
                    auto == null ? "bg-slate-100 text-slate-500" : bgClass || "bg-white text-slate-700 border border-slate-200"
                  }`}
                >
                  {auto == null ? "—" : auto}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

type ConfigTabProps = {
  managers: ManagerInfo[];
  selectedManagerId: string | null;
  onSelectManager: (id: string | null) => void;
  getLinkFor: (managerId: string, metricKey: MetricKey) => string;
  onSave: () => void;
  saving: boolean;
};

function ConfigTab({
  managers,
  selectedManagerId,
  onSelectManager,
  getLinkFor,
  onSave,
  saving,
}: ConfigTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-slate-600">
          <p>
            Для каждого менеджера задайте ссылки amoCRM, по которым будут
            загружаться фактические значения по каждому параметру.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900"
            value={selectedManagerId ?? ""}
            onChange={(e) =>
              onSelectManager(e.target.value || null)
            }
          >
            <option value="">Select manager / Выберите менеджера</option>
            {managers.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.fullName}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onSave}
            disabled={!selectedManagerId || saving}
            className="inline-flex items-center rounded-md bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white shadow hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save links / Сохранить ссылки"}
          </button>
        </div>
      </div>

      {!selectedManagerId && (
        <p className="text-xs text-slate-500">
          Выберите менеджера, чтобы настроить ссылки.
        </p>
      )}

      {selectedManagerId && (
        <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Links for manager / Ссылки для менеджера
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <MetricLinksSection
              section="buyer"
              managerId={selectedManagerId}
              getLinkFor={getLinkFor}
            />
            <MetricLinksSection
              section="seller"
              managerId={selectedManagerId}
              getLinkFor={getLinkFor}
            />
          </div>
        </section>
      )}
    </div>
  );
}

type MetricLinksSectionProps = {
  section: "buyer" | "seller";
  managerId: string;
  getLinkFor: (managerId: string, metricKey: MetricKey) => string;
};

function MetricLinksSection({
  section,
  managerId,
  getLinkFor,
}: MetricLinksSectionProps) {
  const metrics = METRICS.filter((m) => m.section === section);

  return (
    <section className="space-y-2 text-xs">
      <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {section === "buyer" ? "Buyer / Покупатели" : "Seller / Продавцы"}
      </h3>
      <div className="space-y-1">
        {metrics.map((metric) => {
          const id = `url-${managerId}-${metric.key}`;
          const initial = getLinkFor(managerId, metric.key);

          return (
            <label key={metric.key} className="flex flex-col gap-1">
              <span className="flex items-center justify-between text-[11px] font-medium text-slate-700">
                <span>{metric.label}</span>
                {metric.hint && (
                  <span className="text-[10px] text-slate-400">
                    {metric.hint}
                  </span>
                )}
              </span>
              <input
                id={id}
                type="text"
                defaultValue={initial}
                placeholder="https://zimaamo.amocrm.ru/..."
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/40"
              />
            </label>
          );
        })}
      </div>
    </section>
  );
}

