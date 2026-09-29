import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import os from "os";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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
 * When running in serverless environments like Vercel, writes to os.tmpdir()
 * to avoid read-only filesystem errors.
 */
export class LocalStorageProvider implements StorageProvider {
  private uploadDir: string;

  constructor(uploadDir?: string) {
    if (uploadDir) {
      this.uploadDir = uploadDir;
    } else if (process.env.VERCEL) {
      this.uploadDir = path.join(os.tmpdir(), "uploads");
    } else {
      this.uploadDir = path.join(process.cwd(), "uploads");
    }
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
 * Supabase Storage Provider
 * Cloud object storage suitable for production deployments on Vercel.
 */
export class SupabaseStorageProvider implements StorageProvider {
  private client: SupabaseClient;
  private bucket: string;
  private bucketChecked = false;

  constructor() {
    const rawUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL;

    const rawKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!rawUrl || !rawKey) {
      throw new Error(
        "Supabase Storage requires SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) to be set."
      );
    }

    // Clean URL: strip quotes, trailing slashes, and accidental /rest/v1 or /storage/v1 subpaths
    let url = rawUrl.trim().replace(/^["']|["']$/g, "");
    url = url.replace(/\/(rest|storage)(\/v\d+)?\/?$/i, "").replace(/\/+$/, "");
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }

    const key = rawKey.trim().replace(/^["']|["']$/g, "");

    this.client = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    this.bucket = (process.env.STORAGE_BUCKET || "attachments")
      .trim()
      .replace(/^["']|["']$/g, "")
      .replace(/^\/+|\/+$/g, "");
  }

  private sanitizeStorageKey(storageKey: string): string {
    const basename = path.basename(storageKey);
    if (basename !== storageKey || storageKey.includes("..")) {
      throw new Error("Invalid storage key detected (Path Traversal Attempt)");
    }
    return basename;
  }

  private async ensureBucketExists(): Promise<void> {
    if (this.bucketChecked) return;
    try {
      const { error } = await this.client.storage.getBucket(this.bucket);
      if (error && error.message.toLowerCase().includes("not found")) {
        await this.client.storage.createBucket(this.bucket, {
          public: false,
          fileSizeLimit: 10 * 1024 * 1024,
        });
      }
    } catch {
      // Continue even if getBucket or createBucket fails (e.g. key has limited permissions)
    } finally {
      this.bucketChecked = true;
    }
  }

  async uploadFile(
    fileBuffer: Buffer,
    originalFileName: string,
    mimeType: string
  ): Promise<StorageUploadResult> {
    await this.ensureBucketExists();

    const ext = path.extname(originalFileName).toLowerCase();
    const safeExt = /^\.[a-z0-9]+$/i.test(ext) ? ext : ".bin";
    const storageKey = `${crypto.randomUUID()}-${Date.now()}${safeExt}`;

    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(storageKey, fileBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Supabase Storage upload failed: ${error.message}`);
    }

    return { storageKey };
  }

  async getFileBuffer(storageKey: string): Promise<Buffer> {
    const safeKey = this.sanitizeStorageKey(storageKey);
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .download(safeKey);

    if (error || !data) {
      throw new Error(
        `File not found or unreadable in storage: ${error?.message || "Not found"}`
      );
    }

    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async deleteFile(storageKey: string): Promise<void> {
    const safeKey = this.sanitizeStorageKey(storageKey);
    const { error } = await this.client.storage
      .from(this.bucket)
      .remove([safeKey]);

    if (error) {
      console.warn(`[storage] Failed to delete file ${safeKey}:`, error.message);
    }
  }
}

/**
 * Returns the configured storage provider instance.
 * Automatically detects Supabase in production if credentials are provided,
 * or switches based on STORAGE_PROVIDER env variable.
 */
export function getStorageProvider(): StorageProvider {
  const raw = process.env.STORAGE_PROVIDER;
  const isProd = process.env.NODE_ENV === "production";

  const hasSupabase = Boolean(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );

  let provider: string;

  if (raw && raw.trim() !== "") {
    provider = raw.toLowerCase().trim();
  } else if (isProd && hasSupabase) {
    provider = "supabase";
  } else if (isProd) {
    if (process.env.VERCEL) {
      console.warn(
        "[storage] STORAGE_PROVIDER not set on Vercel. Falling back to temporary /tmp storage for demo."
      );
      provider = "local";
    } else {
      throw new Error(
        'STORAGE_PROVIDER must be set explicitly in production (use "supabase" or "local")'
      );
    }
  } else {
    provider = "local";
  }

  switch (provider) {
    case "local":
      if (isProd && !process.env.VERCEL) {
        console.warn(
          "[storage] Using local filesystem storage in production. Configure Supabase Storage for durable uploads."
        );
      }
      return new LocalStorageProvider();
    case "supabase":
      return new SupabaseStorageProvider();
    case "s3":
      throw new Error(
        `STORAGE_PROVIDER=s3 is reserved but not implemented. Use "supabase" or "local".`
      );
    default:
      throw new Error(`Unsupported STORAGE_PROVIDER: ${provider}`);
  }
}
