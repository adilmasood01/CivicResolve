"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Trash2, Upload, Loader2, Check, AlertCircle, User } from "lucide-react";
import { uploadAvatarAction, removeAvatarAction } from "@/app/actions/profile";

interface ProfileAvatarUploaderProps {
  initialImage: string | null;
  name: string;
}

export function ProfileAvatarUploader({
  initialImage,
  name,
}: ProfileAvatarUploaderProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentImage, setCurrentImage] = useState<string | null>(initialImage);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Please select a JPEG, PNG, or WebP image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size exceeds the 5 MB limit.");
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleCancel = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;

    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    startTransition(async () => {
      const res = await uploadAvatarAction(formData);
      if (res.success && res.image) {
        setCurrentImage(res.image);
        setSelectedFile(null);
        setPreviewUrl(null);
        setSuccess("Profile photo updated successfully!");
        router.refresh();
      } else {
        setError(res.error || "Failed to update profile photo.");
      }
    });
  };

  const handleRemove = () => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const res = await removeAvatarAction();
      if (res.success) {
        setCurrentImage(null);
        setSelectedFile(null);
        setPreviewUrl(null);
        setSuccess("Profile photo removed.");
        router.refresh();
      } else {
        setError(res.error || "Failed to remove profile photo.");
      }
    });
  };

  const displayImage = previewUrl || currentImage;
  const initial = name ? name.charAt(0).toUpperCase() : null;

  return (
    <div className="rounded-lg border border-border bg-card p-6 mb-6">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="relative group">
          <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-border shadow-sm flex items-center justify-center bg-primary text-primary-foreground text-2xl font-bold">
            {displayImage ? (
              <img
                src={displayImage}
                alt={name || "Profile avatar"}
                className="h-full w-full object-cover"
              />
            ) : initial ? (
              <span>{initial}</span>
            ) : (
              <User className="h-10 w-10 text-primary-foreground/80" />
            )}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
            className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-transform active:scale-95 disabled:opacity-50"
            aria-label="Upload photo"
            title="Upload photo"
          >
            <Camera className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 text-center sm:text-left space-y-2">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Profile Photo
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Upload a picture to personalize your account across CivicResolve.
              JPG, PNG, or WebP up to 5 MB.
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
            disabled={isPending}
          />

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
            {selectedFile ? (
              <>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  Save photo
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isPending}
                  className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-border hover:bg-muted text-foreground transition-colors disabled:opacity-50"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload new photo
                </button>

                {currentImage && (
                  <button
                    type="button"
                    onClick={handleRemove}
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-destructive hover:bg-destructive/10 border border-destructive/20 transition-colors disabled:opacity-50"
                  >
                    {isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    Remove photo
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 text-xs text-destructive bg-destructive/10 p-2.5 rounded-md border border-destructive/20">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mt-4 flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 p-2.5 rounded-md border border-emerald-200 dark:border-emerald-800">
          <Check className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}
    </div>
  );
}
