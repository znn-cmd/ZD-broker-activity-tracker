import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { authOptions } from "@/server/auth/auth-options";
import { UserRole } from "@/types/domain";
import Image from "next/image";
import Link from "next/link";

type Props = {
  children: ReactNode;
};

export default async function DashboardLayout({ children }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  type SessionUser = {
    id: string;
    name?: string | null;
    email?: string | null;
    role: UserRole;
    teamId: string | null;
  };

  const role = (session.user as SessionUser).role;

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-slate-950/95 px-4 py-6 text-slate-100 md:flex">
        <div className="mb-8 flex items-center gap-3 px-2">
          <Image
            src="/ZIMA-logo.svg"
            alt="ZIMA"
            width={36}
            height={36}
            className="h-9 w-9"
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-400">
              Broker Activity
            </p>
            <p className="text-[11px] text-slate-300">
              Sales cockpit / Кабинет продаж
            </p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 text-sm">
          <SidebarLink href="/dashboard/report" label="Report / Отчет" />
          <SidebarLink
            href="/dashboard/analytics"
            label="Analytics / Аналитика"
          />
          <SidebarLink href="/dashboard/plans" label="Targets / План" />
          {(role === UserRole.Head || role === UserRole.Admin) && (
            <>
              <SidebarLink
                href="/dashboard/team"
                label="Team Dashboard / Команда"
              />
              <SidebarLink
                href="/dashboard/missed-reports"
                label="Missed Reports / Пропуски"
              />
              <SidebarLink
                href="/dashboard/comments"
                label="Comments / Заметки"
              />
            </>
          )}
          {role === UserRole.Admin && (
            <>
              <SidebarLink href="/dashboard/users" label="Users / Пользователи" />
              <SidebarLink href="/dashboard/settings" label="Settings / Настройки" />
              <SidebarLink
                href="/dashboard/report-check"
                label="Report check / Проверка отчетов"
              />
              <SidebarLink href="/dashboard/audit-log" label="Audit Log" />
              <SidebarLink
                href="/dashboard/integrations"
                label="Integrations / Интеграции"
              />
            </>
          )}
        </nav>
        <div className="mt-6 border-t border-slate-800 pt-4 text-xs text-slate-300">
          <p className="font-medium">{session.user?.name}</p>
          <p className="text-[11px] capitalize">{role}</p>
          <form action="/api/auth/signout" method="post" className="mt-3">
            <button
              type="submit"
              className="inline-flex items-center rounded-md border border-slate-700 px-2 py-1 text-[11px] font-medium text-slate-200 hover:border-slate-500 hover:bg-slate-800"
            >
              Logout / Выйти
            </button>
          </form>
        </div>
      </aside>
      <main className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 text-sm">
          <div className="flex items-center gap-2 md:hidden">
            <Image
              src="/ZIMA-logo.svg"
              alt="ZIMA"
              width={28}
              height={28}
              className="h-7 w-7"
            />
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-700">
              Broker Activity
            </span>
          </div>
          <div className="flex-1" />
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600">
            {session.user?.name} · {(role as string).toUpperCase()}
          </span>
        </header>
        <div className="flex-1 px-4 py-4 md:px-6 md:py-6">{children}</div>
      </main>
    </div>
  );
}

type SidebarLinkProps = {
  href: string;
  label: string;
};

function SidebarLink({ href, label }: SidebarLinkProps) {
  return (
    <Link
      href={href}
      className="block rounded-md px-2 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800"
    >
      {label}
    </Link>
  );
}

