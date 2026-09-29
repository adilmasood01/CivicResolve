import { NextResponse } from "next/server";
import { runSLAMonitoringJob } from "@/services/sla.service";
import { authorizeCronRequest } from "@/lib/cron-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const authz = authorizeCronRequest(req);
  if (!authz.ok) {
    return NextResponse.json(
      { success: false, error: authz.error },
      { status: authz.status }
    );
  }

  try {
    const summary = await runSLAMonitoringJob();
    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("[cron/sla] job failed", error instanceof Error ? error.name : "unknown");
    return NextResponse.json(
      { success: false, error: "SLA monitoring job failed" },
      { status: 500 }
    );
  }
}
