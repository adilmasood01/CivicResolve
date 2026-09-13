import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { deleteFilterPreset } from "@/services/preset.service";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const { id } = await params;
    const result = await deleteFilterPreset(user, id);
    return NextResponse.json(result);
  } catch (err: any) {
    let status = 400;
    if (err.message?.includes("Forbidden")) status = 403;
    else if (err.message?.includes("not found")) status = 404;
    return NextResponse.json({ error: err.message || "Failed to delete preset" }, { status });
  }
}
