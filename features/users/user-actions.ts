"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth/auth-options";
import {
  getAllUsers,
  updateUserRoleAndStatus,
  createUser,
} from "@/lib/repositories/users-repository";
import { UserRole } from "@/types/domain";
import bcrypt from "bcryptjs";

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

export async function createUserAdmin(data: {
  fullName: string;
  email: string;
  username: string;
  password: string;
  role: UserRole;
  teamId?: string;
  teamName?: string;
  telegramChatId?: string;
  reminderEmail?: string;
}) {
  await requireAdminSession();

  const fullName = data.fullName.trim();
  const email = data.email.trim();
  const username = data.username.trim();
  const password = data.password;

  if (!fullName || !email || !username || !password) {
    throw new Error("fullName, email, username and password are required");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await createUser({
    fullName,
    email,
    username,
    passwordHash,
    role: data.role,
    teamId: data.teamId?.trim() || null,
    teamName: data.teamName?.trim() || null,
    isActive: true,
    telegramChatId: data.telegramChatId?.trim() || null,
    reminderEmail: data.reminderEmail?.trim() || email,
  });
}

