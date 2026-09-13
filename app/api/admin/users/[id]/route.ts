import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAdminUserById, updateUserRoleAndDepartment } from "@/services/user.service";
import { updateUserSchema } from "@/schemas/admin.schema";

export async function GET(
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
    const targetUser = await getAdminUserById(user, id);
    return NextResponse.json({ success: true, data: targetUser });
  } catch (error: any) {
    const status = error.message === "User not found" ? 404 : error.message?.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: error.message || "Failed to fetch user" }, { status });
  }
}

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
    const validated = updateUserSchema.parse(body);

    const updatedUser = await updateUserRoleAndDepartment(user, id, validated);
    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error: any) {
    const status = error.message?.includes("Forbidden")
      ? 403
      : error.message?.includes("Action prohibited") || error.message?.includes("required")
      ? 400
      : 500;
    return NextResponse.json({ error: error.message || "Failed to update user" }, { status });
  }
}
