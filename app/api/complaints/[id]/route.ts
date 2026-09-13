import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getComplaintById } from "@/services/complaint.service";

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
    // Return 404 for missing or unauthorized complaint (prevents ID enumeration)
    return NextResponse.json(
      { success: false, error: "Complaint not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: complaint });
}
