import { NextRequest, NextResponse } from "next/server";

import { parseRangeParams, trafficQuerySchema } from "@/lib/api/schemas";
import { fetchTraffic } from "@/lib/server/dashboard-queries";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const parsed = trafficQuerySchema.safeParse({
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      granularity: searchParams.get("granularity") ?? undefined,
    });

    const { from, to } = parseRangeParams({
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
    });

    const granularity = parsed.success ? parsed.data.granularity ?? "1h" : "1h";

    const data = await fetchTraffic(from, to, granularity);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch traffic", error);
    return NextResponse.json({ error: "Failed to fetch traffic" }, { status: 500 });
  }
}
