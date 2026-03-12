import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/server/auth/auth-options";
import { getPlansForUserMonth } from "@/lib/repositories/plans-repository";
import type { MonthlyPlanRecord, UserRecord, UserRole } from "@/types/domain";
import { loadTeamMembersForPlanner } from "@/features/plans/plan-actions";
import { TeamPlansEditor } from "@/features/plans/TeamPlansEditor";

type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: UserRole;
  teamId: string | null;
};

export default async function PlansPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const me = session.user as SessionUser;
  const today = new Date();
  const year = today.getUTCFullYear();
  const month = today.getUTCMonth() + 1;

  const users = await loadTeamMembersForPlanner();

  // Manager: simple read-only view of own plans
  if (me.role === "manager") {
    const plans = await getPlansForUserMonth({ userId: me.id, year, month });
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            Targets & Plans / Планы и цели
          </h1>
          <p className="text-xs text-slate-500">
            Month: {year}-{String(month).padStart(2, "0")}. Your monthly plan
            values from Google Sheets.
          </p>
        </div>
        {plans.length === 0 ? (
          <p className="text-xs text-slate-500">
            No plans found for this month. Ask your head or admin to configure
            your monthly targets.
          </p>
        ) : (
          <PlansTable plans={plans} />
        )}
      </div>
    );
  }

  // Head & Admin: full team planning editor
  const initialSelectedUserId = users[0]?.userId ?? null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">
          Team Plans / Командное планирование
        </h1>
        <p className="text-xs text-slate-500">
          Set monthly targets per broker and metric. Changes are saved directly
          to the <span className="font-mono">monthly_plans</span> sheet.
        </p>
      </div>
      {users.length === 0 ? (
        <p className="text-xs text-slate-500">
          No active users found in your scope.
        </p>
      ) : (
        <TeamPlansEditor
          initialUsers={users as UserRecord[]}
          initialYear={year}
          initialMonth={month}
          initialSelectedUserId={initialSelectedUserId}
        />
      )}
    </div>
  );
}

type PlansTableProps = {
  plans: MonthlyPlanRecord[];
};

function PlansTable({ plans }: PlansTableProps) {
  const sorted = [...plans].sort((a, b) => a.metricKey.localeCompare(b.metricKey));

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full border-collapse text-xs">
        <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          <tr>
            <th className="px-3 py-2">Metric</th>
            <th className="px-3 py-2">Plan value</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((plan) => (
            <tr key={plan.planId} className="border-t border-slate-100">
              <td className="px-3 py-2 font-mono text-[11px] text-slate-700">
                {plan.metricKey}
              </td>
              <td className="px-3 py-2 text-slate-900">{plan.planValue}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

