import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAuditLogs } from "@/services/audit.service";
import { filterAuditLogSchema } from "@/schemas/admin.schema";

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
    const filterInput = filterAuditLogSchema.parse({
      search: searchParams.get("search") || undefined,
      actorId: searchParams.get("actorId") || undefined,
      entity: searchParams.get("entity") || undefined,
      action: searchParams.get("action") || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      page: searchParams.get("page") || undefined,
      pageSize: searchParams.get("pageSize") || undefined,
    });

    const result = await getAuditLogs(user, filterInput);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch audit logs" },
      { status: error.message?.includes("Forbidden") ? 403 : 400 }
    );
  }
}

// Prohibit write/mutation operations on audit logs (READ-ONLY)
export async function POST() {
  return NextResponse.json({ error: "Method Not Allowed: Audit logs are read-only." }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "Method Not Allowed: Audit logs are read-only." }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method Not Allowed: Audit logs are read-only." }, { status: 405 });
}
