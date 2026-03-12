"use client";

import { useState } from "react";
import { DailyReportForm } from "./DailyReportForm";
import { LivePerformancePanel } from "./LivePerformancePanel";
import type { DailyReportWithPlanning } from "./report-actions";

type Props = {
  initialDate: string;
};

export function ReportPageContent({ initialDate }: Props) {
  const [planningState, setPlanningState] = useState<DailyReportWithPlanning | null>(null);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)]">
      <div className="space-y-4">
        <h1 className="text-lg font-semibold text-slate-900">
          Daily Report / Ежедневный отчет
        </h1>
        <DailyReportForm
          initialDate={initialDate}
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
