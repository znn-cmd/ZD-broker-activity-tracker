import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/server/auth/auth-options";
import { DailyReportForm } from "@/features/reports/DailyReportForm";

export default async function ReportPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)]">
      <div className="space-y-4">
        <h1 className="text-lg font-semibold text-slate-900">
          Daily Report / Ежедневный отчет
        </h1>
        <DailyReportForm initialDate={today} />
      </div>
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-800">
          Live performance / Текущая эффективность
        </h2>
        <p className="text-xs text-slate-500">
          After you select a date and save the report, the panel below shows
          your daily snapshot, month plan tracking, and pace.
        </p>
        {/* Analytics cards will be rendered client-side from form state */}
        {/* This keeps the first milestone focused on end-to-end data flow */}
      </div>
    </div>
  );
}

