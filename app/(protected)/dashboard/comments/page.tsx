import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/server/auth/auth-options";
import { UserRole } from "@/types/domain";
import { loadCommentsForTeamScope } from "@/features/comments/comments-actions";
import { CommentsView } from "@/features/comments/CommentsView";

export default async function CommentsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const role = (session.user as { role: UserRole }).role;
  if (role !== UserRole.Head && role !== UserRole.Admin) {
    redirect("/dashboard/report");
  }

  const { comments, users } = await loadCommentsForTeamScope();

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-slate-900">
        Comments / Заметки
      </h1>
      <CommentsView initialComments={comments} users={users} />
    </div>
  );
}
