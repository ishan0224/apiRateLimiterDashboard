import { NextRequest, NextResponse } from "next/server";

import { parseRangeParams } from "@/lib/api/schemas";
import { fetchOverview, fetchPipelineHealth } from "@/lib/server/dashboard-queries";
import { withServerCache } from "@/lib/server/cache";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { from, to } = parseRangeParams({
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
    });

    const cacheKey = `snapshot:${from.toISOString()}:${to.toISOString()}`;

    const data = await withServerCache(cacheKey, 15_000, async () => {
      const [overview, pipelineHealth] = await Promise.all([
        fetchOverview(from, to),
        fetchPipelineHealth(),
      ]);

      return {
        overview,
        pipelineHealth,
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch snapshot", error);
    return NextResponse.json({ error: "Failed to fetch snapshot" }, { status: 500 });
  }
}
