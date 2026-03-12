import { getAllUsers } from "@/lib/repositories/users-repository";
import { getReportByUserAndDate } from "@/lib/repositories/reports-repository";
import { appendReminder } from "@/lib/repositories/reminders-repository";
import { isWorkingDay } from "@/analytics/workingDays";
import { sendTelegramMessage, buildReminderMessage } from "./telegram-reminder";

export type ReminderRunResult = {
  reportDate: string;
  sent: number;
  failed: number;
  skipped: number;
  errors: string[];
};

/** Run reminders for the given date: find users without report, send Telegram to those with chat_id. */
export async function runRemindersForDate(
  reportDate: string,
): Promise<ReminderRunResult> {
  const result: ReminderRunResult = {
    reportDate,
    sent: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  const date = new Date(reportDate + "T12:00:00Z");
  const isWork = await isWorkingDay(date);
  if (!isWork) {
    return result;
  }

  const users = await getAllUsers();
  const activeWithTelegram = users.filter(
    (u) =>
      u.role === "manager" &&
      u.isActive &&
      u.telegramChatId &&
      u.telegramChatId.trim() !== "",
  );

  for (const user of activeWithTelegram) {
    const existing = await getReportByUserAndDate(user.userId, reportDate);
    if (existing) {
      result.skipped += 1;
      continue;
    }

    const text = buildReminderMessage(user.fullName || user.username, reportDate);
    const send = await sendTelegramMessage(user.telegramChatId!, text);
    const now = new Date().toISOString();

    if (send.ok) {
      result.sent += 1;
      await appendReminder({
        userId: user.userId,
        reportDate,
        channel: "telegram",
        status: "sent",
        sentAt: now,
        payloadJson: JSON.stringify({ chatId: user.telegramChatId }),
      });
    } else {
      result.failed += 1;
      result.errors.push(`${user.username}: ${send.error ?? "unknown"}`);
      await appendReminder({
        userId: user.userId,
        reportDate,
        channel: "telegram",
        status: "failed",
        sentAt: now,
        payloadJson: JSON.stringify({ error: send.error }),
      });
    }
  }

  return result;
}
