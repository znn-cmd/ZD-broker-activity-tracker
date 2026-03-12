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
  const workingDays = await getWorkingDaysInRange(startDate, endDate);
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
    endDate,
    expectedWorkingDays: workingDays.length,
    submittedDays,
    missedDates,
    completionPct,
  };
}
