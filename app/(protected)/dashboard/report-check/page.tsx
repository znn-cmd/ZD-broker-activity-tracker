import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/server/auth/auth-options";
import { UserRole } from "@/types/domain";
import { ReportCheckPageContent } from "@/features/report-check/ReportCheckPageContent";

export default async function ReportCheckPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const me = session.user as { id: string; role: UserRole };
  if (me.role !== UserRole.Admin) {
    redirect("/dashboard/report");
  }

  return (
    <ReportCheckPageContent />
  );
}

