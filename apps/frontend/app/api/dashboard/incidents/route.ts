import { NextRequest, NextResponse } from "next/server";

import { parseRangeParams } from "@/lib/api/schemas";
import { fetchIncidents } from "@/lib/server/dashboard-queries";
import { withServerCache } from "@/lib/server/cache";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { from, to } = parseRangeParams({
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
    });

    const data = await withServerCache(
      `incidents:${from.toISOString()}:${to.toISOString()}`,
      15_000,
      () => fetchIncidents(from, to)
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch incidents", error);
    return NextResponse.json({ error: "Failed to fetch incidents" }, { status: 500 });
  }
}
