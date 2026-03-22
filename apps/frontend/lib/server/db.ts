import { Pool } from "pg";

type GlobalPoolCache = typeof globalThis & {
  __dashboardPgPool?: Pool;
};

const globalPoolCache = globalThis as GlobalPoolCache;

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL is required for dashboard APIs");
  }

  return url;
}

function createPool() {
  return new Pool({
    connectionString: getDatabaseUrl(),
    max: 10,
    idleTimeoutMillis: 10_000,
  });
}

export function getPool() {
  if (!globalPoolCache.__dashboardPgPool) {
    globalPoolCache.__dashboardPgPool = createPool();
  }

  return globalPoolCache.__dashboardPgPool;
}
