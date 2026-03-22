import { NextRequest, NextResponse } from "next/server";

import { parseRangeParams } from "@/lib/api/schemas";
import { fetchApiKeyDetail } from "@/lib/server/dashboard-queries";

type Params = {
  params: Promise<{ keyId: string }>;
};

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { keyId } = await params;
    const { searchParams } = new URL(request.url);
    const { from, to } = parseRangeParams({
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
    });

    const data = await fetchApiKeyDetail(keyId, from, to);

    if (!data) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch API key detail", error);
    return NextResponse.json({ error: "Failed to fetch API key detail" }, { status: 500 });
  }
}
