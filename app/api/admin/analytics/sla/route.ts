import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSLAAnalytics } from "@/services/analytics.service";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const range = (searchParams.get("range") as any) || "30d";
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;
    const departmentId = searchParams.get("departmentId") || undefined;

    const data = await getSLAAnalytics(user, { range, dateFrom, dateTo }, departmentId);
    return NextResponse.json(data);
  } catch (err: any) {
    const status = err.message?.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: err.message || "Failed to load SLA analytics" }, { status });
  }
}
