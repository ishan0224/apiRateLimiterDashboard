import { PrismaClient } from "@prisma/client";

type GlobalPrismaCache = typeof globalThis & {
  __prisma?: PrismaClient;
};

const globalPrismaCache = globalThis as GlobalPrismaCache;

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalPrismaCache.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalPrismaCache.__prisma = prisma;
}
