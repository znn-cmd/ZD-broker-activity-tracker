import type { DailyReportRecord, MetricKey, MonthlyPlanRecord } from "@/types/domain";
import {
  getElapsedWorkingDaysInMonth,
  getRemainingWorkingDaysInMonth,
  getWorkingDaysInMonth,
} from "./workingDays";

export type MetricPaceStats = {
  metricKey: MetricKey;
  monthlyPlan: number;
  actualMonthToDate: number;
  totalWorkingDaysInMonth: number;
  elapsedWorkingDaysInMonth: number;
  remainingWorkingDaysInMonth: number;
  dailyBaselineMinimumTarget: number;
  requiredPerRemainingWorkday: number;
  expectedActualByNow: number;
  projectedMonthEnd: number;
  planCompletionPct: number | null;
  paceAttainmentPct: number | null;
};

export async function calculateMetricPaceForUserMonth(options: {
  plans: MonthlyPlanRecord[];
  reports: DailyReportRecord[];
  year: number;
  month: number;
  referenceDate: Date;
}): Promise<MetricPaceStats[]> {
  const { plans, reports, year, month, referenceDate } = options;

  const totalWorkingDaysInMonth = await getWorkingDaysInMonth(year, month);
  const elapsedWorkingDaysInMonth = await getElapsedWorkingDaysInMonth(
    year,
    month,
    referenceDate,
  );
  const remainingWorkingDaysInMonth = await getRemainingWorkingDaysInMonth(
    year,
    month,
    referenceDate,
  );

  const metrics = new Set<MetricKey>();
  plans.forEach((plan) => metrics.add(plan.metricKey));

  const groupedActuals: Record<MetricKey, number> = {} as Record<
    MetricKey,
    number
  >;
  reports.forEach((report) => {
    metrics.forEach((metricKey) => {
      const value = report[metricKey] as number;
      groupedActuals[metricKey] = (groupedActuals[metricKey] ?? 0) + value;
    });
  });

  const results: MetricPaceStats[] = [];

  metrics.forEach((metricKey) => {
    const plan = plans.find((p) => p.metricKey === metricKey);
    const monthlyPlan = plan?.planValue ?? 0;
    const actualMonthToDate = groupedActuals[metricKey] ?? 0;

    const dailyBaselineMinimumTarget =
      totalWorkingDaysInMonth > 0
        ? monthlyPlan / totalWorkingDaysInMonth
        : 0;

    const remainingDemand = Math.max(monthlyPlan - actualMonthToDate, 0);
    const requiredPerRemainingWorkday =
      remainingWorkingDaysInMonth > 0
        ? remainingDemand / remainingWorkingDaysInMonth
        : remainingDemand;

    const expectedActualByNow =
      elapsedWorkingDaysInMonth > 0
        ? dailyBaselineMinimumTarget * elapsedWorkingDaysInMonth
        : 0;

    const projectedMonthEnd =
      elapsedWorkingDaysInMonth > 0
        ? (actualMonthToDate / elapsedWorkingDaysInMonth) *
          totalWorkingDaysInMonth
        : 0;

    const planCompletionPct =
      monthlyPlan > 0 ? actualMonthToDate / monthlyPlan : null;

    const paceAttainmentPct =
      expectedActualByNow > 0 ? actualMonthToDate / expectedActualByNow : null;

    results.push({
      metricKey,
      monthlyPlan,
      actualMonthToDate,
      totalWorkingDaysInMonth,
      elapsedWorkingDaysInMonth,
      remainingWorkingDaysInMonth,
      dailyBaselineMinimumTarget,
      requiredPerRemainingWorkday,
      expectedActualByNow,
      projectedMonthEnd,
      planCompletionPct,
      paceAttainmentPct,
    });
  });

  return results;
}

