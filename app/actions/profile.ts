"use server";

import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStorageProvider } from "@/lib/storage";
import { detectMimeTypeFromMagicBytes } from "@/lib/attachments";
import { revalidatePath } from "next/cache";

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_AVATAR_MIMES = ["image/jpeg", "image/png", "image/webp"];

export interface AvatarActionResult {
  success: boolean;
  error?: string;
  image?: string | null;
}

export async function uploadAvatarAction(
  formData: FormData
): Promise<AvatarActionResult> {
  const user = await requireAuth("/profile");

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return { success: false, error: "Please select an image file to upload." };
  }

  if (file.size === 0) {
    return { success: false, error: "Uploaded file is empty." };
  }

  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    return {
      success: false,
      error: "Image exceeds maximum allowed size of 5 MB.",
    };
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const detectedMime = detectMimeTypeFromMagicBytes(buffer);
  if (!detectedMime || !ALLOWED_AVATAR_MIMES.includes(detectedMime)) {
    return {
      success: false,
      error:
        "Unsupported file format. Please upload a valid JPEG, PNG, or WebP image.",
    };
  }

  try {
    const storageProvider = getStorageProvider();

    // Clean up previous avatar if stored locally
    const current = await prisma.user.findUnique({
      where: { id: user.id },
      select: { image: true },
    });

    if (current?.image?.startsWith("/api/avatar/")) {
      const oldKey = current.image.replace("/api/avatar/", "").split("?")[0];
      try {
        await storageProvider.deleteFile(oldKey);
      } catch {
        // ignore if already deleted
      }
    }

    const uploadResult = await storageProvider.uploadFile(
      buffer,
      file.name,
      detectedMime
    );

    const avatarUrl = `/api/avatar/${uploadResult.storageKey}`;

    await prisma.user.update({
      where: { id: user.id },
      data: { image: avatarUrl },
    });

    revalidatePath("/", "layout");
    revalidatePath("/profile");

    return {
      success: true,
      image: avatarUrl,
    };
  } catch (error) {
    console.error("Avatar upload failed:", error);
    return {
      success: false,
      error: "Failed to upload avatar. Please try again.",
    };
  }
}

export async function removeAvatarAction(): Promise<AvatarActionResult> {
  const user = await requireAuth("/profile");

  try {
    const current = await prisma.user.findUnique({
      where: { id: user.id },
      select: { image: true },
    });

    if (current?.image?.startsWith("/api/avatar/")) {
      const oldKey = current.image.replace("/api/avatar/", "").split("?")[0];
      try {
        const storageProvider = getStorageProvider();
        await storageProvider.deleteFile(oldKey);
      } catch {
        // ignore
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { image: null },
    });

    revalidatePath("/", "layout");
    revalidatePath("/profile");

    return { success: true, image: null };
  } catch (error) {
    console.error("Avatar removal failed:", error);
    return {
      success: false,
      error: "Failed to remove avatar. Please try again.",
    };
  }
}
