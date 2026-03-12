import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/server/auth/auth-options";
import { UserRole } from "@/types/domain";
import { loadAuditLog } from "@/features/audit-log/audit-actions";

export default async function AuditLogPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if ((session.user as { role: UserRole }).role !== UserRole.Admin) {
    redirect("/dashboard/report");
  }

  const entries = await loadAuditLog({ limit: 100 });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-slate-900">Audit Log</h1>
      <p className="text-xs text-slate-500">
        Recent actions. Data from the <span className="font-mono">audit_log</span> sheet.
      </p>
      {entries && entries.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full border-collapse text-xs">
            <thead className="bg-slate-50 text-left text-[11px] font-semibold text-slate-600">
              <tr>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">User ID</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Entity</th>
                <th className="px-3 py-2">ID</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.logId} className="border-t border-slate-100">
                  <td className="px-3 py-2 text-slate-600">
                    {new Date(e.createdAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px]">{e.userId}</td>
                  <td className="px-3 py-2">{e.action}</td>
                  <td className="px-3 py-2">{e.entityType}</td>
                  <td className="max-w-[120px] truncate px-3 py-2 font-mono text-[11px]">
                    {e.entityId}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-slate-500">No audit entries yet.</p>
      )}
    </div>
  );
}
