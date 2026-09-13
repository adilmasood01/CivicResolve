"use client";

import { useState, useRef } from "react";
import {
  Paperclip,
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

    // Client-side quick checks
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
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
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6 shadow-xs">
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <Paperclip className="h-5 w-5 text-blue-600" />
          <h3 className="font-bold text-gray-900 text-base">
            Evidence & Attachments ({attachments.length})
          </h3>
        </div>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Upload Box */}
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
          dragActive
            ? "border-blue-500 bg-blue-50/50"
            : "border-gray-300 hover:border-blue-400 bg-gray-50/50"
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
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          ) : (
            <UploadCloud className="h-8 w-8 text-blue-500" />
          )}
          <p className="text-sm font-semibold text-gray-800">
            {isUploading ? "Uploading file…" : "Click or drag file to upload evidence"}
          </p>
          <p className="text-xs text-gray-500">
            Supports JPEG, PNG, WEBP, PDF (Max 10 MB)
          </p>
        </div>
      </div>

      {/* Visibility Selector for Staff */}
      {isStaff && (
        <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border text-xs">
          <span className="font-semibold text-gray-700">Upload Visibility:</span>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="visibility"
              value="PUBLIC"
              checked={visibility === "PUBLIC"}
              onChange={() => setVisibility("PUBLIC")}
              className="text-blue-600"
            />
            <span>Public (Visible to Citizen)</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="visibility"
              value="INTERNAL"
              checked={visibility === "INTERNAL"}
              onChange={() => setVisibility("INTERNAL")}
              className="text-blue-600"
            />
            <span className="flex items-center gap-1 text-purple-700 font-medium">
              <Shield className="h-3.5 w-3.5" />
              Internal Staff Only
            </span>
          </label>
        </div>
      )}

      {/* Attachment List */}
      {attachments.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-4">
          No attachments uploaded yet.
        </p>
      ) : (
        <div className="space-y-3">
          {attachments.map((att) => {
            const isPdf = att.fileType.includes("pdf");
            const canDelete =
              currentUser.role === "ADMIN" ||
              att.uploadedBy.id === currentUser.id ||
              (currentUser.role === "DEPARTMENT_MANAGER" && isStaff);

            return (
              <div
                key={att.id}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition text-xs gap-3 flex-wrap"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                    {isPdf ? (
                      <FileText className="h-5 w-5 text-red-500" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {att.fileName}
                    </p>
                    <p className="text-gray-500 text-[11px] flex items-center gap-2">
                      <span>{formatBytes(att.fileSize)}</span>
                      <span>•</span>
                      <span>Uploaded by {att.uploadedBy.name || att.uploadedBy.email}</span>
                      <span>•</span>
                      <span>{formatDateTime(att.createdAt)}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {att.visibility === "INTERNAL" && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Internal
                    </span>
                  )}

                  {/* View / Download */}
                  <a
                    href={`/api/attachments/${att.id}/download`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition"
                    title="View file"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>View</span>
                  </a>

                  <a
                    href={`/api/attachments/${att.id}/download`}
                    download={att.fileName}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium transition"
                    title="Download file"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download</span>
                  </a>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(att.id)}
                      disabled={deletingId === att.id}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                      title="Delete attachment"
                    >
                      {deletingId === att.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
