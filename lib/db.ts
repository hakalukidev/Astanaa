import { PrismaClient } from "@prisma/client";

// Reused across Next.js hot-reloads in dev so we don't open a fresh
// connection pool on every file save (the classic Prisma+Next.js pattern).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
