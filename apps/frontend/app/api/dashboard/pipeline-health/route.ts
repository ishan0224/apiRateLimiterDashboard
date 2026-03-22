import { NextResponse } from "next/server";

import { fetchPipelineHealth } from "@/lib/server/dashboard-queries";

export async function GET() {
  try {
    const data = await fetchPipelineHealth();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch pipeline health", error);
    return NextResponse.json({ error: "Failed to fetch pipeline health" }, { status: 500 });
  }
}
