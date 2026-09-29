import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generateDepartmentPerformancePDF } from "@/services/export.service";
import { getClientSafeErrorMessage, getClientErrorStatus } from "@/lib/utils";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const pdfBuffer = await generateDepartmentPerformancePDF(user);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="department_performance_report_${Date.now()}.pdf"`,
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
