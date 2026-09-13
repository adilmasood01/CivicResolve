import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { updateSLARuleByIdAdmin } from "@/services/sla.service";
import { updateSLARuleSchema } from "@/schemas/admin.schema";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const validated = updateSLARuleSchema.parse(body);

    const updated = await updateSLARuleByIdAdmin(user, id, validated);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    const status = error.message === "SLA rule not found"
      ? 404
      : error.message?.includes("Forbidden")
      ? 403
      : 400;
    return NextResponse.json({ error: error.message || "Failed to update SLA rule" }, { status });
  }
}
