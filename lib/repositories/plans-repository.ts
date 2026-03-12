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

export async function getPlansForTeamMonth(options: {
  teamId: string;
  year: number;
  month: number;
}): Promise<MonthlyPlanRecord[]> {
  const { teamId, year, month } = options;
  const rows = await getSheetRows(SHEET_NAME);
  if (!rows || rows.length <= 1) return [];

  const [, ...dataRows] = rows;
  const plans: MonthlyPlanRecord[] = [];

  dataRows.forEach((row, index) => {
    const parsed = parsePlanRow(row, index + 2);
    if (!parsed) return;
    if (
      parsed.data.teamId === teamId &&
      parsed.data.year === year &&
      parsed.data.month === month
    ) {
      plans.push(parsed.data);
    }
  });

  return plans;
}

export async function upsertUserMonthPlans(params: {
  userId: string;
  teamId: string | null;
  year: number;
  month: number;
  entries: { metricKey: MetricKey; planValue: number; updatedBy: string }[];
}) {
  const { userId, teamId, year, month, entries } = params;
  if (entries.length === 0) return;

  const rows = await getSheetRows(SHEET_NAME);
  const now = new Date().toISOString();

  if (!rows || rows.length <= 1) {
    for (const entry of entries) {
      const plan: MonthlyPlanRecord = {
        planId: uuidv4(),
        userId,
        teamId,
        year,
        month,
        metricKey: entry.metricKey,
        planValue: entry.planValue,
        createdAt: now,
        updatedAt: now,
        updatedBy: entry.updatedBy,
      };
      await appendSheetRow(SHEET_NAME, serializePlanRow(plan));
    }
    return;
  }

  const [, ...dataRows] = rows;

  for (const entry of entries) {
    let existing: RawPlanRow | null = null;
    for (let i = 0; i < dataRows.length; i += 1) {
      const parsed = parsePlanRow(dataRows[i], i + 2);
      if (!parsed) continue;
      if (
        parsed.data.userId === userId &&
        parsed.data.year === year &&
        parsed.data.month === month &&
        parsed.data.metricKey === entry.metricKey
      ) {
        existing = parsed;
        break;
      }
    }

    if (existing) {
      const updated: MonthlyPlanRecord = {
        ...existing.data,
        planValue: entry.planValue,
        updatedAt: now,
        updatedBy: entry.updatedBy,
      };
      await updateSheetRow(
        SHEET_NAME,
        existing.rowIndex,
        serializePlanRow(updated),
      );
    } else {
      const plan: MonthlyPlanRecord = {
        planId: uuidv4(),
        userId,
        teamId,
        year,
        month,
        metricKey: entry.metricKey,
        planValue: entry.planValue,
        createdAt: now,
        updatedAt: now,
        updatedBy: entry.updatedBy,
      };
      await appendSheetRow(SHEET_NAME, serializePlanRow(plan));
    }
  }
}

