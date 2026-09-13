/**
 * CivicResolve — Attachment Validation Utilities
 *
 * Enforces strict MIME type checks, file size limits, filename sanitization,
 * and magic byte signature verification to prevent spoofed file uploads.
 */

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export type AllowedMimeType = typeof ALLOWED_MIME_TYPES[number];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Validates file MIME type, size limit, and header magic bytes.
 */
export function validateAttachmentFile(
  buffer: Buffer,
  originalFileName: string,
  declaredMimeType: string
): { isValid: boolean; error?: string; detectedMimeType?: string } {
  // 1. Size check
  if (buffer.length === 0) {
    return { isValid: false, error: "Uploaded file is empty" };
  }

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: `File size exceeds maximum allowed limit of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB`,
    };
  }

  // 2. MIME type check
  const normalizedMime = declaredMimeType.toLowerCase().trim();
  if (!ALLOWED_MIME_TYPES.includes(normalizedMime as AllowedMimeType)) {
    return {
      isValid: false,
      error: `Unsupported file type (${declaredMimeType}). Allowed types: JPEG, PNG, WEBP, PDF`,
    };
  }

  // 3. Magic byte inspection
  const magicDetected = detectMimeTypeFromMagicBytes(buffer);
  if (!magicDetected || magicDetected !== normalizedMime) {
    return {
      isValid: false,
      error: "File format header does not match declared MIME type (Spoofing detected)",
    };
  }

  return { isValid: true, detectedMimeType: magicDetected };
}

/**
 * Inspects buffer header bytes to verify true file signature.
 */
export function detectMimeTypeFromMagicBytes(buffer: Buffer): string | null {
  if (buffer.length < 4) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }

  // PDF: 25 50 44 46 (%PDF)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return "application/pdf";
  }

  // WEBP: 52 49 46 46 (RIFF) ... 57 41 56 45 / 57 45 42 50 (WEBP)
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

/**
 * Sanitizes user-supplied filenames to prevent header injection & XSS.
 */
export function sanitizeFileName(fileName: string): string {
  // Strip path information
  const basename = fileName.replace(/^.*[\\/]/, "");
  // Keep alphanumeric, dots, dashes, underscores, spaces
  const sanitized = basename.replace(/[^a-zA-Z0-9._\- ]/g, "_");
  return sanitized.trim().slice(0, 150) || "attachment";
}
