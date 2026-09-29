import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generateComplaintsCSV } from "@/services/export.service";
import { getClientSafeErrorMessage, getClientErrorStatus } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const rawFilters: Record<string, string> = {};

    searchParams.forEach((val, key) => {
      rawFilters[key] = val;
    });

    const csvContent = await generateComplaintsCSV(user, rawFilters as any);

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="civicresolve_complaints_${Date.now()}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: getClientSafeErrorMessage(err) },
      { status: getClientErrorStatus(err) }
    );
  }
}
