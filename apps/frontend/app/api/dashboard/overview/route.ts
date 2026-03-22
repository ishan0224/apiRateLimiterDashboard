import { NextRequest, NextResponse } from "next/server";

import { parseRangeParams } from "@/lib/api/schemas";
import { fetchOverview } from "@/lib/server/dashboard-queries";
import { withServerCache } from "@/lib/server/cache";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { from, to } = parseRangeParams({
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
    });

    const data = await withServerCache(
      `overview:${from.toISOString()}:${to.toISOString()}`,
      15_000,
      () => fetchOverview(from, to)
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch overview", error);
    return NextResponse.json({ error: "Failed to fetch overview" }, { status: 500 });
  }
}
