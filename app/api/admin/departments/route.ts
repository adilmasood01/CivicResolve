import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDepartmentsAdmin, createDepartment } from "@/services/department.service";
import { createDepartmentSchema } from "@/schemas/admin.schema";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const departments = await getDepartmentsAdmin(user);
    return NextResponse.json({ success: true, data: departments });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch departments" },
      { status: error.message?.includes("Forbidden") ? 403 : 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const validated = createDepartmentSchema.parse(body);
    const newDept = await createDepartment(user, validated);

    return NextResponse.json({ success: true, data: newDept }, { status: 201 });
  } catch (error: any) {
    const status = error.message?.includes("already in use") || error.message?.includes("already exists")
      ? 409
      : error.message?.includes("Forbidden")
      ? 403
      : 400;
    return NextResponse.json({ error: error.message || "Failed to create department" }, { status });
  }
}
