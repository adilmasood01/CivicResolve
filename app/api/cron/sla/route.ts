import { NextResponse } from "next/server";
import { runSLAMonitoringJob } from "@/services/sla.service";
import { getErrorMessage } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // Verify bearer token / secret header
    const authHeader = req.headers.get("authorization");
    const cronSecretHeader = req.headers.get("x-cron-secret");

    const expectedSecret = process.env.CRON_SECRET || "civicresolve-cron-secret-2026-key";
    
    let providedSecret = "";
    if (authHeader && authHeader.startsWith("Bearer ")) {
      providedSecret = authHeader.substring(7).trim();
    } else if (cronSecretHeader) {
      providedSecret = cronSecretHeader.trim();
    }

    if (!providedSecret || providedSecret !== expectedSecret) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid or missing SLA Cron secret" },
        { status: 401 }
      );
    }

    const summary = await runSLAMonitoringJob();

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
