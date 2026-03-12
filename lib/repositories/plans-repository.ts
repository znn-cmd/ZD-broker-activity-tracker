import { v4 as uuidv4 } from "uuid";
import {
  appendSheetRow,
  getSheetRows,
  updateSheetRow,
} from "@/lib/google/sheetsClient";
import type { MetricKey, MonthlyPlanRecord } from "@/types/domain";

const SHEET_NAME = "monthly_plans";

type RawPlanRow = {
  rowIndex: number;
  data: MonthlyPlanRecord;
};

function toNumber(value: string | undefined): number {
  if (!value) return 0;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function parsePlanRow(row: string[], rowIndex: number): RawPlanRow | null {
  if (row.length === 0) return null;

  const [
    plan_id,
    user_id,
    team_id,
    year,
    month,
    metric_key,
    plan_value,
    created_at,
    updated_at,
    updated_by,
  ] = row;

  if (!plan_id || !user_id || !year || !month || !metric_key) return null;

  const data: MonthlyPlanRecord = {
    planId: plan_id,
    userId: user_id,
    teamId: team_id || null,
    year: Number(year),
    month: Number(month),
    metricKey: metric_key as MetricKey,
    planValue: toNumber(plan_value),
    createdAt: created_at ?? "",
    updatedAt: updated_at ?? "",
    updatedBy: updated_by ?? "",
  };

  return { rowIndex, data };
}

function serializePlanRow(
  plan: MonthlyPlanRecord,
): (string | number | null)[] {
  return [
    plan.planId,
    plan.userId,
    plan.teamId,
    plan.year,
    plan.month,
    plan.metricKey,
    plan.planValue,
    plan.createdAt,
    plan.updatedAt,
    plan.updatedBy,
  ];
}

export async function getPlansForUserMonth(options: {
  userId: string;
  year: number;
  month: number;
}): Promise<MonthlyPlanRecord[]> {
  const { userId, year, month } = options;
  const rows = await getSheetRows(SHEET_NAME);
  if (!rows || rows.length <= 1) return [];

  const [, ...dataRows] = rows;
  const plans: MonthlyPlanRecord[] = [];

  dataRows.forEach((row, index) => {
    const parsed = parsePlanRow(row, index + 2);
    if (!parsed) return;
    if (
      parsed.data.userId === userId &&
      parsed.data.year === year &&
      parsed.data.month === month
    ) {
      plans.push(parsed.data);
    }
  });

  return plans;
}

