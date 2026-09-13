import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generateComplaintSummaryPDF } from "@/services/export.service";

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

    const pdfBuffer = await generateComplaintSummaryPDF(user, rawFilters as any);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="complaint_summary_report_${Date.now()}.pdf"`,
      },
    });
  } catch (err: any) {
    const status = err.message?.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: err.message || "Failed to generate PDF report" }, { status });
  }
}
