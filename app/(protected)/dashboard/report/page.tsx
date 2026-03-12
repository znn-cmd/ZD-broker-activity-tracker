import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/server/auth/auth-options";
import { ReportPageContent } from "@/features/reports/ReportPageContent";

export default async function ReportPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const today = new Date().toISOString().slice(0, 10);

  return <ReportPageContent initialDate={today} />;
}

