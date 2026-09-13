import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAdminDashboardStats } from "@/services/admin.service";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const stats = await getAdminDashboardStats(user);
    return NextResponse.json({ success: true, data: stats });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch admin stats" },
      { status: error.message?.includes("Forbidden") ? 403 : 500 }
    );
  }
}
