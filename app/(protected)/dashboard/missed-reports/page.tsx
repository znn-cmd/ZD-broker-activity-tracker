import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/server/auth/auth-options";
import { UserRole } from "@/types/domain";
import { loadMissedReports } from "@/features/missed-reports/missed-reports-actions";
import { MissedReportsView } from "@/features/missed-reports/MissedReportsView";

function getDefaultRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

type Props = {
  searchParams: Promise<{ start?: string; end?: string }>;
};

export default async function MissedReportsPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const role = (session.user as { role: UserRole }).role;
  if (role !== UserRole.Head && role !== UserRole.Admin) {
    redirect("/dashboard/report");
  }

  const params = await searchParams;
  const startDate = params.start ?? getDefaultRange().startDate;
  const endDate = params.end ?? getDefaultRange().endDate;

  const rows = await loadMissedReports({ startDate, endDate });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-slate-900">
        Missed Reports / Пропуски отчётов
      </h1>
      {rows && rows.length > 0 ? (
        <MissedReportsView rows={rows} startDate={startDate} endDate={endDate} />
      ) : rows && rows.length === 0 ? (
        <p className="text-sm text-slate-500">No users in scope for this period.</p>
      ) : (
        <p className="text-sm text-slate-500">You do not have access to this page.</p>
      )}
    </div>
  );
}
