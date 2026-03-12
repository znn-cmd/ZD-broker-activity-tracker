import { v4 as uuidv4 } from "uuid";
import { appendSheetRow, getSheetRows, updateSheetRow } from "@/lib/google/sheetsClient";
import type { UserRecord } from "@/types/domain";
import { UserRole } from "@/types/domain";

const SHEET_NAME = "users";

type RawUserRow = {
  rowIndex: number;
  data: UserRecord;
};

function parseBoolean(value: string | undefined): boolean {
  return value === "true" || value === "1" || value === "TRUE";
}

function serializeBoolean(value: boolean): string {
  return value ? "true" : "false";
}

function parseUserRow(row: string[], rowIndex: number): RawUserRow | null {
  if (row.length === 0) return null;

  const [
    user_id,
    full_name,
    email,
    username,
    password_hash,
    role,
    team_id,
    team_name,
    is_active,
    telegram_chat_id,
    reminder_email,
    created_at,
    updated_at,
  ] = row;

  if (!user_id) return null;

  const data: UserRecord = {
    userId: user_id,
    fullName: full_name ?? "",
    email: email ?? "",
    username: username ?? "",
    passwordHash: password_hash ?? "",
    role: (role as UserRole) || UserRole.Manager,
    teamId: team_id || null,
    teamName: team_name || null,
    isActive: parseBoolean(is_active ?? "true"),
    telegramChatId: telegram_chat_id || null,
    reminderEmail: reminder_email || null,
    createdAt: created_at ?? "",
    updatedAt: updated_at ?? "",
  };

  return { rowIndex, data };
}

function serializeUserRow(user: UserRecord): (string | null)[] {
  return [
    user.userId,
    user.fullName,
    user.email,
    user.username,
    user.passwordHash,
    user.role,
    user.teamId,
    user.teamName,
    serializeBoolean(user.isActive),
    user.telegramChatId,
    user.reminderEmail,
    user.createdAt,
    user.updatedAt,
  ];
}

export async function getAllUsers(): Promise<UserRecord[]> {
  const rows = await getSheetRows(SHEET_NAME);
  if (!rows || rows.length <= 1) return [];

  const [, ...dataRows] = rows;
  const parsed: UserRecord[] = [];

  dataRows.forEach((row, index) => {
    const parsedRow = parseUserRow(row, index + 2); // +2 because of header row
    if (parsedRow) {
      parsed.push(parsedRow.data);
    }
  });

  return parsed;
}

export async function getUserByIdentifier(
  identifier: string,
): Promise<UserRecord | null> {
  const rows = await getSheetRows(SHEET_NAME);
  if (!rows || rows.length <= 1) return null;

  const [, ...dataRows] = rows;

  for (let i = 0; i < dataRows.length; i += 1) {
    const row = dataRows[i];
    const parsedRow = parseUserRow(row, i + 2);
    if (!parsedRow) continue;
    const user = parsedRow.data;
    if (
      user.email.toLowerCase() === identifier.toLowerCase() ||
      user.username.toLowerCase() === identifier.toLowerCase()
    ) {
      return user;
    }
  }

  return null;
}

export async function createInitialAdminIfNeeded() {
  const existingUsers = await getAllUsers();
  if (existingUsers.length > 0) return;

  const username = process.env.INITIAL_ADMIN_USERNAME;
  const email = process.env.INITIAL_ADMIN_EMAIL;
  const passwordHash = process.env.INITIAL_ADMIN_PASSWORD_HASH;

  if (!username || !email || !passwordHash) {
    // Silent: app will require manual seeding
    return;
  }

  const now = new Date().toISOString();
  const user: UserRecord = {
    userId: uuidv4(),
    fullName: "Admin",
    email,
    username,
    passwordHash,
    role: UserRole.Admin,
    teamId: null,
    teamName: null,
    isActive: true,
    telegramChatId: null,
    reminderEmail: email,
    createdAt: now,
    updatedAt: now,
  };

  await appendSheetRow(SHEET_NAME, serializeUserRow(user));
}

