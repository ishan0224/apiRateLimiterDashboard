import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { enforceRateLimit } from "./lib/rate-limit/rate-limiter.service";

function applyRateLimitHeaders(
  response: NextResponse,
  limit: number,
  remaining: number,
  resetAtEpochSeconds: number
) {
  response.headers.set("X-RateLimit-Limit", String(limit));
  response.headers.set("X-RateLimit-Remaining", String(remaining));
  response.headers.set("X-RateLimit-Reset", String(resetAtEpochSeconds));
}


export async function middleware(request: NextRequest) {
  try {
    const decision = await enforceRateLimit(request);

    if (!decision.allowed) {
      const response = NextResponse.json({ error: "Too Many Requests" }, { status: 429 });

      applyRateLimitHeaders(
        response,
        decision.limit,
        decision.remaining,
        decision.resetAtEpochSeconds
      );
      response.headers.set("Retry-After", String(decision.retryAfterSeconds));

      return response;
    }

    const response = NextResponse.next();

    applyRateLimitHeaders(
      response,
      decision.limit,
      decision.remaining,
      decision.resetAtEpochSeconds
    );

    return response;
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
