import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export interface StorageUploadResult {
  storageKey: string;
  publicUrl?: string;
}

export interface StorageProvider {
  uploadFile(
    fileBuffer: Buffer,
    originalFileName: string,
    mimeType: string
  ): Promise<StorageUploadResult>;

  getFileBuffer(storageKey: string): Promise<Buffer>;

  deleteFile(storageKey: string): Promise<void>;
}

/**
 * Local Filesystem Storage Provider
 * Safe for local development & testing.
 * Storage keys are generated independently using random UUIDs.
 * Path traversal attack prevention is strictly enforced.
 */
export class LocalStorageProvider implements StorageProvider {
  private uploadDir: string;

  constructor(uploadDir?: string) {
    this.uploadDir = uploadDir || path.join(process.cwd(), "uploads");
  }

  private async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  private sanitizeStorageKey(storageKey: string): string {
    // Prevent directory traversal attacks (e.g. "../", "..\", null bytes)
    const basename = path.basename(storageKey);
    if (basename !== storageKey || storageKey.includes("..")) {
      throw new Error("Invalid storage key detected (Path Traversal Attempt)");
    }
    return basename;
  }

  async uploadFile(
    fileBuffer: Buffer,
    originalFileName: string,
    _mimeType: string
  ): Promise<StorageUploadResult> {
    await this.ensureDirectoryExists();

    const ext = path.extname(originalFileName).toLowerCase();
    const safeExt = /^\.[a-z0-9]+$/i.test(ext) ? ext : ".bin";
    // Storage key is never derived from user path segments — UUID only
    const storageKey = `${crypto.randomUUID()}-${Date.now()}${safeExt}`;
    const destinationPath = path.join(this.uploadDir, storageKey);

    await fs.writeFile(destinationPath, fileBuffer);

    return {
      storageKey,
    };
  }

  async getFileBuffer(storageKey: string): Promise<Buffer> {
    const safeKey = this.sanitizeStorageKey(storageKey);
    const filePath = path.join(this.uploadDir, safeKey);

    try {
      return await fs.readFile(filePath);
    } catch {
      throw new Error("File not found or unreadable in storage");
    }
  }

  async deleteFile(storageKey: string): Promise<void> {
    const safeKey = this.sanitizeStorageKey(storageKey);
    const filePath = path.join(this.uploadDir, safeKey);

    try {
      await fs.unlink(filePath);
    } catch {
      // Ignore if file was already removed
    }
  }
}

/**
 * Returns the configured storage provider instance.
 * Switchable to S3 / Supabase Storage via STORAGE_PROVIDER env variable.
 *
 * Production requires an explicit STORAGE_PROVIDER. Local filesystem storage
 * is allowed in production only when STORAGE_PROVIDER=local is set deliberately.
 */
export function getStorageProvider(): StorageProvider {
  const raw = process.env.STORAGE_PROVIDER;
  const isProd = process.env.NODE_ENV === "production";

  if (isProd && (raw === undefined || raw.trim() === "")) {
    throw new Error(
      "STORAGE_PROVIDER must be set explicitly in production (use \"local\" only for demos)"
    );
  }

  const provider = (raw || "local").toLowerCase().trim();

  switch (provider) {
    case "local":
      if (isProd) {
        console.warn(
          "[storage] Using local filesystem storage in production. Configure S3/Supabase for durable uploads."
        );
      }
      return new LocalStorageProvider();
    case "s3":
    case "supabase":
      throw new Error(
        `STORAGE_PROVIDER=${provider} is reserved but not implemented. Use local for now or add a provider adapter.`
      );
    default:
      throw new Error(`Unsupported STORAGE_PROVIDER: ${provider}`);
  }
}
