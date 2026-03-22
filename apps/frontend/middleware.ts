import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { sendLogMessage } from "./lib/aws/sqs-client";
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

function publishUsageLog(identifier: string, path: string, status: 200 | 429) {
  void sendLogMessage({
    identifier,
    path,
    status,
    timestamp: new Date().toISOString(),
  }).catch((error) => {
    console.error("Failed to enqueue usage log message", {
      path,
      status,
      error,
    });
  });
}

export async function middleware(request: NextRequest) {
  try {
    const decision = await enforceRateLimit(request);

    if (!decision.allowed) {
      publishUsageLog(decision.identifier, request.nextUrl.pathname, 429);

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

    publishUsageLog(decision.identifier, request.nextUrl.pathname, 200);

    const response = NextResponse.next();

    applyRateLimitHeaders(
      response,
      decision.limit,
      decision.remaining,
      decision.resetAtEpochSeconds
    );

    return response;
  } catch (error) {
    console.error("Middleware failure", error);
    return NextResponse.next();
  }
}

export const config = {
  runtime: "nodejs",
  matcher: [
    "/((?!api/dashboard|overview|api-keys|traffic|incidents|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
