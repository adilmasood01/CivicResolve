import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getFilterPresets, createFilterPreset } from "@/services/preset.service";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const presets = await getFilterPresets(user);
    return NextResponse.json(presets);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch presets" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const body = await req.json();
    const preset = await createFilterPreset(user, body);
    return NextResponse.json(preset, { status: 201 });
  } catch (err: any) {
    const status = err.message?.includes("Forbidden") ? 403 : 400;
    return NextResponse.json({ error: err.message || "Failed to create preset" }, { status });
  }
}
