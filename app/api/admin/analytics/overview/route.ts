import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getSystemKPIs,
  getComplaintTrends,
  getStatusDistribution,
  getPriorityDistribution,
  getCategoryDistribution,
} from "@/services/analytics.service";

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

    const dateOptions = { range, dateFrom, dateTo };

    const [kpis, trend, statusDist, priorityDist, categoryDist] = await Promise.all([
      getSystemKPIs(user, dateOptions, departmentId),
      getComplaintTrends(user, dateOptions, departmentId),
      getStatusDistribution(user, dateOptions, departmentId),
      getPriorityDistribution(user, dateOptions, departmentId),
      getCategoryDistribution(user, dateOptions, departmentId),
    ]);

    return NextResponse.json({
      kpis,
      trend,
      statusDist,
      priorityDist,
      categoryDist,
    });
  } catch (err: any) {
    const status = err.message?.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: err.message || "Failed to load executive analytics" }, { status });
  }
}
