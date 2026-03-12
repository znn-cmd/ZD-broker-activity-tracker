"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth/auth-options";
import { getTeamScopeUsers } from "@/features/team-dashboard/team-actions";
import {
  listCommentsBySubjectUser,
  createComment,
  updateCommentText,
} from "@/lib/repositories/comments-repository";
import type {
  CommentRecord,
  CommentTargetType,
  CommentVisibility,
} from "@/types/domain";
import { UserRole } from "@/types/domain";

type SessionUser = { id: string; role: UserRole };

export async function loadCommentsForTeamScope(): Promise<{
  comments: CommentRecord[];
  users: Awaited<ReturnType<typeof getTeamScopeUsers>>["users"];
}> {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthenticated");
  const me = session.user as SessionUser;
  if (me.role !== UserRole.Head && me.role !== UserRole.Admin) {
    return { comments: [], users: [] };
  }
  const { users } = await getTeamScopeUsers();
  const allComments: CommentRecord[] = [];
  for (const user of users) {
    const list = await listCommentsBySubjectUser(user.userId);
    allComments.push(...list);
  }
  allComments.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return { comments: allComments, users };
}

export async function addCommentAction(payload: {
  targetType: CommentTargetType;
  targetId: string;
  subjectUserId: string;
  visibility: CommentVisibility;
  commentText: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthenticated");
  const me = session.user as SessionUser;
  if (me.role !== UserRole.Head && me.role !== UserRole.Admin) {
    throw new Error("Forbidden");
  }
  const { users } = await getTeamScopeUsers();
  const canComment =
    me.role === UserRole.Admin ||
    users.some((u) => u.userId === payload.subjectUserId);
  if (!canComment) throw new Error("Forbidden");
  return createComment({
    ...payload,
    authorUserId: me.id,
  });
}

export async function updateCommentAction(commentId: string, commentText: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthenticated");
  const me = session.user as SessionUser;
  if (me.role !== UserRole.Head && me.role !== UserRole.Admin) {
    throw new Error("Forbidden");
  }
  return updateCommentText(commentId, commentText);
}
