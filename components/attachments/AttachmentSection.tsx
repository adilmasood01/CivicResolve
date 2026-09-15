"use client";

import { useState, useRef } from "react";
import {
  FileText,
  Image as ImageIcon,
  UploadCloud,
  Download,
  Trash2,
  Eye,
  Loader2,
  Shield,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { formatDateTime, formatBytes } from "@/lib/utils";
import type { SessionUser } from "@/types";

export interface AttachmentItem {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  visibility: "PUBLIC" | "INTERNAL";
  createdAt: string | Date;
  uploadedBy: {
    id: string;
    name?: string | null;
    email: string;
    role: string;
  };
}

interface AttachmentSectionProps {
  complaintId: string;
  attachments: AttachmentItem[];
  currentUser: SessionUser;
  onRefresh?: () => void;
}

export function AttachmentSection({
  complaintId,
  attachments: initialAttachments,
  currentUser,
  onRefresh,
}: AttachmentSectionProps) {
  const [attachments, setAttachments] = useState<AttachmentItem[]>(initialAttachments);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<"PUBLIC" | "INTERNAL">("PUBLIC");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isStaff = currentUser.role !== "CITIZEN";

  const handleFileUpload = async (file: File) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const MAX_SIZE = 10 * 1024 * 1024;
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

    if (file.size > MAX_SIZE) {
      setErrorMsg("File exceeds the 10 MB maximum size limit.");
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorMsg("Unsupported file type. Please upload a JPEG, PNG, WEBP, or PDF file.");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("visibility", visibility);

      const res = await fetch(`/api/complaints/${complaintId}/attachments`, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to upload file");
      }

      setAttachments((prev) => [json.data, ...prev]);
      setSuccessMsg(`File "${file.name}" uploaded successfully.`);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while uploading file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!confirm("Are you sure you want to delete this attachment?")) return;

    setDeletingId(attachmentId);
    setErrorMsg(null);

    try {
      const res = await fetch(
        `/api/complaints/${complaintId}/attachments/${attachmentId}`,
        { method: "DELETE" }
      );
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete attachment");
      }

      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
      setSuccessMsg("Attachment deleted.");
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to delete attachment");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="mb-8 border-t border-border pt-6">
      <h2 className="mb-4 text-sm font-semibold text-foreground">
        Attachments
        <span className="ml-2 text-xs font-normal text-muted-foreground">
          ({attachments.length})
        </span>
      </h2>

      {errorMsg && (
        <div className="mb-3 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-3 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{successMsg}</span>
        </div>
      )}

      <div
        className={`mb-4 cursor-pointer rounded-lg border border-dashed p-5 text-center transition-colors ${
          dragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
        />

        <div className="flex flex-col items-center gap-2">
          {isUploading ? (
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" aria-hidden="true" />
          ) : (
            <UploadCloud className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
          )}
          <p className="text-sm font-medium text-foreground">
            {isUploading ? "Uploading…" : "Click or drag a file to upload"}
          </p>
          <p className="text-xs text-muted-foreground">
            JPEG, PNG, WEBP, or PDF · Max 10 MB
          </p>
        </div>
      </div>

      {isStaff && (
        <div className="mb-4 flex flex-wrap items-center gap-4 text-xs">
          <span className="font-medium text-muted-foreground">Visibility:</span>
          <label className="flex cursor-pointer items-center gap-1.5">
            <input
              type="radio"
              name="visibility"
              value="PUBLIC"
              checked={visibility === "PUBLIC"}
              onChange={() => setVisibility("PUBLIC")}
              className="accent-primary"
            />
            <span>Public</span>
          </label>
          <label className="flex cursor-pointer items-center gap-1.5">
            <input
              type="radio"
              name="visibility"
              value="INTERNAL"
              checked={visibility === "INTERNAL"}
              onChange={() => setVisibility("INTERNAL")}
              className="accent-primary"
            />
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              <Shield className="h-3.5 w-3.5" aria-hidden="true" />
              Internal only
            </span>
          </label>
        </div>
      )}

      {attachments.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">
          No attachments uploaded yet.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {attachments.map((att) => {
            const isPdf = att.fileType.includes("pdf");
            const canDelete =
              currentUser.role === "ADMIN" ||
              att.uploadedBy.id === currentUser.id ||
              (currentUser.role === "DEPARTMENT_MANAGER" && isStaff);

            return (
              <li
                key={att.id}
                className="flex flex-wrap items-center justify-between gap-3 px-3 py-3 text-xs"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="shrink-0 text-muted-foreground">
                    {isPdf ? (
                      <FileText className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <ImageIcon className="h-5 w-5" aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{att.fileName}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {formatBytes(att.fileSize)}
                      <span className="mx-1">·</span>
                      {att.uploadedBy.name || att.uploadedBy.email}
                      <span className="mx-1">·</span>
                      {formatDateTime(att.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {att.visibility === "INTERNAL" && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                      <Shield className="h-3 w-3" aria-hidden="true" />
                      Internal
                    </span>
                  )}

                  <a
                    href={`/api/attachments/${att.id}/download`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="View file"
                  >
                    <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                    View
                  </a>

                  <a
                    href={`/api/attachments/${att.id}/download`}
                    download={att.fileName}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium text-primary hover:bg-muted"
                    title="Download file"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    Download
                  </a>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(att.id)}
                      disabled={deletingId === att.id}
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      title="Delete attachment"
                    >
                      {deletingId === att.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
