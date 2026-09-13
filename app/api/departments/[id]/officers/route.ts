import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SAFE_USER_SELECT } from "@/services/complaint.service";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  const { id: departmentId } = await params;

  // Authorization: Only manager of this department or admin
  if (
    user.role !== "ADMIN" &&
    !(user.role === "DEPARTMENT_MANAGER" && user.departmentId === departmentId)
  ) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    const officers = await prisma.user.findMany({
      where: {
        role: "OFFICER",
        departmentId,
        isActive: true,
      },
      select: SAFE_USER_SELECT,
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: officers });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch officers" },
      { status: 500 }
    );
  }
}
