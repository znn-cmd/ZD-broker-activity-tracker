import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/server/auth/auth-options";
import { UserRole } from "@/types/domain";
import { loadTeamDashboard } from "@/features/team-dashboard/team-actions";
import { TeamDashboardView } from "@/features/team-dashboard/TeamDashboardView";

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

export default async function TeamPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const role = (session.user as { role: UserRole }).role;
  if (role !== UserRole.Head && role !== UserRole.Admin) {
    redirect("/dashboard/report");
  }

  const params = await searchParams;
  const startDate = params.start ?? getDefaultRange().startDate;
  const endDate = params.end ?? getDefaultRange().endDate;

  const data = await loadTeamDashboard({ startDate, endDate });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-slate-900">
        Team Dashboard / Команда
      </h1>
      {data ? (
        <TeamDashboardView
          data={data}
          startDate={startDate}
          endDate={endDate}
        />
      ) : (
        <p className="text-sm text-slate-500">
          No team data. Add users and reports for your scope.
        </p>
      )}
    </div>
  );
}
