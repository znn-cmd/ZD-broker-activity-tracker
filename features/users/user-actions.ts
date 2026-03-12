"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth/auth-options";
import {
  getAllUsers,
  updateUserRoleAndStatus,
} from "@/lib/repositories/users-repository";
import { UserRole } from "@/types/domain";

type SessionUser = {
  id: string;
  role: UserRole;
};

export async function requireAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthenticated");
  const user = session.user as SessionUser;
  if (user.role !== UserRole.Admin) {
    throw new Error("Forbidden");
  }
  return user;
}

export async function listAllUsers() {
  await requireAdminSession();
  return getAllUsers();
}

export async function updateUserAdmin(data: {
  userId: string;
  role: UserRole;
  isActive: boolean;
}) {
  await requireAdminSession();
  await updateUserRoleAndStatus(data);
}

