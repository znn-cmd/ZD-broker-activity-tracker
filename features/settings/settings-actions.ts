"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth/auth-options";
import { getAllSettings, setSetting } from "@/lib/repositories/settings-repository";
import { UserRole } from "@/types/domain";

type SessionUser = { id: string; role: UserRole };

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthenticated");
  const me = session.user as SessionUser;
  if (me.role !== UserRole.Admin) throw new Error("Forbidden");
  return me;
}

export async function loadSettings(): Promise<Record<string, string>> {
  await requireAdmin();
  return getAllSettings();
}

export async function saveSettingsAction(settings: Record<string, string>) {
  await requireAdmin();
  for (const [key, value] of Object.entries(settings)) {
    await setSetting(key, value);
  }
}
