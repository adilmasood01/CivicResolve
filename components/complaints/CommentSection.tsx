"use client";

import { useState, useTransition } from "react";
import { formatDateTime } from "@/lib/utils";
import type { CommentType } from "@prisma/client";
import type { SafeUser, SessionUser } from "@/types";
import { addCommentAction } from "@/app/actions/complaints";
import { MessageSquare, Lock, Send, AlertCircle } from "lucide-react";

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

  // Filter comments based on tab
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
      // Force citizens to PUBLIC_COMMENT
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
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-600" aria-hidden="true" />
          <h3 className="font-semibold text-gray-900 text-lg">Comments & Updates</h3>
          <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
            {visibleComments.length}
          </span>
        </div>

        {isStaff && (
          <div className="flex bg-gray-100 p-1 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={`px-3 py-1 rounded-md transition ${
                activeTab === "ALL"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All ({comments.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("PUBLIC")}
              className={`px-3 py-1 rounded-md transition ${
                activeTab === "PUBLIC"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Public
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("INTERNAL")}
              className={`px-3 py-1 rounded-md transition ${
                activeTab === "INTERNAL"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Internal Notes
            </button>
          </div>
        )}
      </div>

      {/* Comment List */}
      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
        {visibleComments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm bg-gray-50 rounded-lg border border-dashed border-gray-200">
            No comments posted yet.
          </div>
        ) : (
          visibleComments.map((c) => {
            const isInternal = c.type === "INTERNAL_NOTE";
            return (
              <div
                key={c.id}
                className={`p-4 rounded-xl border text-sm transition ${
                  isInternal
                    ? "bg-amber-50/60 border-amber-200/80"
                    : "bg-gray-50/80 border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      {c.author?.name || c.author?.email || "User"}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-700 font-medium">
                      {c.author?.role}
                    </span>
                    {isInternal && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 bg-amber-100 text-amber-800 rounded border border-amber-300">
                        <Lock className="h-3 w-3" aria-hidden="true" />
                        Internal Note
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDateTime(c.createdAt)}
                  </span>
                </div>
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {c.content}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-3 pt-4 border-t">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isStaff && (
          <div className="flex items-center gap-4 text-xs font-medium">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="type"
                checked={commentType === "PUBLIC_COMMENT"}
                onChange={() => setCommentType("PUBLIC_COMMENT")}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-800">Public Comment (Visible to Citizen)</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="type"
                checked={commentType === "INTERNAL_NOTE"}
                onChange={() => setCommentType("INTERNAL_NOTE")}
                className="text-amber-600 focus:ring-amber-500"
              />
              <span className="text-amber-800 font-semibold flex items-center gap-1">
                <Lock className="h-3 w-3" aria-hidden="true" />
                Internal Staff Note Only
              </span>
            </label>
          </div>
        )}

        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder={
              commentType === "INTERNAL_NOTE"
                ? "Write an internal note for staff members..."
                : "Write a comment or response..."
            }
            className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
            required
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending || !content.trim()}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-white transition disabled:opacity-50 ${
              commentType === "INTERNAL_NOTE"
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            <span>{isPending ? "Posting..." : "Post Comment"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
