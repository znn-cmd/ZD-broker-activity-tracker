"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth/auth-options";
import { listAuditLog } from "@/lib/repositories/audit-repository";
import type { AuditLogEntry } from "@/types/domain";
import { UserRole } from "@/types/domain";

type SessionUser = { role: UserRole };

export async function loadAuditLog(params: {
  limit?: number;
  userId?: string;
  action?: string;
}): Promise<AuditLogEntry[] | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthenticated");
  if ((session.user as SessionUser).role !== UserRole.Admin) {
    return null;
  }
  return listAuditLog(params);
}
