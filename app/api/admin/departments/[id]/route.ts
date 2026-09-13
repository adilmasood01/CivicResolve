import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDepartmentByIdAdmin, updateDepartment } from "@/services/department.service";
import { updateDepartmentSchema } from "@/schemas/admin.schema";

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
    const dept = await getDepartmentByIdAdmin(user, id);
    return NextResponse.json({ success: true, data: dept });
  } catch (error: any) {
    const status = error.message === "Department not found" ? 404 : error.message?.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: error.message || "Failed to fetch department" }, { status });
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
    const validated = updateDepartmentSchema.parse(body);

    const updated = await updateDepartment(user, id, validated);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    const status = error.message === "Department not found"
      ? 404
      : error.message?.includes("already in use") || error.message?.includes("already exists")
      ? 409
      : error.message?.includes("Forbidden")
      ? 403
      : 400;
    return NextResponse.json({ error: error.message || "Failed to update department" }, { status });
  }
}
