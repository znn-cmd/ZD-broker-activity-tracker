"use client";

import { useState, useTransition } from "react";
import type { CommentRecord, CommentTargetType, CommentVisibility } from "@/types/domain";
import type { UserRecord } from "@/types/domain";
import {
  addCommentAction,
  updateCommentAction,
} from "./comments-actions";

type Props = {
  initialComments: CommentRecord[];
  users: UserRecord[];
};

export function CommentsView({ initialComments, users }: Props) {
  const [comments, setComments] = useState(initialComments);
  const [filterUserId, setFilterUserId] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const filtered =
    filterUserId === ""
      ? comments
      : comments.filter((c) => c.subjectUserId === filterUserId);

  const userMap = new Map(users.map((u) => [u.userId, u]));

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const targetType = formData.get("targetType") as CommentTargetType;
    const targetId = (formData.get("targetId") as string)?.trim() ?? "";
    const subjectUserId = formData.get("subjectUserId") as string;
    const visibility = formData.get("visibility") as CommentVisibility;
    const commentText = (formData.get("commentText") as string)?.trim() ?? "";
    if (!commentText || !subjectUserId) return;
    startTransition(async () => {
      try {
        const newComment = await addCommentAction({
          targetType,
          targetId,
          subjectUserId,
          visibility,
          commentText,
        });
        setComments((prev) => [newComment, ...prev]);
        form.reset();
      } catch (err) {
        console.error(err);
      }
    });
  }

  function startEdit(c: CommentRecord) {
    setEditingId(c.commentId);
    setEditText(c.commentText);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditText("");
  }

  function saveEdit() {
    if (!editingId) return;
    startTransition(async () => {
      try {
        const updated = await updateCommentAction(editingId, editText);
        if (updated) {
          setComments((prev) =>
            prev.map((x) => (x.commentId === editingId ? updated : x)),
          );
        }
        cancelEdit();
      } catch (e) {
        console.error(e);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs font-medium text-slate-600">
          Filter by broker:
        </label>
        <select
          value={filterUserId}
          onChange={(e) => setFilterUserId(e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
        >
          <option value="">All</option>
          {users.map((u) => (
            <option key={u.userId} value={u.userId}>
              {u.fullName}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Add note
        </h2>
        <form onSubmit={handleAdd} className="flex flex-col gap-3 text-xs">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-medium text-slate-600">
                Broker (subject)
              </label>
              <select
                name="subjectUserId"
                required
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1"
              >
                {users.map((u) => (
                  <option key={u.userId} value={u.userId}>
                    {u.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600">
                Target type
              </label>
              <select
                name="targetType"
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1"
              >
                <option value="daily_report">Daily report</option>
                <option value="user_period">User period</option>
                <option value="plan_review">Plan review</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600">
                Target ID (e.g. date 2026-03-15 or period-2026-03)
              </label>
              <input
                type="text"
                name="targetId"
                placeholder="2026-03-15"
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600">
                Visibility
              </label>
              <select
                name="visibility"
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1"
              >
                <option value="manager_private">Manager only</option>
                <option value="manager_to_broker">Visible to broker</option>
                <option value="admin_internal">Admin internal</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-600">
              Comment text
            </label>
            <textarea
              name="commentText"
              rows={3}
              required
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="w-fit rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
          >
            {isPending ? "Adding…" : "Add note"}
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <h2 className="border-b border-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Notes ({filtered.length})
        </h2>
        <ul className="divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <li className="px-3 py-4 text-xs text-slate-500">No comments yet.</li>
          ) : (
            filtered.map((c) => (
              <li key={c.commentId} className="px-3 py-2 text-xs">
                {editingId === c.commentId ? (
                  <div className="space-y-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={2}
                      className="w-full rounded border border-slate-300 px-2 py-1"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={saveEdit}
                        disabled={isPending}
                        className="rounded bg-slate-800 px-2 py-1 text-white hover:bg-slate-700"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded border border-slate-300 px-2 py-1"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                      <span>
                        Re: {userMap.get(c.subjectUserId)?.fullName ?? c.subjectUserId}
                      </span>
                      <span>{c.targetType} · {c.targetId}</span>
                      <span>{c.visibility}</span>
                      <span>
                        {new Date(c.createdAt).toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => startEdit(c)}
                        className="text-sky-600 hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                    <p className="mt-1 text-slate-800 whitespace-pre-wrap">
                      {c.commentText}
                    </p>
                  </>
                )}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
