import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { deleteComplaintAttachment } from "@/services/attachment.service";
import { getErrorMessage } from "@/lib/utils";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
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
    const result = await deleteComplaintAttachment(user, attachmentId);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = getErrorMessage(error);
    const status = message.toLowerCase().includes("forbidden") ? 403 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
