import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCategoriesAdmin, createCategory } from "@/services/category.service";
import { createCategorySchema } from "@/schemas/admin.schema";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId") || undefined;
    const search = searchParams.get("search") || undefined;

    const categories = await getCategoriesAdmin(user, { departmentId, search });
    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch categories" },
      { status: error.message?.includes("Forbidden") ? 403 : 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const validated = createCategorySchema.parse(body);
    const category = await createCategory(user, validated);

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error: any) {
    const status = error.message?.includes("already exists")
      ? 409
      : error.message?.includes("Forbidden")
      ? 403
      : 400;
    return NextResponse.json({ error: error.message || "Failed to create category" }, { status });
  }
}
