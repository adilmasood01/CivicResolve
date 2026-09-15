"use client";

import { useState, useTransition } from "react";
import { formatDateTime } from "@/lib/utils";
import type { CommentType } from "@prisma/client";
import type { SafeUser, SessionUser } from "@/types";
import { addCommentAction } from "@/app/actions/complaints";
import { Lock, Send, AlertCircle } from "lucide-react";

export interface CommentItem {
  id: string;
  content: string;
  type: CommentType;
  createdAt: Date | string;
  author: SafeUser;
}

interface CommentSectionProps {
  complaintId: string;
  comments: CommentItem[];
  currentUser: SessionUser;
}

export function CommentSection({
  complaintId,
  comments,
  currentUser,
}: CommentSectionProps) {
  const isStaff =
    currentUser.role === "OFFICER" ||
    currentUser.role === "DEPARTMENT_MANAGER" ||
    currentUser.role === "ADMIN";

  const [activeTab, setActiveTab] = useState<"ALL" | "PUBLIC" | "INTERNAL">(
    "ALL"
  );
  const [content, setContent] = useState("");
  const [commentType, setCommentType] =
    useState<CommentType>("PUBLIC_COMMENT");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const visibleComments = comments.filter((c) => {
    if (!isStaff && c.type === "INTERNAL_NOTE") return false;
    if (activeTab === "PUBLIC") return c.type === "PUBLIC_COMMENT";
    if (activeTab === "INTERNAL") return c.type === "INTERNAL_NOTE";
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setError(null);
    startTransition(async () => {
      const typeToSend = isStaff ? commentType : "PUBLIC_COMMENT";
      const res = await addCommentAction(complaintId, content, typeToSend);

      if (!res.success) {
        setError(res.error);
      } else {
        setContent("");
      }
    });
  };

  return (
    <section className="mb-8 border-t border-border pt-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Comments
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              ({visibleComments.length})
            </span>
          </h2>
        </div>

        {isStaff && (
          <div className="flex gap-1 text-xs">
            {(
              [
                ["ALL", `All (${comments.length})`],
                ["PUBLIC", "Public"],
                ["INTERNAL", "Internal"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  activeTab === key
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mb-4 max-h-[500px] space-y-3 overflow-y-auto pr-1">
        {visibleComments.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No comments posted yet.
          </p>
        ) : (
          visibleComments.map((c) => {
            const isInternal = c.type === "INTERNAL_NOTE";
            return (
              <div
                key={c.id}
                className={`rounded-md border p-3 text-sm ${
                  isInternal
                    ? "border-amber-200/80 bg-amber-50/40"
                    : "border-border bg-muted/20"
                }`}
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">
                      {c.author?.name || c.author?.email || "User"}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {c.author?.role?.replace(/_/g, " ")}
                    </span>
                    {isInternal && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800">
                        <Lock className="h-3 w-3" aria-hidden="true" />
                        Internal
                      </span>
                    )}
                  </div>
                  <time className="text-[11px] text-muted-foreground">
                    {formatDateTime(c.createdAt)}
                  </time>
                </div>
                <p className="whitespace-pre-wrap leading-relaxed text-foreground">
                  {c.content}
                </p>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 border-t border-border pt-4">
        {error && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {isStaff && (
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <label className="flex cursor-pointer items-center gap-1.5">
              <input
                type="radio"
                name="type"
                checked={commentType === "PUBLIC_COMMENT"}
                onChange={() => setCommentType("PUBLIC_COMMENT")}
                className="accent-primary"
              />
              <span className="text-foreground">Public comment</span>
            </label>
            <label className="flex cursor-pointer items-center gap-1.5">
              <input
                type="radio"
                name="type"
                checked={commentType === "INTERNAL_NOTE"}
                onChange={() => setCommentType("INTERNAL_NOTE")}
                className="accent-amber-600"
              />
              <span className="inline-flex items-center gap-1 font-medium text-amber-800">
                <Lock className="h-3 w-3" aria-hidden="true" />
                Internal note
              </span>
            </label>
          </div>
        )}

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder={
            commentType === "INTERNAL_NOTE"
              ? "Write an internal note for staff…"
              : "Write a comment or response…"
          }
          className="w-full rounded-md border border-border bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          required
        />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending || !content.trim()}
            className={`inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50 ${
              commentType === "INTERNAL_NOTE"
                ? "bg-amber-700 hover:opacity-90"
                : "bg-primary hover:opacity-90"
            }`}
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            {isPending ? "Posting…" : "Post comment"}
          </button>
        </div>
      </form>
    </section>
  );
}
