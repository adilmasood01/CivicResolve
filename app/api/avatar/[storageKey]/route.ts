import { NextResponse } from "next/server";
import { getStorageProvider } from "@/lib/storage";
import { detectMimeTypeFromMagicBytes } from "@/lib/attachments";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ storageKey: string }> }
) {
  const { storageKey } = await params;

  if (!storageKey) {
    return new NextResponse("Missing storage key", { status: 400 });
  }

  try {
    const storageProvider = getStorageProvider();
    const fileBuffer = await storageProvider.getFileBuffer(storageKey);
    const mimeType = detectMimeTypeFromMagicBytes(fileBuffer) || "image/jpeg";

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "public, max-age=86400, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Avatar not found", { status: 404 });
  }
}
