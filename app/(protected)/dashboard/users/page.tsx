import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/server/auth/auth-options";
import { UserRole, type UserRecord } from "@/types/domain";
import { listAllUsers, updateUserAdmin } from "@/features/users/user-actions";

type SessionUser = {
  id: string;
  role: UserRole;
};

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }
  const me = session.user as SessionUser;
  if (me.role !== UserRole.Admin) {
    redirect("/dashboard/report");
  }

  const users = await listAllUsers();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">
          Users / Пользователи
        </h1>
        <p className="text-xs text-slate-500">
          Manage access, roles, and activation for all brokers and heads of
          department.
        </p>
      </div>
      <UsersTable users={users} />
    </div>
  );
}

function UsersTable({ users }: { users: UserRecord[] }) {
  if (users.length === 0) {
    return (
      <p className="text-xs text-slate-500">
        No users found. Add rows to the <span className="font-mono">users</span>{" "}
        sheet.
      </p>
    );
  }

  const sorted = [...users].sort((a, b) =>
    (a.teamName ?? "").localeCompare(b.teamName ?? "") ||
    a.fullName.localeCompare(b.fullName),
  );

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full border-collapse text-xs">
        <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          <tr>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Username</th>
            <th className="px-3 py-2">Email</th>
            <th className="px-3 py-2">Role</th>
            <th className="px-3 py-2">Team</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((user) => (
            <UserRow key={user.userId} user={user} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UserRow({ user }: { user: UserRecord }) {
  async function updateUser(formData: FormData) {
    "use server";
    const role = formData.get("role") as UserRole;
    const isActive = formData.get("isActive") === "on";
    await updateUserAdmin({
      userId: user.userId,
      role,
      isActive,
    });
  }

  return (
    <tr className="border-t border-slate-100">
      <td className="px-3 py-2 text-slate-900">{user.fullName}</td>
      <td className="px-3 py-2 font-mono text-[11px] text-slate-700">
        {user.username}
      </td>
      <td className="px-3 py-2 text-slate-700">{user.email}</td>
      <td className="px-3 py-2" colSpan={3}>
        <form action={updateUser} className="flex items-center gap-4">
          <select
            name="role"
            defaultValue={user.role}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-800"
          >
            <option value={UserRole.Manager}>manager</option>
            <option value={UserRole.Head}>head</option>
            <option value={UserRole.Admin}>admin</option>
          </select>
          <span className="text-slate-700">
            {user.teamName ?? <span className="text-slate-400">—</span>}
          </span>
          <label className="inline-flex items-center gap-1 text-[11px] text-slate-700">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={user.isActive}
              className="h-3 w-3"
            />
            <span>{user.isActive ? "Active" : "Inactive"}</span>
          </label>
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white hover:bg-slate-700"
          >
            Save
          </button>
        </form>
      </td>
    </tr>
  );
}

