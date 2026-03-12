"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth/auth-options";
import { getAllUsers } from "@/lib/repositories/users-repository";
import { listReportsForUsersInDateRange } from "@/lib/repositories/reports-repository";
import { getDisciplineForPeriod } from "@/analytics/discipline";
import {
  buildTeamSummary,
  getTeamBuyerConversions,
  getTeamSellerConversions,
  type TeamSummary,
} from "@/analytics/teamAnalytics";
import { getPlansForUserMonth } from "@/lib/repositories/plans-repository";
import { calculateMetricPaceForUserMonth } from "@/analytics/planning";
import { UserRole } from "@/types/domain";

type SessionUser = {
  id: string;
  role: UserRole;
  teamId: string | null;
};

export async function getTeamScopeUsers(): Promise<{
  users: Awaited<ReturnType<typeof getAllUsers>>;
  teamId: string | null;
  teamName: string | null;
}> {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthenticated");
  const me = session.user as SessionUser;
  const all = await getAllUsers();
  const activeManagers = all.filter(
    (u) => u.isActive && u.role === UserRole.Manager,
  );

  if (me.role === UserRole.Admin) {
    return { users: activeManagers, teamId: null, teamName: null };
  }
  if (me.role === UserRole.Head && me.teamId) {
    const teamUsers = activeManagers.filter((u) => u.teamId === me.teamId);
    const teamName = teamUsers[0]?.teamName ?? null;
    return { users: teamUsers, teamId: me.teamId, teamName };
  }
  return { users: [], teamId: null, teamName: null };
}

export type TeamDashboardData = {
  summary: TeamSummary;
  buyerConversions: ReturnType<typeof getTeamBuyerConversions>;
  sellerConversions: ReturnType<typeof getTeamSellerConversions>;
};

export async function loadTeamDashboard(params: {
  startDate: string;
  endDate: string;
}): Promise<TeamDashboardData | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthenticated");
  const me = session.user as SessionUser;
  if (me.role !== UserRole.Head && me.role !== UserRole.Admin) {
    return null;
  }

  const { users, teamId, teamName } = await getTeamScopeUsers();
  if (users.length === 0) {
    return null;
  }

  const userIds = users.map((u) => u.userId);
  const reports = await listReportsForUsersInDateRange({
    userIds,
    startDate: params.startDate,
    endDate: params.endDate,
  });

  const byUser = new Map<string, typeof reports>();
  reports.forEach((r) => {
    const list = byUser.get(r.userId) ?? [];
    list.push(r);
    byUser.set(r.userId, list);
  });

  const disciplineByUser = new Map<string, Awaited<ReturnType<typeof getDisciplineForPeriod>>>();
  for (const user of users) {
    const d = await getDisciplineForPeriod(
      user.userId,
      params.startDate,
      params.endDate,
      reports,
    );
    disciplineByUser.set(user.userId, d);
  }

  const paceByUser = new Map<string, Awaited<ReturnType<typeof calculateMetricPaceForUserMonth>>>();
  const end = new Date(params.endDate + "T12:00:00Z");
  const today = new Date();
  const referenceDate = end > today ? today : end;
  const year = referenceDate.getUTCFullYear();
  const month = referenceDate.getUTCMonth() + 1;

  for (const user of users) {
    const userReports = byUser.get(user.userId) ?? [];
    const plans = await getPlansForUserMonth({ userId: user.userId, year, month });
    const paceStats = await calculateMetricPaceForUserMonth({
      plans,
      reports: userReports,
      year,
      month,
      referenceDate,
    });
    paceByUser.set(user.userId, paceStats);
  }

  const summary = buildTeamSummary(
    users,
    byUser,
    disciplineByUser,
    paceByUser,
    params.startDate,
    params.endDate,
    teamId,
    teamName,
  );

  return {
    summary,
    buyerConversions: getTeamBuyerConversions(summary),
    sellerConversions: getTeamSellerConversions(summary),
  };
}
