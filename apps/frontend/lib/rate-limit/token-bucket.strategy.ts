import type { Redis } from "@upstash/redis";

export type RateLimitDecision = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAtEpochSeconds: number;
  retryAfterSeconds: number;
};

export interface RateLimitingStrategy {
  evaluate(redisKey: string, nowInMilliseconds: number): Promise<RateLimitDecision>;
}

const BUCKET_SIZE = 100;
const REFILL_RATE_PER_SECOND = 10;
const REFILL_RATE_PER_MILLISECOND = REFILL_RATE_PER_SECOND / 1000;
const FULL_REFILL_TIME_MS = Math.ceil(BUCKET_SIZE / REFILL_RATE_PER_MILLISECOND);
const KEY_TTL_MS = FULL_REFILL_TIME_MS * 2;

const TOKEN_BUCKET_LUA_SCRIPT = `
local key = KEYS[1]
local now_ms = tonumber(ARGV[1])
local bucket_size = tonumber(ARGV[2])
local refill_rate_per_ms = tonumber(ARGV[3])
local ttl_ms = tonumber(ARGV[4])

local state = redis.call("HMGET", key, "tokens", "last_refill_timestamp")
local tokens = tonumber(state[1])
local last_refill_timestamp = tonumber(state[2])

if tokens == nil then
  tokens = bucket_size
end

if last_refill_timestamp == nil then
  last_refill_timestamp = now_ms
end

local elapsed_ms = math.max(0, now_ms - last_refill_timestamp)
local available_tokens = math.min(bucket_size, tokens + (elapsed_ms * refill_rate_per_ms))
local allowed = 0

if available_tokens >= 1 then
  available_tokens = available_tokens - 1
  allowed = 1
end

redis.call("HSET", key, "tokens", available_tokens, "last_refill_timestamp", now_ms)
redis.call("PEXPIRE", key, ttl_ms)

local remaining_tokens = math.floor(available_tokens)
local reset_after_ms = math.ceil((bucket_size - available_tokens) / refill_rate_per_ms)
local retry_after_ms = 0

if allowed == 0 then
  retry_after_ms = math.ceil((1 - available_tokens) / refill_rate_per_ms)
end

if reset_after_ms < 0 then
  reset_after_ms = 0
end

if retry_after_ms < 0 then
  retry_after_ms = 0
end

return { allowed, remaining_tokens, reset_after_ms, retry_after_ms }
`;

type LuaEvaluationResult = [number, number, number, number];

export class TokenBucketStrategy implements RateLimitingStrategy {
  constructor(private readonly redis: Redis) {}

  async evaluate(redisKey: string, nowInMilliseconds: number): Promise<RateLimitDecision> {
    const [allowed, remaining, resetAfterMs, retryAfterMs] = (await this.redis.eval(
      TOKEN_BUCKET_LUA_SCRIPT,
      [redisKey],
      [
        nowInMilliseconds,
        BUCKET_SIZE,
        REFILL_RATE_PER_MILLISECOND,
        KEY_TTL_MS,
      ]
    )) as LuaEvaluationResult;

    return {
      allowed: allowed === 1,
      limit: BUCKET_SIZE,
      remaining: Math.max(0, Number(remaining)),
      resetAtEpochSeconds: Math.ceil((nowInMilliseconds + Number(resetAfterMs)) / 1000),
      retryAfterSeconds: Math.max(0, Math.ceil(Number(retryAfterMs) / 1000)),
    };
  }
}
