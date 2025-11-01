import { PrismaClient } from "@/generated/prisma/client";

// Avoid re-creating PrismaClient on every hot reload in development
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"], // optional: helps with debugging
  });

// Cache the Prisma instance during development
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
