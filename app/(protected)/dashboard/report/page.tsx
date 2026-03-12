import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/server/auth/auth-options";
import { ReportPageContent } from "@/features/reports/ReportPageContent";
import { getAllUsers } from "@/lib/repositories/users-repository";
import { UserRole } from "@/types/domain";

export default async function ReportPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }
  const me = session.user as { id: string; role: UserRole };

  const today = new Date().toISOString().slice(0, 10);

  let managers:
    | {
        userId: string;
        fullName: string;
      }[]
    | undefined;

  if (me.role === UserRole.Admin) {
    const all = await getAllUsers();
    managers = all
      .filter((u) => u.role === UserRole.Manager && u.isActive)
      .map((u) => ({ userId: u.userId, fullName: u.fullName || u.username }));
  }

  return (
    <ReportPageContent
      initialDate={today}
      isAdmin={me.role === UserRole.Admin}
      managers={managers}
    />
  );
}

