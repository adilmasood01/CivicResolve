import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generateComplaintSummaryPDF } from "@/services/export.service";
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

    const pdfBuffer = await generateComplaintSummaryPDF(user, rawFilters as any);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="civicresolve_complaint_summary_${Date.now()}.pdf"`,
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
