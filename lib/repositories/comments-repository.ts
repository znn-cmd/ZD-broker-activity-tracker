import { v4 as uuidv4 } from "uuid";
import {
  appendSheetRow,
  getSheetRows,
  updateSheetRow,
} from "@/lib/google/sheetsClient";
import type {
  CommentRecord,
  CommentTargetType,
  CommentVisibility,
} from "@/types/domain";

const SHEET_NAME = "comments";

type RawCommentRow = { rowIndex: number; data: CommentRecord };

function parseCommentRow(row: string[], rowIndex: number): RawCommentRow | null {
  if (row.length < 9) return null;
  const [
    comment_id,
    target_type,
    target_id,
    subject_user_id,
    author_user_id,
    visibility,
    comment_text,
    created_at,
    updated_at,
  ] = row;
  if (!comment_id || !target_type || !target_id || !author_user_id) return null;
  return {
    rowIndex,
    data: {
      commentId: comment_id,
      targetType: target_type as CommentTargetType,
      targetId: target_id,
      subjectUserId: subject_user_id ?? "",
      authorUserId: author_user_id,
      visibility: (visibility as CommentVisibility) ?? "manager_private",
      commentText: comment_text ?? "",
      createdAt: created_at ?? "",
      updatedAt: updated_at ?? "",
    },
  };
}

function serializeComment(c: CommentRecord): (string | null)[] {
  return [
    c.commentId,
    c.targetType,
    c.targetId,
    c.subjectUserId,
    c.authorUserId,
    c.visibility,
    c.commentText,
    c.createdAt,
    c.updatedAt,
  ];
}

export async function listCommentsBySubjectUser(
  subjectUserId: string,
): Promise<CommentRecord[]> {
  const rows = await getSheetRows(SHEET_NAME);
  if (!rows || rows.length <= 1) return [];
  const [, ...dataRows] = rows;
  const out: CommentRecord[] = [];
  dataRows.forEach((row, index) => {
    const parsed = parseCommentRow(row, index + 2);
    if (parsed && parsed.data.subjectUserId === subjectUserId) {
      out.push(parsed.data);
    }
  });
  return out.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function listCommentsByTarget(
  targetType: CommentRecord["targetType"],
  targetId: string,
): Promise<CommentRecord[]> {
  const rows = await getSheetRows(SHEET_NAME);
  if (!rows || rows.length <= 1) return [];
  const [, ...dataRows] = rows;
  const out: CommentRecord[] = [];
  dataRows.forEach((row, index) => {
    const parsed = parseCommentRow(row, index + 2);
    if (
      parsed &&
      parsed.data.targetType === targetType &&
      parsed.data.targetId === targetId
    ) {
      out.push(parsed.data);
    }
  });
  return out.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function createComment(comment: Omit<CommentRecord, "commentId" | "createdAt" | "updatedAt">): Promise<CommentRecord> {
  const now = new Date().toISOString();
  const full: CommentRecord = {
    ...comment,
    commentId: uuidv4(),
    createdAt: now,
    updatedAt: now,
  };
  await appendSheetRow(SHEET_NAME, serializeComment(full));
  return full;
}

export async function updateCommentText(
  commentId: string,
  commentText: string,
): Promise<CommentRecord | null> {
  const rows = await getSheetRows(SHEET_NAME);
  if (!rows || rows.length <= 1) return null;
  const [, ...dataRows] = rows;
  for (let i = 0; i < dataRows.length; i += 1) {
    const parsed = parseCommentRow(dataRows[i], i + 2);
    if (!parsed || parsed.data.commentId !== commentId) continue;
    const updated: CommentRecord = {
      ...parsed.data,
      commentText,
      updatedAt: new Date().toISOString(),
    };
    await updateSheetRow(SHEET_NAME, parsed.rowIndex, serializeComment(updated));
    return updated;
  }
  return null;
}
