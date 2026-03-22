import { NextRequest, NextResponse } from "next/server";

import { DEFAULT_PAGE_SIZE } from "@/lib/constants/dashboard";
import { keysQuerySchema, parseRangeParams } from "@/lib/api/schemas";
import { fetchApiKeys } from "@/lib/server/dashboard-queries";
import { withServerCache } from "@/lib/server/cache";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const parsed = keysQuerySchema.safeParse({
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    });

    const { from, to } = parseRangeParams({
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
    });

    const page = parsed.success ? parsed.data.page ?? 1 : 1;
    const pageSize = parsed.success ? parsed.data.pageSize ?? DEFAULT_PAGE_SIZE : DEFAULT_PAGE_SIZE;
    const search = parsed.success ? parsed.data.search : undefined;

    const data = await withServerCache(
      `keys:${from.toISOString()}:${to.toISOString()}:${page}:${pageSize}:${search ?? ""}`,
      15_000,
      () => fetchApiKeys(from, to, page, pageSize, search)
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch API keys", error);
    return NextResponse.json({ error: "Failed to fetch API keys" }, { status: 500 });
  }
}
