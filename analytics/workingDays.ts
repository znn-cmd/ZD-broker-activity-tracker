import { getSheetRows } from "@/lib/google/sheetsClient";

const WORKING_DAYS_SHEET = "working_days";

type WorkingDayOverride = {
  date: string;
  isWorkingDay: boolean;
};

let overridesCache: Map<string, WorkingDayOverride> | null = null;

async function loadOverrides(): Promise<Map<string, WorkingDayOverride>> {
  if (overridesCache) return overridesCache;
  const rows = await getSheetRows(WORKING_DAYS_SHEET);
  const map = new Map<string, WorkingDayOverride>();
  if (rows && rows.length > 1) {
    const [, ...dataRows] = rows;
    dataRows.forEach((row) => {
      const [date, isWorking] = row;
      if (!date) return;
      const flag =
        isWorking === "true" ||
        isWorking === "TRUE" ||
        isWorking === "1" ||
        isWorking === "yes";
      map.set(date, { date, isWorkingDay: flag });
    });
  }
  overridesCache = map;
  return map;
}

export async function isWorkingDay(date: Date): Promise<boolean> {
  const iso = date.toISOString().slice(0, 10);
  const overrides = await loadOverrides();
  const override = overrides.get(iso);
  if (override) return override.isWorkingDay;

  const day = date.getUTCDay(); // 0 = Sunday, 6 = Saturday
  return day !== 0 && day !== 6;
}

export async function getWorkingDaysInMonth(
  year: number,
  month: number,
): Promise<number> {
  let count = 0;
  const date = new Date(Date.UTC(year, month - 1, 1));
  while (date.getUTCFullYear() === year && date.getUTCMonth() === month - 1) {
    if (await isWorkingDay(date)) {
      count += 1;
    }
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return count;
}

export async function getElapsedWorkingDaysInMonth(
  year: number,
  month: number,
  referenceDate: Date,
): Promise<number> {
  let count = 0;
  const date = new Date(Date.UTC(year, month - 1, 1));
  const refIso = referenceDate.toISOString().slice(0, 10);
  while (date.getUTCFullYear() === year && date.getUTCMonth() === month - 1) {
    const iso = date.toISOString().slice(0, 10);
    if (await isWorkingDay(date)) {
      count += 1;
    }
    if (iso === refIso) break;
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return count;
}

export async function getRemainingWorkingDaysInMonth(
  year: number,
  month: number,
  referenceDate: Date,
): Promise<number> {
  let count = 0;
  const date = new Date(
    Date.UTC(year, month - 1, referenceDate.getUTCDate() + 1),
  );
  while (date.getUTCFullYear() === year && date.getUTCMonth() === month - 1) {
    if (await isWorkingDay(date)) {
      count += 1;
    }
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return count;
}

