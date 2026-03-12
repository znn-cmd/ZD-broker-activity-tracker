import type { DailyReportRecord } from "@/types/domain";
import { getWorkingDaysInRange } from "./workingDays";

export type DisciplineResult = {
  userId: string;
  startDate: string;
  endDate: string;
  expectedWorkingDays: number;
  submittedDays: number;
  missedDates: string[];
  completionPct: number | null;
};

export async function getDisciplineForPeriod(
  userId: string,
  startDate: string,
  endDate: string,
  reports: DailyReportRecord[],
): Promise<DisciplineResult> {
  const todayIso = new Date().toISOString().slice(0, 10);
  const effectiveEnd = endDate > todayIso ? todayIso : endDate;
  const workingDays = await getWorkingDaysInRange(startDate, effectiveEnd);
  const submittedSet = new Set(
    reports.filter((r) => r.userId === userId).map((r) => r.reportDate),
  );
  const missedDates = workingDays.filter((d) => !submittedSet.has(d));
  const submittedDays = workingDays.filter((d) => submittedSet.has(d)).length;
  const completionPct =
    workingDays.length > 0
      ? Math.round((submittedDays / workingDays.length) * 1000) / 10
      : null;

  return {
    userId,
    startDate,
    endDate: effectiveEnd,
    expectedWorkingDays: workingDays.length,
    submittedDays,
    missedDates,
    completionPct,
  };
}
