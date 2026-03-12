"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth/auth-options";
import { getTeamScopeUsers } from "@/features/team-dashboard/team-actions";
import { listReportsForUsersInDateRange } from "@/lib/repositories/reports-repository";
import { getDisciplineForPeriod } from "@/analytics/discipline";
import type { DisciplineResult } from "@/analytics/discipline";
import type { UserRecord } from "@/types/domain";
import { UserRole } from "@/types/domain";

type SessionUser = {
  id: string;
  role: UserRole;
};

export type MissedReportsRow = {
  user: UserRecord;
  discipline: DisciplineResult;
};

export async function loadMissedReports(params: {
  startDate: string;
  endDate: string;
}): Promise<MissedReportsRow[] | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthenticated");
  const me = session.user as SessionUser;
  if (me.role !== UserRole.Head && me.role !== UserRole.Admin) {
    return null;
  }

  const { users } = await getTeamScopeUsers();
  const managers = users.filter((u) => u.role === UserRole.Manager);
  if (managers.length === 0) return [];

  const userIds = managers.map((u) => u.userId);
  const reports = await listReportsForUsersInDateRange({
    userIds,
    startDate: params.startDate,
    endDate: params.endDate,
  });

  const rows: MissedReportsRow[] = [];
  for (const user of managers) {
    const d = await getDisciplineForPeriod(
      user.userId,
      params.startDate,
      params.endDate,
      reports,
    );
    rows.push({ user, discipline: d });
  }

  return rows.sort((a, b) => {
    const missA = a.discipline.missedDates.length;
    const missB = b.discipline.missedDates.length;
    if (missB !== missA) return missB - missA;
    return (a.discipline.completionPct ?? 0) - (b.discipline.completionPct ?? 0);
  });
}
