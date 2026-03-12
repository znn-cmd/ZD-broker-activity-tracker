"use client";

import { useState } from "react";
import { DailyReportForm } from "./DailyReportForm";
import { LivePerformancePanel } from "./LivePerformancePanel";
import type { DailyReportWithPlanning } from "./report-actions";

type Props = {
  initialDate: string;
  isAdmin: boolean;
  managers?: { userId: string; fullName: string }[];
};

export function ReportPageContent({ initialDate, isAdmin, managers }: Props) {
  const [planningState, setPlanningState] = useState<DailyReportWithPlanning | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(
    isAdmin && managers && managers.length > 0 ? managers[0].userId : undefined,
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)]">
      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-lg font-semibold text-slate-900">
            Daily Report / Ежедневный отчет
          </h1>
          {isAdmin && managers && managers.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-600">Manager:</span>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900"
              >
                {managers.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.fullName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <DailyReportForm
          initialDate={initialDate}
          userIdOverride={isAdmin ? selectedUserId : undefined}
          onPlanningStateChange={setPlanningState}
        />
      </div>
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-800">
          Live performance / Текущая эффективность
        </h2>
        <p className="text-xs text-slate-500">
          Pace and plan tracking for the selected date. Green = on track, yellow = behind, red = at risk.
        </p>
        <LivePerformancePanel state={planningState} />
      </div>
    </div>
  );
}
