import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAttachmentForDownload } from "@/services/attachment.service";
import { getErrorMessage } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ attachmentId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  const { attachmentId } = await params;

  try {
    const { attachment, fileBuffer } = await getAttachmentForDownload(
      user,
      attachmentId
    );

    // Force UTF-8 safe filename for Content-Disposition header
    const encodedFileName = encodeURIComponent(attachment.fileName);

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": attachment.fileType || "application/octet-stream",
        "Content-Length": attachment.fileSize.toString(),
        "Content-Disposition": `inline; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    const message = getErrorMessage(error);
    const status = message.toLowerCase().includes("forbidden") ? 403 : 404;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
