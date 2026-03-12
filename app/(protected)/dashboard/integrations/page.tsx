import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/server/auth/auth-options";
import { UserRole } from "@/types/domain";
import { loadReminderHistory } from "@/features/integrations/integrations-actions";

export default async function IntegrationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const role = (session.user as { role: UserRole }).role;
  if (role !== UserRole.Head && role !== UserRole.Admin) {
    redirect("/dashboard/report");
  }

  const reminders = await loadReminderHistory({ limit: 50 });

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-slate-900">
        Integrations / Интеграции
      </h1>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-800">Telegram</h2>
        <p className="mt-1 text-xs text-slate-600">
          Set <span className="font-mono">TELEGRAM_BOT_TOKEN</span> in environment.
          Reminders can be sent via Telegram Bot API when configured and enabled in settings.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-800">Email</h2>
        <p className="mt-1 text-xs text-slate-600">
          Set <span className="font-mono">EMAIL_PROVIDER_API_KEY</span> and{" "}
          <span className="font-mono">EMAIL_FROM_ADDRESS</span> for reminder emails.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-800">Reminder history</h2>
        <p className="mt-1 text-xs text-slate-500">
          From <span className="font-mono">reminders</span> sheet.
        </p>
        {reminders && reminders.length > 0 ? (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full border-collapse text-xs">
              <thead className="bg-slate-50 text-left text-[11px] font-semibold text-slate-600">
                <tr>
                  <th className="px-3 py-2">Sent at</th>
                  <th className="px-3 py-2">User ID</th>
                  <th className="px-3 py-2">Report date</th>
                  <th className="px-3 py-2">Channel</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {reminders.map((r) => (
                  <tr key={r.reminderId} className="border-t border-slate-100">
                    <td className="px-3 py-2">{r.sentAt ? new Date(r.sentAt).toLocaleString() : "—"}</td>
                    <td className="px-3 py-2 font-mono text-[11px]">{r.userId}</td>
                    <td className="px-3 py-2">{r.reportDate}</td>
                    <td className="px-3 py-2">{r.channel}</td>
                    <td className="px-3 py-2">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-xs text-slate-500">No reminders sent yet.</p>
        )}
      </div>
    </div>
  );
}
