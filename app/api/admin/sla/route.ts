import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSLARulesAdmin, upsertSLARuleAdmin } from "@/services/sla.service";
import { createSLARuleSchema } from "@/schemas/admin.schema";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const rules = await getSLARulesAdmin(user);
    return NextResponse.json({ success: true, data: rules });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch SLA rules" },
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
    const validated = createSLARuleSchema.parse(body);
    const rule = await upsertSLARuleAdmin(user, validated);

    return NextResponse.json({ success: true, data: rule }, { status: 201 });
  } catch (error: any) {
    const status = error.message?.includes("Forbidden") ? 403 : 400;
    return NextResponse.json({ error: error.message || "Failed to save SLA rule" }, { status });
  }
}
