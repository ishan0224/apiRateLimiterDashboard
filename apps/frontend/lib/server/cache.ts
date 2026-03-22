type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

type GlobalCache = typeof globalThis & {
  __dashboardServerCache?: Map<string, CacheEntry<unknown>>;
};

const globalCache = globalThis as GlobalCache;

function getCache() {
  if (!globalCache.__dashboardServerCache) {
    globalCache.__dashboardServerCache = new Map<string, CacheEntry<unknown>>();
  }

  return globalCache.__dashboardServerCache;
}

export async function withServerCache<T>(key: string, ttlMs: number, compute: () => Promise<T>): Promise<T> {
  const cache = getCache();
  const now = Date.now();
  const cached = cache.get(key);

  if (cached && cached.expiresAt > now) {
    return cached.value as T;
  }

  const value = await compute();

  cache.set(key, {
    value,
    expiresAt: now + ttlMs,
  });

  return value;
}
