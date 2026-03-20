import type { NextRequest } from "next/server";

export type IdentifierSource = "api-key" | "ip";

export type ClientIdentifier = {
  redisKey: string;
  source: IdentifierSource;
};

const FORWARDED_IP_HEADERS = ["x-forwarded-for", "x-real-ip", "cf-connecting-ip"] as const;
const BEARER_PREFIX = /^Bearer\s+/i;

function extractApiKey(request: NextRequest): string | null {
  const authorizationHeader = request.headers.get("authorization");

  if (!authorizationHeader) {
    return null;
  }

  const normalizedApiKey = authorizationHeader.replace(BEARER_PREFIX, "").trim();

  return normalizedApiKey.length > 0 ? normalizedApiKey : null;
}

function extractIpAddress(request: NextRequest): string {
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

async function sha256Hex(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", encoded);

  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

export async function extractClientIdentifier(request: NextRequest): Promise<ClientIdentifier> {
  const apiKey = extractApiKey(request);
  const source: IdentifierSource = apiKey ? "api-key" : "ip";
  const rawIdentifier = apiKey ?? extractIpAddress(request);
  const redisKey = await sha256Hex(`${source}:${rawIdentifier}`);

  return {
    redisKey,
    source,
  };
}
