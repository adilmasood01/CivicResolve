import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generateDepartmentPerformancePDF } from "@/services/export.service";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const pdfBuffer = await generateDepartmentPerformancePDF(user);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="department_performance_report_${Date.now()}.pdf"`,
      },
    });
  } catch (err: any) {
    const status = err.message?.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: err.message || "Failed to generate Department PDF report" }, { status });
  }
}
