import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getStaffOverview } from "@/services/admin.service";

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
    const departmentId = searchParams.get("departmentId") || undefined;
    const search = searchParams.get("search") || undefined;

    const staff = await getStaffOverview(user, { departmentId, search });
    return NextResponse.json({ success: true, data: staff });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch staff overview" },
      { status: error.message?.includes("Forbidden") ? 403 : 500 }
    );
  }
}
