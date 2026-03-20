import { Redis } from "@upstash/redis";

type GlobalRedisCache = typeof globalThis & {
  __rateLimiterRedisClient?: Redis;
};

const globalRedisCache = globalThis as GlobalRedisCache;

export const redis =
  globalRedisCache.__rateLimiterRedisClient ??
  Redis.fromEnv({
    enableAutoPipelining: true,
    latencyLogging: false,
  });

if (process.env.NODE_ENV !== "production") {
  globalRedisCache.__rateLimiterRedisClient = redis;
}
