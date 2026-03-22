import type { NextRequest } from "next/server";

import { extractClientIdentifier } from "./identifier";
import { redis } from "./redis-client";
import { TokenBucketStrategy, type RateLimitDecision } from "./token-bucket.strategy";

const RATE_LIMIT_REDIS_KEY_PREFIX = "rate_limit";
const tokenBucketStrategy = new TokenBucketStrategy(redis);

export type RateLimitResult = RateLimitDecision & {
  identifierSource: "api-key" | "ip";
  identifier: string;
};

export async function enforceRateLimit(request: NextRequest): Promise<RateLimitResult> {
  const identifier = await extractClientIdentifier(request);
  const redisKey = `${RATE_LIMIT_REDIS_KEY_PREFIX}:${identifier.redisKey}`;
  const decision = await tokenBucketStrategy.evaluate(redisKey, Date.now());

  return {
    ...decision,
    identifierSource: identifier.source,
    identifier: identifier.redisKey,
  };
}
