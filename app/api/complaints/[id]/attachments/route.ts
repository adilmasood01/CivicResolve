import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  uploadComplaintAttachment,
  getComplaintAttachments,
} from "@/services/attachment.service";
import { getErrorMessage } from "@/lib/utils";
import { AttachmentVisibility } from "@prisma/client";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    const attachments = await getComplaintAttachments(user, id);
    return NextResponse.json({ success: true, data: attachments });
  } catch (error) {
    const message = getErrorMessage(error);
    const status = message.toLowerCase().includes("forbidden") ? 403 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const visibilityRaw = (formData.get("visibility") as string) || "PUBLIC";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    const visibility =
      visibilityRaw.toUpperCase() === "INTERNAL"
        ? AttachmentVisibility.INTERNAL
        : AttachmentVisibility.PUBLIC;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const attachment = await uploadComplaintAttachment(
      user,
      id,
      buffer,
      file.name,
      file.type,
      visibility
    );

    return NextResponse.json({ success: true, data: attachment }, { status: 201 });
  } catch (error) {
    const message = getErrorMessage(error);
    const status = message.toLowerCase().includes("forbidden") ? 403 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
