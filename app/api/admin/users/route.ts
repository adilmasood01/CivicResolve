import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAdminUsers } from "@/services/user.service";
import { filterUserSchema } from "@/schemas/admin.schema";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const filterInput = filterUserSchema.parse({
      search: searchParams.get("search") || undefined,
      role: searchParams.get("role") || undefined,
      departmentId: searchParams.get("departmentId") || undefined,
      page: searchParams.get("page") || undefined,
      pageSize: searchParams.get("pageSize") || undefined,
    });

    const result = await getAdminUsers(user, filterInput);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch users" },
      { status: error.message?.includes("Forbidden") ? 403 : 400 }
    );
  }
}
