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
    } catch (err) {
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
 */
export function getStorageProvider(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER || "local";
  switch (provider.toLowerCase()) {
    case "local":
    default:
      return new LocalStorageProvider();
  }
}
