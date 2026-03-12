"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth/auth-options";
import {
  getPlansForUserMonth,
  upsertUserMonthPlans,
} from "@/lib/repositories/plans-repository";
import { getAllUsers } from "@/lib/repositories/users-repository";
import { MetricKey, UserRole, type UserRecord } from "@/types/domain";

type SessionUser = {
  id: string;
  role: UserRole;
  teamId: string | null;
};

export type EditablePlanEntry = {
  metricKey: MetricKey;
  planValue: number;
};

export async function getCurrentUserAndTeam() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Unauthenticated");
  }
  const user = session.user as SessionUser;
  return user;
}

export async function loadUserMonthPlans(userId: string, year: number, month: number) {
  const plans = await getPlansForUserMonth({ userId, year, month });
  return plans;
}

export async function loadTeamMembersForPlanner(): Promise<UserRecord[]> {
  const user = await getCurrentUserAndTeam();
  const all = await getAllUsers();

  if (user.role === UserRole.Admin) {
    return all.filter((u) => u.isActive);
  }
  if (user.role === UserRole.Head) {
    return all.filter((u) => u.isActive && u.teamId === user.teamId);
  }
  // managers only see themselves
  return all.filter((u) => u.userId === user.id && u.isActive);
}

export async function saveUserMonthPlans(
  targetUserId: string,
  year: number,
  month: number,
  entries: EditablePlanEntry[],
) {
  const me = await getCurrentUserAndTeam();
  const users = await getAllUsers();
  const target = users.find((u) => u.userId === targetUserId);
  if (!target) throw new Error("Target user not found");

  const isAdmin = me.role === UserRole.Admin;
  const isHeadOfSameTeam =
    me.role === UserRole.Head && me.teamId && me.teamId === target.teamId;
  const isSelf = me.id === targetUserId;

  if (!(isAdmin || isHeadOfSameTeam || isSelf)) {
    throw new Error("Not allowed to edit this user's plans");
  }

  const sanitized = entries
    .filter((e) => e.planValue >= 0)
    .map((e) => ({
      metricKey: e.metricKey,
      planValue: e.planValue,
      updatedBy: me.id,
    }));

  await upsertUserMonthPlans({
    userId: targetUserId,
    teamId: target.teamId,
    year,
    month,
    entries: sanitized,
  });
}

