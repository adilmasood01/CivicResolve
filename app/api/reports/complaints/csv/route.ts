import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generateComplaintsCSV } from "@/services/export.service";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const rawFilters: Record<string, any> = {};

    searchParams.forEach((val, key) => {
      rawFilters[key] = val;
    });

    const csvContent = await generateComplaintsCSV(user, rawFilters as any);

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="civicresolve_complaints_${Date.now()}.csv"`,
      },
    });
  } catch (err: any) {
    const status = err.message?.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: err.message || "Failed to generate CSV export" }, { status });
  }
}
