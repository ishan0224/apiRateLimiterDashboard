import { NextResponse } from "next/server";

import { fetchPipelineHealth } from "@/lib/server/dashboard-queries";
import { withServerCache } from "@/lib/server/cache";

export async function GET() {
  try {
    const data = await withServerCache("pipeline-health", 15_000, () => fetchPipelineHealth());

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch pipeline health", error);
    return NextResponse.json({ error: "Failed to fetch pipeline health" }, { status: 500 });
  }
}
