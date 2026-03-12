const TELEGRAM_API = "https://api.telegram.org";

export async function sendTelegramMessage(
  chatId: string,
  text: string,
): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return { ok: false, error: "TELEGRAM_BOT_TOKEN not set" };
  }
  const url = `${TELEGRAM_API}/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    }),
  });
  const data = (await res.json()) as { ok?: boolean; description?: string };
  if (!res.ok) {
    return { ok: false, error: data.description ?? res.statusText };
  }
  return { ok: data.ok ?? true };
}

export function buildReminderMessage(userName: string, reportDate: string): string {
  return (
    `🔔 <b>Broker Activity Tracker</b>\n\n` +
    `Привет, ${userName}. Напоминаем сдать ежедневный отчёт за <b>${reportDate}</b>.\n\n` +
    `Please submit your daily report for ${reportDate}.`
  );
}
