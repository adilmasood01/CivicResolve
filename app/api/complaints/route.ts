import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createComplaint, getComplaints } from "@/services/complaint.service";
import { getErrorMessage } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const filters = {
      search: searchParams.get("search") || undefined,
      status: (searchParams.get("status") as any) || undefined,
      priority: (searchParams.get("priority") as any) || undefined,
      departmentId: searchParams.get("departmentId") || undefined,
      categoryId: searchParams.get("categoryId") || undefined,
      citizenId: searchParams.get("citizenId") || undefined,
      assignedOfficerId: searchParams.get("assignedOfficerId") || undefined,
      slaStatus: (searchParams.get("slaStatus") as any) || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1,
      pageSize: searchParams.get("pageSize") ? parseInt(searchParams.get("pageSize")!, 10) : 20,
      sortBy: (searchParams.get("sortBy") as any) || "createdAt",
      sortOrder: (searchParams.get("sortOrder") as any) || "desc",
    };

    const result = await getComplaints(user, filters);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = getErrorMessage(error);
    const status = message.toLowerCase().includes("forbidden") ? 403 : 400;
    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const complaint = await createComplaint(user, body);
    return NextResponse.json({ success: true, data: complaint }, { status: 201 });
  } catch (error) {
    const message = getErrorMessage(error);
    const status = message.toLowerCase().includes("forbidden") ? 403 : 400;
    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  }
}
