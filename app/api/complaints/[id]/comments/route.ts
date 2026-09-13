import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { addComment, getComplaintById } from "@/services/complaint.service";
import { getErrorMessage } from "@/lib/utils";

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
  const complaint = await getComplaintById(user, id);

  if (!complaint) {
    return NextResponse.json(
      { success: false, error: "Complaint not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: complaint.comments });
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
    const body = await req.json();
    const comment = await addComment(user, id, body);
    return NextResponse.json({ success: true, data: comment }, { status: 201 });
  } catch (error) {
    const message = getErrorMessage(error);
    const status = message.toLowerCase().includes("forbidden") ? 403 : 400;
    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  }
}
