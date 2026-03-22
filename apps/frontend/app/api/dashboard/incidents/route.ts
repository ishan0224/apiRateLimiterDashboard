import { NextRequest, NextResponse } from "next/server";

import { parseRangeParams } from "@/lib/api/schemas";
import { fetchIncidents } from "@/lib/server/dashboard-queries";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { from, to } = parseRangeParams({
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
    });

    const data = await fetchIncidents(from, to);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch incidents", error);
    return NextResponse.json({ error: "Failed to fetch incidents" }, { status: 500 });
  }
}
