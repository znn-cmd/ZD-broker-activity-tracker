import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/server/auth/auth-options";
import { UserRole } from "@/types/domain";
import { loadSettings } from "@/features/settings/settings-actions";
import { SettingsForm } from "@/features/settings/SettingsForm";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const role = (session.user as { role: UserRole }).role;
  if (role !== UserRole.Admin) redirect("/dashboard/report");

  const settings = await loadSettings();

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-slate-900">
        Settings / Настройки
      </h1>
      <p className="text-xs text-slate-500">
        App timezone and pace thresholds. Stored in the{" "}
        <span className="font-mono">settings</span> sheet.
      </p>
      <SettingsForm initialSettings={settings} />
    </div>
  );
}
