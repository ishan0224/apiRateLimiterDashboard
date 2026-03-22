import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { sendLogMessage } from "./lib/aws/sqs-client";
import { enforceRateLimit } from "./lib/rate-limit/rate-limiter.service";

const FORWARDED_IP_HEADERS = ["x-forwarded-for", "x-real-ip", "cf-connecting-ip"] as const;
const BEARER_PREFIX = /^Bearer\s+/i;

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

function extractLogIdentifier(request: NextRequest): string {
  const authorizationHeader = request.headers.get("authorization");

  if (authorizationHeader) {
    const normalizedApiKey = authorizationHeader.replace(BEARER_PREFIX, "").trim();

    if (normalizedApiKey.length > 0) {
      return normalizedApiKey;
    }
  }

  for (const headerName of FORWARDED_IP_HEADERS) {
    const headerValue = request.headers.get(headerName);

    if (!headerValue) {
      continue;
    }

    const [firstForwardedAddress] = headerValue.split(",");
    const ipAddress = firstForwardedAddress?.trim();

    if (ipAddress) {
      return ipAddress;
    }
  }

  return "unknown";
}

function publishUsageLog(request: NextRequest, status: 200 | 429) {
  void sendLogMessage({
    identifier: extractLogIdentifier(request),
    path: request.nextUrl.pathname,
    status,
    timestamp: new Date().toISOString(),
  }).catch((error) => {
    console.error("Failed to enqueue usage log message", {
      path: request.nextUrl.pathname,
      status,
      error,
    });
  });
}

export async function middleware(request: NextRequest) {
  try {
    const decision = await enforceRateLimit(request);

    if (!decision.allowed) {
      publishUsageLog(request, 429);

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

    publishUsageLog(request, 200);

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
  matcher: ["/((?!api/dashboard|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
