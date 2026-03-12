import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/server/auth/auth-options";
import { UserRole, type UserRecord } from "@/types/domain";
import {
  listAllUsers,
  updateUserAdmin,
  createUserAdmin,
} from "@/features/users/user-actions";
import { revalidatePath } from "next/cache";

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
      <CreateUserCard />
      <UsersTable users={users} />
    </div>
  );
}

async function createUser(formData: FormData) {
  "use server";
  const fullName = String(formData.get("fullName") ?? "");
  const email = String(formData.get("email") ?? "");
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const role = (formData.get("role") as UserRole) ?? UserRole.Manager;
  const teamId = String(formData.get("teamId") ?? "");
  const teamName = String(formData.get("teamName") ?? "");
  const telegramChatId = String(formData.get("telegramChatId") ?? "");
  const reminderEmail = String(formData.get("reminderEmail") ?? "");

  await createUserAdmin({
    fullName,
    email,
    username,
    password,
    role,
    teamId,
    teamName,
    telegramChatId,
    reminderEmail,
  });

  revalidatePath("/dashboard/users");
}

function CreateUserCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-900">
        Add user / Добавить пользователя
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        Create managers, heads and admins. Password will be stored as a bcrypt
        hash in the <span className="font-mono">users</span> sheet.
      </p>
      <form
        action={createUser}
        className="mt-3 grid gap-3 text-xs md:grid-cols-3"
      >
        <label className="flex flex-col gap-1">
          <span className="font-medium text-slate-700">Full name</span>
          <input
            name="fullName"
            required
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-medium text-slate-700">Email</span>
          <input
            type="email"
            name="email"
            required
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-medium text-slate-700">Username</span>
          <input
            name="username"
            required
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-medium text-slate-700">Password</span>
          <input
            type="password"
            name="password"
            required
            minLength={6}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-medium text-slate-700">Role</span>
          <select
            name="role"
            defaultValue={UserRole.Manager}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900"
          >
            <option value={UserRole.Manager}>manager</option>
            <option value={UserRole.Head}>head</option>
            <option value={UserRole.Admin}>admin</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-medium text-slate-700">Team ID (optional)</span>
          <input
            name="teamId"
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-medium text-slate-700">
            Team name (for heads)
          </span>
          <input
            name="teamName"
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-medium text-slate-700">
            Telegram chat id (optional)
          </span>
          <input
            name="telegramChatId"
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-medium text-slate-700">
            Reminder email (optional)
          </span>
          <input
            type="email"
            name="reminderEmail"
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900"
          />
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            className="inline-flex items-center rounded-md bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white shadow hover:bg-sky-500"
          >
            Create user
          </button>
        </div>
      </form>
    </div>
  );
}

function UsersTable({ users }: { users: UserRecord[] }) {
  if (users.length === 0) {
    return (
      <p className="text-xs text-slate-500">
        No users found. Use the form above or add rows to the{" "}
        <span className="font-mono">users</span> sheet.
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

