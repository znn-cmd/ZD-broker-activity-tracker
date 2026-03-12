"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth/auth-options";
import { UserRole, type DailyReportRecord, type MetricKey } from "@/types/domain";
import { getAllUsers } from "@/lib/repositories/users-repository";
import {
  listReportsForUsersInDateRange,
} from "@/lib/repositories/reports-repository";
import {
  listAllReportCheckLinks,
  saveReportCheckLinksForUser,
} from "@/lib/repositories/report-check-repository";
import { listAutoValuesForDate } from "@/lib/repositories/report-check-auto-repository";
import { METRICS } from "./metrics";

type SessionUser = {
  id: string;
  role: UserRole;
};

async function requireAdmin(): Promise<SessionUser> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Unauthenticated");
  }
  const me = session.user as SessionUser;
  if (me.role !== UserRole.Admin) {
    throw new Error("Forbidden");
  }
  return me;
}

export async function loadReportCheckSetup() {
  const me = await requireAdmin();
  void me;

  const allUsers = await getAllUsers();
  const managers = allUsers.filter((u) => u.role === UserRole.Manager && u.isActive);
  const links = await listAllReportCheckLinks();

  return {
    managers: managers.map((m) => ({
      userId: m.userId,
      fullName: m.fullName || m.username,
    })),
    links,
    metrics: METRICS,
  };
}

export async function saveLinksForManager(params: {
  managerId: string;
  metricUrls: { metricKey: MetricKey; url: string }[];
}) {
  const me = await requireAdmin();
  await saveReportCheckLinksForUser({
    userId: params.managerId,
    metricUrls: params.metricUrls,
    updatedBy: me.id,
  });
}

export type ReportCheckResultCell = {
  metricKey: MetricKey;
  manualValue: number;
  autoValue: number | null;
};

export type ReportCheckResultRow = {
  userId: string;
  fullName: string;
  cells: ReportCheckResultCell[];
};

export async function runReportCheckForYesterday(): Promise<{
  date: string;
  rows: ReportCheckResultRow[];
}> {
  const me = await requireAdmin();
  void me;

  const today = new Date();
  const yesterday = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 1),
  )
    .toISOString()
    .slice(0, 10);

  const allUsers = await getAllUsers();
  const managers = allUsers.filter((u) => u.role === UserRole.Manager && u.isActive);
  const userIds = managers.map((m) => m.userId);

  const [reports, links, autoValues] = await Promise.all([
    listReportsForUsersInDateRange({
      userIds,
      startDate: yesterday,
      endDate: yesterday,
    }),
    listAllReportCheckLinks(),
    listAutoValuesForDate(yesterday),
  ]);

  const reportsByUser = new Map<string, DailyReportRecord>();
  reports.forEach((r) => {
    reportsByUser.set(r.userId, r);
  });

  const latestLinkByUserMetric = new Map<string, string>();
  links.forEach((l) => {
    const key = `${l.userId}:${l.metricKey}`;
    latestLinkByUserMetric.set(key, l.url);
  });

  const autoByUserMetric = new Map<string, number>();
  autoValues.forEach((a) => {
    const key = `${a.userId}:${a.metricKey}`;
    autoByUserMetric.set(key, a.autoValue);
  });

  const rows: ReportCheckResultRow[] = [];

  for (const manager of managers) {
    const report = reportsByUser.get(manager.userId) ?? null;
    const cells: ReportCheckResultCell[] = [];

    for (const metric of METRICS) {
      const metricKey = metric.key;
      const manualValue = (report?.[metricKey] as number | undefined) ?? 0;
      const linkKey = `${manager.userId}:${metricKey}`;
      const url = latestLinkByUserMetric.get(linkKey) ?? "";
      void url; // пока url используется только для отображения/возможной отладки
      const autoValue = autoByUserMetric.get(linkKey) ?? null;

      cells.push({
        metricKey,
        manualValue,
        autoValue,
      });
    }

    rows.push({
      userId: manager.userId,
      fullName: manager.fullName || manager.username,
      cells,
    });
  }

  return { date: yesterday, rows };
}

