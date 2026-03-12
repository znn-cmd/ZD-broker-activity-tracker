import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/server/auth/auth-options";
import { getPersonalAnalytics } from "@/features/analytics/personal-analytics-actions";
import { PersonalAnalyticsView } from "@/features/analytics/PersonalAnalyticsView";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const { summary } = await getPersonalAnalytics({ periodType: "month" });

  return <PersonalAnalyticsView initialData={summary} />;
}

