"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth/auth-options";
import { listReminders } from "@/lib/repositories/reminders-repository";
import type { ReminderRecord } from "@/types/domain";
import { UserRole } from "@/types/domain";

type SessionUser = { role: UserRole };

export async function loadReminderHistory(params: {
  limit?: number;
}): Promise<ReminderRecord[] | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthenticated");
  const me = session.user as SessionUser;
  if (me.role !== UserRole.Head && me.role !== UserRole.Admin) return null;
  return listReminders({ limit: params.limit ?? 50 });
}
