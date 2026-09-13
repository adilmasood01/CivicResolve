import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assignOfficer } from "@/services/assignment.service";
import { getErrorMessage } from "@/lib/utils";

export const runtime = "nodejs";

export async function PATCH(
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
    const updated = await assignOfficer(user, id, body);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const message = getErrorMessage(error);
    const status = message.toLowerCase().includes("forbidden") ? 403 : 400;
    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  }
}
